# Build Your Own World Cup Pool Website — A Beginner-to-Advanced Tutorial

*Using the very app we built for our friends' pool as the running example.*

Hey! You played the pool — now you want to know how the site was actually made. This
tutorial walks you from "I've never written a line of code" all the way to the advanced
bits (auto-updating results, installable app, login wall). Every concept is tied back to
the **real code** in our app so it's concrete, not abstract.

You don't need to read it all at once. Do a part, try the "Your turn" exercise, take a break.

---

## Table of contents

1. The big picture — what this app actually is
2. Tools you need (all free)
3. Part 1 — HTML: the skeleton
4. Part 2 — CSS: making it look good (colours, themes, mobile)
5. Part 3 — JavaScript: making it *do* things
6. Part 4 — Data: how the game is stored in code
7. Part 5 — The bracket brain: resolving winners
8. Part 6 — Rendering: turning data into what you see
9. Part 7 — Memory: saving state with localStorage
10. Part 8 — Getting live data: fetch + async
11. Part 9 — Automation: GitHub Actions + a robot that fetches scores
12. Part 10 — Putting it online: hosting for free
13. Part 11 — A login wall with no server (Cloudflare Access)
14. Part 12 — Making it an installable app (PWA)
15. Part 13 — Polish: animations, confetti, mobile touches
16. Part 14 — How I'd rebuild it from zero (step-by-step)
17. Debugging like a developer
18. Glossary of every term used
19. Where to go next

---

## 1. The big picture — what this app actually is

Here's the single most important idea: **our app is just three text files** (HTML, and CSS +
JavaScript that live *inside* the HTML) plus a few helpers. There is **no traditional
server** running our code. That's why it's free to host and hard to break.

A website normally has three "layers":

