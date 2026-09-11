package com.feswiesbaden.attendencemanagement.repository;

import com.feswiesbaden.attendencemanagement.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
}
