// RoleRepository.java
package com.example.backend.repository;

import com.example.backend.model.ERole;
import com.example.backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(ERole name);
}