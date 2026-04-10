let startTime = null;

function formatSeconds(value) {
    return Number(value || 0).toFixed(2);
}

function startSession() {
    startTime = new Date();
    document.getElementById("status").innerText = "Session Started!";
}

function stopSession() {
    if (!startTime) return;

    let endTime = new Date();
    let duration = (endTime - startTime) / 1000;

    let subject = document.getElementById("subject").value.trim();
    if (!subject) {
        document.getElementById("status").innerText = "Please enter a subject.";
        return;
    }

    fetch("/add_session", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            subject: subject,
            duration: duration
        })
    })
    .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Unable to save session");
        }
        return data;
    })
    .then(data => {
        document.getElementById("status").innerText = "Session Saved!";
        document.getElementById("subject").value = "";
        loadSessions();
    })
    .catch((error) => {
        document.getElementById("status").innerText = error.message;
    });

    startTime = null;
}

function toggleEditor(editorId, visible) {
    const editor = document.getElementById(editorId);
    if (editor) {
        editor.style.display = visible ? "flex" : "none";
    }
}

function saveEdit(sessionId) {
    const subjectInput = document.getElementById(`subject-${sessionId}`);
    const durationInput = document.getElementById(`duration-${sessionId}`);

    const subject = subjectInput.value.trim();
    const duration = Number(durationInput.value);

    fetch(`/edit_session/${sessionId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ subject, duration })
    })
    .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Unable to update session");
        }
        return data;
    })
    .then(() => {
        document.getElementById("status").innerText = "Session updated.";
        loadSessions();
    })
    .catch((error) => {
        document.getElementById("status").innerText = error.message;
    });
}

function loadSessions() {
    fetch("/get_sessions")
    .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Unable to load sessions");
        }
        return data;
    })
    .then(data => {
        let list = document.getElementById("sessionList");
        list.innerHTML = "";

        data.forEach(s => {
            let li = document.createElement("li");

            const row = document.createElement("div");
            row.className = "session-row";

            const text = document.createElement("span");
            text.innerText = `${s.subject} - ${formatSeconds(s.duration)} sec`;

            const editButton = document.createElement("button");
            editButton.className = "edit";
            editButton.innerText = "Edit";
            editButton.onclick = () => toggleEditor(`editor-${s.id}`, true);

            row.appendChild(text);
            row.appendChild(editButton);

            const editor = document.createElement("div");
            editor.className = "edit-form";
            editor.id = `editor-${s.id}`;
            editor.style.display = "none";

            const subjectInput = document.createElement("input");
            subjectInput.id = `subject-${s.id}`;
            subjectInput.value = s.subject;
            subjectInput.placeholder = "Subject";

            const durationInput = document.createElement("input");
            durationInput.id = `duration-${s.id}`;
            durationInput.type = "number";
            durationInput.step = "0.01";
            durationInput.min = "0.01";
            durationInput.value = formatSeconds(s.duration);
            durationInput.placeholder = "Duration (sec)";

            const saveButton = document.createElement("button");
            saveButton.className = "save";
            saveButton.innerText = "Save";
            saveButton.onclick = () => saveEdit(s.id);

            const cancelButton = document.createElement("button");
            cancelButton.className = "cancel";
            cancelButton.innerText = "Cancel";
            cancelButton.onclick = () => toggleEditor(`editor-${s.id}`, false);

            editor.appendChild(subjectInput);
            editor.appendChild(durationInput);
            editor.appendChild(saveButton);
            editor.appendChild(cancelButton);

            li.appendChild(row);
            li.appendChild(editor);
            list.appendChild(li);
        });
    })
    .catch((error) => {
        document.getElementById("status").innerText = error.message;
    });

    fetch("/analytics")
    .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Unable to load analytics");
        }
        return data;
    })
    .then(data => {
        document.getElementById("total").innerText = formatSeconds(data.totalStudyTime);
        document.getElementById("sessionCount").innerText = data.numberOfSessions;
        document.getElementById("avgDuration").innerText = formatSeconds(data.averageSessionDuration);

        const subjectWiseList = document.getElementById("subjectWiseList");
        subjectWiseList.innerHTML = "";
        const entries = Object.entries(data.subjectWiseStudyTime || {});

        if (!entries.length) {
            const li = document.createElement("li");
            li.innerText = "No sessions yet.";
            subjectWiseList.appendChild(li);
            return;
        }

        entries.forEach(([subject, total]) => {
            const li = document.createElement("li");
            li.innerText = `${subject}: ${formatSeconds(total)} sec`;
            subjectWiseList.appendChild(li);
        });
    })
    .catch((error) => {
        document.getElementById("status").innerText = error.message;
    });
}

window.onload = loadSessions;