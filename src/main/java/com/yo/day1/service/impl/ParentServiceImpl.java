package com.yo.day1.service.impl;

import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Parent;
import com.yo.day1.dto.parent.ParentResponse;
import com.yo.day1.dto.parent.ParentUpsertRequest;
import com.yo.day1.repository.ParentRepository;
import com.yo.day1.service.ParentService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ParentServiceImpl implements ParentService {

    private final ParentRepository parentRepository;
    private final ModelMapper mapper;

    @Override
    public List<ParentResponse> findAll() {
        return parentRepository.findAll()
                .stream()
                .map(p -> mapper.map(p, ParentResponse.class))
                .toList();
    }

    @Override
    public Optional<ParentResponse> findById(Long id) {
        return parentRepository.findById(id)
                .map(p -> mapper.map(p, ParentResponse.class));
    }

    @Override
    public ParentResponse save(ParentUpsertRequest req) {
        Parent parent = mapper.map(req, Parent.class);
        return mapper.map(parentRepository.save(parent), ParentResponse.class);
    }

    @Override
    public ParentResponse update(Long id, ParentUpsertRequest req) {
        Parent existing = parentRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Parent not found: " + id));
        mapper.map(req, existing);
        return mapper.map(parentRepository.save(existing), ParentResponse.class);
    }

    @Override
    public void delete(Long id) {
        if (!parentRepository.existsById(id)) {
            throw new NotFoundExeception("Parent not found: " + id);
        }
        parentRepository.deleteById(id);
    }
}
