import { searchWeb, fetchPage } from "../lib/scraper";
import { analyze } from "../lib/openai";
import { log } from "../lib/logger";

export interface AnalyzeSERPInput {
  query: string;
  num_results?: number;
}

export async function analyzeSERP(input: AnalyzeSERPInput): Promise<string> {
  const { query, num_results } = input;
  const limit = Math.min(num_results || 10, 10);
  await log("info", "Starting SERP analysis", { query, limit });

  // Step 1: Get search results
  const results = await searchWeb(query, limit);

  if (results.length === 0) {
    return `No search results found for "${query}". The query may be too specific or there may be a temporary search issue.`;
  }

  // Step 2: Fetch and analyze each result page
  const pages = await Promise.all(
    results.slice(0, limit).map(async (r, idx) => {
      const page = await fetchPage(r.url).catch(() => null);
      return {
        position: idx + 1,
        url: r.url,
        title: r.title,
        snippet: r.snippet,
        page: page
          ? {
              actualTitle: page.title,
              description: page.description,
              h1: page.h1.slice(0, 3),
              h2: page.h2.slice(0, 6),
              hasSSL: page.hasSSL,
              loadTimeMs: page.loadTimeMs,
              imageCount: page.images,
              metaTags: page.metaTags,
              ogTags: page.ogTags,
              schemaOrg: page.schemaOrg.length > 0,
              wordCount: page.textContent.split(/\s+/).length,
              textPreview: page.textContent.slice(0, 400),
            }
          : null,
      };
    })
  );

  // Step 3: AI analysis of SERP landscape
  const report = await analyze(
    `You are an expert SEO analyst. Analyze the search engine results page (SERP) for the given query.

Structure your report as:
## SERP Analysis: "[query]"

### Search Intent
- Primary intent type (informational/commercial/transactional/navigational)
- User expectations when searching this query

### Top Results Overview
For each of the top results, note:
- Domain authority indicators (is it a major brand, niche site, forum?)
- Content type (article, product page, video, tool, etc.)
- Title tag optimization quality
- Meta description effectiveness

### Content Patterns
- Average word count of ranking pages
- Common H1/H2 patterns
- Content structure patterns (listicles, how-tos, comparisons)
- Schema markup usage

### Technical Patterns
- SSL adoption rate
- Average page load time
- Mobile optimization indicators

### Ranking Opportunity Assessment
- Difficulty estimate (easy/medium/hard/very hard)
- Content gaps in current results
- Specific angle to take to compete
- Minimum content requirements to rank

### Actionable Recommendations
- Exact title tag to use
- Content outline (H2 structure)
- Key topics to cover
- Differentiation strategy

Be specific — reference actual data from the results.`,
    `Query: "${query}"

SERP Results (${pages.length} analyzed):\n${JSON.stringify(pages, null, 2)}

Provide a detailed SERP analysis with actionable ranking recommendations.`,
    3000
  );

  await log("info", "SERP analysis complete", {
    query,
    results_analyzed: pages.length,
  });

  return report;
}
