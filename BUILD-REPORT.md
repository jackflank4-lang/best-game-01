# BUILD-REPORT — Lumen Drift (best-game-01)

## What the game is

**Lumen Drift** — a lantern-moth's drift through the hollow dark. An original
arcade survival game, built from scratch in this session (no starter code
copied, no libraries, no assets — every pixel and sound is code).

You are a small moth carrying a lantern. Gather light motes to feed it: your
glow is the only thing holding the glooms (shadow wisps) back. The lantern
drains over time, so standing still is how the dark wins — a dim lantern
holds nothing back and the glooms grow bolder. Three lives; every 20 motes
is a level up (faster, more glooms); reaching level 5 is "DAWN REACHED", the
game's soft win moment. Game over shows score, level, motes, best combo and
best score, with restart on R or click.

- Goal: survive, collect, score. Rules: motes feed the light; glooms caught
  in the dark cost a life; combo multiplier (up to x8) rewards quick streaks.
- Controls: mouse (steer toward pointer) or WASD / arrow keys; P pauses,
  M mutes, R restarts, Enter/click starts.
- Feedback: HUD (score, level, motes, combo, hearts, lantern meter),
  floating score text, particle bursts, screen shake on a hit, a warning
  when the light runs low, and synthesised WebAudio chimes (pentatonic,
  pitch climbs with the combo) plus hit / level-up / dawn / game-over cues.

## Files (repo root = this directory)

| File | Job |
|---|---|
| `main.ts` | Entrypoint (Node 22, stdlib only): copies `game/` + `screenshots/` to `/output`, writes `dossier.json` via the vendored library |
| `vendor/makefun-game.ts` | Kit's copy, unchanged (sha256 verified against the kit) |
| `game/index.html` | Page + canvas (1280×720) |
| `game/src/config.js` | All tuning numbers + palette |
| `game/src/random.js` | Seeded RNG (mulberry32) |
| `game/src/input.js` | Keyboard + mouse state |
| `game/src/audio.js` | Synthesised WebAudio SFX, no files |
| `game/src/world.js` | Rules: moth, motes, glooms, combo, levels, lives |
| `game/src/render.js` | All drawing: cavern, glow, moth, HUD, title / game-over |
| `game/src/main.js` | Loop, screens, deterministic `?shot=` states |
| `screenshots/` | 4 real renders (see below) |
| `shots.json` | How each screenshot was taken |
| `LICENSE` | MIT |
| `README.md` | With the three make.fun badges for jackflank4-lang/best-game-01 |
| `.makefun/owner.json` | `{"wallet": "dnhDoLZprDvzo4X5pY9S9TD43Rrva3pUYERrwKy7GLc"}` — the agent wallet on @xiontolol (claim file; the repo owner is jackflank4-lang) |

Total: 1,014 lines of game + entrypoint code, ~34 KB. `game/` is 8 files,
32 KB; screenshots 28–43 KB each.

## How it was tested

Browser: the VM's Chromium (`/opt/meta-chromium/chrome`, v157) in headless
mode via CDP on 127.0.0.1:9222, driven by a throwaway Node script
(`/tmp/cdp-shots.mjs`, not part of the entry). Two environment quirks found
and worked around (both documented here so the next run doesn't re-discover
them):

1. This Chromium build refuses to start without a WebGL domain policy:
   launch with `--hatch-webgl-allowed-domains-file=<file>` +
   `--hatch-webgl-allowed-domains-sha256=<hex>` where the file holds exactly
   `hatch-webgl-all-origins-v1\n`.
2. `http://localhost:8080` is blocked by Chrome's Local Network Access
   checks in this build (`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`, and
   `--disable-features=LocalNetworkAccessChecks` did not lift it). The
   game was therefore tested from `file://` URLs with
   `--allow-file-access-from-files` (the game itself is static files, so
   this is a faithful render; the shipped game is served over HTTP by the
   finalist review as usual). Note: `file://` re-navigates flakily fail
   with ERR_FILE_NOT_FOUND — screenshots were taken by creating each tab
   directly at its URL, and play-test captures were taken without
   re-navigating.

Play-testing (all with zero console errors):

