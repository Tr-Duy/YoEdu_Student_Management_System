package com.yo.day1.domain.spec;

import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.enums.StudentStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class StudentSpec {

    // Hàm tạo điều kiện tìm kiếm động cho Student
    public static Specification<Student> filter(
            String search,          // từ khóa tìm kiếm
            StudentStatus status,   // trạng thái học sinh
            String gradeLevel       // khối lớp
    ) {

        // Trả về một Specification<Student>
        return (root, query, cb) -> {

            // Danh sách chứa các điều kiện WHERE
            List<Predicate> predicates = new ArrayList<>();


            // ===================== SEARCH =====================
            // Nếu người dùng nhập từ khóa tìm kiếm
            if (search != null && !search.isBlank()) {

                // Chuyển về dạng %keyword%
                String like = "%" + search.toLowerCase() + "%";

                predicates.add(

                        // Điều kiện OR
                        cb.or(

                                // lower(full_name) like '%keyword%'
                                cb.like(
                                        cb.lower(root.get("fullName")),
                                        like
                                ),

                                // lower(student_code) like '%keyword%'
                                cb.like(
                                        cb.lower(root.get("studentCode")),
                                        like
                                ),

                                // lower(phone) like '%keyword%'
                                cb.like(
                                        cb.lower(root.get("phone")),
                                        like
                                )
                        )
                );
            }


            // ===================== STATUS =====================
            // Nếu có truyền status
            if (status != null)

                // status = ?
                predicates.add(
                        cb.equal(
                                root.get("status"),
                                status
                        )
                );


            // ===================== GRADE LEVEL =====================
            // Nếu có truyền gradeLevel
            if (gradeLevel != null && !gradeLevel.isBlank())

                predicates.add(

                        // lower(grade_level) = ?
                        cb.equal(
                                cb.lower(root.get("gradeLevel")),
                                gradeLevel.toLowerCase()
                        )
                );


            // ===================== KẾT HỢP =====================
            // Ghép tất cả điều kiện bằng AND
            return cb.and(
                    predicates.toArray(new Predicate[0])
            );
        };
    }
}