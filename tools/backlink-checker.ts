import { searchWeb, fetchPage } from "../lib/scraper";
import { analyze } from "../lib/openai";
import { log } from "../lib/logger";

export interface CheckBacklinksInput {
  url: string;
  competitor_urls?: string;
}

export async function checkBacklinks(
  input: CheckBacklinksInput
): Promise<string> {
  const { url, competitor_urls } = input;
  await log("info", "Starting backlink analysis", { url });

  // Extract domain from URL
  let domain: string;
  try {
    domain = new URL(url).hostname;
  } catch {
    return `Invalid URL: ${url}. Please provide a full URL like https://example.com`;
  }

  // Step 1: Search for backlinks and mentions of the target site
  const queries = [
    `"${domain}" -site:${domain}`,
    `link:${domain}`,
    `"${domain}" review mention`,
    `inurl:${domain} -site:${domain}`,
  ];

  const allResults: { title: string; url: string; snippet: string }[] = [];
  for (const q of queries) {
    const results = await searchWeb(q, 8);
    allResults.push(...results);
  }

  // Deduplicate by domain
  const seen = new Set<string>();
  seen.add(domain); // Exclude self
  const mentions = allResults.filter((r) => {
    try {
      const d = new URL(r.url).hostname;
      if (seen.has(d)) return false;
      seen.add(d);
      return true;
    } catch {
      return false;
    }
  });

  // Step 2: Fetch the target site
  const targetPage = await fetchPage(url).catch(() => null);

  // Step 3: Analyze some referring pages
  const refPages = await Promise.all(
    mentions.slice(0, 5).map(async (m) => {
      const page = await fetchPage(m.url).catch(() => null);
      return {
        url: m.url,
        title: m.title,
        snippet: m.snippet,
        hasLinkToTarget: page
          ? page.links.some((l) => l.href.includes(domain))
          : null,
        anchorText: page
          ? page.links
              .filter((l) => l.href.includes(domain))
              .map((l) => l.text)
              .slice(0, 3)
          : [],
        domainAuthIndicators: page
          ? {
              hasSSL: page.hasSSL,
              hasSchema: page.schemaOrg.length > 0,
              loadTimeMs: page.loadTimeMs,
            }
          : null,
      };
    })
  );

  // Step 4: Analyze competitor backlinks if provided
  let competitorData: any[] = [];
  if (competitor_urls) {
    const competitors = competitor_urls
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 3);

    for (const compUrl of competitors) {
      try {
        const compDomain = new URL(compUrl).hostname;
        const compResults = await searchWeb(
          `"${compDomain}" -site:${compDomain}`,
          5
        );
        competitorData.push({
          url: compUrl,
          domain: compDomain,
          mentionsFound: compResults.length,
          topMentions: compResults.slice(0, 3).map((r) => ({
            title: r.title,
            url: r.url,
            snippet: r.snippet,
          })),
        });
      } catch {}
    }
  }

  // Step 5: AI analysis
  const report = await analyze(
    `You are an expert SEO backlink analyst. Analyze the backlink profile and link building opportunities for a website.

Structure your report as:
## Backlink Analysis: [domain]

### Current Backlink Profile
- Estimated referring domains found
- Link quality assessment (high/medium/low quality sites)
- Anchor text patterns
- Link types (editorial, directory, social, forum, etc.)

### Referring Domains Analysis
For each confirmed referring domain:
- Domain quality indicators
- Link context (where on the page, in what content)
- Anchor text used
- Follow/nofollow likelihood

${competitor_urls ? `### Competitor Comparison
- How competitors' backlink profiles compare
- Links competitors have that the target doesn't
- Shared linking domains` : ""}

### Link Building Opportunities
- 5-7 specific link building strategies for this site
- Potential outreach targets based on competitor links
- Content types that attract links in this niche
- Quick wins (directories, profiles, mentions without links)

### Risk Assessment
- Any potentially toxic or spammy referring domains
- Over-optimization of anchor text
- Link velocity concerns

Be specific and reference actual data from the analysis.`,
    `Target URL: ${url}
Domain: ${domain}

Target Site Info:
${targetPage ? `- Title: ${targetPage.title}\n- Description: ${targetPage.description}\n- SSL: ${targetPage.hasSSL}\n- Load time: ${targetPage.loadTimeMs}ms` : "Could not fetch target site"}

Mentions/Backlinks Found (${mentions.length} unique domains):
${mentions.map((m) => `- ${m.title} (${m.url}): ${m.snippet}`).join("\n")}

Referring Page Analysis:
${JSON.stringify(refPages, null, 2)}

${competitorData.length > 0 ? `Competitor Analysis:\n${JSON.stringify(competitorData, null, 2)}` : ""}

Provide a detailed backlink analysis with actionable link building recommendations.`,
    3000
  );

  await log("info", "Backlink analysis complete", {
    domain,
    mentions_found: mentions.length,
    competitors_analyzed: competitorData.length,
  });

  return report;
}
