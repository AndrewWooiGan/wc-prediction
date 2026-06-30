// Fetches finished 2026 World Cup matches from football-data.org and writes results.json.
// Run by GitHub Actions on a daily schedule. Node 20+ (global fetch).
// Fail-safe: on any error it exits 0 without breaking the workflow, leaving results.json as-is.
import { writeFileSync, readFileSync } from "node:fs";

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const OUT = "results.json";

function keep(existing, reason){
  console.warn("Keeping existing results.json:", reason);
  process.exit(0);
}

if (!TOKEN) keep(null, "FOOTBALL_DATA_TOKEN secret not set");

try {
  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": TOKEN }
  });
  if (!res.ok) keep(null, "API responded " + res.status);

  const data = await res.json();
  const matches = (data.matches || [])
    .filter(m => m.status === "FINISHED" && m.score && m.score.winner && m.score.winner !== "DRAW")
    .map(m => ({
      stage: m.stage || "",
      home: (m.homeTeam && (m.homeTeam.name || m.homeTeam.shortName)) || "",
      away: (m.awayTeam && (m.awayTeam.name || m.awayTeam.shortName)) || "",
      winner: m.score.winner === "HOME_TEAM"
        ? (m.homeTeam && (m.homeTeam.name || m.homeTeam.shortName))
        : (m.awayTeam && (m.awayTeam.name || m.awayTeam.shortName))
    }))
    .filter(m => m.home && m.away && m.winner);

  const out = { updated: new Date().toISOString(), source: "football-data.org", matches };
  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${matches.length} finished matches to ${OUT}`);
} catch (e) {
  keep(null, String(e));
}
