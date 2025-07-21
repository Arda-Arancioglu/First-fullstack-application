
package com.example.backend.repository;

import com.example.backend.model.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long>, JpaSpecificationExecutor<Question> {

    // Original method for backward compatibility
    List<Question> findByFormId(Long formId);

    // New paginated method
    Page<Question> findByFormId(Long formId, Pageable pageable);

    // Additional paginated methods you might need
    Page<Question> findByFormIdAndQuestionTextContaining(Long formId, String questionText, Pageable pageable);

    Page<Question> findByFormIdAndType(Long formId, String type, Pageable pageable);

    // Custom query example with pagination
    @Query("SELECT q FROM Question q WHERE q.form.id = :formId AND q.questionText LIKE %:searchTerm%")
    Page<Question> findByFormIdAndSearchTerm(@Param("formId") Long formId, @Param("searchTerm") String searchTerm, Pageable pageable);
}