package com.yo.day1.domain.spec;

import com.yo.day1.domain.entity.Teacher;
import com.yo.day1.domain.enums.TeacherRole;
import com.yo.day1.domain.enums.TeacherStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class TeacherSpec {

    public static Specification<Teacher> filter(
            String search,        // từ khóa tìm kiếm
            TeacherStatus status, // trạng thái giáo viên
            TeacherRole role,     // vai trò giáo viên
            Boolean isActive      // đang hoạt động hay không
    ) {

        return (root, query, cb) -> { // tạo Specification động

            List<Predicate> predicates = new ArrayList<>();
            // danh sách chứa các điều kiện WHERE

            if (search != null && !search.isBlank()) {
                // kiểm tra người dùng có nhập từ khóa tìm kiếm không

                String like = "%" + search.toLowerCase() + "%";
                // chuyển "DUY" -> "%duy%"

                predicates.add(
                        cb.or( // tìm kiếm theo 1 trong các trường bên dưới

                                cb.like(
                                        cb.lower(root.get("fullName")),
                                        like
                                ),
                                // lower(full_name) LIKE '%duy%'

                                cb.like(
                                        cb.lower(root.get("teacherCode")),
                                        like
                                ),
                                // lower(teacher_code) LIKE '%duy%'

                                cb.like(
                                        cb.lower(root.get("phone")),
                                        like
                                )
                                // lower(phone) LIKE '%duy%'
                        )
                );
            }

            if (status != null)
                predicates.add(
                        cb.equal(
                                root.get("status"),
                                status
                        )
                );
            // status = giá trị truyền vào

            if (role != null)
                predicates.add(
                        cb.equal(
                                root.get("teacherRole"),
                                role
                        )
                );
            // teacher_role = giá trị truyền vào

            if (isActive != null)
                predicates.add(
                        cb.equal(
                                root.get("isActive"),
                                isActive
                        )
                );
            // is_active = true hoặc false

            predicates.add(cb.equal(root.get("deleted"), false));

            return cb.and(
                    predicates.toArray(new Predicate[0])
            );
            // ghép tất cả điều kiện bằng AND
        };
    }
}