- **Frontend** — what runs in your phone/browser (HTML + CSS + JavaScript).
- **Backend** — a program running on a computer somewhere (we mostly *don't* have one).
- **Database** — where shared data is stored (we fake this with a plain file, `results.json`).

Our architecture in one picture:

```
   Your phone browser                     GitHub / Cloudflare (free hosting)
   ┌───────────────────┐    downloads     ┌────────────────────────────┐
   │  index.html       │ <─────────────── │  index.html, results.json  │
   │  (HTML+CSS+JS)     │                  │  icons, manifest, sw.js    │
   │                   │    reads scores  │                            │
   │  reads results.json ────────────────>│  results.json  <───┐       │
   └───────────────────┘                  └────────────────────┼───────┘
                                                                │ writes
                                          ┌─────────────────────┴──────┐
                                          │  GitHub Action (a robot)    │
                                          │  runs every 30 min, calls   │
                                          │  the football data API,     │
                                          │  saves scores to results.json│
                                          └────────────────────────────┘
```

So the "live" feeling comes from a **robot (GitHub Action)** that periodically writes the
latest scores into a file, and your browser reading that file. Simple and robust.

**Key takeaway:** you can build surprisingly powerful things with *just* a frontend + a
static data file + a scheduled script. No expensive servers required.

---

## 2. Tools you need (all free)

- **A text editor.** [VS Code](https://code.visualstudio.com/) is the standard. It's free.
- **A web browser** with developer tools (Chrome, Edge, Firefox — all have them).
- **A GitHub account** — for storing code and running the "robot".
- Optional later: a **Cloudflare** account (hosting + login wall), and **Node.js**
  installed locally if you want to run the fetch script on your own machine.

That's it. You can write the entire frontend with just a text editor and a browser — open
the `.html` file by double-clicking it and it runs. No installation, no build step.

> **Mental model:** an `.html` file is a document your browser knows how to draw. CSS is the
> styling rules, JavaScript is the behaviour. All three can live in one `.html` file, which
> is exactly what our `index.html` does.

---

## 3. Part 1 — HTML: the skeleton

HTML ("HyperText Markup Language") is a set of **tags** that label pieces of content. A tag
looks like `<p>hello</p>` — an opening `<p>`, some content, a closing `</p>`. Browsers turn
these tags into the boxes, text, and buttons you see.

The absolute minimum page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>My first web page.</p>
</body>
</html>
```

- `<!DOCTYPE html>` — "this is modern HTML."
- `<head>` — invisible setup: the title, character set, the `viewport` line (crucial for
  mobile — it tells phones "render at real width, don't zoom out").
- `<body>` — everything you actually see.

Common tags you'll meet in our app:

- `<div>` — a generic box, used everywhere for grouping/layout.
- `<h1>`,`<h2>` — headings.
- `<button>` — a clickable button (our ○ winner buttons, "Fetch latest results", etc.).
- `<span>` — inline text you can style (our team chips).
- `<a href="...">` — a link (the "Live & scorers" links, the nav).
- `<table>` — rows/columns (the Team Tracker).
- `<canvas>` — a drawing surface (our confetti).
- `<input>` — a text box (typing team names into the R32 slots).

In our real `index.html`, the champion-pool structure is basically:

```html
<div class="wrap">
  <nav> ... links: Champion Pool / Group Stage / Sign out ... </nav>
  <header> ... the hero "scorebug" with RM440 pool + countdown ... </header>

  <h2>Standings &amp; Payout</h2>
  <div class="card"><div class="players" id="standings"></div></div>

  <h2>Team Tracker</h2>
  <div class="card"><table id="teamTracker"> ... </table></div>

  <h2>Knockout Bracket</h2>
  <div class="card"><div class="bracket" id="bracket"></div></div>
</div>
```

Notice most containers are **empty** (`<div id="standings"></div>`). That's deliberate:
JavaScript fills them in later based on the game data. HTML provides the *skeleton*; JS adds
the *flesh*. This "empty container + fill with JS" pattern is the heart of interactive sites.

**Attributes** are the extra info inside a tag: `id="standings"` (a unique name so JS can
find this box), `class="card"` (a reusable style label), `href="..."` (a link target).

### Your turn (5 min)

Make a file `test.html`, paste the minimum page above, change the `<h1>` text, and
double-click the file to open it in your browser. Add a `<button>Click me</button>`. You just
wrote a web page.

---

## 4. Part 2 — CSS: making it look good

CSS ("Cascading Style Sheets") is how you turn plain HTML into something that looks like our
app. A CSS **rule** picks elements and sets properties:

```css
.card {
  background: #161b22;   /* dark grey */
  border-radius: 16px;   /* rounded corners */
  padding: 20px;         /* space inside */
}
```

- `.card` is a **selector** — "every element with `class="card"`".
- `#bracket` selects the one element with `id="bracket"` (`#` = id, `.` = class).
- The stuff in braces are **property: value** pairs.

You either put CSS inside a `<style>` block in the `<head>` (what our app does) or in a
separate `.css` file.

### CSS variables (the theme system)

Our app supports **dark and light mode**. The trick is **CSS variables** — named values you
define once and reuse. Look at the real code:

```css
[data-theme="dark"] {
  --bg:#080b14; --panel:#111726; --text:#eef2fb; --gold:#ffcf47; --accent:#4c7dff;
}
[data-theme="light"] {
  --bg:#eef1f8; --panel:#ffffff; --text:#141a29; --gold:#c78a00; --accent:#2f5fff;
}
body { background: var(--bg); color: var(--text); }
.card { background: var(--panel); }
```

`--gold` is a variable; `var(--gold)` uses it. Because the values differ under
`[data-theme="dark"]` vs `[data-theme="light"]`, flipping one attribute on the page
(`<html data-theme="light">`) instantly re-skins everything. That's the entire theme toggle:

```js
document.documentElement.setAttribute('data-theme', 'light');  // or 'dark'
```

### Layout: flexbox and grid

Two systems do 95% of layout:

- **Flexbox** — arrange things in a row or column. Our nav and match rows use it:
  `display:flex; align-items:center; gap:8px;` puts items side by side, vertically centred,
  with an 8px gap.
- **Grid** — arrange things in a grid of columns. Our player cards use:
  `display:grid; grid-template-columns:repeat(auto-fill, minmax(255px, 1fr));` which means
  "as many 255px+ columns as fit; on a phone that's one column."

### Responsive design (mobile)

A **media query** applies rules only at certain screen sizes:

```css
@media (max-width: 640px) {
  .players { grid-template-columns: 1fr; }   /* single column on phones */
  .side .pick { width: 30px; height: 30px; } /* bigger tap targets */
}
```

This is why the app reflows nicely on phones. We also wrap wide tables in a scroll box
(`.table-wrap { overflow-x: auto; }`) so they never break the page width.

### Your turn

In your `test.html`, add a `<style>` block in the `<head>`. Give your `<h1>` a colour and
your `<button>` a `background` and `border-radius`. Then add a `@media (max-width:500px)`
rule that changes the `<h1>` colour — resize the window to watch it flip.

---

## 5. Part 3 — JavaScript: making it *do* things

HTML is structure, CSS is looks, **JavaScript (JS) is behaviour**. It's a real programming
language that runs inside the browser. It lives in `<script>` tags or `.js` files.

### The building blocks

```js
// variables — boxes that hold values
let score = 3;                 // a number
const name = "Argentina";      // text (a "string"); const = never reassigned
let alive = true;              // true/false (a "boolean")

// arrays — ordered lists
const teams = ["France", "England", "Spain"];
teams[0];        // "France"  (counting starts at 0)
teams.length;    // 3

// objects — labelled bundles of values (like a mini form)
const player = { name: "Mung", teams: ["Argentina", "France", "Spain"] };
player.name;     // "Mung"

// functions — reusable instructions
function poolShare(total, winners) {
  return total / winners;
}
poolShare(440, 1);   // 440
```

Our whole app is arrays of objects + functions that transform them. For example the real
players list:

```js
const ENTRIES = [
  { name:"Liang", teams:["France","Holland","England"] },
  { name:"Mung",  teams:["Argentina","France","Spain"] },
  // ...
];
```

### Talking to the page (the DOM)

The **DOM** ("Document Object Model") is the browser's live, editable version of your HTML.
JS reads and changes it:

```js
// find an element by its id
const box = document.getElementById("standings");

// change its contents (this is how we render everything)
box.innerHTML = "<div class='pcard'>Mung</div>";

// react to a click
document.getElementById("saveBtn").addEventListener("click", function () {
  alert("Saved!");
});
```

`innerHTML = "..."` literally replaces what's inside an element with new HTML. Almost every
"render" function in our app builds a string of HTML and assigns it to some container's
`innerHTML`. That's the core loop: **data → build HTML string → drop it into a container.**

### Events and event delegation

An **event** is something that happens (a click, a key press). You "listen" for it. When we
have many similar clickable things (all the team chips), instead of attaching a listener to
each, we attach **one** listener to the parent and check what was clicked — "event
delegation":

```js
document.getElementById("standings").addEventListener("click", function (e) {
  const chip = e.target.closest(".chip-x");   // was a team chip clicked?
  if (chip) openRoad(chip.dataset.team);       // if so, open its road popup
});
```

`e.target` is the exact thing clicked; `.closest(".chip-x")` walks up to find a chip;
`dataset.team` reads a `data-team="Spain"` attribute we put on the chip. This one pattern
powers the clickable teams, the bracket picks, and the tracker.

### Your turn

In `test.html`, add `<p id="out"></p>` and a `<button id="go">Go</button>`. In a `<script>`
at the bottom, write:

```js
document.getElementById("go").addEventListener("click", function () {
  document.getElementById("out").innerHTML = "You clicked at " + new Date().toLocaleTimeString();
});
```

Click the button a few times. You've just made an interactive page.

---

## 6. Part 4 — Data: how the game is stored in code

Before any pretty UI, you decide **how to represent the game as data**. Get this right and the
rest is easy. Our app has three data structures.

**1) Who played and what they picked:**

```js
const ENTRIES = [
  { name:"Mung", teams:["Argentina","France","Spain"] },
  // ... 9 players
];
const PRICE = 20;   // RM per team
```

From this we compute everything: pool size (`total teams × RM20`), who backed each team, and
payouts. Example — the pool total:

```js
function totalSlots() { return ENTRIES.reduce((sum, e) => sum + e.teams.length, 0); }
function poolTotal()  { return totalSlots() * PRICE; }   // 22 × 20 = RM440
```

`reduce` walks the list adding up team counts — a very common array tool.

**2) The Round-of-32 matchups (the fixed starting bracket):**

