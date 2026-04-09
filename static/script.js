let startTime = null;

function startSession() {
    startTime = new Date();
    document.getElementById("status").innerText = "Session Started!";
}

function stopSession() {
    if (!startTime) return;

    let endTime = new Date();
    let duration = (endTime - startTime) / 1000;

    let subject = document.getElementById("subject").value;

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
    .then(res => res.json())
    .then(data => {
        document.getElementById("status").innerText = "Session Saved!";
        loadSessions();
    });

    startTime = null;
}

function loadSessions() {
    fetch("/get_sessions")
    .then(res => res.json())
    .then(data => {
        let list = document.getElementById("sessionList");
        list.innerHTML = "";

        data.forEach(s => {
            let li = document.createElement("li");
            li.innerText = `${s.subject} - ${s.duration.toFixed(2)} sec`;
            list.appendChild(li);
        });
    });

    fetch("/total_time")
    .then(res => res.json())
    .then(data => {
        document.getElementById("total").innerText = data.total.toFixed(2);
    });
}

window.onload = loadSessions;