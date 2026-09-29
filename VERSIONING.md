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
| Source release line | 2.1.1 | merged to `main` on 2026-09-29 | Source-only minor version; no Release/Pages/desktop artifacts |
| Desktop release line | 2.1.0 | GitHub Release and Products `RELEASES.md` | Installer, portable and SHA-256 manifest |
| Historical desktop releases | 2.0.1 / 2.0.0 | Products `archive/<version>` and GitHub Releases | Retained for recovery |

### 2.1.1 source-only minor version (2026-09-29)

Authorized by the user as a small-version commit/push. Scope: project-wide walkthrough (four user paths with screenshots, connectivity checks, system decomposition), UI polish (theme-card active state, typography reset command, copy toast guidance, header stats contrast, mobile nav labels), a stale skill-path fix in `CLAUDE.md`, and the WeChat regression long-form fixture imported from the open `maintenance-202609` branch (PR #7 itself remains open and conflicting; its doc changes are superseded by `main`). `verify` passed before and after (0 lint warnings, 256 tests, secret scan clean). No GitHub Release, Pages rebuild, desktop packaging, PR closure, 2FA or scheduling change: those remain user-gated. Project-archive record: Poiesis `版本状态.md` and qc report `04-全局核验与小版本迭代-20260929`.

The 2.1.0 release rebuilds tracked `docs/` from the release source. GitHub Pages serves `main:/docs`; a release claim requires the deployed commit and online asset hashes, recorded in the Release manifest and Products release record. Source merge and deployment completion are separate states. The former 2.0.1 web build (`25bdac5`, included by tag commit `e07e866`) remains recoverable in Git and the historical Products snapshot.

## 2.1.0 release

Authorized by the user on 2026-09-27. Player Todo `TASK-44` tracks verification, the protected release PR, Windows artifacts, Pages deployment and Products promotion. [Release notes](release-notes/2.1.0.md) describe the shipped behavior. The sections below retain the pre-release audit/candidate snapshots; their unreleased status describes those earlier checkpoints, not the current release line.

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

### 2026-09-27 studio feature candidate

`codex/studio-agent-20260927` continues the verified local audit commit `d0b1b42`, under the user's request to extend that work. It contains the voice-project-inspired neumorphic workbench, nine rebuilt article presets, a shared Agent JSON/CLI contract, and imagegen preparation/attachment workflow. The package version remains `2.0.1` until an approved release is prepared. This branch is a local source candidate; it is not merged, pushed, packaged, deployed or promoted to Products.

Implementation, screenshots, shared-skill installation and verification evidence: [studio delivery](design/2026-09-27/README.md). The installed skill lives in the user's shared skill root outside this repository; its local SHA-256 is recorded with the delivery evidence. The existing `docs/` Pages build remains untouched. Follow-on work can continue this candidate branch without pretending it is the synchronized main line.

### General rules

1. Development work only starts from a clean `main` synchronized with `origin/main`.
2. A desktop build is stored once under `candidates/<version>` until it passes the release gate.
3. Promotion to `release/` requires explicit approval, a recorded source commit, verification, desktop smoke testing, and an updated Products release record. Archive the previous version before promoting the verified candidate; do not rebuild or replace released assets silently.
4. A web release requires a fresh committed `docs/` build and a recorded deployed revision. A source commit alone is not a web-release claim.
5. Historical branches and unreachable Git objects are recovery evidence, never active release lines. Do not delete them without an explicit retention decision.
