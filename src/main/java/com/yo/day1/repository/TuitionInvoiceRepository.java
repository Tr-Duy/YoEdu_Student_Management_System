package com.yo.day1.repository;

import com.yo.day1.domain.entity.TuitionInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TuitionInvoiceRepository extends JpaRepository<TuitionInvoice, Long> {

    java.util.List<TuitionInvoice> findByStudentId(Long studentId);

    java.util.List<TuitionInvoice> findByStudentParentId(Long parentId);
}
