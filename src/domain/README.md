# `src/domain`

Pure logic. No Payload import, no React, no I/O — nothing but relative imports of other
domain modules.

The Estimate calculation, the Lead time cutoff arithmetic, Enquiry validation, slug and
locale resolution all live here. If a behaviour is worth testing, it moves here first.

`boundary.test.ts` enforces the rule mechanically, so the boundary is a failing test
rather than a convention someone has to remember. See `docs/agents/build-conventions.md`.