```js
const DEFAULT_R32 = {
  73:{top:"South Africa", bot:"Canada"},
  86:{top:"Argentina",    bot:"Cape Verde"},
  // ... matches 73–88
};
```

**3) The bracket wiring — which match feeds which:**

```js
// FEED[parentMatch] = [topFeederMatch, bottomFeederMatch]
const FEED = {
  95:[86,88],       // Match 95's top = winner of 86, bottom = winner of 88
  100:[95,96],
  104:[101,102],    // the Final
};
```

That `FEED` map is the tournament tree encoded as data. The winner of 86 (Argentina) flows
into 95, whose winner flows into 100, and so on to 104. We never hard-code "Argentina is in
the QF" — we *derive* it from results.

> **Lesson:** model the *relationships* (feeders) as data, and compute positions from
> results. This is why entering one result auto-advances a team through every later round.

---

## 7. Part 5 — The bracket brain: resolving winners

This is the cleverest part and a great intro to **recursion** (a function that calls itself).

We store only two things about progress:
- `state.r32` — the 32 starting team names.
- `state.pick` — for each decided match, which side won (`"top"` or `"bot"`).

To answer "who is in match N, top side?" we use two functions that lean on each other:

```js
function teamAt(n, side) {
  if (isR32(n)) return state.r32[n][side];          // R32: just look it up
  const feeder = FEED[n][side === "top" ? 0 : 1];   // else: it's the winner of a feeder
  return winnerOf(feeder);
}

function winnerOf(n) {
  const p = state.pick[n];        // did someone win match n?
  if (!p) return "";              // undecided → empty
  return teamAt(n, p);            // the team on the winning side
}
```

