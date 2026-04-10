const state = {
    running: false,
    paused: false,
    intervalId: null,
    startTimestampMs: null,
    accumulatedMs: 0,
    sessionStartIso: null,
    sessions: [],
    analytics: null,
};

function setStatus(message) {
    document.getElementById("status").innerText = message;
}

function formatTimeDetailed(seconds) {
    const totalSeconds = Math.max(0, Math.floor(Number(seconds || 0)));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function formatTimeCompact(seconds) {
    const totalSeconds = Math.max(0, Math.floor(Number(seconds || 0)));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
        return `${h}h ${String(m).padStart(2, "0")}m`;
    }
    return `${m}m ${String(s).padStart(2, "0")}s`;
}

function formatClockFromMs(totalMs) {
    const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getLiveElapsedMs() {
    if (!state.running || state.startTimestampMs === null) {
        return state.accumulatedMs;
    }
    return state.accumulatedMs + (Date.now() - state.startTimestampMs);
}

function updateTimerDisplay() {
    document.getElementById("liveTimer").innerText = formatClockFromMs(getLiveElapsedMs());
}

function updateTimerStateLabel() {
    const label = document.getElementById("timerState");
    if (state.running) {
        label.innerText = "Running";
        return;
    }
    if (state.paused) {
        label.innerText = "Paused";
        return;
    }
    label.innerText = "Idle";
}

function startTicking() {
    if (state.intervalId) {
        clearInterval(state.intervalId);
    }
    state.intervalId = setInterval(updateTimerDisplay, 200);
}

function stopTicking() {
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
}

function resetTimerState() {
    stopTicking();
    state.running = false;
    state.paused = false;
    state.startTimestampMs = null;
    state.accumulatedMs = 0;
    state.sessionStartIso = null;
    updateTimerDisplay();
    updateTimerStateLabel();
}

function startSession() {
    const subject = document.getElementById("subject").value.trim();
    if (!subject) {
        setStatus("Enter a subject before starting the timer.");
        return;
    }
    if (state.running || state.paused) {
        setStatus("A session is already active.");
        return;
    }

    state.running = true;
    state.paused = false;
    state.startTimestampMs = Date.now();
    state.accumulatedMs = 0;
    state.sessionStartIso = new Date().toISOString();
    updateTimerStateLabel();
    startTicking();
    setStatus("Session started. Stay in flow.");
}

function pauseSession() {
    if (!state.running) {
        return;
    }
    state.accumulatedMs = getLiveElapsedMs();
    state.running = false;
    state.paused = true;
    state.startTimestampMs = null;
    stopTicking();
    updateTimerDisplay();
    updateTimerStateLabel();
    setStatus("Session paused.");
}

function resumeSession() {
    if (!state.paused) {
        return;
    }
    state.running = true;
    state.paused = false;
    state.startTimestampMs = Date.now();
    startTicking();
    updateTimerStateLabel();
    setStatus("Session resumed.");
}

async function stopSession() {
    if (!state.running && !state.paused) {
        setStatus("Start a session first.");
        return;
    }

    const subject = document.getElementById("subject").value.trim();
    const notes = document.getElementById("notes").value.trim();
    if (!subject) {
        setStatus("Subject cannot be empty.");
        return;
    }

    const elapsedMs = getLiveElapsedMs();
    const durationSeconds = elapsedMs / 1000;
    if (durationSeconds < 1) {
        setStatus("Session too short to save.");
        return;
    }

    try {
        const res = await fetch("/add_session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                subject,
                notes,
                duration: durationSeconds,
                startedAt: state.sessionStartIso || new Date().toISOString(),
                endedAt: new Date().toISOString(),
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Unable to save session");
        }

        resetTimerState();
        document.getElementById("notes").value = "";
        setStatus("Session saved successfully.");
        await loadDashboard();
    } catch (error) {
        setStatus(error.message);
    }
}

function clearTimer() {
    if (state.running || state.paused) {
        resetTimerState();
        setStatus("Timer reset.");
    }
}

function toggleEditor(editorId, visible) {
    const editor = document.getElementById(editorId);
    if (editor) {
        editor.style.display = visible ? "grid" : "none";
    }
}

async function saveEdit(sessionId) {
    const subject = document.getElementById(`subject-${sessionId}`).value.trim();
    const duration = Number(document.getElementById(`duration-${sessionId}`).value);
    const notes = document.getElementById(`notes-${sessionId}`).value.trim();

    try {
        const res = await fetch(`/edit_session/${sessionId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, duration, notes }),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Unable to update session");
        }
        setStatus("Session updated.");
        await loadDashboard();
    } catch (error) {
        setStatus(error.message);
    }
}

async function deleteSession(sessionId) {
    if (!window.confirm("Delete this session?")) {
        return;
    }
    try {
        const res = await fetch(`/delete_session/${sessionId}`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Unable to delete session");
        }
        setStatus("Session deleted.");
        await loadDashboard();
    } catch (error) {
        setStatus(error.message);
    }
}

async function deleteAllSessions() {
    if (!state.sessions.length) {
        setStatus("No sessions to delete.");
        return;
    }

    if (!window.confirm("Delete all sessions? This cannot be undone.")) {
        return;
    }

    try {
        for (const item of state.sessions) {
            const res = await fetch(`/delete_session/${item.id}`, { method: "POST" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Unable to delete one or more sessions");
            }
        }
        setStatus("All sessions deleted.");
        await loadDashboard();
    } catch (error) {
        setStatus(error.message);
    }
}

function renderSubjectDistribution(subjectWiseStudyTime) {
    const list = document.getElementById("subjectWiseList");
    list.innerHTML = "";
    const entries = Object.entries(subjectWiseStudyTime || {}).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, sec]) => sum + Number(sec), 0);

    if (!entries.length) {
        const li = document.createElement("li");
        li.innerText = "No sessions yet.";
        list.appendChild(li);
        return;
    }

    entries.forEach(([subject, seconds]) => {
        const ratio = total > 0 ? (seconds / total) * 100 : 0;
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="subject-head">
                <span>${subject}</span>
                <span>${formatTimeCompact(seconds)}</span>
            </div>
            <div class="subject-track">
                <div class="subject-bar" style="width:${ratio.toFixed(1)}%"></div>
            </div>
        `;
        list.appendChild(li);
    });
}

function computeSmartTip(analytics) {
    if (!analytics || !analytics.numberOfSessions) {
        return "Start with one focused 25-minute sprint today and log clear notes.";
    }

    const entries = Object.entries(analytics.subjectWiseStudyTime || {}).sort((a, b) => b[1] - a[1]);
    const top = entries[0];
    const total = Number(analytics.totalStudyTime || 0);
    const avg = Number(analytics.averageSessionDuration || 0);

    if (top && total > 0 && (top[1] / total) > 0.7) {
        return `You are heavily focused on ${top[0]}. Add a short session in a second subject for better balance.`;
    }
    if (avg < 900) {
        return "Your average session is under 15 minutes. Try a 25-minute deep work block for better retention.";
    }
    if (analytics.focusScore >= 80) {
        return "Excellent consistency. Maintain this pace and schedule one review session before day end.";
    }
    return "Good momentum. Keep session notes specific to make your revision faster later.";
}

function applyGoalProgress(todayStudyTimeSeconds) {
    const goalInput = document.getElementById("dailyGoal");
    const stored = localStorage.getItem("studyGoalMinutes");
    if (stored && !Number.isNaN(Number(stored))) {
        goalInput.value = String(Number(stored));
    }

    const goalMinutes = Math.max(15, Number(goalInput.value || 120));
    const todayMinutes = todayStudyTimeSeconds / 60;
    const progress = Math.min(100, (todayMinutes / goalMinutes) * 100);

    document.getElementById("goalProgressBar").style.width = `${progress.toFixed(1)}%`;
    document.getElementById("todayProgressText").innerText = `Today: ${todayMinutes.toFixed(1)} / ${goalMinutes} min`;
}

function renderSessions(sessions) {
    const list = document.getElementById("sessionList");
    list.innerHTML = "";
    if (!sessions.length) {
        const li = document.createElement("li");
        li.className = "session-item";
        li.innerText = "No study sessions yet. Start your first focused session.";
        list.appendChild(li);
        return;
    }

    const sorted = [...sessions].sort((a, b) => {
        const dateA = new Date(a.startedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.startedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
    });

    sorted.forEach((s) => {
        const li = document.createElement("li");
        li.className = "session-item";

        const startedAt = s.startedAt || s.createdAt;
        const prettyDate = startedAt ? new Date(startedAt).toLocaleString() : "Unknown time";
        const noteText = s.notes ? `<div class="session-meta">Notes: ${s.notes}</div>` : "";

        li.innerHTML = `
            <div class="session-row">
                <div class="session-main">
                    <strong>${s.subject}</strong>
                    <div class="session-meta">Duration: ${formatTimeCompact(s.duration)} | ${prettyDate}</div>
                    ${noteText}
                </div>
                <div class="session-actions">
                    <button class="edit" id="edit-btn-${s.id}">Edit</button>
                    <button class="delete" id="delete-btn-${s.id}">Delete</button>
                </div>
            </div>
            <div class="edit-form" id="editor-${s.id}" style="display:none;">
                <input id="subject-${s.id}" value="${s.subject}" placeholder="Subject">
                <input id="duration-${s.id}" type="number" min="1" step="1" value="${Math.max(1, Math.round(Number(s.duration || 0)))}" placeholder="Duration (sec)">
                <input value="${prettyDate}" disabled>
                <textarea id="notes-${s.id}" rows="3" placeholder="Notes">${s.notes || ""}</textarea>
                <div class="edit-buttons">
                    <button class="save" id="save-btn-${s.id}">Save</button>
                    <button class="cancel" id="cancel-btn-${s.id}">Cancel</button>
                </div>
            </div>
        `;

        list.appendChild(li);

        document.getElementById(`edit-btn-${s.id}`).addEventListener("click", () => toggleEditor(`editor-${s.id}`, true));
        document.getElementById(`cancel-btn-${s.id}`).addEventListener("click", () => toggleEditor(`editor-${s.id}`, false));
        document.getElementById(`save-btn-${s.id}`).addEventListener("click", () => saveEdit(s.id));
        document.getElementById(`delete-btn-${s.id}`).addEventListener("click", () => deleteSession(s.id));
    });
}

function renderAnalytics(analytics) {
    document.getElementById("total").innerText = formatTimeDetailed(analytics.totalStudyTime);
    document.getElementById("sessionCount").innerText = analytics.numberOfSessions;
    document.getElementById("avgDuration").innerText = formatTimeCompact(analytics.averageSessionDuration);
    document.getElementById("longestSession").innerText = formatTimeCompact(analytics.longestSession);
    document.getElementById("focusScore").innerText = analytics.focusScore;
    document.getElementById("smartTip").innerText = computeSmartTip(analytics);
    renderSubjectDistribution(analytics.subjectWiseStudyTime);
    applyGoalProgress(Number(analytics.todayStudyTime || 0));
}

async function loadDashboard() {
    try {
        const [sessionsRes, analyticsRes] = await Promise.all([
            fetch("/get_sessions"),
            fetch("/analytics"),
        ]);

        const sessionsData = await sessionsRes.json();
        const analyticsData = await analyticsRes.json();

        if (!sessionsRes.ok) {
            throw new Error(sessionsData.error || "Unable to load sessions");
        }
        if (!analyticsRes.ok) {
            throw new Error(analyticsData.error || "Unable to load analytics");
        }

        state.sessions = sessionsData;
        state.analytics = analyticsData;

        renderSessions(state.sessions);
        renderAnalytics(state.analytics);
    } catch (error) {
        setStatus(error.message);
    }
}

function saveGoal() {
    const goalMinutes = Math.max(15, Number(document.getElementById("dailyGoal").value || 120));
    localStorage.setItem("studyGoalMinutes", String(goalMinutes));
    if (state.analytics) {
        applyGoalProgress(Number(state.analytics.todayStudyTime || 0));
    }
    setStatus("Daily goal updated.");
}

function bindEvents() {
    document.getElementById("startBtn").addEventListener("click", startSession);
    document.getElementById("pauseBtn").addEventListener("click", pauseSession);
    document.getElementById("resumeBtn").addEventListener("click", resumeSession);
    document.getElementById("stopBtn").addEventListener("click", stopSession);
    document.getElementById("resetBtn").addEventListener("click", clearTimer);
    document.getElementById("saveGoalBtn").addEventListener("click", saveGoal);
    document.getElementById("clearCompletedBtn").addEventListener("click", deleteAllSessions);
}

window.onload = async () => {
    updateTimerDisplay();
    updateTimerStateLabel();
    bindEvents();
    await loadDashboard();
};