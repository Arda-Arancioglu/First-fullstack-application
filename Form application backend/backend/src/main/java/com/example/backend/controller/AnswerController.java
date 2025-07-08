package com.example.backend.controller;

import com.example.backend.model.Answer;
import com.example.backend.repository.AnswerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/answers")
@CrossOrigin(origins = "*")
public class AnswerController {

    private final AnswerRepository answerRepo;

    public AnswerController(AnswerRepository answerRepo) {
        this.answerRepo = answerRepo;
    }

    // save a batch of answers from React
    @PostMapping
    public ResponseEntity<List<Answer>> saveAll(@RequestBody List<Answer> answers) {
        List<Answer> saved = answerRepo.saveAll(answers);
        return ResponseEntity.ok(saved);
    }

    // optional: fetch all answers to inspect via REST
    @GetMapping
    public List<Answer> getAll() {
        return answerRepo.findAll();
    }
}
