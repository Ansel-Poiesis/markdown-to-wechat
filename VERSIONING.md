# Versioning

This file is the version-management entry for `markdown-to-wechat`.

## Canonical Sources

- Source: this repository, `main`, with `origin` at `https://github.com/Ansel-Poiesis/markdown-to-wechat.git`.
- Project record: `C:\Ansel_Work\10_Projects\00_Core\Poiesis\50-阿莱是台珍妮机\10-Project\02-markdown渲染器`.
- Formal desktop releases: `C:\Ansel_Work\10_Projects\10_Products\markdown-to-wechat\release`.
- Release candidates: `C:\Ansel_Work\10_Projects\10_Products\markdown-to-wechat\candidates`.

No other local directory is a development or release source.

## Current State

| Line | Version | Evidence | Status |
| --- | --- | --- | --- |
| Source baseline | 2.0.1 | `v2.0.1` tag on `main` | Canonical development line |
| Formal desktop release | 2.0.1 | `10_Products\\markdown-to-wechat\\release` | Current official local delivery |
| Historical desktop release | 2.0.0 | `10_Products\\markdown-to-wechat\\archive\\2.0.0` | Retained for recovery |

The tracked `docs/` tree was last changed by `25bdac5`; the annotated `v2.0.1` tag resolves to merge commit `e07e866`, which includes that build. Do not claim that the public Pages site contains later source changes until a fresh build, deployed revision, and browser check are recorded.

## 2026-09-27 audit snapshot

- Remote and local `main`: `11825751a63fecc4eadd3c1ebdce83acf4124eba`; `git fsck --full` passed.
- PR #7 (`maintenance-202609@0e1ee42`) remains OPEN, CLEAN, with `verify` SUCCESS. It has not been merged into this patch branch.
- New local patch branch: `codex/audit-20260927`, based on synchronized main. Package version remains the released baseline `2.0.1`; unmerged patch source is not a new release or verified desktop candidate.
- GitHub Pages reports `built` at `1182575`; HTTP 200 and asset names `index-DK6Y9cKj.js` / `index-BZHcZM-0.css` still match committed `docs/index.html`.
- Products `web/` matches all eight committed web files by SHA-256. Both local desktop executable hashes match the GitHub Release asset digests.
- Local installer SHA-256: `0E6692BD45B4F6779D1EB63AB6960DAF05ECDF37E011C3DFCEEA73B67195FEF2`.
- Local portable SHA-256: `9924B009B07E86E817B12275231C591710EBB20612A8205AA6A806D709F7EB3D`.
- `main` protection requires a PR and strict `verify`, enforces administrators, and disallows force pushes/deletions. Required approving review count is zero: this protects checks, but does not guarantee independent human review.
- No Release, Pages deployment, Products promotion, account change, or automation change occurred. Real WeChat paste verification and actual Electron candidate smoke remain separate release gates.

Audit evidence and the proposed improvement sequence: [audit/2026-09-27/README.md](audit/2026-09-27/README.md). Task state lives in Player Todo `TASK-14.1`; unresolved release gates remain under `TASK-14`.

## Promotion Rules

1. Development work only starts from a clean `main` synchronized with `origin/main`.
2. A desktop build is stored once under `candidates/<version>` until it passes the release gate.
3. Promotion to `release/` requires explicit approval, a recorded source commit, verification, desktop smoke testing, and an updated Products release record. The current `2.0.1` package is promoted from the verified candidate because a repeat build was blocked by the network.
4. A web release requires a fresh committed `docs/` build and a recorded deployed revision. A source commit alone is not a web-release claim.
5. Historical branches and unreachable Git objects are recovery evidence, never active release lines. Do not delete them without an explicit retention decision.