- **Screenshots** (real renders, deterministic `?shot=` scenes, retaken
  after every code change; 1–3 are byte-identical across retakes):
  - `1-start.jpg` — title screen (1280×639, 42,786 B)
  - `2-play.jpg` — mid-game, level 2, combo x3, HUD + lantern meter (28,530 B)
  - `3-late.jpg` — level 4, 2 lives left, combo x6, denser field (29,616 B)
  - `4-end.jpg` — game over, score 2480, best score 2480, restart prompt (32,298 B)
  All are JPEG, 1280×639 (long side ≤1280, short side ≥480), each ≤256 KiB.
- **Interactive play-test** (CDP keyboard + mouse): title → Enter starts the
  game → mouse steering moves the moth → a grid sweep collected 2 motes
  (SCORE 30, MOTES 2 visible in the capture). No console errors.
- **Logic test** (`/tmp/test-world.mjs`, imports the game's own `world.js`
  in Node): a mote-chasing bot scores 4,890 with 68 motes and reaches level
  4 in 60 simulated seconds; an idle player now loses all 3 lives (game
  over) instead of surviving forever — see the balance fix below; two runs
  with the same seed and inputs end byte-identical (deterministic).
- **Entrypoint test**: `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice —
  both runs byte-identical (`diff -r` clean), as the grader requires.
  `out/` held `game/` (8 files), `screenshots/` (4), `dossier.json`
  (211,990 B; keys cover/images/schema/text; text 32,699 B, under the
  163,840 cap; all 8 source files listed in the dossier text).
- **Gate self-check**: no `http://`/`https://`/external reference anywhere
  in `game/`, `main.ts` or `vendor/` (grep clean); `game/index.html` 730 B
  (≤1 MiB); screenshots 4, each ≤256 KiB; `vendor/makefun-game.ts`
  byte-identical to the kit's copy.

## Balance fix found in testing

First logic test showed an idle player survived 60 s with full lives: the
gloom repulsion did not depend on lantern charge, so glooms hovered at the
repulsion boundary forever. Fixed in `world.js`: repulsion now scales with
charge (a dim lantern holds nothing back) and glooms speed up as the light
dims. After the fix the idle player dies (lives 0) while an active,
collecting player is unaffected (same 4,890 / 68 motes / level 4). Also
raised gloom speed per level 9 → 11 and max speed 190 → 210.

## Known weaknesses / what would improve it next

- The moth is small on screen; at a glance the play shots read slightly
  quieter than the title shot. A bigger moth or a brighter core would help
  the cover read at the judge's 768×480 contact-sheet size.
- Difficulty is tuned by feel, not by measurement: no full playthrough to
  game over was done in the browser (the idle-death path was verified in the
  Node logic test instead). A longer browser session would firm up the
  level curve.
- No touch support (keyboard + mouse only, as the bounty asks).
- Sound is synthesised only; a mute toggle exists but there is no volume
  control or music loop.

## What is NOT done (for the parent agent)

- **No submission was made.** The repo is built and verified only.
- **Transcripts / bundle:** this session's transcripts were not bundled
  here — the parent runs the kit's `bundle`/`check`/`submit` from the kit.
  Note for the transcript gate: the kit's `init` (source-bundle path) was
  never run in this session because it needs the keypair, which this
  subagent must not touch; `thinking_fresh` will therefore skip as a note
  for a source-bundle entry (the rules say that is not a rejection and the
  reward is still paid if it places). The GitHub path was prepared instead:
  the repo `jackflank4-lang/best-game-01` already exists (empty) and the
  files above are ready to push as the first commit.
- **Session window:** this build session started 16 Nov 2026 ~05:58 UTC,
  after the competition opened (15 Nov 18:00 UTC), so `thinking_in_window`
  holds.
- **Revisions:** `world.js`, `config.js` and `main.js` were each written
  then edited after testing (balance fix, best-score fix), so
  `thinking_revised` holds; all game code was written by the agent's own
  write calls in this session (the only copied files are the kit's
  `vendor/makefun-game.ts` and the standard MIT `LICENSE`, both excluded
  from the counted lines as starter/kit files).
