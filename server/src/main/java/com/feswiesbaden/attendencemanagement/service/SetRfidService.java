package com.feswiesbaden.attendencemanagement.service;

import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class SetRfidService {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_TIMEOUT = "TIMEOUT";
    public static final String STATUS_NOT_FOUND = "NOT_FOUND";

    private static final long TIMEOUT_SECONDS = 60;
    private static final long RESULT_TTL_SECONDS = 300;
    private static final long CLEANUP_INTERVAL_SECONDS = 10;

    private record PendingSet(CompletableFuture<String> future, long createdAt, AtomicBoolean processing) {
    }

    private final ConcurrentHashMap<String, PendingSet> pendingSets = new ConcurrentHashMap<>();

    public SetRfidService() {
        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "rfid-set-cleaner");
            t.setDaemon(true);
            return t;
        });
        scheduler.scheduleAtFixedRate(this::cleanUp,
                CLEANUP_INTERVAL_SECONDS, CLEANUP_INTERVAL_SECONDS, TimeUnit.SECONDS);
    }

    public String startSet() {
        String requestId = UUID.randomUUID().toString();
        pendingSets.put(requestId, new PendingSet(new CompletableFuture<>(), System.currentTimeMillis(), new AtomicBoolean(false)));
        return requestId;
    }

    public boolean claimSet(String requestId) {
        if (requestId == null || requestId.isBlank()) return false;
        PendingSet pending = pendingSets.get(requestId);
        return pending != null && !pending.future().isDone()
                && pending.processing().compareAndSet(false, true);
    }

    public String getSinglePendingRequestId() {
        String result = null;
        for (var entry : pendingSets.entrySet()) {
            PendingSet pending = entry.getValue();
            if (!pending.future().isDone() && !pending.processing().get()) {
                if (result != null) return null; // Ambiguous legacy reader response.
                result = entry.getKey();
            }
        }
        return result;
    }

    public void completeSet(String requestId, String result) {
        PendingSet pending = pendingSets.get(requestId);
        if (pending != null) pending.future().complete(result);
    }

    public void cancelSet(String requestId) {
        pendingSets.remove(requestId);
    }

    public String getStatus(String requestId) {
        PendingSet pending = pendingSets.get(requestId);
        if (pending == null) return STATUS_NOT_FOUND;
        return pending.future().getNow(STATUS_PENDING);
    }

    private void cleanUp() {
        long now = System.currentTimeMillis();
        pendingSets.forEach((requestId, pending) -> {
            long ageMs = now - pending.createdAt();
            if (pending.future().isDone() && ageMs > RESULT_TTL_SECONDS * 1000) {
                pendingSets.remove(requestId, pending);
            } else if (!pending.future().isDone() && !pending.processing().get()
                    && ageMs > TIMEOUT_SECONDS * 1000) {
                pending.future().complete(STATUS_TIMEOUT);
            }
        });
    }
}
