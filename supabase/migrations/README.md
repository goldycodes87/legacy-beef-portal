# Migrations

Every schema change lands here as a dated file, applied to production and then
committed. `../schema.sql` is a generated snapshot of the result — regenerate it
from the live database after a change rather than editing it by hand.

## History

| File | What it did |
|---|---|
| `20260823_atomic_inventory_and_payment_guards.sql` | `adjust_animal_units` for atomic capacity; partial unique indexes allowing one real paid deposit and one real paid balance per reservation |
| `20260824_allow_archived_animal_status.sql` | Added `archived` to the `animals.status` check. Archiving had never worked — the app wrote a value the constraint refused |
| `20260824b_schema_cleanup.sql` | Cut-sheet unique constraint, missing indexes, RLS policies, `deposit_amount` widened to numeric, dead Chet-VPS tables moved to `graveyard` |

## Schemas other than `public`

- **`graveyard`** — retired tables from the dead Chet-VPS project, plus the
  superseded `invites` table. Moved, not dropped. Restore with
  `alter table graveyard.<name> set schema public;`, or drop the lot with
  `drop schema graveyard cascade;` once you are certain.
- **`snapshot_20260824`** — a copy of every business table taken immediately
  before the cleanup above. Restore one table with
  `truncate public.<t>; insert into public.<t> select * from snapshot_20260824.<t>;`
  Drop with `drop schema snapshot_20260824 cascade;` once the cleanup has
  proven itself.

Supabase exposes only the `public` schema through its API, so neither of these
is reachable from the applications.

## Retired files

`block6-inventory.sql`, `block7-book-page.sql` and `block8-contract-esign.sql`
were early hand-run scripts. `block7` and `block8` have been applied; `block6`
describes a `slot_inventory` table that was never created and never used —
capacity lives in `animals.total_animals` and `animals.units_used`. They are
kept here as history and should not be run.
