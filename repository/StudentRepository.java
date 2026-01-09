package com.studenttrack.repository;

import com.studenttrack.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByClassId(Long classId);
    List<Student> findByDepartmentId(Long departmentId);
}