Read it slowly: to find the team in a later match, `teamAt` asks `winnerOf` its feeder, which
asks `teamAt` again, and so on **until it hits the Round of 32**, where the answer is a plain
lookup. That "keep asking until you reach the simple base case" is recursion.

The champion is simply:

```js
const champion = () => winnerOf(104);   // winner of the Final
```

Marking a winner:

```js
function setWinner(n, side) {
  const t = teamAt(n, side);
  if (!t) return;               // can't pick an empty slot
  state.pick[n] = side;         // record it
  save(); renderAll();          // persist + redraw
}
```

Because everything is derived, setting one pick makes the winner automatically appear in the
next round when we redraw. No manual bookkeeping.

### Applying official results by team pair

When the robot gives us finished matches, we don't know match numbers from the feed — we
match by **the pair of teams playing**, order-independent:

```js
const pairKey = (a, b) => [norm(a), norm(b)].sort().join("|");
// pairKey("Argentina","Cape Verde")  === "argentina|cape verde"
```

`norm()` lowercases and fixes spelling variants (this is why "Cape Verde Islands",
"Cabo Verde" and "Holland"/"Netherlands" all match). We loop the bracket, and for any match
whose two current teams match an official result's pair, we set the winner — repeating until
nothing changes so winners cascade forward:

```js
function applyOfficial(matches) {
  const map = {};
  matches.forEach(m => { if (m.winner) map[pairKey(m.home, m.away)] = norm(m.winner); });
  let changed = true;
  while (changed) {                 // repeat so R32 → R16 → QF ... all resolve
    changed = false;
    for (const round of ROUNDS) for (const n of round.matches) {
      const top = teamAt(n,"top"), bot = teamAt(n,"bot");
      if (!top || !bot) continue;
      const w = map[pairKey(top, bot)];
      if (w && state.pick[n] !== (norm(top)===w ? "top" : "bot")) {
        state.pick[n] = norm(top)===w ? "top" : "bot"; changed = true;
      }
    }
  }
}
```

> **Debugging story from real life:** Argentina wasn't advancing because the feed called the
> team **"Cape Verde Islands"** but our bracket said **"Cape Verde"** — different text, so the
> pair keys didn't match. The fix was one line: teach `norm()` that
> `"cape verde islands"` means `"cape verde"`. Lesson: **data from the outside world is
> messy; normalise names before comparing.**

---

## 8. Part 6 — Rendering: turning data into what you see

"Rendering" = building HTML from data and putting it on screen. Every section has a render
function; `renderAll()` calls them all:

```js
function renderAll() {
  renderTop();        // hero numbers (pool, players)
  renderStandings();  // player cards
  renderTracker();    // team table
  renderBracket();    // the knockout tree
  renderChampion();   // the gold banner + confetti
  renderPodium();     // final standings
}
```

A render function is just: loop the data, build a string, set `innerHTML`. Simplified
standings:

```js
function renderStandings() {
  const box = document.getElementById("standings");
  box.innerHTML = ENTRIES.map(e => {
    const chips = e.teams.map(t => `<span class="chip">${t}</span>`).join("");
    return `<div class="pcard"><b>${e.name}</b>${chips}</div>`;
  }).join("");
}
```

- `ENTRIES.map(...)` turns each player into an HTML string.
- Template literals (the backtick strings) let us drop values in with `${...}`.
- `.join("")` glues the pieces into one big string.

The bracket render loops the rounds and builds a column of match boxes per round, skipping
any round you've hidden — that's the "hide Round of 32" feature:

