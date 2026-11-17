package com.feswiesbaden.attendencemanagement.controller;

import com.feswiesbaden.attendencemanagement.dto.requests.AssignRfidDto;
import com.feswiesbaden.attendencemanagement.dto.response.AssignRfidResponseDto;
import com.feswiesbaden.attendencemanagement.dto.response.SetRfidResponseDto;
import com.feswiesbaden.attendencemanagement.entity.Rfid_chip;
import com.feswiesbaden.attendencemanagement.entity.Student;
import com.feswiesbaden.attendencemanagement.repository.RfidRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import com.feswiesbaden.attendencemanagement.service.MqttService;
import com.feswiesbaden.attendencemanagement.service.SetRfidService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/rfid")
@RequiredArgsConstructor
public class CardController {

    private final MqttService mqttService;

    private final SetRfidService setRfidService;

    private final StudentRepository studentRepository;

    private final RfidRepository rfidRepository;

    @PostMapping("/set")
    public ResponseEntity<SetRfidResponseDto> SetRfid() {
        String requestId = setRfidService.startSet();
        try {
            mqttService.setRfid(requestId);
        } catch (Exception e) {
            setRfidService.cancelSet(requestId);
            return ResponseEntity.status(503).body(new SetRfidResponseDto(requestId, "FAILED"));
        }
        return ResponseEntity.accepted().body(new SetRfidResponseDto(requestId, "PENDING"));
    }

//    @GetMapping("/set/status/{requestId}")
//    public ResponseEntity<SetRfidResponseDto> SetRfidStatus(@PathVariable String requestId) {
//
//    }

    @GetMapping("/getall")
    public ResponseEntity<List<Rfid_chip>> GetAll() {
        return ResponseEntity.ok(rfidRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rfid_chip> GetCardById(@PathVariable UUID id) {
        System.out.println(id);
        boolean exist = rfidRepository.existsById(id);
        System.out.println(exist);
        return rfidRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/assign-rfid")
    @Transactional
    public ResponseEntity<AssignRfidResponseDto> AssignRfid(@RequestBody AssignRfidDto dto) {
        if (dto.studentId == null || dto.rfid_Id == null) return ResponseEntity.badRequest().build();

        if (!studentRepository.existsById(dto.studentId)) {
            System.out.println("student doesnt exist");
            return ResponseEntity.notFound().build();
        }
        if (!rfidRepository.existsById(dto.rfid_Id)) {
            System.out.println("rfid doesnt exist");
            return ResponseEntity.notFound().build();
        }

        Optional<Student> existingStudent = studentRepository.findById(dto.studentId);
        if (existingStudent.isEmpty()) return ResponseEntity.notFound().build();

        Student student = existingStudent.get();

        Optional<Rfid_chip> existingCard = rfidRepository.findById(dto.rfid_Id);
        if (existingCard.isEmpty()) return ResponseEntity.notFound().build();

        Rfid_chip Card = existingCard.get();

        Optional<Student> previousStudent = studentRepository.findByRfidChipId(Card.getId());
        if (previousStudent.isPresent() && !previousStudent.get().getId().equals(student.getId())) {
            previousStudent.get().setRfidChip(null);
            studentRepository.save(previousStudent.get());
        }

        student.setRfidChip(Card);
        studentRepository.save(student);

        return ResponseEntity.ok(new AssignRfidResponseDto());
    }
}
