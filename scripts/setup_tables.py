import os
import psycopg2

# Reads database connection string from environment
conn_str = os.environ.get('SUPABASE_DB_URL')

if not conn_str:
    print('[INFO] Set SUPABASE_DB_URL environment variable to execute migrations directly.')
    exit(0)

try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    print('[DB] Connected successfully to Supabase PostgreSQL!')

    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    tables = [row[0] for row in cur.fetchall()]
    print(f'[DB] Active tables in public schema: {tables}')

except Exception as e:
    print(f'[DB ERROR] {e}')
