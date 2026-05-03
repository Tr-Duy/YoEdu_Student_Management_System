package com.yo.day1.service;

import com.yo.day1.domain.entity.Parent;

import java.util.List;
import java.util.Optional;

public interface ParentService {
    List<Parent> findAll();
    Optional<Parent> findById(Long id);
    Parent save(Parent parent);
    Parent update(Long id, Parent parent);
    void delete(Long id);
}
