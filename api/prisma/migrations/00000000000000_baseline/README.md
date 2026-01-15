Baseline migration
==================

This is a no-op baseline used to mark the current database schema as the starting
point for Prisma Migrate in environments where the database is already provisioned
and contains tables. It prevents error P3005 during `prisma migrate deploy` when
no versioned migrations exist yet.

It intentionally applies no changes.

