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

The tracked `docs/` tree was last changed by `25bdac5` (`release: consolidate markdown renderer 2.0.1`), which the `v2.0.1` tag merge commit `e07e866` carries. Record the implementation commit (`25bdac5`) when citing the web build baseline, and the merge commit (`e07e866`) when citing the tag point. Do not claim that the public Pages site contains later source changes until a fresh build, deployed revision, and browser check are recorded.

Verified 2026-09-07: the live site serves `assets/index-DK6Y9cKj.js` and `assets/index-BZHcZM-0.css`, byte-identical to the references in the committed `docs/index.html`.

Re-verified 2026-09-15 (monthly maintenance round): the live site returns HTTP 200 and still references `./assets/index-DK6Y9cKj.js` and `./assets/index-BZHcZM-0.css`, character-for-character identical to the committed `docs/index.html`. The local Products snapshot `10_Products\markdown-to-wechat\web\` is byte-identical to `docs/` across all 8 compared files (SHA-256, 0 mismatches), so no refresh was needed. `docs/` was last changed by `25bdac5`; the web baseline is unchanged from 2.0.1.

## Promotion Rules

1. Development work only starts from a clean `main` synchronized with `origin/main`.
2. A desktop build is stored once under `candidates/<version>` until it passes the release gate.
3. Promotion to `release/` requires explicit approval, a recorded source commit, verification, desktop smoke testing, and an updated Products release record. The current `2.0.1` package is promoted from the verified candidate because a repeat build was blocked by the network.
4. A web release requires a fresh committed `docs/` build and a recorded deployed revision. A source commit alone is not a web-release claim.
5. Historical branches and unreachable Git objects are recovery evidence, never active release lines. Do not delete them without an explicit retention decision.
