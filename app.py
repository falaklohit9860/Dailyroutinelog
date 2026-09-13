from flask import Flask, render_template, request, jsonify
import os
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


# ==================================================
# DATABASE
# ==================================================

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()


def using_postgres():
    return bool(DATABASE_URL)


def get_db():
    if using_postgres():
        import psycopg2
        return psycopg2.connect(DATABASE_URL)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ==================================================
# INITIALIZE DATABASE
# ==================================================

def init_db():

    conn = get_db()

    if using_postgres():

        cursor = conn.cursor()

        cursor.execute("""
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

        conn.commit()
        cursor.close()
        conn.close()

    else:

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


# ==================================================
# HOME
# ==================================================

@app.route("/")
def index():
    init_db()
    return render_template("index.html")


# ==================================================
# GET ALL DIARIES
# ==================================================

@app.get("/api/diaries")
def get_diaries():

    init_db()

    conn = get_db()

    if using_postgres():

        from psycopg2.extras import RealDictCursor

        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT *
            FROM diaries
            ORDER BY date DESC
        """)

        rows = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify([dict(row) for row in rows])

    else:

        rows = conn.execute("""
            SELECT *
            FROM diaries
            ORDER BY date DESC
        """).fetchall()

        conn.close()

        return jsonify([dict(row) for row in rows])


# ==================================================
# GET ONE DIARY
# ==================================================

@app.get("/api/diaries/<date>")
def get_diary(date):

    init_db()

    conn = get_db()

    if using_postgres():

        from psycopg2.extras import RealDictCursor

        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            """
            SELECT *
            FROM diaries
            WHERE date = %s
            """,
            (date,)
        )

        row = cursor.fetchone()

        cursor.close()
        conn.close()

        if row:
            return jsonify(dict(row))

    else:

        row = conn.execute(
            """
            SELECT *
            FROM diaries
            WHERE date = ?
            """,
            (date,)
        ).fetchone()

        conn.close()

        if row:
            return jsonify(dict(row))

    return jsonify({"date": date})


# ==================================================
# SAVE DIARY
# ==================================================

@app.post("/api/diaries")
def save_diary():

    init_db()

    data = request.get_json(silent=True) or {}

    date = str(data.get("date", "")).strip()

    if not date:
        return jsonify({
            "error": "Date is required"
        }), 400

    values = [
        str(data.get(field, "") or "")
        for field in FIELDS
    ]

    # ------------------------------
    # PostgreSQL / Neon
    # ------------------------------

    if using_postgres():

        from psycopg2.extras import RealDictCursor

        conn = get_db()

        cursor = conn.cursor(
            cursor_factory=RealDictCursor
        )

        columns = ", ".join(
            ["date"] + FIELDS
        )

        placeholders = ", ".join(
            ["%s"] * (len(FIELDS) + 1)
        )

        updates = ", ".join(
            [
                f"{field}=EXCLUDED.{field}"
                for field in FIELDS
            ]
        )

        sql = f"""
            INSERT INTO diaries ({columns})
            VALUES ({placeholders})
            ON CONFLICT (date)
            DO UPDATE SET {updates}
            RETURNING *
        """

        cursor.execute(
            sql,
            (date, *values)
        )

        row = cursor.fetchone()

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify(dict(row))

    # ------------------------------
    # SQLite / Local PC
    # ------------------------------

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
        INSERT INTO diaries ({columns})
        VALUES ({placeholders})
        ON CONFLICT(date)
        DO UPDATE SET {updates}
        """,
        (date, *values)
    )

    conn.commit()

    row = conn.execute(
        """
        SELECT *
        FROM diaries
        WHERE date = ?
        """,
        (date,)
    ).fetchone()

    conn.close()

    return jsonify(dict(row))


# ==================================================
# DELETE ONE DIARY
# ==================================================

@app.delete("/api/diaries/<date>")
def delete_diary(date):

    init_db()

    conn = get_db()

    if using_postgres():

        cursor = conn.cursor()

        cursor.execute(
            """
            DELETE FROM diaries
            WHERE date = %s
            """,
            (date,)
        )

        deleted = cursor.rowcount

        conn.commit()

        cursor.close()
        conn.close()

    else:

        cursor = conn.execute(
            """
            DELETE FROM diaries
            WHERE date = ?
            """,
            (date,)
        )

        deleted = cursor.rowcount

        conn.commit()
        conn.close()

    if deleted == 0:
        return jsonify({
            "error": "Diary not found"
        }), 404

    return jsonify({
        "message": "Diary deleted",
        "date": date
    })


# ==================================================
# DELETE ALL
# ==================================================

@app.delete("/api/diaries")
def clear_all():

    init_db()

    conn = get_db()

    if using_postgres():

        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM diaries"
        )

        conn.commit()

        cursor.close()
        conn.close()

    else:

        conn.execute(
            "DELETE FROM diaries"
        )

        conn.commit()
        conn.close()

    return jsonify({
        "message": "All diaries deleted"
    })


# ==================================================
# HEALTH CHECK
# ==================================================

@app.get("/health")
def health():

    try:

        init_db()

        conn = get_db()

        if using_postgres():

            cursor = conn.cursor()

            cursor.execute("SELECT 1")

            cursor.fetchone()

            cursor.close()

        else:

            conn.execute(
                "SELECT 1"
            ).fetchone()

        conn.close()

        return jsonify({
            "status": "ok",
            "database": (
                "postgresql"
                if using_postgres()
                else "sqlite"
            )
        })

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# ==================================================
# START
# ==================================================

try:
    init_db()
except Exception as error:
    print(
        "Database initialization warning:",
        error
    )


if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )