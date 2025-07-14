// src/main/java/com/example/backend/controller/FormController.java
package com.example.backend.controller;

import com.example.backend.model.Form;
import com.example.backend.repository.FormRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/forms")
@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600)
public class FormController {

    private final FormRepository formRepository;

    public FormController(FormRepository formRepository) {
        this.formRepository = formRepository;
    }

    /**
     * Get all forms. Accessible by USER or ADMIN.
     * @return List of all forms.
     */
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Form>> getAllForms() {
        List<Form> forms = formRepository.findAll();
        return ResponseEntity.ok(forms);
    }

    /**
     * Get a single form by ID. Accessible by USER or ADMIN.
     * @param id The ID of the form.
     * @return The form if found, or 404 Not Found.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Form> getFormById(@PathVariable Long id) {
        Optional<Form> form = formRepository.findById(id);
        return form.map(ResponseEntity::ok)
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Create a new form. Accessible by ADMIN only.
     * @param form The form object to create.
     * @return The created form.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Form> createForm(@RequestBody Form form) {
        // Basic validation: ensure title is not empty and is unique
        if (form.getTitle() == null || form.getTitle().trim().isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        if (formRepository.findByTitle(form.getTitle()).isPresent()) {
            return new ResponseEntity<>(HttpStatus.CONFLICT); // 409 Conflict if title already exists
        }
        Form savedForm = formRepository.save(form);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedForm);
    }

    /**
     * Update an existing form. Accessible by ADMIN only.
     * @param id The ID of the form to update.
     * @param formDetails The updated form details.
     * @return The updated form.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Form> updateForm(@PathVariable Long id, @RequestBody Form formDetails) {
        return formRepository.findById(id)
                .map(form -> {
                    form.setTitle(formDetails.getTitle());
                    form.setDescription(formDetails.getDescription());
                    // Note: Questions are managed via the QuestionController or AdminController,
                    // not directly by updating the 'questions' list here to avoid N+1 issues
                    // or unexpected cascade behavior if not carefully managed.
                    Form updatedForm = formRepository.save(form);
                    return ResponseEntity.ok(updatedForm);
                }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Delete a form by ID. Accessible by ADMIN only.
     * Due to CascadeType.ALL on questions, associated questions will also be deleted.
     * @param id The ID of the form to delete.
     * @return 204 No Content if successful, 404 Not Found otherwise.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HttpStatus> deleteForm(@PathVariable Long id) {
        if (!formRepository.existsById(id)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        formRepository.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);


    }
}
