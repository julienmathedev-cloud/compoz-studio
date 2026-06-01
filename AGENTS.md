General rules

- Respect the existing architecture and patterns.
- Prefer minimal patches.
- Do not refactor unrelated code.
- Do not create new files unless explicitly requested.
- Do not rename files or move folders unless explicitly requested.
- Preserve existing behavior.

Workflow

Before editing code:

1. Analyze the existing implementation.
2. List the files that will be modified.
3. Explain the planned changes briefly.
4. Wait for approval before applying modifications.

Code style

- Follow the existing project conventions.
- Keep code readable and explicit.
- Avoid unnecessary abstractions.
- Avoid over-engineering.

Forms architecture

- Respect the RHF-first architecture.
- Keep forms as the source of truth.
- Respect the existing Section / Form / Hook pattern.

Safety

- Never modify more files than necessary.
- Prefer additive and backward-compatible changes.
- Do not introduce breaking schema changes.