```js
ROUNDS.filter(r => !hiddenRounds.has(r.key)).forEach(round => {
  // build a column of matches for this round
});
```

> **Security note:** dropping text into `innerHTML` can be risky if the text comes from
> strangers (they could inject HTML). We control all our data, but as a habit we run names
> through an `esc()` function that turns `<` into `&lt;` etc. Always escape untrusted text.

---

## 9. Part 7 — Memory: saving state with localStorage

If you refresh the page, JavaScript variables reset. To remember things (your manual picks,
your theme choice, whether you dismissed the 2030 banner), browsers give every site a tiny
key–value store called **localStorage**. It survives refreshes and even closing the browser.

```js
// save (values must be text, so we JSON-encode objects)
localStorage.setItem("wc_champion_bracket_v3", JSON.stringify(state));

// load
const saved = localStorage.getItem("wc_champion_bracket_v3");
if (saved) state = JSON.parse(saved);
```

Our real save/load:

```js
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load() {
  const s = localStorage.getItem(STORAGE_KEY);
  return s ? JSON.parse(s) : blank();   // fall back to a fresh bracket
}
```

**Important limitation:** localStorage is **per-browser, per-device**. It is *not* shared. This
is exactly why, early on, your manual results didn't show up for other players — each phone
had its own private copy. The shared truth had to live in a file everyone downloads
(`results.json`). Remember this distinction:

- **localStorage** → private to one browser (preferences, personal previews).
- **A file/database the server hands out** → shared by everyone.

We also "version" the key (`..._v3`). When we change the default bracket, bumping the version
makes everyone load the fresh data instead of a stale saved copy — a simple cache-busting
trick.

---

## 10. Part 8 — Getting live data: fetch + async

To show live-ish scores, the page **downloads `results.json`** and reads it. Fetching takes
time (it goes over the network), so JS uses **async/await** to wait without freezing:

```js
async function loadOfficial() {
  const res  = await fetch("results.json?_=" + Date.now());  // download (cache-busted)
  const data = await res.json();                              // parse the JSON text
  applyOfficial(data.matches);                                // update the bracket
  renderAll();                                                // redraw
}
```

- `fetch(url)` requests a file/URL.
- `await` means "pause here until it arrives, then continue" (only allowed inside an `async`
  function).
- `?_=` + a timestamp forces a fresh copy instead of a cached one.

The data file itself is plain **JSON** (JavaScript Object Notation) — the universal text
format for data:

```json
{
  "updated": "2026-07-06T10:30:34Z",
  "matches": [
    { "stage": "LAST_32", "home": "Argentina", "away": "Cape Verde Islands", "winner": "Argentina" }
  ],
  "upcoming": [
    { "date": "2026-07-07T16:00:00Z", "home": "Argentina", "away": "Egypt", "odds": { "h":1.36, "d":4.7, "a":9.5 } }
  ]
}
```

Notice this is the *same shape* as our JS objects — that's why JSON and JavaScript pair so
naturally. The "Fetch latest results" button just calls `loadOfficial()` again.

> **Why can't the browser call the football API directly?** Two reasons: browsers block many
> cross-site requests (a security rule called **CORS**), and the API key would be visible to
> anyone viewing the page source. So we let a trusted robot fetch it **server-side** and
> publish a clean `results.json`. That's Part 9.

---

## 11. Part 9 — Automation: GitHub Actions + a robot that fetches scores

This is where "static site" becomes "live app". We use **GitHub Actions** — free robots that
run on a schedule and can commit files back to your repo.

### The Node.js fetch script

Node.js is JavaScript that runs **outside** the browser (on a server/computer). Our robot runs
`update-results.mjs`, which:

1. Calls the football-data API with a secret key.
2. Keeps only finished matches + upcoming fixtures.
3. Optionally fetches odds from a second free API (throttled to protect the quota).
4. Writes it all to `results.json`.

The important bits:

```js
const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
  headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN }   // secret, not in the code
});
const data = await res.json();
const matches = data.matches
  .filter(m => m.status === "FINISHED" && m.score.winner !== "DRAW")
  .map(m => ({ stage:m.stage, home:m.homeTeam.name, away:m.awayTeam.name, winner: /* winner */ }));
writeFileSync("results.json", JSON.stringify({ updated:new Date().toISOString(), matches }, null, 2));
```

`process.env.FOOTBALL_DATA_TOKEN` reads a **secret** from the environment — never write API
keys directly in code that's public. And the script is **fail-safe**: if the API is down it
exits without breaking anything, leaving the last good `results.json` in place.

