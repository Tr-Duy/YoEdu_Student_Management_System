package com.yo.day1.domain.spec;

import com.yo.day1.domain.entity.TuitionInvoice;
import com.yo.day1.domain.enums.InvoiceStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class InvoiceSpec {
    public static Specification<TuitionInvoice> filterBy(String search, Long studentId, Long classId, InvoiceStatus status, String month) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate codeMatches = criteriaBuilder.like(criteriaBuilder.lower(root.get("invoiceCode")), searchPattern);
                Predicate studentNameMatches = criteriaBuilder.like(criteriaBuilder.lower(root.get("student").get("fullName")), searchPattern);
                Predicate studentCodeMatches = criteriaBuilder.like(criteriaBuilder.lower(root.get("student").get("studentCode")), searchPattern);
                predicates.add(criteriaBuilder.or(codeMatches, studentNameMatches, studentCodeMatches));
            }

            if (studentId != null) {
                predicates.add(criteriaBuilder.equal(root.get("student").get("id"), studentId));
            }

            if (classId != null) {
                predicates.add(criteriaBuilder.equal(root.get("courseClass").get("id"), classId));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (StringUtils.hasText(month)) {
                // month format is expected to be "YYYY-MM"
                try {
                    String[] parts = month.split("-");
                    int y = Integer.parseInt(parts[0]);
                    int m = Integer.parseInt(parts[1]);
                    
                    // We only want to match the exact billing month and year
                    // The entity stores a full LocalDate (always the 1st of the month, but just in case we match year and month)
                    Predicate yearMatches = criteriaBuilder.equal(criteriaBuilder.function("YEAR", Integer.class, root.get("billingMonth")), y);
                    Predicate monthMatches = criteriaBuilder.equal(criteriaBuilder.function("MONTH", Integer.class, root.get("billingMonth")), m);
                    predicates.add(criteriaBuilder.and(yearMatches, monthMatches));
                } catch (Exception e) {
                    // Ignore parse error
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
