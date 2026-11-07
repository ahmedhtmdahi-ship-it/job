# Public source and original distribution

The owner explicitly requested publishing the complete original project to this public repository, including its applicant data and original handoff archive.

- Application source is at the repository root.
- The exact original handoff is `inputs/Ahmed_Hatem_Codex_Handoff.zip`.
- The original source-delivery archive is in `distribution/`.
- The original Windows distribution exceeds GitHub's 100 MiB per-file limit. Its bytes are preserved in numbered parts under `distribution/windows/parts/`, with per-part and full-archive SHA256 in `manifest.json`.
- On Windows, run `distribution/windows/INSTALL_WINDOWS.cmd` to assemble, verify and extract the original ZIP. It requires built-in Windows PowerShell, not a Python installation. It does not change execution policy or overwrite existing output.
- Alternatively, run `python distribution/windows/assemble.py`, then extract the resulting ZIP.

This is a development branch, not a completed code audit or a claim of verified live integrations. The last complete application run passed 105 local tests. Windows binaries were exercised under Wine, not a native Windows kernel. Live submit/publish adapters remain unverified and the production path remains manual reviewed handoff. The requested further code audit is still open.

Browser sessions, cookies, credential stores, local databases, virtual environments and build caches are not included.
