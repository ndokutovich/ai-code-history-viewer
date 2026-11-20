# Upstream Migration Plan v2 — tail v1.13.0 → v1.32.2

Boundary: `v1.13.0..upstream/main` = **433 commits** (2026-05-25 → 2026-10-20).
Previous tail (`7fa7e30..v1.13.0`, 271 commits) fully migrated as PR #15 (Phase 1) + PR #17 (Phases 2-5).
Raw list: `docs/plans/upstream-tail-v13-v32.txt`.

Method legend (unchanged from v1 plan): **PORT** re-implement final state in our architecture · **COMPARE** we have an equivalent, fold deltas only · **CONFIG** mechanical copy (i18n/CI/data) · **SKIP** not wanted.

## PROGRESS LOG (branch `fix/antigravity-stores`, started 2026-11-06)

- ✅ Antigravity P0 — `ed24f1c0`: brain transcripts + summaries.db + CLI store, workspace grouping, legacy fallback
- ✅ Windows #604/#548/#549 — `cee02502`: watcher `\\?\` strip; filesystem-verified project-folder decoder (project.rs/session.rs)
- ✅ Codex zstd (#74bdee28) — `05d89269`: .jsonl.zst discovery/parse/twin-skip (553/576 local rollouts were invisible)
- ✅ Codex identity (#7727193b+#38b9e583) — `9b0566e2`: first session_meta wins, filename-uuid fallback, cwd last-turn_context
- ✅ Codex reasoning (#610/#597) — next commit: reasoning items → Thinking content (summary → content[].reasoning_text)
- ✅ Gemini .jsonl (#393/#348) — commit: append-only jsonl sessions parse ($set/$rewindTo), .jsonl filter
- ✅ OpenCode global split (#432) — commit: global sessions split by raw directory into global-dir-<hash> virtual projects (75/124 local)
- ✅ percent_decode panic (#398) — commit: byte-wise decode in cli.rs + antigravity (both copies)
- 247→249 tests green after each batch. Frontend tsc clean, 354 vitest green.
- ✅ #eaaa8787 double-text render — commit: skipText for all roles in ClaudeContentArrayRenderer
- ✅ #623 metadata serialize — commit: write_lock across read→merge→persist (8 writers)
- ✅ #611 ai-titles — commit: aiTitle (last wins) > summary > first-user; noise exclusion was already ours
- ✅ #437+#396 in-session search — commit: tool_use.input args + array tool_result text indexed (4 new tests)
- ✅ UX batch part 1 — commits: KaTeX #499 (+shared markdownPlugins, 8 call sites), prompt jumps #629 (isTurnStart + usePromptJump, 9 tests), tool name aliases #00a9b362, repeated-header drop #051fa7a3 (continuation detection in rows memo). 367 vitest green.
- ✅ security sweep — VERIFIED CLOSED: no follow_links(true) anywhere, WalkDir defaults refuse symlink dirs, June adapter guards + antigravity port have per-entry symlink checks; no Server mode = no remote path surface. Residual (per-file symlink_metadata in local readers) accepted with rationale.
- ✅ #496 chain merge — commits: session_chain.rs (resolve + superseded, 7 tests), loader reads whole chain oldest-first, list hides covered predecessors (#572 included). 256 Rust tests green.
- ✅ #412 font scale — commits: text-pxN utilities (calc px * --font-scale), 233 hardcoded classes swept in 38 files; vite build green.
- ✅ #410 trash fallback — commit: remove_path (trash → permanent) for .jsonl + folder.
- ✅ #443/#412 both — the px sweep covers tool/thinking/markdown boxes (all 233 sites).

## FINAL DISPOSITIONS (2026-11-07, 19 commits on fix/antigravity-stores)

**Integrated (19 commits):** antigravity stores, win watcher+decode, codex zstd/identity/reasoning, gemini jsonl, opencode global split, percent_decode, double-render, metadata lock, ai-titles, search indexing, KaTeX, prompt jumps, tool aliases, header drop, chain merge (#496+#572), font scale, trash fallback. Suites: 256 Rust + 367 TS green, vite build green.

- ✅ codex cwd-projects (2026-11-07 follow-up, user-verified symptom "574 projects") — commit: projects group by cwd (upstream model), unknown bucket, len+mtime metadata cache so project opens do not re-decompress 576 zst files; 257 tests green.
- ✅ 2026-11-07 dogfood fixes (v1.10.6) — detection: per-provider validate (kills 9x9 storm), 15s timeout, idempotent registry init, single-flight initializeSources + regression test; codex project listing now cache-driven (no re-decompression of hundreds of zst per open).
- ✅ Recent Edits hardening (2026-11-07) — our fork ALREADY has the backend (`commands/edits.rs`: collect + paginate + restore, June port). Ported upstream #606 (replace_all replay, 3 tests) and the #525/#640 restore guard (refuse symlink / non-regular targets, 3 tests).
- ✅ #463 resume-in-terminal — ALREADY PRESENT: `commands/resume.rs::resume_session` spawns a terminal; wired via ExportControls.
- ⏭ Recent Edits remaining: the dock/sidebar PANEL UI + recentEditsPanelSlice + restore preview (backend list/restore already exist).
- ✅ #607 rename trailing newline (2026-11-07) — rewritten JSONL is newline-terminated so Claude Code's next append cannot glue onto our last line; helper + unit tests.
- ✅ 2026-11-07 batch 2 — #606 replace_all replay, #525/#640 restore guard, #475 reveal-in-folder, #607 rename trailing newline, #616 stats ai-title names, #602/#613 link navigation guard. 267 Rust + 378 FE tests green.
- ✅ Verified already-owned (no port needed): Recent Edits viewer + backend, resume-in-terminal (#463), agent task/progress grouping.
- ✅ #456 multi-select + mass delete (2026-11-07) — select mode in tree and flat list, two-step confirm, per-file outcome, 7 tests.
- ✅ #411 archive backup (2026-11-07) — `backup_claude_projects` zips the projects tree with strict destination guards, save dialog entry in the project-list menu, 5 backend tests.
- ✅ #634 session minimap (2026-11-07) — opt-in strip, viewport box, click/drag jump; geometry helpers with 11 tests; toggle persisted in view preferences.
- ✅ #595 resume extra CLI args (2026-11-07) — settings field, sanitising on both sides, 5 backend + 7 frontend tests.
- ✅ #473 diff view in Recent Edits (2026-11-07) — EnhancedDiffViewer against the recorded original.
- ✅ #413 headless `--export` (2026-11-07) — CLI export to JSON/Markdown with page-streamed loading; 7 tests + real-session smoke.
- ✅ #528 blocking-pool offload (2026-11-07) — scan_projects, get_recent_edits, load_session_messages_paginated run via spawn_blocking.
- ✅ subagent discovery + copy paths (2026-11-07) — `commands/subagents.rs` lists flat and workflow (`workflows/wf_*/agent-*.jsonl`) transcripts; session menu copies their paths. This is the prerequisite for #99b2ec7d.
- ✅ #99b2ec7d workflow/sub-agent rendering (2026-11-07) — discovery + guarded loader + inline reader dialog; workflow agents grouped by wf_ name.
- ✅ Pricing data (2026-11-07) — audited Claude 5.x rates (opus-5-5 $4/$20, sonnet-5-5 with the $0.10 cache read, haiku-5-5, opus-5/sonnet-5, fable/mythos) ported from upstream model-pricing.json; 5 tests. Our cost stats no longer fall back to generic rates for current models.
- ✅ #589/#582 Cline SDK-era store (2026-11-07) — `adapters/cline_sdk.rs` reads `~/.cline/data/sessions`, routed by `cline://sdk:`; detection falls back to it; 5 tests.
- ✅ #ccf7c19b temp-directory bucket (2026-11-07) — projects under OS temp/cache roots collect in a "Temporary locations" group; 5 tests.
- ✅ Pricing infrastructure (2026-11-08) — audited table moved to `src/data/model-pricing.json` (102 entries); `scripts/check-model-pricing.mjs` + weekly `pricing-watch` workflow ported and verified live (25 findings).
**QUEUED — next session, fresh context (P2 features, port-notes ready):**
- Recent Edits panel — **HAVE (own design)**: `RecentEditsViewer` + backend `commands/edits.rs` shipped June.
  Ported deltas: #606 replace_all, #525/#640 restore guard, #475 reveal-in-folder.
  Remaining deltas (optional): #473 full diff view, dock/sidebar presentation (#515), restore preview.
- workflow rendering #99b2ec7d — discovery landed (subagents.rs); what remains is rendering workflow agents inline in the viewer. parallel-tasks filter #446; explorer columns (#23ea7fbe/#ccf7c19b/#4bc63da2); headless --export #413.
- perf COMPARE (#458/#381/#591/#528/#436/#468): diff against our June cache; port deltas only.
- #568 preserve branched conversations (chain merge covered the display half; verify fork-parent visibility).

**SKIP (rationale):** 20 new providers (user uses none; each = adapter+registration+i18n×6+maintenance); Server/WebUI cluster (no server mode in fork); Cline SDK store #589/#588/#586 (no local store; 2 legacy tasks); #612/#614/#621 (architecture absent); i18n plural v4 migration (verify our i18next version first — CONFIG); Linux ibus/DMABUF, CI/Homebrew/release chores (not applicable).

- ⏭ REMAINING + DISPOSITIONS (each verified against our code, not assumed):
  - #ccf7c19b (temp-directory bucketing) / #4bc63da2 (sessions column) — **SKIP BY DESIGN**: both are
    parts of upstream's three-column explorer layout; our tree keeps the two-pane model, so they
    would be a redesign rather than a port.
  - perf wave leftovers (#591/#436/#468/#464/#466/#467) — **MEASURED, NO PORT NEEDED**: #528 offload
    landed; real data (2026-11-07): scan 173 projects / 638 ms, per-project session loads 5–201 ms
    (216 files → 201 ms), message page 15–24 ms, Codex project listing served from the len+mtime
    cache without decompression. No stall to chase; upstream's extra caches would add state for no
    measured win. Re-measure before revisiting.
  - #623/#611/#616/#437/#396/#606/#607/#602/#613/#475/#473/#411/#413/#456/#595/#634/#528 — **DONE** (see above).
  - #612/#614/#621 — dispositioned no-op (architecture absent).

- DISPOSITIONED no-op: #612/#614/#621 store reload races (their session-list pagination architecture — we have no sessionsOffset/loadMoreSessions machinery; our reload path differs, June tree-orphan fix covered the visible bug).
- DEFERRED: Cline SDK store #589/#588/#586 (no local ~/.cline store, 2 legacy tasks); OpenCode #428 cache bound + ab6bcb45 schema (our reader differs, verify later); providers wave 2 (SKIP unless user asks); Server/WebUI cluster (SKIP, no server mode); pricing lifecycle (P3).
- NOTE: Kaspersky blocks cargo build-script exes; user excluded target dirs. Build: `CARGO_TARGET_DIR=C:/Users/xxx/.cargo-target/ccv-merge cargo test --lib` from src-tauri.
- NOTE: big patches via scripts written to `.claude-scratch/` (bash heredocs choke on mixed quotes).

---

## P0 — diagnosed live bug: Antigravity shows nothing

**Root cause (confirmed on this machine 2026-11-06):**

| Store on disk | Contents | Our adapter (June port) |
|---|---|---|
| `~/.gemini/antigravity/conversations/` | 3× `.db` (SQLite), 2× `.pb` | reads only dirs + flat `.pb`; **`.db` unsupported**; `.pb` scan upstream deleted as unusable (5da74de9) |
| `~/.gemini/antigravity-cli/` | `history.jsonl`, `conversations/*.db`, `conversation_summaries.db` | **not read at all** (store added upstream in #470, July) |
| state DB / trajectory summaries | `agyhub_summaries_proto.pb`, `antigravity_state.pbtxt` | not read (upstream `antigravity_state_sync.rs` parses titles) |

**Fix = PORT upstream final state of all three modules** into our adapter layer:
- `providers/antigravity.rs` (1445 ln) — .db (SQLite) conversations, titles via rpc-cache/session-titled, `data_dir()/Antigravity/logs` ls-main.log
- `providers/antigravity_cli.rs` (867 ln) — `~/.gemini/antigravity-cli`: history.jsonl, brain/conv-cli transcripts, conversation_summaries
- `providers/antigravity_state_sync.rs` (646 ln) — trajectory protobuf summaries for session titles

Upstream commits to absorb: #470 (8546a439), 5da74de9, ae536bbe, #555 test-sandbox path expectations.
**Rule: write a failing test against real store fixtures first** (reproduces "sessions exist but not listed"), then port.

## P0 — Windows fixes (we are the Windows user)

| Commit(s) | Fix | Method |
|---|---|---|
| b8264157+43c55dbf+bb6e3e1b (#549) | project-folder decoding heuristic unreachable/mis-keyed on Windows | PORT |
| c1c7a59f (#604) | watcher: strip `\\?\` extended-length prefix from events | PORT |
| f4c7bee5 (#398) | cursor percent_decode panic on multibyte workspace names | PORT (when Cursor Agent ported) |
| 5a767673 (#588), 0820adba (#586) | Cline Windows paths + extension discovery | PORT (with Cline SDK) |
| 150efb18 (#624) | shared Windows path-prefix helper in settings | COMPARE |
| 62b37328 etc. | clippy Windows false positives | SKIP (noise) |

## P1 — Performance (COMPARE against our June cache work)

Our own cache landed June (#perf cache, "unbelievable! fast"). Upstream did an independent wave — diff approaches, port deltas:

| Commit | What | Method |
|---|---|---|
| f94c2b10 (#458) | chat-style message pagination across all providers | COMPARE→PORT (we paginate 20/load-more already) |
| 034fb54a (#381) | paginate project session loading | COMPARE |
| 41530711 (#591) | session list load speedup large histories | COMPARE |
| f22b6b3a (#528) | heavy reads on blocking pool | PORT |
| 76af742d (#436) | concurrent provider scanners at startup | COMPARE (we have 5s timeout per provider) |
| 22657329 (#468) | bounded-pool parallel workspace scans | PORT |
| 4c921fe5/be07e308 (#466/#467) | search result resolve + per-file cache signature | COMPARE (we have backend search) |
| d93907c9 (#464) | per-file daily stats aggregate cache | COMPARE |
| b8ba8e5e (#352) | FlexSearch → Web Worker | COMPARE (our FlexSearch in-session search) |
| 7f5f942c (#460), 016f0acd (#461) | offscreen row skip; size-guard syntax highlight | PORT |
| af5f1d9b | resolve image blobs only on session open | PORT (with Kimi-style images) |

## P1 — Session intelligence (Phase 2 follow-ups)

| Commit(s) | Feature | Method |
|---|---|---|
| e43bb358 (#611), 6ec51b09 (#616) | show Claude auto-generated session titles (viewer + stats) | PORT |
| 9fceba3b (#496) | merge cross-file Claude continuations | PORT |
| 1d16de59 (#572) | hide redundant Claude predecessors | PORT |
| 7f096a1d (#568) | preserve branched conversations | PORT |
| 6dee9c8c (#477), 29f7af21 (#368), 2c720731 (#395) | native rename: custom-title event (Claude 2.x), /branch source, JSONL newline | COMPARE (we have rename) |
| 5c0fc736 (#369) | resolve project cwd/name from JSONL metadata | COMPARE |
| fa96b51b (#419) | folder name over stale cwd for project identity | COMPARE |
| 8c9946f3 (#623) | serialize metadata saves | PORT |
| c1374fda/89e61026/581c5105 (#621/#614/#612) | store: stale pages on reload, keep selection past page 1, in-place reload | PORT (we hit reload blanking too) |

## P1 — Security sweep (port into OUR readers; June port already symlink-guarded adapters)

| Commit(s) | Area | Method |
|---|---|---|
| 8599a911/742e1e5f/aa0d355a/6b5f4b5f/e09c3c98 | stats/sessions/search/subagents: never follow symlinks, regular files only, refuse FIFO | COMPARE→close gaps |
| e8aa95f4/c3eb2459 | recent-edits/server refuse folder-or-FIFO named like session | PORT (with Recent Edits) |
| 1eed29d7 (#602), d864bdeb (#613) | links: block non-external nav, only downloads for blob/data | PORT |
| 3b551796 (#605) | refuse to overwrite unparseable config on MCP save | PORT if we have MCP settings |
| 8a9df561 + #640-642 | restore only recorded whole-file versions + restore guard | with Recent Edits |

## P2 — Recent Edits panel (full subsystem, mature by v1.32)

Series #515 (20+ feat commits Aug 21-26) + #514 cache + adversarial-review fix wave + #475 reveal-in-folder + #473 diff view + v1.31-32 restore hardening.
Files: `recentEditsPanelSlice`, dock/sidebar panel, backend edits reader, i18n 5 locales.
**PORT whole subsystem in one phase** — follow-ups (cache keying, cursor ownership, ABA guards) are integral, do not skip. Includes #526 refactor onto `useFileEditActions`.

## P2 — Search improvements

| Commit | What | Method |
|---|---|---|
| ce01bea1 (#437) | index `tool_use.input` → matches tool arguments | PORT |
| f28efa29 (#396) | global search matches tool_result content | PORT |
| ee6082b3 (#481) | reveal + highlight in-session matches inside tool cards | PORT |
| 8aa2c1bb (#426), c65ee5ea (#392) | conversation attribution + navigation from results | COMPARE (our GlobalSearchModal) |
| d7b33a9b, 54936818 (#506) | JSON-escaped matches preserved; Codex relevance | PORT |

## P2 — Viewer UX

Minimap (#634), Alt+↑↓ prompt jumps (#629+#630), collapsed tool-call summary rows (#00a9b362), drop repeated headers (#051fa7a3), **double text render for array-content providers (#eaaa8787 — likely affects OUR providers)**, expand-key scope (#81a27a6c), KaTeX (#499+6130cac2+86c8f8a8), narrow window (#500), font-size propagation (#412/#443/af2dcd7f/c81e9a82), i18n plural v4 (#82a05981), theme tokens (#1bd82f8b, e6f10e99), a11y skip links (#530), OverlayScrollbars init event (#351).

## P3 — Providers wave 2 (pick per need)

**Fixes to providers we already have — PORT regardless:**
- Antigravity: see P0
- Codex: zstd rollouts (74bdee28), meta-less rollouts via turn_context (38b9e583), forked session_meta (7727193b), reasoning in content not summary (#610), sqlite orphan cleanup (50d32412)
- OpenCode: split global sessions by dir (#432), bounded session cache (#428), schema align (ab6bcb45), subagents from DB (#560)
- Gemini: .jsonl sessions (#393), path normalize in stats (#3155c05c)
- Cline (have adapter): SDK-era store (#589), Windows (#588/#586), truncation char-safe (#425)
- Cursor (have): global stats (#495); Cursor Agent CLI is a NEW provider (#397/#482/#571)
- Claude: subagent usage rollup (#594), streamed final tokens (#585)

**New providers — DECISION REQUIRED (recommend SKIP unless user uses them):**
Kiro (#324), Kimi CLI (#349) + Kimi Code wire (#513, VS Code ext), Copilot ×3 (#415), Continue/PearAI/Kilo/Goose/Crush/llm (#416), Amazon Q (#417), OpenInterpreter/Qwen/Zed/OpenHands/Trae (#418), Pi+oh-my-pi (#445), Vibe (#438), Grok (#487), Z Code (#573), Kilo OpenCode-core (#580), CodeBuddy (#353).
Each = Rust adapter + TS adapter + registration + 6 locale files + maintenance.

## P3 — SKIP candidates (no server mode in our fork / not applicable)

Server/WebUI cluster: #384 auth, #493 deep links, #560/#617/#618/#620/#693 path+URI validation, #562/#520 restore gates, watcher wildcard events (1dbe4a84), global refresh (#439) — **all SKIP while we have no Server Mode** (revisit if we ever port it).
Also skip: Homebrew/release CI (#553/#554/#342b...), Linux ibus/WebKit DMABUF (#360, 4d2cf9d6), harness-kit (2f77115f), serena config (e3ed8f0e), README/changelog/docs, test-sandboxing campaign (#544-#558 — useful patterns, not features).

## Session management features (P2/P3 mix)

Multi-select + mass delete (#456, + a11y 03fea98e + scope 5568ff5c) — PORT (P2, we have delete?). Resume in terminal (#463) + extra args (#595) — PORT (P2, pairs with our resume). One-click full backup archive (#411) + trash fallback (#410) — PORT (P2). Parallel-tasks filter (#446) — PORT (P3). Workflow runs rendering (#99b2ec7d) — P3 decision. Explorer columns (one-row-per-folder #23ea7fbe, temp bucketing #ccf7c19b, sessions column #4bc63da2) — COMPARE with our ProjectTree (P3). Headless `--export` (#413) — P3. Skill/subagent stats (#414) — P3. Pricing lifecycle (eae3db1c + updates) — P3 (costs drift; optional).

---

## Suggested execution order

1. **Antigravity P0** (test-first against real fixtures: .db + CLI store)
2. **Windows P0 cluster** (#549 decode, #604 watcher prefix)
3. **Provider fixes for providers we have** (Codex/OpenCode/Gemini/Cline/Cursor fixes)
4. **Perf COMPARE** — measure our cache vs their approaches, port deltas
5. **Session intelligence + store reload fixes**
6. **Security sweep gaps**
7. **Recent Edits panel** (big, isolated)
8. **Viewer UX + search** (incremental)
9. Provider decisions for wave 2 (likely SKIP most)

Ship each batch as PR to `origin` (never upstream). Re-measure: `git rev-list --count v1.13.0..upstream/main` stays 433 until next fetch; new tail re-triaged then.

## Provider-fix sweep — C group (2026-11-08)

Each item was read against our code, not against the ledger's label.

| Item | Verdict | Why |
|---|---|---|
| #575/#585 streamed usage dedup | **PORTED** `db9dbc79` | Measured on a real 2.3 GB session: rows sharing `message.id` inflated tokens by 94% (38.6B reported vs 19.8B actual). Per-field growth dedup now runs in all four scan paths. |
| #577/#594 subagent rollup | **PORTED** `db9dbc79` | One session carried 144 subagent transcripts, each listed as a session and none billed to its parent. Folded under `billing_total`; session-shaped metrics count heads only. |
| #560 OpenCode Task runs | **PORTED** `f8b7df11` | OpenCode stores a child run as a `session` row with `parent_id` (5 in the local DB). Listed and readable as subagents via `opencode://` ids. |
| #428 OpenCode cache bound | **N/A** | Our watcher keeps no OpenCode session cache, so there is nothing to bound. |
| #425 Cline char-safe truncation | **ALREADY PRESENT** | `truncate_chars` and its tests landed with the adapter; the Roo/Kilo label fallback has no local data behind it. |
| #495 Cursor global stats | **SKIP** | It is a new feature (849 lines in the provider + 260 in stats), not a fix. Our global stats cover Claude/Codex/Gemini only; per-session stats are provider-neutral. |
| #3155c05c Gemini path normalize | **N/A** | We route Gemini sessions by `gemini://` URI, not by filesystem path. |
| ab6bcb45 "OpenCode schema align" | **N/A** | The commit is `fix(ompi): align session parsing` — pi/ompi, not OpenCode. The ledger mislabelled it. |
| 50d32412 Codex sqlite orphans | **N/A** | Our Codex reader has no `state_*.sqlite`; deletes are file-based. |
| #397/#482/#571 Cursor Agent CLI | **SKIP** | A new provider, a separate decision, not a fix to one we have. |

Unrelated bug fixed in the same pass: `31ba420c` — the update check could spin
forever because both `check()` and the release-feed fetch run in Rust with no
timeout; both are now raced against a 15 s ceiling.

## PRODUCT DECISIONS LEFT (explicitly deferred to the owner, 2026-11-07)

These are the only upstream items not integrated. Each is a product choice, not unfinished work:

1. **20+ additional providers** (Kimi, Grok, Amazon Q, Qwen, Zed, Trae, Goose, Crush, Copilot, Amazon…).
   Each = Rust adapter + TS adapter + registration + 6 locales + permanent maintenance.
2. **Server mode / WebUI** — an HTTP server with auth and deep links over the same history.
   Our fork has no server surface at all.

---

## TAIL 2 — v1.32.2 → Omnilogue v2.0.0 (136 commits, 2026-11-19/20)

Upstream renamed the repository to **jhlee0409/omnilogue** and shipped **v2.0.0**
on the same day our fork was renamed (2026-11-19). The `upstream` remote now
points at the new URL. Dispositions below are from commit subjects plus, where
it mattered, the diff; nothing here is implemented yet.

### Recommended ports — fixes that apply to code we own

| Commit | What | Why us |
|---|---|---|
| `49ecfb6c` | avoid recursive stack growth in deep transcripts (#765) | crash on very long sessions |
| `13903a00` | stop counting Claude Code `api-request` records as messages (#768) | our transcripts carry these rows; message counts inflate |
| `ccf779ec` | follow appended messages across latest-window refreshes (#763) | messages vanish after auto-refresh |
| `ca9b27a8` | unlock pagination after an abandoned session reload (#767) | we hit the blank/paged-dead session |
| `6058c6c2` | preserve message text containing image filenames and URLs (#720) | text gets eaten by the image heuristic |
| `c46f8999` | keep same-named projects apart for every provider (#672) | project identity collisions |
| `9fa7315e` | retain project identity in stats and Claude/Codex search (#724) | stats/search attribution |
| `424ad45a` | one shared file watcher on desktop (#804/#807) | duplicate watchers per window |
| `17758d75` | date undated records from neighbouring lines (#729/#745) | stats timeline correctness |
| `756040da` | read sessions from OpenCode 2.x (#776) | our store already has an `opencode-v2` DB on disk |
| `85a77d62` | roll OpenCode/Kilo subagent runs into session stats (#795) | completes the Claude-only rollup we ported (#594) |
| `d7b7ff3a` | restore only writes recorded whole-file versions (#682) | data loss for Codex/OpenCode |
| `827f34d5` | validate path shape before resolving the Cursor Agent root (#781) | traversal guard |
| `f876bfeb` | Antigravity IDE v2.6 workspace grouping (#766) | we own that adapter |
| `1e42be02` | load Cline sessions by the listed file; answer edits/subagents (#790) | we own that adapter |
| `823b72f1` | treat AskUserQuestion answers as user input (#709/#786) | navigator/prompt jumps miss them |
| `71fc2ad1` | conversation branches with an inline switcher (#782/#800) | the branched-conversation gap we deferred (#568) |

### Compare — we have an equivalent; port deltas only if a symptom appears

`99865191` recent-edits scope · `605f4eb5` / `84e068f9` symlink-free history
reads (we already refuse symlinks) · `fb744e8b` history read failures + Cline
ids · `36b7d41c` navigator focus row · `63efbb44` minimap search ticks ·
`c64bd64a` spawned-subagent rollup (ours differs) · `500a04a8` scoped search ·
`486cbdf1` pagination/archive counts · `9c3c6604` empty-subagent parent link ·
`2c1cbab7` prepend restore measurement · `398a10ea` headless export parity ·
`e0a2ba3d` / `509030fc` usage-breakdown contract · `29400c8e` / `03da7e24` /
`c3ab07a2` truthful loading and token recording · `31767b17` / `7cb3f603`
settings location metadata · `a8fb62a6` turn outline (our navigator) ·
`324ee2cd` lossless per-result metadata · `02f217fc` provider search parity.

### Skip — upstream's shell and design system

The T/F/SX/TR series is a rewrite of the shell and transcript around their
three-pane layout: `2dcc9772` toolbar + Library/Projects sidebar (sessions
column removed), `faf4e22f` tabs, `c8e22250` Inspector, `786eae75` Edits
screen, `c1a0faeb` typography, `23e53153` / `2c777022` role tokens,
`39dcebab`…`f0e8317a` ToolRow/DiffView transcript model, `fe757d9d`
ShellLayout slots, `e3b84091` navigation transactions, `32f963b6` command
manifest, `30efc534` native menu, `f3a81172` window restore, `2edfb8fc`
multiple windows. Adopting any of it means adopting the rest.

Also skipped: brand/theme rename (`00be8865`, `28a91c03`, `dadc03ce` — we
renamed to our own name instead), server/web/Pages (`6b181dda`, `b6b01f41`,
`69338870`), release and CI harness (`10c5fb29`, `0076a8c0`, `3747e738`,
`017896ee`, `82c87123`, `6c191c15`, `325ce79e`), docs (`bc505013`).

### Non-applicable — providers we do not have

`6c155df6` Hermes · `6514bbe2` Qoder · `640d2978` Vibe store · `05d62a6c`
Z Code modelId · `d520ed8f` Cursor ACP / JetBrains · `91b98080` claude.ai
account export · `87231b20` Flatpak (build target, not papered).

### Notes

- Upstream's v2.0.0 **removed the sessions column** (`2dcc9772`) that we
  ported from #4bc63da2. Ours stays: it is our layout choice, not a mirror.
- The new tail is 136 commits; the previous boundary (`v1.13.0..v1.32.2`, 433)
  remains fully dispositioned above.

### Outcome — what the sweep actually did (2026-11-20)

**Ported**

| Upstream | Our commit | What changed |
|---|---|---|
| `49ecfb6c` #765 | `20193538` | transcript walk uses a worklist; 100k-deep chain no longer overflows (the old test depth of 10k fit the stack, so it proved nothing) |
| `13903a00` #768 | `884ecc65` | `api-request*` records never count as messages or render, even with the noise toggle on |
| `ca9b27a8` #767 | `2410aa42` | every session selection takes a token; a stale load cannot paint over the newer session |
| `6058c6c2` #720 | `f072bf3a` | image detection only on whole values; prose mentioning `logo.png` stays text |
| `17758d75` #729 | `01618914` | undated records inherit the nearest dated line, past the page window |
| `424ad45a` #804 | `df1c5196` | setup starts the file watcher nothing ever started |
| `c74795be` #791 | `dac81ef3` | copy-feedback timers owned by a hook and cleared on unmount |
| `605f4eb5`/`84e068f9` #699/#710 | `1f3ef5f3` | history files are opened without following a link or reading a pipe |

**Not applicable — checked in our code, not assumed**

- `ccf779ec` #763 — our refresh replaces the first page instead of merging a
  latest window, so the "appended tail disappears" class cannot occur here.
- `c46f8999` #672, `9fa7315e` #724 — our search results carry no
  `projectPaths` contract; both commits presuppose upstream's search module.
- `d7b7ff3a` #682 — the live edit collector rebuilds whole files from
  `originalFile`; the patch/fragment rows it guards exist only in dead code
  (`build_tool_use_edits` is unreachable).
- `827f34d5` #781 — our `delete_session` validates absolute path and `.jsonl`
  before any store lookup.
- `823b72f1` #709 — our navigator is role-based and has no kind taxonomy to
  extend with "answer".
- `f876bfeb` #766, `756040da` #776, `1e42be02` #790 — each needs a store format
  we do not have a fixture for (Antigravity IDE 2.6, OpenCode 2.x
  `session_v2`; the local `opencode.db` is 1.x with `session_message` empty).
  Upstream code is available to port the day such a store appears.
- `85a77d62` #795 — token stats cover Claude/Codex/Gemini only; there are no
  OpenCode or Kilo rows to roll up.

**Deferred product decisions** — features rather than fixes: conversation
branches (`71fc2ad1` #782, pairs with #568), inline per-message tokens
(`55489c10` #787), "prompts & final replies" filter (`74381842` #769),
multiple windows (`2edfb8fc` #803), Flatpak (`87231b20` #794), and the
provider wave (Hermes, Qoder, claude.ai export, Cursor ACP).
