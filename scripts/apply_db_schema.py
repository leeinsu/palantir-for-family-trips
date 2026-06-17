#!/usr/bin/env python3
"""Apply database/schema.sql to the configured MariaDB database.

Configuration is loaded from environment variables first, then .env.local.
Required variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.
Optional: DB_PORT, DB_CONNECT_TIMEOUT.
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def split_sql(sql: str) -> list[str]:
    # This schema does not define routines/triggers, so semicolon splitting is enough.
    cleaned = re.sub(r'^\s*--.*$', '', sql, flags=re.MULTILINE)
    return [stmt.strip() for stmt in cleaned.split(';') if stmt.strip()]


def main() -> int:
    project_root = Path(__file__).resolve().parents[1]
    load_dotenv(project_root / '.env.local')

    missing = [name for name in ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] if not os.environ.get(name)]
    if missing:
        print(f"Missing required DB env vars: {', '.join(missing)}", file=sys.stderr)
        return 2

    try:
        import pymysql
    except ImportError:
        print('PyMySQL is required. Install with: python3 -m pip install PyMySQL', file=sys.stderr)
        return 3

    schema_path = project_root / 'database' / 'schema.sql'
    statements = split_sql(schema_path.read_text())

    conn = pymysql.connect(
        host=os.environ['DB_HOST'],
        port=int(os.environ.get('DB_PORT', '3306')),
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
        database=os.environ['DB_NAME'],
        charset='utf8mb4',
        autocommit=False,
        connect_timeout=int(os.environ.get('DB_CONNECT_TIMEOUT', '10')),
    )

    try:
        with conn.cursor() as cur:
            for statement in statements:
                cur.execute(statement)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    print(f"Applied {len(statements)} SQL statements to {os.environ['DB_HOST']}:{os.environ.get('DB_PORT', '3306')}/{os.environ['DB_NAME']} as {os.environ['DB_USER']}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
