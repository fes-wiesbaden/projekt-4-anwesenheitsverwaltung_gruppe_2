package com.feswiesbaden.attendencemanagement.controller;

import com.feswiesbaden.attendencemanagement.dto.requests.CreateRoomDto;
import com.feswiesbaden.attendencemanagement.entity.Room;
import com.feswiesbaden.attendencemanagement.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/room")
@RequiredArgsConstructor
public class RoomController {

    private final RoomRepository roomRepository;

    @PostMapping("/create")
    public ResponseEntity<Room> Create(@RequestBody CreateRoomDto dto) {
        if (dto.RoomName == null || dto.RoomName.isBlank()) return ResponseEntity.badRequest().build();

        Room room = new Room();
        room.setRoomName(dto.RoomName);
        room.setRoomNumber(dto.RoomNumber);

        roomRepository.save(room);
        return ResponseEntity.ok(room);
    }

    @GetMapping("/getall")
    public ResponseEntity<List<Room>> GetAllRooms(){
        return ResponseEntity.ok(roomRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> GetRoomById(@PathVariable Long id){
        return roomRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

}
