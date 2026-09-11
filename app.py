from flask import Flask, render_template, request, jsonify
import sqlite3
from pathlib import Path

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "routine.db"

CORE_FIELDS = [
    "wake",
    "breakfast",
    "lunch",
    "snacks",
    "exercise",
    "dinner",
    "sleep",
    "water",
    "work",
    "notes"
]

EXTRA_FIELDS = [
    "mood",
    "steps",
    "exercise_minutes",
    "reading",
    "meditation",
    "screen_time",
    "gratitude"
]

FIELDS = CORE_FIELDS + EXTRA_FIELDS


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS diaries (
            date TEXT PRIMARY KEY,

            wake TEXT DEFAULT '',
            breakfast TEXT DEFAULT '',
            lunch TEXT DEFAULT '',
            snacks TEXT DEFAULT '',
            exercise TEXT DEFAULT '',
            dinner TEXT DEFAULT '',
            sleep TEXT DEFAULT '',
            water TEXT DEFAULT '',
            work TEXT DEFAULT '',
            notes TEXT DEFAULT '',

            mood TEXT DEFAULT '',
            steps TEXT DEFAULT '',
            exercise_minutes TEXT DEFAULT '',
            reading TEXT DEFAULT '',
            meditation TEXT DEFAULT '',
            screen_time TEXT DEFAULT '',
            gratitude TEXT DEFAULT ''
        )
    """)

    existing_columns = {
        row[1]
        for row in conn.execute(
            "PRAGMA table_info(diaries)"
        ).fetchall()
    }

    for field in EXTRA_FIELDS:
        if field not in existing_columns:
            conn.execute(
                f"ALTER TABLE diaries ADD COLUMN {field} TEXT DEFAULT ''"
            )

    conn.commit()
    conn.close()


@app.route("/")
def index():
    init_db()
    return render_template("index.html")


@app.get("/api/diaries")
def get_diaries():
    init_db()

    conn = get_db()

    rows = conn.execute(
        "SELECT * FROM diaries ORDER BY date DESC"
    ).fetchall()

    conn.close()

    return jsonify([dict(row) for row in rows])


@app.get("/api/diaries/<date>")
def get_diary(date):
    init_db()

    conn = get_db()

    row = conn.execute(
        "SELECT * FROM diaries WHERE date = ?",
        (date,)
    ).fetchone()

    conn.close()

    if row:
        return jsonify(dict(row))

    return jsonify({
        "date": date
    })


@app.post("/api/diaries")
def save_diary():
    init_db()

    data = request.get_json(silent=True) or {}

    date = str(
        data.get("date", "")
    ).strip()

    if not date:
        return jsonify({
            "error": "Date is required"
        }), 400

    values = [
        str(data.get(field, "") or "")
        for field in FIELDS
    ]

    columns = ", ".join(
        ["date"] + FIELDS
    )

    placeholders = ", ".join(
        ["?"] * (len(FIELDS) + 1)
    )

    updates = ", ".join(
        [
            f"{field}=excluded.{field}"
            for field in FIELDS
        ]
    )

    conn = get_db()

    conn.execute(
        f"""
        INSERT INTO diaries (
            {columns}
        )
        VALUES (
            {placeholders}
        )
        ON CONFLICT(date)
        DO UPDATE SET
            {updates}
        """,
        (date, *values)
    )

    conn.commit()

    row = conn.execute(
        "SELECT * FROM diaries WHERE date = ?",
        (date,)
    ).fetchone()

    conn.close()

    return jsonify(dict(row))


@app.delete("/api/diaries/<date>")
def delete_diary(date):
    init_db()

    conn = get_db()

    cursor = conn.execute(
        "DELETE FROM diaries WHERE date = ?",
        (date,)
    )

    conn.commit()
    conn.close()

    if cursor.rowcount == 0:
        return jsonify({
            "error": "Diary not found"
        }), 404

    return jsonify({
        "message": "Diary deleted",
        "date": date
    })


@app.delete("/api/diaries")
def clear_all():
    init_db()

    conn = get_db()

    conn.execute(
        "DELETE FROM diaries"
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "All diaries deleted"
    })


@app.get("/health")
def health():
    return jsonify({
        "status": "ok"
    })


init_db()


if __name__ == "__main__":
    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )