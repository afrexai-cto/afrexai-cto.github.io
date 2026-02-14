"""Shared database connection helper for AfrexAI CRM scripts."""
import os, psycopg2, psycopg2.extras

os.environ["PATH"] = "/usr/local/opt/postgresql@17/bin:" + os.environ.get("PATH", "")

DB_PARAMS = dict(dbname="afrexai_crm", user="openclaw", host="localhost")

def get_conn():
    return psycopg2.connect(**DB_PARAMS)

def get_cursor(conn, dict_cursor=True):
    if dict_cursor:
        return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    return conn.cursor()
