package com.yo.day1.service.impl;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.*;
import com.yo.day1.domain.enums.DiscountType;
import com.yo.day1.domain.enums.InvoiceStatus;
import com.yo.day1.domain.enums.NotificationRecipientType;
import com.yo.day1.domain.enums.NotificationType;
import com.yo.day1.domain.enums.PaymentMethod;
import com.yo.day1.dto.Billing.*;
import com.yo.day1.repository.*;
import com.yo.day1.service.AuthService;
import com.yo.day1.service.BillingService;
import com.yo.day1.service.CourseClassService;
import com.yo.day1.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {

    private static final int CODE_MAX_LENGTH = 30;

    private final TuitionInvoiceRepository tuitionInvoiceRepository;
    private final PromotionRepository promotionRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationRepository notificationRepository;
    private final StudentService studentService;
    private final CourseClassService courseClassService;
    private final AuthService authService;
    private final ModelMapper mapper;

    @Transactional
    @Override
    public InvoiceResponse createInvoice(InvoiceCreateRequest request) {
        Student student = studentService.getStudent(request.getStudentId());
        CourseClass courseClass = courseClassService.getCourseClass(request.getCourseClassId());
        LocalDate billingMonth = normalizeBillingMonth(request.getBillingMonth());

        assertInvoiceNotDuplicate(student, courseClass, billingMonth);

        String code = request.getInvoiceCode();
        if (code == null || code.trim().isEmpty()) {
            code = generateUniqueInvoiceCode(student, courseClass, billingMonth);
        } else if (tuitionInvoiceRepository.existsByInvoiceCode(code.trim())) {
            throw new BadRequestException("Mã hóa đơn đã tồn tại: " + code.trim());
        }

        TuitionInvoice invoice = buildInvoice(
                code.trim(),
                student,
                courseClass,
                billingMonth,
                request.getOriginalAmount(),
                request.getPromotionId(),
                request.getDueDate(),
                request.getNote()
        );

        try {
            return toInvoiceResponse(tuitionInvoiceRepository.save(invoice));
        } catch (DataIntegrityViolationException ex) {
            throw mapInvoiceIntegrityViolation(ex, student, courseClass, billingMonth);
        }
    }

    @Transactional
    @Override
    public List<InvoiceResponse> createInvoicesBulk(BulkInvoiceRequest request) {
        Student student = studentService.getStudent(request.getStudentId());
        CourseClass courseClass = courseClassService.getCourseClass(request.getCourseClassId());
        List<InvoiceResponse> results = new ArrayList<>();
        for (int i = 0; i < request.getNumberOfMonths(); i++) {
            LocalDate month = request.getStartMonth().plusMonths(i).withDayOfMonth(1);
            if (tuitionInvoiceRepository.existsByStudentIdAndCourseClassIdAndBillingMonth(
                    student.getId(), courseClass.getId(), month)) {
                continue;
            }
            String code = generateUniqueInvoiceCode(student, courseClass, month);
            TuitionInvoice invoice = buildInvoice(code, student, courseClass, month,
                    request.getOriginalAmount(), request.getPromotionId(),
                    month.plusMonths(1).withDayOfMonth(5), null);
            try {
                results.add(toInvoiceResponse(tuitionInvoiceRepository.save(invoice)));
            } catch (DataIntegrityViolationException ex) {
                throw mapInvoiceIntegrityViolation(ex, student, courseClass, month);
            }
        }
        return results;
    }

    @Transactional(readOnly = true)
    @Override
    public List<InvoiceResponse> findInvoicesByStudent(Long studentId, String username) throws BadRequestException, NotFoundExeception {
        Users user = authService.findActiveUserByUsername(username);
        if (user.getRole().name().equals("PARENT")) {
            studentService.getStudentForParent(studentId, user.getParent().getId());
        }
        return tuitionInvoiceRepository.findByStudentId(studentId).stream().map(this::toInvoiceResponse).toList();
    }

    @Transactional
    @Override
    public PaymentResponse recordPayment(PaymentCreateRequest request, String receivedBy) {
        TuitionInvoice invoice = tuitionInvoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new NotFoundExeception("Invoice not found: " + request.getInvoiceId()));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BadRequestException("Invoice is already fully paid");
        }
        if (request.getPaidAmount().compareTo(invoice.getBalanceAmount()) > 0) {
            throw new BadRequestException("Payment amount exceeds remaining balance: " + invoice.getBalanceAmount());
        }

        BigDecimal newAmountPaid = invoice.getAmountPaid().add(request.getPaidAmount());
        BigDecimal newBalance = invoice.getFinalAmount().subtract(newAmountPaid);
        invoice.setAmountPaid(newAmountPaid);
        invoice.setBalanceAmount(newBalance);
        invoice.setStatus(newBalance.compareTo(BigDecimal.ZERO) == 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL);
        tuitionInvoiceRepository.save(invoice);

        String paymentCode = resolvePaymentCode(request, invoice);

        Payment record = new Payment();
        record.setInvoice(invoice);
        record.setPaymentCode(paymentCode);
        record.setPaidAmount(request.getPaidAmount());
        record.setPaymentMethod(request.getPaymentMethod());
        record.setPaidAt(request.getPaidAt());
        record.setNote(request.getNote());

        try {
            paymentRepository.save(record);
        } catch (DataIntegrityViolationException ex) {
            String message = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
            if (message != null && message.toLowerCase().contains("payment_code")) {
                throw new BadRequestException("Mã thanh toán không hợp lệ hoặc đã tồn tại. Vui lòng thử lại.");
            }
            throw ex;
        }

        createPaymentNotification(invoice, request.getPaidAmount(), request.getPaymentMethod());

        return toPaymentResponse(record);
    }

    @Transactional(readOnly = true)
    @Override
    public List<PaymentResponse> getPaymentHistory(Long studentId, String username) throws BadRequestException, NotFoundExeception {
        Users user = authService.findActiveUserByUsername(username);
        if (user.getRole().name().equals("PARENT")) {
            studentService.getStudentForParent(studentId, user.getParent().getId());
        }
        return paymentRepository.findByStudentId(studentId).stream().map(this::toPaymentResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<PaymentResponse> getAllPayments(Long studentId, String username) {
        Users user = authService.findActiveUserByUsername(username);
        if (user.getRole().name().equals("PARENT")) {
            if (studentId == null) {
                throw new BadRequestException("Student ID is required for PARENT role");
            }
            studentService.getStudentForParent(studentId, user.getParent().getId());
        }
        if (studentId != null) {
            return paymentRepository.findByStudentId(studentId).stream().map(this::toPaymentResponse).toList();
        } else {
            return paymentRepository.findAll().stream().map(this::toPaymentResponse).toList();
        }
    }

    @Transactional(readOnly = true)
    @Override
    public PaymentResponse getPaymentById(Long id, String username) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Payment not found: " + id));
        Users user = authService.findActiveUserByUsername(username);
        if (user.getRole().name().equals("PARENT")) {
            studentService.getStudentForParent(payment.getInvoice().getStudent().getId(), user.getParent().getId());
        }
        return toPaymentResponse(payment);
    }

    @Transactional(readOnly = true)
    @Override
    public List<OverdueWarningResponse> getOverdueWarnings() {
        LocalDate cutoff = LocalDate.now().minusMonths(1);
        return tuitionInvoiceRepository.findOverdue(cutoff).stream().map(i -> {
            OverdueWarningResponse r = new OverdueWarningResponse();
            r.setInvoiceId(i.getId());
            r.setInvoiceCode(i.getInvoiceCode());
            r.setStudentId(i.getStudent().getId());
            r.setStudentName(i.getStudent().getFullName());
            r.setCourseClassId(i.getCourseClass().getId());
            r.setClassName(i.getCourseClass().getName());
            r.setBillingMonth(i.getBillingMonth());
            r.setDueDate(i.getDueDate());
            r.setBalanceAmount(i.getBalanceAmount());
            r.setOverdueDays(ChronoUnit.DAYS.between(i.getDueDate(), LocalDate.now()));
            return r;
        }).toList();
    }

    // ---- helpers ----

    private LocalDate normalizeBillingMonth(LocalDate billingMonth) {
        LocalDate month = billingMonth != null ? billingMonth : LocalDate.now();
        return month.withDayOfMonth(1);
    }

    private void assertInvoiceNotDuplicate(Student student, CourseClass courseClass, LocalDate billingMonth) {
        if (tuitionInvoiceRepository.existsByStudentIdAndCourseClassIdAndBillingMonth(
                student.getId(), courseClass.getId(), billingMonth)) {
            throw new BadRequestException(duplicateInvoiceMessage(student, courseClass, billingMonth));
        }
    }

    private String duplicateInvoiceMessage(Student student, CourseClass courseClass, LocalDate billingMonth) {
        return String.format(
                "Đã có hóa đơn tháng %02d/%d cho học viên %s tại lớp %s. Vui lòng chọn tháng khác hoặc mở hóa đơn hiện có.",
                billingMonth.getMonthValue(),
                billingMonth.getYear(),
                student.getFullName(),
                courseClass.getName()
        );
    }

    private String generateUniqueInvoiceCode(Student student, CourseClass courseClass, LocalDate billingMonth) {
        String base = "INV-" + student.getStudentCode() + "-" + courseClass.getClassCode() + "-"
                + billingMonth.getYear() + String.format("%02d", billingMonth.getMonthValue());
        base = truncateCode(base);
        String code = base;
        int suffix = 1;
        while (tuitionInvoiceRepository.existsByInvoiceCode(code)) {
            String suffixPart = "-" + suffix++;
            int maxBaseLen = CODE_MAX_LENGTH - suffixPart.length();
            String trimmedBase = base.length() > maxBaseLen ? base.substring(0, maxBaseLen) : base;
            code = trimmedBase + suffixPart;
        }
        return code;
    }

    private String resolvePaymentCode(PaymentCreateRequest request, TuitionInvoice invoice) {
        String code = request.getPaymentCode();
        if (code == null || code.trim().isEmpty()) {
            return generateUniquePaymentCode(invoice.getId());
        }
        code = truncateCode(code.trim());
        if (paymentRepository.existsByPaymentCode(code)) {
            throw new BadRequestException("Mã thanh toán đã tồn tại: " + code);
        }
        return code;
    }

    private String generateUniquePaymentCode(Long invoiceId) {
        for (int attempt = 0; attempt < 100; attempt++) {
            long token = Math.abs((System.nanoTime() + attempt) % 1_000_000_000L);
            String code = truncateCode(String.format("P%d-%09d", invoiceId, token));
            if (!paymentRepository.existsByPaymentCode(code)) {
                return code;
            }
        }
        throw new BadRequestException("Không thể sinh mã thanh toán. Vui lòng thử lại.");
    }

    private String truncateCode(String code) {
        if (code.length() <= CODE_MAX_LENGTH) {
            return code;
        }
        return code.substring(0, CODE_MAX_LENGTH);
    }

    private BadRequestException mapInvoiceIntegrityViolation(
            DataIntegrityViolationException ex,
            Student student,
            CourseClass courseClass,
            LocalDate billingMonth) {
        if (tuitionInvoiceRepository.existsByStudentIdAndCourseClassIdAndBillingMonth(
                student.getId(), courseClass.getId(), billingMonth)) {
            return new BadRequestException(duplicateInvoiceMessage(student, courseClass, billingMonth));
        }
        String message = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        if (message != null && message.toLowerCase().contains("invoice_code")) {
            return new BadRequestException("Mã hóa đơn đã tồn tại. Vui lòng thử lại.");
        }
        if (message != null && message.toLowerCase().contains("uq_invoice")) {
            return new BadRequestException(duplicateInvoiceMessage(student, courseClass, billingMonth));
        }
        return new BadRequestException("Không thể tạo hóa đơn. Kiểm tra dữ liệu trùng lặp hoặc khóa ngoại.");
    }

    private TuitionInvoice buildInvoice(String code, Student student, CourseClass courseClass,
                                        LocalDate billingMonth, BigDecimal originalAmountInput,
                                        Long promotionId, LocalDate dueDate, String note) {
        TuitionInvoice invoice = new TuitionInvoice();
        invoice.setInvoiceCode(code);
        invoice.setStudent(student);
        invoice.setCourseClass(courseClass);
        invoice.setBillingMonth(billingMonth);

        BigDecimal originalAmount = (originalAmountInput != null && originalAmountInput.compareTo(BigDecimal.ZERO) != 0)
                ? originalAmountInput : courseClass.getTuitionFee();
        invoice.setOriginalAmount(originalAmount);

        Promotion promotion = null;
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (promotionId != null) {
            promotion = promotionRepository.findById(promotionId)
                    .orElseThrow(() -> new NotFoundExeception("Promotion not found: " + promotionId));
            discountAmount = calculateDiscount(originalAmount, promotion);
        }

        BigDecimal finalAmount = originalAmount.subtract(discountAmount);
        invoice.setPromotion(promotion);
        invoice.setDiscountAmount(discountAmount);
        invoice.setFinalAmount(finalAmount);
        invoice.setAmountPaid(BigDecimal.ZERO);
        invoice.setBalanceAmount(finalAmount);
        invoice.setStatus(finalAmount.compareTo(BigDecimal.ZERO) == 0 ? InvoiceStatus.PAID : InvoiceStatus.UNPAID);
        invoice.setDueDate(dueDate);
        invoice.setNote(note);
        return invoice;
    }

    private BigDecimal calculateDiscount(BigDecimal originalAmount, Promotion promotion) {
        if (promotion.getDiscountType() == DiscountType.PERCENT) {
            return originalAmount.multiply(BigDecimal.valueOf(promotion.getDiscountValue()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(promotion.getDiscountValue());
    }

    private void createPaymentNotification(TuitionInvoice invoice, BigDecimal amount, PaymentMethod method) {
        Student student = invoice.getStudent();
        if (student.getParent() == null) return;

        Notification notification = new Notification();
        notification.setRecipientType(NotificationRecipientType.PARENT);
        notification.setRecipientRefId(student.getParent().getId());
        notification.setStudent(student);
        notification.setType(NotificationType.TUITION);
        notification.setTitle("Xác nhận thu học phí");
        notification.setContent(String.format("Đã ghi nhận thanh toán %,.0f VNĐ (%s) cho hóa đơn %s tháng %s.",
                amount, method == PaymentMethod.CASH ? "Tiền mặt" : "Chuyển khoản",
                invoice.getInvoiceCode(), invoice.getBillingMonth()));
        notification.setRelatedEntityType("TuitionInvoice");
        notification.setRelatedEntityId(invoice.getId());
        notificationRepository.save(notification);
    }

    private InvoiceResponse toInvoiceResponse(TuitionInvoice item) {
        InvoiceResponse result = mapper.map(item, InvoiceResponse.class);
        result.setStudentId(item.getStudent().getId());
        result.setStudentName(item.getStudent().getFullName());
        result.setCourseClassId(item.getCourseClass().getId());
        result.setClassName(item.getCourseClass().getName());
        result.setStatus(item.getStatus().name());
        if (item.getPromotion() != null) {
            result.setPromotionId(item.getPromotion().getId());
            result.setPromotionName(item.getPromotion().getName());
        }
        return result;
    }

    private PaymentResponse toPaymentResponse(Payment r) {
        PaymentResponse res = new PaymentResponse();
        res.setId(r.getId());
        res.setInvoiceId(r.getInvoice().getId());
        res.setInvoiceCode(r.getInvoice().getInvoiceCode());
        res.setPaymentCode(r.getPaymentCode());
        if (r.getInvoice() != null && r.getInvoice().getStudent() != null) {
            res.setStudentId(r.getInvoice().getStudent().getId());
            res.setStudentName(r.getInvoice().getStudent().getFullName());
            res.setStudentCode(r.getInvoice().getStudent().getStudentCode());
        }
        res.setPaidAmount(r.getPaidAmount());
        res.setPaymentMethod(r.getPaymentMethod().name());
        res.setPaidAt(r.getPaidAt());
        res.setNote(r.getNote());
        return res;
    }
}
