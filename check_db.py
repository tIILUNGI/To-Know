import sqlite3
import os

db_path = r'C:\Users\us\Downloads\Trabalhos e Projectos ILUNGI\TOKNOW\To Know\toknow.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("Tables in database:")
    for t in tables:
        print(f"  {t[0]}")

    # Check employees table
    print("\nEmployees columns:")
    cursor.execute("PRAGMA table_info(employees)")
    for col in cursor.fetchall():
        print(f"  {col}")

    # Check users table
    print("\nUsers columns:")
    cursor.execute("PRAGMA table_info(users)")
    for col in cursor.fetchall():
        print(f"  {col}")

    # Check collaboration tables
    print("\nCollaboration forms:")
    cursor.execute("SELECT COUNT(*) FROM collaboration_forms")
    print(f"  Rows: {cursor.fetchone()[0]}")

    print("\nCollaboration questions:")
    cursor.execute("SELECT COUNT(*) FROM collaboration_questions")
    print(f"  Rows: {cursor.fetchone()[0]}")

    # Check if collaboration_questions has section_key and max_score
    print("\nCollaboration_questions columns:")
    cursor.execute("PRAGMA table_info(collaboration_questions)")
    for col in cursor.fetchall():
        print(f"  {col}")

    # Check collaboration_forms has is_active
    print("\nCollaboration_forms columns:")
    cursor.execute("PRAGMA table_info(collaboration_forms)")
    for col in cursor.fetchall():
        print(f"  {col}")

    conn.close()
else:
    print(f"Database not found at {db_path}")