# Database

MariaDB schema and helper scripts for the Trip-centered backend design.

## Files

- `database/schema.sql`: idempotent MariaDB schema for users, trips, places, meals, shopping lists, photos, movement logs, map cache, and schema migrations.
- `scripts/apply_db_schema.mjs`: applies `database/schema.sql` using `DB_*` environment variables or `.env.local`.
- `scripts/apply_db_schema.py`: Python fallback for environments where `mysql2` is unavailable.

## Local config

Actual credentials belong in `.env.local`, which is ignored by git.

Required variables:

```bash
DB_HOST=<mariadb-host>
DB_PORT=3306
DB_USER=<db-user>
DB_PASSWORD=<secret>
DB_NAME=<db-name>
DB_CONNECT_TIMEOUT=10
```

## Apply schema

```bash
npm install
npm run db:apply
```

Python fallback:

```bash
python3 -m pip install PyMySQL
python3 scripts/apply_db_schema.py
```

If the host has no `pip`, prefer the Node script above.
