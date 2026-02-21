import { searchWeb, fetchPage } from "../lib/scraper";
import { analyze } from "../lib/openai";
import { log } from "../lib/logger";

export interface KeywordResearchInput {
  seed_keyword: string;
  industry?: string;
  location?: string;
}

export async function keywordResearch(
  input: KeywordResearchInput
): Promise<string> {
  const { seed_keyword, industry, location } = input;
  await log("info", "Starting keyword_research", { seed_keyword, industry });

  // Step 1: Search for keyword variations and related terms
  const locationStr = location ? ` ${location}` : "";
  const industryStr = industry ? ` ${industry}` : "";
  const queries = [
    `${seed_keyword}${industryStr}${locationStr}`,
    `${seed_keyword} alternatives related terms`,
    `best ${seed_keyword}${industryStr} 2026`,
    `${seed_keyword} tips guide how to`,
  ];

  const allResults: { title: string; url: string; snippet: string }[] = [];
  for (const q of queries) {
    const results = await searchWeb(q, 8);
    allResults.push(...results);
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = allResults.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  // Step 2: Fetch top-ranking pages to analyze content patterns
  const topPages = unique.slice(0, 6);
  const pages = await Promise.all(
    topPages.map((r) => fetchPage(r.url).catch(() => null))
  );

  const pageData = pages
    .filter(Boolean)
    .map((p) => ({
      url: p!.url,
      title: p!.title,
      description: p!.description,
      h1: p!.h1.slice(0, 3),
      h2: p!.h2.slice(0, 8),
      textPreview: p!.textContent.slice(0, 600),
    }));

  // Step 3: Compile search context
  const searchContext = unique
    .slice(0, 20)
    .map((r) => `- "${r.title}" — ${r.snippet}`)
    .join("\n");

  // Step 4: AI analysis for keyword opportunities
  const report = await analyze(
    `You are an expert SEO keyword researcher. Analyze the search results and page content to provide detailed keyword research.

Structure your report as:
## Keyword Research: [seed keyword]

### Primary Keyword Analysis
- Search intent (informational/commercial/transactional/navigational)
- Estimated competition level (low/medium/high) based on result quality
- Content type dominating results (blog posts, product pages, videos, etc.)

### Related Keywords & Variations
List 15-20 related keywords grouped by:
- Long-tail variations (3-5 words)
- Question-based keywords (what, how, why, best)
- Commercial intent keywords (buy, price, review, comparison)
- Informational keywords (guide, tutorial, tips)

### Content Gap Opportunities
Identify 3-5 topics where existing content is weak or missing.

### Content Strategy Recommendations
- Recommended content types to create
- Suggested article titles (5-7)
- Internal linking opportunities

Be specific and data-driven. Reference actual patterns you see in the search results.`,
    `Seed Keyword: ${seed_keyword}
${industry ? `Industry: ${industry}` : ""}
${location ? `Target Location: ${location}` : ""}

Search Results (${unique.length} total):\n${searchContext}

Top-Ranking Page Analysis:\n${JSON.stringify(pageData, null, 2)}

Provide a comprehensive keyword research report with actionable recommendations.`,
    3000
  );

  await log("info", "Keyword research complete", {
    seed_keyword,
    results_found: unique.length,
    pages_analyzed: pageData.length,
  });

  return report;
}
