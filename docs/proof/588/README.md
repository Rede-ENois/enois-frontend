# Visual proof: #588 (notification signals, Explore, slim menus, Boteco shell)

The contract asks for ~390 px and ~1280 px on every changed screen. This PR changes the logged-in
shell, so the capture runs the real app with a seeded session instead of DS stories.

## How it was measured

`shot-588.mjs` starts a fake backend on `127.0.0.1:5198` (the dev SSR calls `BACKEND_TARGET`
directly) and headless Chrome over CDP. For each theme (dark, light) and width (390, 1280):

1. Seeds the session (`enois_auth`, `session_active`, `current_user`) and the theme
   (`connect-grow-theme`) on `/entrar`.
2. Opens `/feed`, `/notificacoes` and `/explorar`; at 390 also opens the side menu.
3. Reads `scrollWidth` × `clientWidth`, whether `.dark` is on, and how many signals are drawn.

The fake backend answers the new contract of Rede-ENois/enois-backend#422 (`place`, `eventDate`,
`byCommunity`, `eventsToday`), so the community table, the event ticket, the community news dot and
the "hoje" tag all show. Every name and value is fake.

## Result

| Screen          | 390 dark | 390 light | 1280 dark | 1280 light |
| --------------- | -------- | --------- | --------- | ---------- |
| `/feed`         | 390/390  | 390/390   | 1280/1280 | 1280/1280  |
| `/notificacoes` | 390/390  | 390/390   | 1280/1280 | 1280/1280  |
| `/explorar`     | 390/390  | 390/390   | 1280/1280 | 1280/1280  |
| side menu       | 390/390  | 390/390   | (rail)    | (rail)     |

No horizontal overflow anywhere. Seen on screen: the dock with message and notice counts, the dot on
the phone menu button, Comunidades and "Design aberto" with the news dot, Eventos with "hoje", the
rail events as tickets (amber for today), notices grouped under "Hoje" with avatar, community table
and ticket contours. `result.json` has the raw reading of all 14 captures.

Two defects found by this capture and fixed in the same PR: the rail printed the raw event date and
format (`2026-11-02 · IN_PERSON`; the day is on the ticket, the line now reads `19:00 · Presencial ·
18 confirmados`), and a reserved 40 px row left an empty band above the feed (the refresh indicator
now floats over the list). The ticket in a notice row was 8 px narrower than the other contours;
fixed in Rede-ENois/enois-design-system#99.

## Reproduce

```bash
# in the worktree: dev server on 5176 pointing at the fake backend (never at production)
BACKEND_TARGET=http://127.0.0.1:5198 npx vite dev --port 5176 --host 127.0.0.1
OUT=/tmp/verif/588 node docs/proof/588/shot-588.mjs
```
