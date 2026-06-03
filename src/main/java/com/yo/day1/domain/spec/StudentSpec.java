package com.yo.day1.domain.spec;

import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.enums.StudentStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class StudentSpec {

    public static Specification<Student> filter(String search, StudentStatus status, String gradeLevel) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), like),
                        cb.like(cb.lower(root.get("studentCode")), like),
                        cb.like(cb.lower(root.get("phone")), like)
                ));
            }
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (gradeLevel != null && !gradeLevel.isBlank())
                predicates.add(cb.equal(cb.lower(root.get("gradeLevel")), gradeLevel.toLowerCase()));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
