package com.yo.day1.repository;

import com.yo.day1.domain.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    boolean existsByPaymentCode(String paymentCode);

    List<Payment> findByInvoiceId(Long invoiceId);

    @Query("SELECT o FROM Payment o  WHERE o.invoice.id = :invoiceId")
    List<Payment> findByInvoice(@Param("invoiceId") Long invoiceId);

    @Query("SELECT p FROM Payment p JOIN p.invoice i WHERE i.student.id = :studentId ORDER BY p.paidAt DESC")
    List<Payment> findByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT COALESCE(SUM(p.paidAmount), 0) FROM Payment p WHERE YEAR(p.paidAt) = :year AND MONTH(p.paidAt) = :month")
    java.math.BigDecimal sumPaidAmountByMonth(@Param("year") int year, @Param("month") int month);

    @Query("SELECT COALESCE(SUM(p.paidAmount), 0) FROM Payment p")
    java.math.BigDecimal sumAllPaidAmount();
}
