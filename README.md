# Lumen Drift

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/jackflank4-lang/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/jackflank4-lang/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A lantern-moth's drift through the hollow dark. Gather light motes to feed
your lantern — your glow is the only thing holding the glooms back. Three
lives. Reach level 5 and see the dawn.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

Steer with the mouse or WASD / arrow keys. `P` pauses, `M` mutes,
`R` restarts after a game over.

## How it is built

- `game/` — the game itself, plain static files, no network, no libraries:
  `index.html` plus `src/` (config, seeded RNG, input, synthesised sound,
  world rules, rendering, and the main loop).
- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to `/output`
  and writes `/output/dossier.json` with the vendored make.fun library.
- `screenshots/` — four real renders of the game's own code: title, play,
  late game, and the game-over screen.

Entered on [make.fun](https://make.fun/bounty/best-game-01).
