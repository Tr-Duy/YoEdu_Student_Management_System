package com.yo.day1.domain.spec;

import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.enums.ClassStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class CourseClassSpec {

    public static Specification<CourseClass> filter(String search, ClassStatus status, Long courseId, Long teacherId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("classCode")), like)
                ));
            }
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (courseId != null) predicates.add(cb.equal(root.get("course").get("id"), courseId));
            if (teacherId != null) predicates.add(cb.or(
                    cb.equal(root.get("mainTeacher").get("id"), teacherId),
                    cb.equal(root.get("assistantTeacher").get("id"), teacherId)
            ));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
