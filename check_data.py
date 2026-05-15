import sqlite3
import os

db_path = r'C:\Users\us\Downloads\Trabalhos e Projectos ILUNGI\TOKNOW\To Know\toknow.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check 360 form
print("Forms with type '360':")
cursor.execute("SELECT id, title, form_type, entity_type, is_active FROM collaboration_forms WHERE LOWER(form_type) = '360'")
for row in cursor.fetchall():
    print(f"  {row}")

# Check 360 questions with section_key
print("\nQuestions with section_key for 360 form:")
cursor.execute("""
    SELECT cq.id, cq.question_text, cq.section_key, cq.display_order, cq.max_score
    FROM collaboration_questions cq
    JOIN collaboration_forms cf ON cq.form_id = cf.id
    WHERE LOWER(cf.form_type) = '360'
    ORDER BY cq.display_order
""")
for row in cursor.fetchall():
    print(f"  {row}")

# Check if users have proper roles
print("\nUsers:")
cursor.execute("SELECT id, username, name, role FROM users")
for row in cursor.fetchall():
    print(f"  {row}")

# Check evaluations table for duplicate column
print("\nEvaluations columns:")
cursor.execute("PRAGMA table_info(evaluations)")
for col in cursor.fetchall():
    print(f"  {col}")

conn.close()