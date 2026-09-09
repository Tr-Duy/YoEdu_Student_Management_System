package com.yo.day1.repository;

import com.yo.day1.domain.entity.TuitionInvoice;
import com.yo.day1.domain.enums.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TuitionInvoiceRepository extends JpaRepository<TuitionInvoice, Long>, JpaSpecificationExecutor<TuitionInvoice> {

    List<TuitionInvoice> findByStudentId(Long studentId);

    List<TuitionInvoice> findByStudentParentId(Long parentId);

    boolean existsByStudentIdAndCourseClassIdAndBillingMonth(Long studentId, Long courseClassId, LocalDate billingMonth);

    boolean existsByInvoiceCode(String invoiceCode);

    @Query("SELECT i FROM TuitionInvoice i WHERE i.status <> 'PAID' AND i.dueDate < :cutoff ORDER BY i.dueDate ASC")
    List<TuitionInvoice> findOverdue(@Param("cutoff") LocalDate cutoff);

    @Query("SELECT COUNT(i) FROM TuitionInvoice i WHERE i.status <> 'PAID'")
    long countUnpaidInvoices();

    // Báo cáo doanh thu theo tháng
    @Query("""
            SELECT YEAR(i.billingMonth), MONTH(i.billingMonth),
                   SUM(i.finalAmount), SUM(i.amountPaid), SUM(i.balanceAmount),
                   COUNT(i), SUM(CASE WHEN i.status = 'PAID' THEN 1 ELSE 0 END),
                   SUM(CASE WHEN i.status <> 'PAID' THEN 1 ELSE 0 END)
            FROM TuitionInvoice i
            WHERE (:year IS NULL OR YEAR(i.billingMonth) = :year)
            GROUP BY YEAR(i.billingMonth), MONTH(i.billingMonth)
            ORDER BY YEAR(i.billingMonth) DESC, MONTH(i.billingMonth) DESC
            """)
    List<Object[]> revenueByMonth(@Param("year") Integer year);

    // Báo cáo doanh thu theo lớp
    @Query("""
            SELECT i.courseClass.id, i.courseClass.name,
                   SUM(i.finalAmount), SUM(i.amountPaid), SUM(i.balanceAmount), COUNT(i)
            FROM TuitionInvoice i
            WHERE (:year IS NULL OR YEAR(i.billingMonth) = :year)
              AND (:month IS NULL OR MONTH(i.billingMonth) = :month)
            GROUP BY i.courseClass.id, i.courseClass.name
            ORDER BY SUM(i.amountPaid) DESC
            """)
    List<Object[]> revenueByClass(@Param("year") Integer year, @Param("month") Integer month);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ti FROM TuitionInvoice ti WHERE ti.id = :id")
    java.util.Optional<TuitionInvoice> findByIdWithLock(@Param("id") Long id);
}
