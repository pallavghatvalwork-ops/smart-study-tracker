import json
import os
import uuid
from datetime import datetime, timedelta, timezone

from flask import Flask, flash, jsonify, redirect, render_template, request, session, url_for
from dotenv import load_dotenv
from pymongo import ASCENDING, MongoClient
from pymongo.errors import PyMongoError
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "change_me_in_production")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = os.getenv("FLASK_SECURE_COOKIE", "false").lower() == "true"
app.permanent_session_lifetime = timedelta(hours=8)

USERS_FILE = "users.json"
SESSIONS_FILE = "sessions.json"

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "smart_study_tracker")

mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
mongo_db = mongo_client[MONGODB_DB_NAME]
users_collection = mongo_db["users"]
sessions_collection = mongo_db["sessions"]
db_boot_error = None


def now_iso_utc():
    return datetime.now(timezone.utc).isoformat()


def parse_iso_datetime(value):
    if not value:
        return None
    normalized = str(value).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def ensure_indexes():
    users_collection.create_index([("username", ASCENDING)], unique=True)
    sessions_collection.create_index([("id", ASCENDING)], unique=True)
    sessions_collection.create_index([("username", ASCENDING)])


def load_legacy_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, dict) else {}


def load_legacy_sessions():
    if not os.path.exists(SESSIONS_FILE):
        return []
    with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def migrate_legacy_data():
    legacy_users = load_legacy_users()
    for username, raw_password in legacy_users.items():
        existing = users_collection.find_one({"username": username})
        if existing:
            continue
        users_collection.insert_one({
            "username": username,
            "password_hash": generate_password_hash(str(raw_password)),
            "role": "student",
            "createdAt": now_iso_utc(),
            "emailVerified": False,
        })

    legacy_sessions = load_legacy_sessions()
    for item in legacy_sessions:
        if not isinstance(item, dict):
            continue
        session_id = item.get("id") or uuid.uuid4().hex
        if sessions_collection.find_one({"id": session_id}):
            continue

        try:
            duration = float(item.get("duration", 0))
        except (TypeError, ValueError):
            continue
        if duration <= 0:
            continue

        session_doc = {
            "id": session_id,
            "subject": (item.get("subject") or "General").strip(),
            "duration": duration,
            "notes": (item.get("notes") or "").strip(),
            "startedAt": item.get("startedAt") or now_iso_utc(),
            "endedAt": item.get("endedAt") or now_iso_utc(),
            "createdAt": item.get("createdAt") or now_iso_utc(),
        }
        # Preserve legacy compatibility: old records may not have owner.
        if "username" in item and item.get("username"):
            session_doc["username"] = item.get("username")

        sessions_collection.insert_one(session_doc)


def get_current_username():
    return session.get("username")


def sanitize_session(doc):
    if not doc:
        return doc
    if "_id" in doc:
        doc.pop("_id")
    return doc


def get_user_sessions(username):
    # Include legacy sessions without username for backward compatibility.
    query = {
        "$or": [
            {"username": username},
            {"username": {"$exists": False}},
        ]
    }
    docs = list(sessions_collection.find(query))
    return [sanitize_session(doc) for doc in docs]


try:
    ensure_indexes()
    migrate_legacy_data()
except PyMongoError as exc:
    db_boot_error = str(exc)


def is_db_ready():
    return db_boot_error is None

@app.route("/")
def home():
    if "username" not in session:
        return redirect(url_for("login"))
    return render_template("index.html", username=session["username"])

@app.route("/login", methods=["GET", "POST"])
def login():
    if not is_db_ready():
        flash("Database is unavailable. Check MongoDB configuration.")
        return render_template("login.html")

    if request.method == "POST":
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""

        user_doc = users_collection.find_one({"username": username})
        if not user_doc:
            flash("Invalid username or password")
            return redirect(url_for("login"))

        password_hash = user_doc.get("password_hash")
        if not password_hash or not check_password_hash(password_hash, password):
            flash("Invalid username or password")
            return redirect(url_for("login"))

        session.permanent = True
        session["username"] = username
        session["role"] = user_doc.get("role", "student")
        return redirect(url_for("home"))
            
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if not is_db_ready():
        flash("Database is unavailable. Check MongoDB configuration.")
        return render_template("register.html")

    if request.method == "POST":
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""

        if len(username) < 3:
            flash("Username must be at least 3 characters")
            return redirect(url_for("register"))

        if len(password) < 6:
            flash("Password must be at least 6 characters")
            return redirect(url_for("register"))

        if users_collection.find_one({"username": username}):
            flash("Username already exists")
            return redirect(url_for("register"))

        users_collection.insert_one({
            "username": username,
            "password_hash": generate_password_hash(password),
            "role": "student",
            "createdAt": now_iso_utc(),
            "emailVerified": False,
        })
        flash("Registration successful. Please login.")
        return redirect(url_for("login"))
        
    return render_template("register.html")

