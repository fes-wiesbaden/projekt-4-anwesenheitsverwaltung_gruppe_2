package com.feswiesbaden.attendencemanagement.controller;

import com.feswiesbaden.attendencemanagement.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;
    private LocalDate today() { return LocalDate.now(ZoneId.of("Europe/Berlin")); }
    private LocalDate from(LocalDate value) { return value == null ? today() : value; }
    private LocalDate to(LocalDate value) { return value == null ? today() : value; }

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(Authentication auth) { return call(() -> reportService.dashboard(auth.getName())); }

    @GetMapping("/attendance/daily")
    public ResponseEntity<?> daily(Authentication auth,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestParam(required=false) Long classId) {
        LocalDate d=date==null?today():date;
        return call(() -> reportService.period(auth.getName(),d,d,classId));
    }
    @GetMapping("/attendance/weekly")
    public ResponseEntity<?> weekly(Authentication auth,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required=false) Long classId) {
        LocalDate end=to==null?today():to; LocalDate start=from==null?end.minusDays(6):from;
        return period(auth,start,end,classId);
    }
    @GetMapping("/attendance/monthly")
    public ResponseEntity<?> monthly(Authentication auth,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required=false) Long classId) {
        LocalDate end=to==null?today():to; LocalDate start=from==null?end.withDayOfMonth(1):from;
        return period(auth,start,end,classId);
    }
    @GetMapping("/attendance/class/{classId}")
    public ResponseEntity<?> byClass(@PathVariable Long classId, Authentication auth,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end=to==null?today():to; LocalDate start=from==null?end.withDayOfMonth(1):from;
        return call(() -> reportService.classReport(auth.getName(),classId,start,end));
    }
    @GetMapping("/attendance/student/{studentId}")
    public ResponseEntity<?> byStudent(@PathVariable UUID studentId, Authentication auth,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end=to==null?today():to; LocalDate start=from==null?end.withDayOfMonth(1):from;
        return call(() -> reportService.studentReport(auth.getName(),studentId,start,end));
    }
    @GetMapping("/absences")
    public ResponseEntity<?> absences(Authentication auth,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end=to==null?today():to; LocalDate start=from==null?end:from;
        return call(() -> reportService.category(auth.getName(),start,end,"ABSENT"));
    }
    @GetMapping("/late-arrivals")
    public ResponseEntity<?> late(Authentication auth,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end=to==null?today():to; LocalDate start=from==null?end:from;
        return call(() -> reportService.category(auth.getName(),start,end,"LATE"));
    }
    @GetMapping("/early-departures")
    public ResponseEntity<?> early(Authentication auth,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end=to==null?today():to; LocalDate start=from==null?end:from;
        return call(() -> reportService.category(auth.getName(),start,end,"EARLY"));
    }
    private ResponseEntity<?> period(Authentication auth,LocalDate start,LocalDate end,Long classId) {
        return call(() -> reportService.period(auth.getName(),start,end,classId));
    }
    private ResponseEntity<?> call(java.util.function.Supplier<Object> supplier) {
        try { return ResponseEntity.ok(supplier.get()); }
        catch (SecurityException ex) { return ResponseEntity.status(403).body(Map.of("error",ex.getMessage())); }
        catch (java.util.NoSuchElementException ex) { return ResponseEntity.status(404).body(Map.of("error",ex.getMessage())); }
        catch (IllegalArgumentException ex) { return ResponseEntity.badRequest().body(Map.of("error",ex.getMessage())); }
    }
}
