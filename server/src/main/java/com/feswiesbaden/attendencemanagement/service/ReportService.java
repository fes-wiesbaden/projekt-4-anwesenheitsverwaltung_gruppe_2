package com.feswiesbaden.attendencemanagement.service;

import com.feswiesbaden.attendencemanagement.entity.*;
import com.feswiesbaden.attendencemanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {
    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;
    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;

    private User user(String username) {
        User u = userRepository.findByUsername(username);
        if (u == null) throw new NoSuchElementException("Authenticated user was not found.");
        return u;
    }
    private Set<Long> accessibleClassIds(User u) {
        if (u.getRole() == Role.ADMIN) return classroomRepository.findAll().stream().map(Classroom::getId).collect(Collectors.toSet());
        Set<Long> ids = new HashSet<>();
        if (u.getMyClassroom() != null) ids.add(u.getMyClassroom().getId());
        if (u.getClasses() != null) u.getClasses().stream().filter(Objects::nonNull).map(Classroom::getId).forEach(ids::add);
        return ids;
    }
    private List<Attendance> scoped(String username, LocalDate from, LocalDate to, Long classId) {
        User u = user(username);
        Set<Long> allowed = accessibleClassIds(u);
        if (classId != null && u.getRole() != Role.ADMIN && !allowed.contains(classId))
            throw new SecurityException("You are not assigned to this class.");
        if (classId != null && !classroomRepository.existsById(classId)) throw new NoSuchElementException("Class not found.");
        return attendanceRepository.findAll().stream()
            .filter(a -> a.getDate() != null && !a.getDate().isBefore(from) && !a.getDate().isAfter(to))
            .filter(a -> a.getStudent() != null && a.getStudent().getClassroom() != null)
            .filter(a -> classId != null ? a.getStudent().getClassroom().getId().equals(classId)
                                         : allowed.contains(a.getStudent().getClassroom().getId()))
            .toList();
    }
    private Map<String,Object> summary(List<Attendance> rows, LocalDate from, LocalDate to) {
        long present = rows.stream().filter(a -> a.getCheckin()!=null).count();
        long absent = rows.stream().filter(a -> a.getStatus()==Attendance_status.ABWESEND).count();
        long late = rows.stream().filter(a -> a.getStatus()==Attendance_status.VERSPAETET).count();
        long early = rows.stream().filter(a -> a.getCheckout()!=null && a.getCheckoutReason()!=null
                && (a.getCheckoutReason().contains("EARLY"))).count();
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("from",from); m.put("to",to); m.put("records",rows.size());
        m.put("present",present); m.put("absent",absent); m.put("lateArrivals",late);
        m.put("earlyDepartures",early);
        m.put("attendancePercentage", rows.isEmpty()?0.0:Math.round((present*10000.0/rows.size()))/100.0);
        return m;
    }
    private Map<String,Object> row(Attendance a) {
        Map<String,Object> m=new LinkedHashMap<>();
        Student s=a.getStudent();
        m.put("attendanceId",a.getId()); m.put("date",a.getDate());
        m.put("studentId",s.getId()); m.put("studentName",s.getDisplayName());
        m.put("classId",s.getClassroom().getId()); m.put("className",s.getClassroom().getClassroomName());
        m.put("status",a.getStatus()); m.put("checkin",a.getCheckin()); m.put("checkout",a.getCheckout());
        m.put("checkoutReason",a.getCheckoutReason()); m.put("checkedOutBy",a.getCheckedOutBy());
        return m;
    }
    public Map<String,Object> dashboard(String username) {
        User u=user(username);
        Set<Long> ids=accessibleClassIds(u);
        List<Student> students=studentRepository.findAll().stream()
            .filter(s->s.getClassroom()!=null && ids.contains(s.getClassroom().getId())).toList();
        LocalDate today=LocalDate.now(ZoneId.of("Europe/Berlin"));
        List<Attendance> todayRows=scoped(username,today,today,null);
        Map<String,Object> result=new LinkedHashMap<>();
        result.put("totalStudents",students.size()); result.put("totalClasses",ids.size());
        result.putAll(summary(todayRows,today,today));
        result.put("totalTeachers",u.getRole()==Role.ADMIN?userRepository.findAll().stream().filter(x->x.getRole()==Role.TEACHER).count():null);
        return result;
    }
    public Map<String,Object> period(String username, LocalDate from, LocalDate to, Long classId) {
        List<Attendance> rows=scoped(username,from,to,classId);
        Map<String,Object> result=summary(rows,from,to);
        result.put("attendance",rows.stream().map(this::row).toList());
        return result;
    }
    public Map<String,Object> classReport(String username, Long classId, LocalDate from, LocalDate to) {
        Map<String,Object> r=period(username,from,to,classId);
        r.put("classId",classId); r.put("className",classroomRepository.findById(classId).orElseThrow().getClassroomName());
        return r;
    }
    public Map<String,Object> studentReport(String username, UUID studentId, LocalDate from, LocalDate to) {
        User u=user(username); Student s=studentRepository.findById(studentId).orElseThrow(()->new NoSuchElementException("Student not found."));
        if(s.getClassroom()==null || (u.getRole()!=Role.ADMIN && !accessibleClassIds(u).contains(s.getClassroom().getId())))
            throw new SecurityException("You are not assigned to this student's class.");
        List<Attendance> rows=attendanceRepository.findAllByStudent_Id(studentId).stream()
            .filter(a->a.getDate()!=null && !a.getDate().isBefore(from) && !a.getDate().isAfter(to)).toList();
        Map<String,Object> r=summary(rows,from,to); r.put("studentId",studentId); r.put("studentName",s.getDisplayName());
        r.put("attendance",rows.stream().map(this::row).toList()); return r;
    }
    public Map<String,Object> category(String username, LocalDate from, LocalDate to, String kind) {
        List<Attendance> rows=scoped(username,from,to,null);
        List<Attendance> filtered=rows.stream().filter(a->switch(kind) {
            case "ABSENT" -> a.getStatus()==Attendance_status.ABWESEND;
            case "LATE" -> a.getStatus()==Attendance_status.VERSPAETET;
            case "EARLY" -> a.getCheckout()!=null && a.getCheckoutReason()!=null && a.getCheckoutReason().contains("EARLY");
            default -> false;
        }).toList();
        Map<String,Object> result=new LinkedHashMap<>(); result.put("from",from); result.put("to",to);
        result.put("count",filtered.size()); result.put("attendance",filtered.stream().map(this::row).toList()); return result;
    }
}
