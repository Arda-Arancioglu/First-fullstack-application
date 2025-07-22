package com.example.backend.repository;

import com.example.backend.model.Form;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FormRepository extends JpaRepository<Form, Long>, JpaSpecificationExecutor<Form> {
    Optional<Form> findByTitle(String title);
}