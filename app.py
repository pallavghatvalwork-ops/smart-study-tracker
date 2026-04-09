from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

sessions = []

@app.route("/")
def home():
    return render_template("index.html")

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