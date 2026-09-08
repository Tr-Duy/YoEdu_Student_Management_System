package com.yo.day1.domain.spec;

import com.yo.day1.domain.entity.Teacher;
import com.yo.day1.domain.enums.TeacherRole;
import com.yo.day1.domain.enums.TeacherStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class TeacherSpec {

    public static Specification<Teacher> filter(String search, TeacherStatus status, TeacherRole role, Boolean isActive) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), like),
                        cb.like(cb.lower(root.get("teacherCode")), like),
                        cb.like(cb.lower(root.get("phone")), like)
                ));
            }
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (role != null) predicates.add(cb.equal(root.get("teacherRole"), role));
            if (isActive != null) predicates.add(cb.equal(root.get("isActive"), isActive));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
