package com.feswiesbaden.attendencemanagement.exceptions;

public class ClassroomNotFoundException extends RuntimeException{
    public ClassroomNotFoundException(String className) {
        super("Classroom not found: " + className);
    }
}