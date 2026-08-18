# Database Migrations

Schema changes **must** go through TypeORM migrations in shared and production environments.

## Commands (run from `backend/`)

```bash
# Generate a new migration from entity diffs
npm run migration:generate -- src/migrations/DescriptiveName

# Apply pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

The CLI DataSource lives at `src/core/config/data-source.ts` (`synchronize: false`).
