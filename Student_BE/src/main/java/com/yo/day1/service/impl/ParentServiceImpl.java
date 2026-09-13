package com.yo.day1.service.impl;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Parent;
import com.yo.day1.dto.parent.ParentResponse;
import com.yo.day1.dto.parent.ParentUpsertRequest;
import com.yo.day1.repository.ParentRepository;
import com.yo.day1.repository.StudentRepository;
import com.yo.day1.service.ParentService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ParentServiceImpl implements ParentService {

    private final ParentRepository parentRepository;
    private final StudentRepository studentRepository;
    private final ModelMapper mapper;

    @Transactional(readOnly = true)
    @Override
    public List<ParentResponse> findAll() {
        return parentRepository.findAll()
                .stream()
                .map(p -> mapper.map(p, ParentResponse.class))
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<ParentResponse> findById(Long id) {
        return parentRepository.findById(id)
                .map(p -> mapper.map(p, ParentResponse.class));
    }

    @Transactional
    @Override
    public ParentResponse save(ParentUpsertRequest req) {
        if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
            throw new BadRequestException("Họ tên phụ huynh không được để trống");
        }
        Parent parent = mapper.map(req, Parent.class);
        parent.setFullName(req.getFullName().trim());
        return mapper.map(parentRepository.save(parent), ParentResponse.class);
    }

    @Transactional
    @Override
    public ParentResponse update(Long id, ParentUpsertRequest req) {
        Parent existing = parentRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Parent not found: " + id));
        if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
            throw new BadRequestException("Họ tên phụ huynh không được để trống");
        }
        mapper.map(req, existing);
        existing.setFullName(req.getFullName().trim());
        return mapper.map(parentRepository.save(existing), ParentResponse.class);
    }

    @Transactional
    @Override
    public void delete(Long id) {
        if (!parentRepository.existsById(id)) {
            throw new NotFoundExeception("Parent not found: " + id);
        }
        if (studentRepository != null && studentRepository.existsByParentId(id)) {
            throw new ConflictException("Không thể xóa phụ huynh đang có học viên liên kết.");
        }
        parentRepository.deleteById(id);
    }
}
