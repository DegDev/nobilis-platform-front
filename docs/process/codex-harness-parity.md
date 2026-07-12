# Claude Code ↔ Codex CLI Harness Parity — nobilis-platform-front

_Type: process doc (pointer) · Updated: 2026-07-12_

The Codex CLI harness-parity map is process canon and lives in the **back** repo — it is not
frontend-specific (it covers the shared harness: CLAUDE.md, skills, hooks, subagents, MCP, git
hooks). This page is a thin pointer to avoid divergence; do not duplicate the content here.

**Canon:** `nobilis-platform-back/docs/process/codex-harness-parity.md`

The same mechanism applies to this repo: Codex reads this repo's `CLAUDE.md` via
`project_doc_fallback_filenames = ["CLAUDE.md"]` in `~/.codex/config.toml` (no `AGENTS.md` needed),
and the shared MCP servers (context7, jetbrains, playwright) work for both agents. See the back
canon for the full transfer-category breakdown, mapping table, and limitations.
