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
import org.springframework.security.core.Authentication;
import com.feswiesbaden.attendencemanagement.service.SystemAuditLogService;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.springframework.beans.factory.annotation.Autowired;
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
    private final SystemAuditLogService auditLogService;

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

    @GetMapping("/set/status/{requestId}")
    public ResponseEntity<SetRfidResponseDto> setRfidStatus(@PathVariable String requestId) {
        String status = setRfidService.getStatus(requestId);
        if (SetRfidService.STATUS_NOT_FOUND.equals(status)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(new SetRfidResponseDto(requestId, status));
    }

    @GetMapping("/getall")
    public ResponseEntity<List<Rfid_chip>> GetAll() {
        return ResponseEntity.ok(rfidRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rfid_chip> GetCardById(@PathVariable UUID id) {
        return rfidRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/assign-rfid")
    @Transactional
    public ResponseEntity<AssignRfidResponseDto> AssignRfid(@RequestBody AssignRfidDto dto, Authentication auth) {
        if (dto == null || dto.studentId == null || dto.rfid_Id == null) return ResponseEntity.badRequest().build();

        if (!studentRepository.existsById(dto.studentId)) {
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
        if (!Card.isActive()) return ResponseEntity.status(409).build();

        Optional<Student> previousStudent = studentRepository.findByRfidChipId(Card.getId());
        if (previousStudent.isPresent() && !previousStudent.get().getId().equals(student.getId())) {
            return ResponseEntity.status(409).build();
        }
        if (student.getRfidChip() != null && !student.getRfidChip().getId().equals(Card.getId())) {
            return ResponseEntity.status(409).build();
        }

        String previousCardId = student.getRfidChip() == null ? null : student.getRfidChip().getId().toString();
        student.setRfidChip(Card);
        studentRepository.save(student);
        auditLogService.record(auth.getName(), "RFID_ASSIGNED", "STUDENT", student.getId().toString(),
                "Assigned RFID card " + Card.getChipId() + " to student " + student.getUsername(),
                previousCardId, Card.getId().toString());

        return ResponseEntity.ok(new AssignRfidResponseDto());
    }

    @DeleteMapping("/assign/{studentId}")
    @Transactional
    public ResponseEntity<Void> UnassignRfid(@PathVariable UUID studentId, Authentication auth) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) return ResponseEntity.notFound().build();
        if (student.getRfidChip() == null) return ResponseEntity.noContent().build();
        String previousCardId = student.getRfidChip().getId().toString();
        student.setRfidChip(null);
        studentRepository.save(student);
        auditLogService.record(auth.getName(), "RFID_UNASSIGNED", "STUDENT", student.getId().toString(),
                "Unassigned RFID card from student " + student.getUsername(), previousCardId, null);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/active")
    @Transactional
    public ResponseEntity<Rfid_chip> SetCardActive(@PathVariable UUID id, @RequestParam boolean active, Authentication auth) {
        Rfid_chip card = rfidRepository.findById(id).orElse(null);
        if (card == null) return ResponseEntity.notFound().build();
        boolean oldActive = card.isActive();
        card.setActive(active);
        auditLogService.record(auth.getName(), active ? "RFID_ACTIVATED" : "RFID_DEACTIVATED", "RFID_CARD",
                id.toString(), "Changed RFID card active state", String.valueOf(oldActive), String.valueOf(active));
        return ResponseEntity.ok(rfidRepository.save(card));
    }

}
