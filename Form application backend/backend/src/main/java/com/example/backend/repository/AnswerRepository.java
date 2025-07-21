
package com.example.backend.repository;

import com.example.backend.model.Answer;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long>, JpaSpecificationExecutor<Answer> {
    Optional<Answer> findByUser_IdAndQuestion_Id(Long userId, Long questionId);

    @EntityGraph(attributePaths = {"question", "user"})
    List<Answer> findByUser_Id(Long userId);
}
