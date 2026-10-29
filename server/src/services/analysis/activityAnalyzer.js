// src/services/analysis/activityAnalyzer.js
import { parseISO, differenceInDays } from "date-fns";
/**
 * Analyze commit activity to produce raw metrics and a heuristic score.
 * Returns an object with measurements and a label.
 */
export function analyzeActivity(commits) {
  if (!commits || commits.length === 0) {
    return { measurements: {}, label: "No activity" };
  }

  // Sort commits by author date (ISO strings)
  const sorted = [...commits].sort((a, b) => new Date(a.author.date) - new Date(b.author.date));
  const firstDate = parseISO(sorted[0].author.date);
  const lastDate = parseISO(sorted[sorted.length - 1].author.date);
  const daysSinceLast = differenceInDays(new Date(), lastDate);

  // Compute average commits per week
  const totalWeeks = Math.max(1, differenceInDays(lastDate, firstDate) / 7);
  const avgPerWeek = commits.length / totalWeeks;

  // Detect long gaps (>30 days) between consecutive commits
  let longGaps = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseISO(sorted[i - 1].author.date);
    const curr = parseISO(sorted[i].author.date);
    if (differenceInDays(curr, prev) > 30) longGaps++;
  }

  // Simple scoring: lower activity and more gaps increase risk
  let score = 0;
  if (daysSinceLast > 180) score += 2;
  else if (daysSinceLast > 90) score += 1;

  if (avgPerWeek < 0.5) score += 1;
  if (longGaps > 2) score += 1;

  const label =
    score >= 3
      ? "Dormant Candidate"
      : score === 2
      ? "Quiet"
      : "Active";

  return {
    measurements: {
      firstCommit: firstDate.toISOString(),
      lastCommit: lastDate.toISOString(),
      daysSinceLast,
      avgCommitsPerWeek: avgPerWeek.toFixed(2),
      longGaps,
    },
    label,
  };
}

export const activityAnalyzer = { analyzeActivity };
