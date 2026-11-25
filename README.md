# Midnight Noodle Cart

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/kochou1shinobu/cooking-game-makefun/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/kochou1shinobu/cooking-game-makefun/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Run a late-night noodle cart for one three-minute shift. Read the order tickets,
click the broth, the noodles and two toppings to build each bowl, and ring the
bell to serve before the ticket's patience runs out. Perfect serves build a
combo; a wrong ingredient costs patience. The rush grows: more tickets, shorter
patience, bigger tips.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any static
server). No network, no build step.

- Click a ticket to cook it; click ingredients (or press `1`–`5`, `Q` `W` `E`
  `A` `S` `D`) to add them to the bowl.
- `Space` rings the bell and serves the bowl when it matches the ticket.
- `Backspace` clears the bowl; `Tab` switches ticket; `P` pauses.

## Build

`main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots are staged scenes of the game's own code (`?shot=kitchen|assembly|
serve|rush&seed=1`, listed in `shots.json`): the cover is a busy mid-shift
kitchen, then a bowl mid-assembly, a plate ready to serve, and the closing rush.

## Entry

An entry for [make.fun's best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137).
