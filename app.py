import json
import os
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash

app = Flask(__name__)
app.secret_key = "super_secret_key"  # Needed for Flask sessions

sessions = []
USERS_FILE = "users.json"

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=4)

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
    data = request.json
    duration = data.get("duration")
    subject = data.get("subject")

    sessions.append({
        "subject": subject,
        "duration": duration
    })

    return jsonify({"message": "Session added!"})

@app.route("/get_sessions")
def get_sessions():
    return jsonify(sessions)

@app.route("/total_time")
def total_time():
    total = sum(s["duration"] for s in sessions)
    return jsonify({"total": total})

if __name__ == "__main__":
    app.run(debug=True)