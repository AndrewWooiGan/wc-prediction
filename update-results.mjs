// Fetches 2026 World Cup matches from football-data.org (scores/fixtures) and, optionally,
// match odds from The Odds API (the-odds-api.com). Writes results.json.
// Run by GitHub Actions. Node 20+ (global fetch).
// Fail-safe: on any error it exits 0 without breaking the workflow, leaving results.json as-is.
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const ODDS_KEY = process.env.ODDS_API_KEY;            // optional; odds off if unset
const OUT = "results.json";
const ODDS_MIN_INTERVAL_H = 3;                          // throttle odds calls to protect the free quota

function keep(reason){ console.warn("Keeping existing results.json:", reason); process.exit(0); }

// team-name normalisation so odds names match football-data names
const ALIAS = { holland:"netherlands", netherland:"netherlands", turkey:"turkiye", "türkiye":"turkiye",
  "united states":"usa", "united states of america":"usa", "korea republic":"south korea",
  "bosnia and herzegovina":"bosnia", "bosnia-herzegovina":"bosnia", "bosnia & herzegovina":"bosnia",
  "cabo verde":"cape verde", "cape verde islands":"cape verde", "congo dr":"dr congo", "dr congo":"dr congo",
  "democratic republic of the congo":"dr congo", "democratic republic of congo":"dr congo",
  "cote d'ivoire":"ivory coast", "côte d'ivoire":"ivory coast",
  "czech republic":"czechia", czech:"czechia" };
const norm = s => { const k = String(s||"").trim().toLowerCase(); return ALIAS[k] || k; };
const pairKey = (a,b) => [norm(a), norm(b)].sort().join("|");

if (!TOKEN) keep("FOOTBALL_DATA_TOKEN secret not set");

// carry over the odds cache from the previous file so we don't re-fetch every run
let prior = null;
try { if (existsSync(OUT)) prior = JSON.parse(readFileSync(OUT, "utf8")); } catch {}

try {
  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": TOKEN }
  });
  if (!res.ok) keep("football-data responded " + res.status);
  const data = await res.json();

  const nm = m => (m && (m.name || m.shortName)) || "";

  const matches = (data.matches || [])
    .filter(m => m.status === "FINISHED" && m.score && m.score.winner && m.score.winner !== "DRAW")
    .map(m => ({
      stage: m.stage || "", home: nm(m.homeTeam), away: nm(m.awayTeam),
      winner: m.score.winner === "HOME_TEAM" ? nm(m.homeTeam) : nm(m.awayTeam)
    }))
    .filter(m => m.home && m.away && m.winner);

  let upcoming = (data.matches || [])
    .filter(m => ["SCHEDULED","TIMED","IN_PLAY","PAUSED"].includes(m.status) && m.utcDate)
    .map(m => {
      const live = m.status === "IN_PLAY" || m.status === "PAUSED";
      const ft = (m.score && m.score.fullTime) ? m.score.fullTime : null;
      const fdOdds = (m.odds && typeof m.odds.homeWin === "number")
        ? { h: m.odds.homeWin, d: m.odds.draw, a: m.odds.awayWin } : null;
      return {
        date: m.utcDate, status: m.status, stage: m.stage || "",
        home: nm(m.homeTeam), away: nm(m.awayTeam),
        score: live ? { h: (ft && ft.home != null) ? ft.home : 0, a: (ft && ft.away != null) ? ft.away : 0 } : null,
        odds: fdOdds
      };
    })
    .filter(m => m.home && m.away)
    .sort((a,b) => new Date(a.date) - new Date(b.date));

  // ---- optional: odds from The Odds API, throttled + cached ----
  let oddsMap = (prior && prior.oddsCache && prior.oddsCache.byPair) || {};
  let oddsAt  = (prior && prior.oddsCache && prior.oddsCache.fetchedAt) || null;
  const hoursSince = oddsAt ? (Date.now() - new Date(oddsAt)) / 3.6e6 : Infinity;

  if (ODDS_KEY && hoursSince >= ODDS_MIN_INTERVAL_H) {
    try {
      const url = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/?apiKey=${ODDS_KEY}&regions=uk&markets=h2h&oddsFormat=decimal`;
      const r = await fetch(url);
      if (r.ok) {
        const events = await r.json();
        const map = {};
        for (const e of (events || [])) {
          const bk = e.bookmakers && e.bookmakers[0]; if (!bk) continue;
          const mk = bk.markets && bk.markets.find(x => x.key === "h2h"); if (!mk) continue;
          let h=null, d=null, a=null;
          for (const o of mk.outcomes) {
            if (norm(o.name) === norm(e.home_team)) h = o.price;
            else if (norm(o.name) === norm(e.away_team)) a = o.price;
            else d = o.price; // "Draw"
          }
          if (h != null && a != null) map[pairKey(e.home_team, e.away_team)] = { h, d, a };
        }
        if (Object.keys(map).length) { oddsMap = map; oddsAt = new Date().toISOString(); }
        console.log(`Odds API: ${Object.keys(map).length} priced events (remaining: ${r.headers.get("x-requests-remaining")||"?"})`);
      } else { console.error("Odds API responded", r.status); }
    } catch (e) { console.error("Odds fetch failed:", String(e)); }
  } else if (ODDS_KEY) {
    console.log(`Odds: using cache (last fetch ${hoursSince.toFixed(1)}h ago).`);
  }

  // attach odds (football-data odds win if ever present, else The Odds API by team pair)
  upcoming = upcoming.map(m => ({ ...m, odds: m.odds || oddsMap[pairKey(m.home, m.away)] || null }));

  const out = {
    updated: new Date().toISOString(), source: "football-data.org", matches, upcoming,
    oddsCache: { fetchedAt: oddsAt, byPair: oddsMap }
  };
  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${matches.length} finished + ${upcoming.length} upcoming to ${OUT}`);
} catch (e) {
  keep(String(e));
}
