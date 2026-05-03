package com.yo.day1.service.impl;

import com.yo.day1.domain.entity.Parent;
import com.yo.day1.repository.ParentRepository;
import com.yo.day1.service.ParentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ParentServiceImpl implements ParentService {

    private final ParentRepository parentRepository;

    public List<Parent> findAll() {
        return parentRepository.findAll();
    }

    public Optional<Parent> findById(Long id) {
        return parentRepository.findById(id);
    }

    public Parent save(Parent parent) {
        return parentRepository.save(parent);
    }

    public Parent update(Long id, Parent parent) {
        Parent existing = parentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parent not found: " + id));
        existing.setFullName(parent.getFullName());
        existing.setEmail(parent.getEmail());
        existing.setPhone(parent.getPhone());
        existing.setAddress(parent.getAddress());
        existing.setGender(parent.getGender());
        existing.setRelationship(parent.getRelationship());
        return parentRepository.save(existing);
    }

    public void delete(Long id) {

        parentRepository.deleteById(id);
}
}