@app.route("/logout")
def logout():
    session.pop("username", None)
    return redirect(url_for("login"))


@app.route("/add_session", methods=["POST"])
def add_session():
    if not is_db_ready():
        return jsonify({"error": "Database unavailable"}), 503

    username = get_current_username()
    if not username:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
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

    session_doc = {
        "id": uuid.uuid4().hex,
        "username": username,
        "subject": subject,
        "duration": duration,
        "notes": notes,
        "startedAt": started_at,
        "endedAt": ended_at,
        "createdAt": now_iso_utc(),
    }
    sessions_collection.insert_one(session_doc)

    return jsonify({"message": "Session added!", "session": sanitize_session(session_doc)})

@app.route("/get_sessions")
def get_sessions():
    if not is_db_ready():
        return jsonify({"error": "Database unavailable"}), 503

    username = get_current_username()
    if not username:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify(get_user_sessions(username))

@app.route("/total_time")
def total_time():
    if not is_db_ready():
        return jsonify({"error": "Database unavailable"}), 503

    username = get_current_username()
    if not username:
        return jsonify({"error": "Unauthorized"}), 401
    total = sum(s["duration"] for s in get_user_sessions(username))
    return jsonify({"total": total})


@app.route("/analytics")
def analytics():
    if not is_db_ready():
        return jsonify({"error": "Database unavailable"}), 503

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
    if not is_db_ready():
        return jsonify({"error": "Database unavailable"}), 503

    username = get_current_username()
    if not username:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    has_subject = "subject" in data
    has_duration = "duration" in data
    has_notes = "notes" in data

    if not has_subject and not has_duration and not has_notes:
        return jsonify({"error": "Provide at least one field to update"}), 400

    query = {
        "id": session_id,
        "$or": [
            {"username": username},
            {"username": {"$exists": False}},
        ],
    }
    existing = sessions_collection.find_one(query)
    if not existing:
        return jsonify({"error": "Session not found"}), 404

    update_fields = {}
    if has_subject:
        subject = (data.get("subject") or "").strip()
        if not subject:
            return jsonify({"error": "Subject cannot be empty"}), 400
        update_fields["subject"] = subject

    if has_duration:
        try:
            duration = float(data.get("duration"))
        except (TypeError, ValueError):
            return jsonify({"error": "Duration must be a number"}), 400
        if duration <= 0:
            return jsonify({"error": "Duration must be greater than 0"}), 400
        update_fields["duration"] = duration

    if has_notes:
        update_fields["notes"] = (data.get("notes") or "").strip()

    sessions_collection.update_one({"_id": existing["_id"]}, {"$set": update_fields})
    updated = sessions_collection.find_one({"_id": existing["_id"]})
    return jsonify({"message": "Session updated", "session": sanitize_session(updated)})


@app.route("/delete_session/<session_id>", methods=["POST", "DELETE"])
def delete_session(session_id):
    if not is_db_ready():
        return jsonify({"error": "Database unavailable"}), 503

    username = get_current_username()
    if not username:
        return jsonify({"error": "Unauthorized"}), 401

    query = {
        "id": session_id,
        "$or": [
            {"username": username},
            {"username": {"$exists": False}},
        ],
    }
    result = sessions_collection.delete_one(query)
    if result.deleted_count:
        return jsonify({"message": "Session deleted"})

    return jsonify({"error": "Session not found"}), 404


@app.route("/health")
def health():
    try:
        mongo_client.admin.command("ping")
        return jsonify({"status": "ok", "database": "connected"})
    except PyMongoError:
        return jsonify({"status": "degraded", "database": "unavailable", "detail": db_boot_error}), 503

if __name__ == "__main__":
    app.run(debug=True)