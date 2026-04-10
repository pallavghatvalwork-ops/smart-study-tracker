# Smart Study Tracker

<p align="center">
  A premium, intelligent study companion to help you build consistency, measure focus, and improve productivity.
</p>

<p align="center">
  <img alt="Flask" src="https://img.shields.io/badge/Backend-Flask-1f425f?style=for-the-badge&logo=flask">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white">
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-0b7285?style=for-the-badge">
  <img alt="Status" src="https://img.shields.io/badge/Status-Actively%20Improving-16a34a?style=for-the-badge">
</p>

## Table of Contents

- [Why This Project](#why-this-project)
- [Key Features](#key-features)
- [UI Experience](#ui-experience)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
- [Production Roadmap](#production-roadmap)
- [Contributing](#contributing)
- [License](#license)

## Why This Project

Most students track study time in fragmented ways. Smart Study Tracker combines timer, analytics, and actionable insights in one place.

It is designed to answer three core questions:

1. How much am I actually studying?
2. Which subjects are getting most of my time?
3. Am I improving focus consistency over time?

## Key Features

### Real-Time Smart Timer

- Live timer that updates in real time
- Start, Pause, Resume, Stop, and Reset controls
- Session state indicators (Idle, Running, Paused)

### Intelligent Analytics

- Total study time
- Number of sessions
- Average session duration
- Longest session duration
- Subject-wise distribution
- Today total study time
- Focus score
- Dynamic smart insight tip

### Session Management

- Save sessions with subject and notes
- Edit session details (subject, duration, notes)
- Delete individual sessions
- Delete all sessions from dashboard

### Experience and Design

- Modern premium dashboard UI
- Responsive auth pages (Login/Register)
- Mobile-first improvements for timer, cards, and session controls

## UI Experience

The app includes:

- Modern glass-style dashboard panels
- Gradient atmosphere with polished typography
- Visual progress bars for goals and subject distribution
- Clean and focused auth experience

Tip: add screenshots in this section for even better presentation.

## Tech Stack

- Backend: Flask (Python)
- Frontend: HTML, CSS, JavaScript
- Data Storage (current): local JSON files
  - users.json
  - sessions.json

## Project Structure

```text
smart-study-tracker/
  app.py
  users.json
  sessions.json
  static/
    style.css
    script.js
  templates/
    login.html
    register.html
    index.html
  frontend/
    ...
```

## Quick Start

### 1) Clone the repository

```bash
git clone https://github.com/pallavghatvalwork-ops/smart-study-tracker.git
cd smart-study-tracker
```

### 2) Create and activate virtual environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3) Install dependencies

```bash
pip install flask
```

### 4) Run the application

```bash
python app.py
```

Open in browser:

```text
http://127.0.0.1:5000
```

## How It Works

1. Register and login
2. Enter subject and optional notes
3. Start timer and study
4. Pause/resume when needed
5. Stop and save session
6. Analyze your data in the dashboard
7. Edit or clean up session history

## API Reference

### Session APIs

- POST /add_session
- GET /get_sessions
- POST /edit_session/<session_id>
- POST or DELETE /delete_session/<session_id>

### Analytics APIs

- GET /analytics
- GET /total_time (legacy)

### Auth Routes

- GET or POST /login
- GET or POST /register
- GET /logout

## Production Roadmap

To become fully production-ready, the next major upgrades are:

1. Database migration to PostgreSQL with ORM and migrations
2. Secure password hashing (bcrypt/argon2) and auth hardening
3. CSRF protection, rate limiting, and secure cookie settings
4. Automated test suite (unit, integration, e2e)
5. CI/CD pipeline with linting, testing, and deployment workflows
6. Structured logging and error monitoring

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit with clear messages
4. Push branch and open a Pull Request

## License

Choose a license for this project (MIT is a common choice for student and open-source projects).