### The workflow file (the schedule)

A workflow is a YAML file in `.github/workflows/`. Ours, trimmed:

```yaml
name: Update World Cup results
on:
  schedule:
    - cron: "7,37 * * * *"     # try at :07 and :37 every hour
  workflow_dispatch: {}         # also allow a manual "Run" button
  repository_dispatch:          # and an external trigger (see below)
    types: [run-results]
permissions:
  contents: write               # allow committing results.json
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: node update-results.mjs
        env:
          FOOTBALL_DATA_TOKEN: ${{ secrets.FOOTBALL_DATA_TOKEN }}
      - run: |                   # commit the new file if it changed
          git add results.json
          git commit -m "Auto-update" || echo "no change"
          git push
```

- **`cron: "7,37 * * * *"`** is a schedule. The five fields are
  `minute hour day month weekday`; `*` means "every". So this = minutes 7 and 37 of every
  hour. ([crontab.guru](https://crontab.guru) explains any pattern.)
- **`secrets.FOOTBALL_DATA_TOKEN`** is stored in GitHub repo settings, not in the code.
- Each run rewrites `results.json` and pushes it; your hosting redeploys automatically.

### Two real gotchas we hit

- **GitHub's scheduler is late/unreliable**, especially at `:00`. Running at `:07`/`:37`
  helps. For rock-solid timing we added an **external cron** (cron-job.org) that calls
  GitHub's `repository_dispatch` API every 30 minutes — far more punctual.
- **204 ≠ it ran.** Triggering a dispatch returns HTTP 204 even if no workflow is listening.
  The workflow must be on the **default branch** and declare the matching event.

> **Concept:** a "cron job" is any task on a repeating time schedule. It's one of the most
> useful automation ideas in all of software.

---

## 12. Part 10 — Putting it online: hosting for free

To share a site you need a **host** (a computer that serves your files over the internet with
`https://`). Two free options we used:

- **GitHub Pages** — turn a repo's files into a website. Free, dead simple, but the published
  page is always **public**.
- **Cloudflare Pages** — connect the same GitHub repo; it auto-deploys on every push (so the
  robot's commits go live automatically) and can sit behind a login wall. We moved here.

The deploy loop becomes beautifully hands-off:

```
you edit code → push to GitHub → Cloudflare Pages rebuilds → live
robot fetches scores → commits results.json → Cloudflare Pages rebuilds → live
```

**HTTPS matters:** modern features (installable apps, service workers, camera, etc.) only work
over `https://`, which both hosts give you free. Opening the raw `file://` on your computer
works for testing HTML/CSS/JS but *not* for `fetch("results.json")` or PWA install — those
need real hosting.

---

## 13. Part 11 — A login wall with no server (Cloudflare Access)

We wanted only our friends to see the pool. But a static site has no server to check
passwords, and any password written in JavaScript is fake security (anyone can read the code).

The clean answer: **Cloudflare Access** (Zero Trust). It sits *in front* of the site at
Cloudflare's edge. A visitor must log in (Google or an email one-time code) and be on your
allow-list before the page ever loads. Zero code, free for up to 50 users.

- The site itself stays "dumb" (no auth code); the gate is external.
- We added a **Sign out** link pointing to `/cdn-cgi/access/logout` — a special path
  Cloudflare intercepts to end the session.
- Bonus: because Cloudflare Pages can deploy from a **private** repo, we could hide the code
  and data from the public entirely.

> **Principle:** authentication is hard and dangerous to hand-roll. Prefer a proven gate
> (Cloudflare Access, Auth0, your host's built-in auth) over inventing your own.

---

## 14. Part 12 — Making it an installable app (PWA)

A **PWA (Progressive Web App)** is a normal website that phones can "install" to the home
screen and open full-screen like a native app, even offline. It needs three things:

**1) A manifest** (`manifest.webmanifest`) — metadata about the app:

```json
{
  "name": "World Cup Champion Pool 2026",
  "short_name": "WC Pool",
  "start_url": "./index.html",
  "display": "standalone",
  "theme_color": "#0b0f1a",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

`start_url: "./index.html"` is why tapping the icon opens the Champion Pool directly.
`display: "standalone"` hides the browser bars.

**2) A service worker** (`sw.js`) — a script that runs in the background and can serve cached
files when offline. Ours is "network-first": always try the live version (so scores/updates
win), fall back to cache when there's no signal:

```js
self.addEventListener("fetch", e => {
  e.respondWith(
    fetch(e.request)                          // try network first
      .then(res => { /* cache a copy */ return res; })
      .catch(() => caches.match(e.request))    // offline → serve cached
  );
});
```

**3) Icons** — the home-screen images (we generated a gold trophy at 192/512/180 px).

Then a couple of lines in the HTML register it:

```html
<link rel="manifest" href="manifest.webmanifest">
<script>
  if ("serviceWorker" in navigator)
    navigator.serviceWorker.register("sw.js");
</script>
```

That's the whole PWA. On Android Chrome the browser offers "Install"; on iPhone it's Share →
Add to Home Screen.

> **Cache-busting tip:** service workers aggressively cache. We name the cache `wcpool-v2`;
> bumping the version deletes the old cache so users get fresh files. Stale caches are the #1
> PWA confusion.

---

## 15. Part 13 — Polish: animations, confetti, mobile touches

The fun stuff, and each teaches a technique:

- **CSS animations** — the pulsing champion banner and floating 2030 badge use `@keyframes`:
  ```css
  @keyframes floaty { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  #wc2030 { animation: floaty 3.6s ease-in-out infinite; }
  ```
- **Canvas + requestAnimationFrame** — the confetti is drawn frame-by-frame on a `<canvas>`.
  `requestAnimationFrame(fn)` asks the browser to call `fn` ~60×/second; we move each confetti
  particle a little each frame. This is the basis of all browser games/animation.
- **Tooltips/popups positioned with `getBoundingClientRect()`** — the "backers" popup reads a
  badge's on-screen position and places itself next to it, flipping if there's no room. We
  switched it to `position: fixed` so it can't be clipped by scrolling containers — a classic
  layout gotcha.
- **Touch targets** — on phones we enlarge the ○ buttons and add `-webkit-overflow-scrolling`
  for smooth scrolling. Small ergonomic details that make an app feel good.

---

## 16. Part 14 — How I'd rebuild it from zero (step-by-step)

If you want to actually *build* your own version, do it in this order. Each step is runnable
and rewarding on its own — resist the urge to do everything at once.

1. **Static skeleton.** Create `index.html` with the minimum page. Add a heading and an empty
   `<div id="app"></div>`. Open it in your browser.
2. **Hard-code the data.** Add a `<script>` with an `ENTRIES` array of a few players. Write a
   `render()` that loops them into `#app` via `innerHTML`. You now show your pool.
3. **Style it.** Add a `<style>` block: CSS variables for colours, a `.card` class, fl/grid
   layout. Make it look decent in dark mode.
4. **Add interactivity.** A button that recomputes the pool total; a click handler that logs
   which player was clicked (event delegation). Get comfortable with data → render.
5. **Model the bracket.** Add `DEFAULT_R32`, `FEED`, and the `teamAt`/`winnerOf` pair. Render
   a simple bracket. Add ○ buttons that call `setWinner`. Watch teams advance.
6. **Persist with localStorage.** Save `state` on every change; load it on start. Refresh and
   confirm your picks survive.
7. **Introduce a data file.** Create `results.json` by hand with a couple of results. Write
   `loadOfficial()` with `fetch` + `applyOfficial`. Serve the folder over HTTP (VS Code's
   "Live Server" extension, or `python3 -m http.server`) because `fetch` needs `http://`.
8. **Host it.** Push to GitHub, enable GitHub Pages (or Cloudflare Pages). Share the link.
9. **Automate the data.** Write `update-results.mjs` (Node). Add a GitHub Actions workflow on a
   cron schedule with your API key as a secret. Watch `results.json` update itself.
10. **Make it an app + gate it.** Add the manifest, service worker, and icons (PWA). If you
    want privacy, move to Cloudflare Pages + Access.
11. **Polish.** Animations, mobile tweaks, a celebration. Ship it to your friends.

By step 8 you already have a real, shareable website. Steps 9–11 are the "senior developer"
upgrades.

---

## 17. Debugging like a developer

You will hit bugs constantly — that's normal, not failure. Tools:

- **Browser DevTools** (press F12): the **Console** tab shows JavaScript errors and lets you
  run code live; the **Elements** tab inspects the HTML/CSS; the **Network** tab shows whether
  `results.json` loaded and what it contained; the **Application** tab shows localStorage,
  service workers, and cache.
- **`console.log(value)`** — sprinkle these to print what your variables actually hold. 90% of
  debugging is "the data wasn't what I assumed." (Our Argentina bug was found by looking at
  the actual `home`/`away` names in `results.json`.)
- **Reproduce, then isolate.** Make the bug happen reliably, then remove things until it
  stops — that narrows down the cause.
- **Hard refresh** (Ctrl/Cmd+Shift+R) when a change "doesn't show" — you're probably seeing a
  cached file.

---

## 18. Glossary of every term used

- **HTML** — tags that structure content.
- **CSS** — rules that style content; **selector** picks elements, **property** sets a look.
- **CSS variable** — a reusable named value (`--gold`), read with `var(--gold)`.
- **JavaScript (JS)** — the programming language that adds behaviour in the browser.
- **Node.js** — JavaScript that runs outside the browser (on servers/robots).
- **DOM** — the browser's live, editable model of the page; JS edits it.
- **Element / tag / attribute** — a piece of the page / its label / its extra info (`id`, `class`).
- **id vs class** — `id` is unique (one element); `class` is reusable (many elements).
- **Event** — something that happens (click, keypress); you "listen" for it.
- **Event delegation** — one listener on a parent handling clicks for many children.
- **Array** — an ordered list `[...]`. **Object** — a labelled bundle `{...}`.
- **Function** — reusable instructions; **recursion** — a function that calls itself.
- **Template literal** — a backtick string with `${...}` slots.
- **innerHTML** — an element's HTML contents (setting it re-renders that box).
- **JSON** — a text format for data; looks like JS objects/arrays.
- **fetch / async / await** — download data / handle waiting for it without freezing.
- **CORS** — browser security rule that blocks many cross-site requests.
- **localStorage** — per-browser key/value storage that survives refreshes (not shared).
- **State** — the current data your app holds (our picks, results).
- **Render** — build HTML from state and show it.
- **API** — a service you request data from over the internet (the football feed).
- **API key / secret** — a private token proving you're allowed to use an API; never public.
- **Environment variable** — a value (like a secret) provided to a program at run time.
- **cron** — a time schedule for repeating tasks; **cron job** — a task on that schedule.
- **GitHub Actions / workflow** — free automation robots defined by a YAML file in your repo.
- **YAML** — an indentation-based text format used for config (workflows).
- **Repository (repo)** — a folder of code tracked by **git**; **commit/push** = save/upload changes.
- **Default branch** — the main line of a repo (usually `main`); schedules run from here.
- **Hosting / static hosting** — a computer serving your files over `https://`.
- **GitHub Pages / Cloudflare Pages** — free static hosts.
- **HTTPS** — encrypted web; required for PWAs and many features.
- **Cloudflare Access / Zero Trust** — an external login wall for a site.
- **PWA** — a website installable to the home screen, works offline.
- **Manifest** — JSON describing the installable app (name, icon, start page).
- **Service worker** — background script enabling offline/caching.
- **Cache-busting** — forcing fresh files instead of stale cached ones (versioned keys/URLs).
- **Responsive design / media query** — CSS that adapts to screen size.
- **Flexbox / Grid** — the two main CSS layout systems.
- **Canvas / requestAnimationFrame** — a drawing surface / the browser's animation timer.
- **Escaping** — neutralising special characters in text to prevent HTML injection.

---

## 19. Where to go next

Free, high-quality resources, roughly in order:

- **MDN Web Docs** (developer.mozilla.org) — the definitive reference for HTML/CSS/JS. Bookmark it.
- **freeCodeCamp** (freecodecamp.org) — free interactive full curriculum.
- **JavaScript.info** — a superb, deep JavaScript book online.
- **Flexbox Froggy** and **Grid Garden** — fun games that teach CSS layout.
- **The Odin Project** — a complete self-taught developer path.
- **crontab.guru** — decode any cron schedule.

Ideas to extend *this* app and level up:
- Add a real shared backend (so manual edits sync for everyone) with a free database
  (Supabase, Firebase) — this teaches backends and databases.
- Rebuild the UI in **React** (a popular frontend framework) to learn components.
- Add charts (each team's win probability over time) with a charting library.
- Build a group-stage predictor for the *next* tournament in 2030. 🇪🇸🇵🇹🇲🇦

You already understand more than you think — you followed this whole app being built, feature
by feature. The best next step is to open a blank `index.html` and start at step 1. Have fun,
and I'll see you (and your site) for World Cup 2030.

*— Built alongside the DigitalRoute WC 2026 friends' pool.*
