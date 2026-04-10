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
            li.innerText = `${s.subject} - ${formatSeconds(s.duration)} sec`;
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