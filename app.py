import json
import os
import uuid
from datetime import datetime, timezone
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash

app = Flask(__name__)
app.secret_key = "super_secret_key"  # Needed for Flask sessions

USERS_FILE = "users.json"
SESSIONS_FILE = "sessions.json"

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=4)


def load_sessions():
    if not os.path.exists(SESSIONS_FILE):
        return []
    with open(SESSIONS_FILE, "r") as f:
        return json.load(f)


def save_sessions(session_data):
    with open(SESSIONS_FILE, "w") as f:
        json.dump(session_data, f, indent=4)


def get_current_username():
    return session.get("username")


def get_user_sessions(username):
    # Include legacy sessions without username for backward compatibility.
    return [s for s in sessions if s.get("username") == username or "username" not in s]


def parse_iso_datetime(value):
    if not value:
        return None
    normalized = str(value).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def now_iso_utc():
    return datetime.now(timezone.utc).isoformat()


def ensure_session_ids(session_data):
    changed = False
    for item in session_data:
        if "id" not in item:
            item["id"] = uuid.uuid4().hex
            changed = True
    if changed:
        save_sessions(session_data)


sessions = load_sessions()
ensure_session_ids(sessions)

@app.route("/")
def home():
    if "username" not in session:
        return redirect(url_for("login"))
    return render_template("index.html", username=session["username"])

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        users = load_users()
        
        if username in users and users[username] == password:
            session["username"] = username
            return redirect(url_for("home"))
        else:
            flash("Invalid username or password")
            return redirect(url_for("login"))
            
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        users = load_users()
        
        if username in users:
            flash("Username already exists")
            return redirect(url_for("register"))
            
        users[username] = password
        save_users(users)
        flash("Registration successful. Please login.")
        return redirect(url_for("login"))
        
    return render_template("register.html")

@app.route("/logout")
def logout():
    session.pop("username", None)
    return redirect(url_for("login"))


@app.route("/add_session", methods=["POST"])
def add_session():
    username = get_current_username()
    if not username:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    duration = data.get("duration", 0)
    subject = (data.get("subject") or "").strip()
    notes = (data.get("notes") or "").strip()
    started_at = data.get("startedAt") or now_iso_utc()
    ended_at = data.get("endedAt") or now_iso_utc()

    try:
        duration = float(duration)
    except (TypeError, ValueError):
        return jsonify({"error": "Duration must be a number"}), 400

    if not subject:
        return jsonify({"error": "Subject is required"}), 400

    if duration <= 0:
        return jsonify({"error": "Duration must be greater than 0"}), 400

    sessions.append({
        "id": uuid.uuid4().hex,
        "username": username,
        "subject": subject,
        "duration": duration,
        "notes": notes,
        "startedAt": started_at,
        "endedAt": ended_at,
        "createdAt": now_iso_utc(),
    })
    save_sessions(sessions)

    return jsonify({"message": "Session added!"})

@app.route("/get_sessions")
def get_sessions():
    username = get_current_username()
    if not username:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify(get_user_sessions(username))

@app.route("/total_time")
def total_time():
    username = get_current_username()
    if not username:
        return jsonify({"error": "Unauthorized"}), 401
    total = sum(s["duration"] for s in get_user_sessions(username))
    return jsonify({"total": total})


@app.route("/analytics")
def analytics():
    username = get_current_username()
    if not username:
        return jsonify({"error": "Unauthorized"}), 401

    user_sessions = get_user_sessions(username)
    total = sum(s["duration"] for s in user_sessions)
    count = len(user_sessions)
    avg = total / count if count else 0

    subject_totals = {}
    for session_item in user_sessions:
        subject = session_item.get("subject", "Unknown")
        subject_totals[subject] = subject_totals.get(subject, 0) + session_item.get("duration", 0)

    longest = max((s.get("duration", 0) for s in user_sessions), default=0)

    today = datetime.now(timezone.utc).date()
    today_total = 0
    for session_item in user_sessions:
        session_dt = parse_iso_datetime(session_item.get("startedAt") or session_item.get("createdAt"))
        if session_dt and session_dt.astimezone(timezone.utc).date() == today:
            today_total += session_item.get("duration", 0)

    # Balanced score across consistency (sessions), stamina (avg length), and time invested.
    consistency_score = min(count, 8) * 6
    stamina_score = min(avg / 1800, 1) * 35
    effort_score = min(total / 14400, 1) * 35
    focus_score = round(min(100, consistency_score + stamina_score + effort_score), 1)

    return jsonify({
        "totalStudyTime": total,
        "subjectWiseStudyTime": subject_totals,
        "numberOfSessions": count,
        "averageSessionDuration": avg,
        "longestSession": longest,
        "todayStudyTime": today_total,
        "focusScore": focus_score,
    })


@app.route("/edit_session/<session_id>", methods=["POST"])
def edit_session(session_id):
    username = get_current_username()
    if not username:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json or {}
    has_subject = "subject" in data
    has_duration = "duration" in data
    has_notes = "notes" in data

    if not has_subject and not has_duration and not has_notes:
        return jsonify({"error": "Provide at least one field to update"}), 400

    for session_item in sessions:
        if session_item.get("id") == session_id and (session_item.get("username") == username or "username" not in session_item):
            if has_subject:
                subject = (data.get("subject") or "").strip()
                if not subject:
                    return jsonify({"error": "Subject cannot be empty"}), 400
                session_item["subject"] = subject

            if has_duration:
                try:
                    duration = float(data.get("duration"))
                except (TypeError, ValueError):
                    return jsonify({"error": "Duration must be a number"}), 400

                if duration <= 0:
                    return jsonify({"error": "Duration must be greater than 0"}), 400
                session_item["duration"] = duration

            if has_notes:
                session_item["notes"] = (data.get("notes") or "").strip()

            save_sessions(sessions)
            return jsonify({"message": "Session updated", "session": session_item})

    return jsonify({"error": "Session not found"}), 404


@app.route("/delete_session/<session_id>", methods=["POST", "DELETE"])
def delete_session(session_id):
    username = get_current_username()
    if not username:
        return jsonify({"error": "Unauthorized"}), 401

    for index, session_item in enumerate(sessions):
        if session_item.get("id") == session_id and (session_item.get("username") == username or "username" not in session_item):
            sessions.pop(index)
            save_sessions(sessions)
            return jsonify({"message": "Session deleted"})

    return jsonify({"error": "Session not found"}), 404

if __name__ == "__main__":
    app.run(debug=True)