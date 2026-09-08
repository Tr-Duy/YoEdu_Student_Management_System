package com.yo.day1.domain.spec;

import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.enums.ClassStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class CourseClassSpec {

    public static Specification<CourseClass> filter(
            String search,      // từ khóa tìm kiếm
            ClassStatus status, // trạng thái lớp học
            Long courseId,      // id khóa học
            Long teacherId      // id giáo viên
    ) {

        return (root, query, cb) -> { // tạo câu query động bằng Specification

            List<Predicate> predicates = new ArrayList<>();
            // danh sách chứa các điều kiện WHERE

            if (search != null && !search.isBlank()) {
                // nếu người dùng nhập từ khóa tìm kiếm

                String like = "%" + search.toLowerCase() + "%";
                // chuyển "JAVA" thành "%java%" để dùng cho LIKE

                predicates.add(cb.or(

                        cb.like(
                                cb.lower(root.get("name")),
                                like
                        ),
                        // tìm kiếm theo tên lớp học

                        cb.like(
                                cb.lower(root.get("classCode")),
                                like
                        )
                        // tìm kiếm theo mã lớp học

                ));
                // chỉ cần name hoặc classCode khớp là được (OR)
            }

            if (status != null)
                predicates.add(
                        cb.equal(
                                root.get("status"),
                                status
                        )
                );
            // status của lớp phải bằng status được truyền vào

            if (courseId != null)
                predicates.add(
                        cb.equal(
                                root.get("course").get("id"),
                                courseId
                        )
                );
            // chỉ lấy những lớp thuộc khóa học có id = courseId

            if (teacherId != null)
                predicates.add(
                        cb.or(

                                cb.equal(
                                        root.get("mainTeacher").get("id"),
                                        teacherId
                                ),
                                // giáo viên chính có id = teacherId

                                cb.equal(
                                        root.get("assistantTeacher").get("id"),
                                        teacherId
                                )
                                // hoặc trợ giảng có id = teacherId

                        )
                );
            // chỉ cần là giáo viên chính hoặc trợ giảng đều được

            return cb.and(
                    predicates.toArray(new Predicate[0])
            );
            // ghép tất cả điều kiện phía trên bằng AND
        };
    }
}