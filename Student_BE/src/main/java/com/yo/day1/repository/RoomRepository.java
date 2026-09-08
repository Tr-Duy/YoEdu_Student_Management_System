package com.yo.day1.repository;

import com.yo.day1.domain.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByNameLike(String name);//tim heo ten bang room
}
