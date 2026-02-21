import { searchWeb, fetchPage } from "../lib/scraper";
import { analyze } from "../lib/openai";
import { log } from "../lib/logger";

export interface OptimizeContentInput {
  url: string;
  target_keyword: string;
}

export async function optimizeContent(
  input: OptimizeContentInput
): Promise<string> {
  const { url, target_keyword } = input;
  await log("info", "Starting content optimization", { url, target_keyword });

  // Step 1: Fetch and analyze the target page
  const targetPage = await fetchPage(url).catch(() => null);

  if (!targetPage || targetPage.error) {
    return `Could not fetch ${url}: ${targetPage?.error || "Unknown error"}. Make sure the URL is accessible.`;
  }

  // Step 2: Search for the target keyword to see what ranks
  const serpResults = await searchWeb(target_keyword, 8);

  // Step 3: Fetch top-ranking competitor pages for comparison
  const competitorPages = await Promise.all(
    serpResults.slice(0, 4).map(async (r) => {
      if (r.url === url) return null; // Skip self
      const page = await fetchPage(r.url).catch(() => null);
      return page
        ? {
            url: r.url,
            title: page.title,
            description: page.description,
            h1: page.h1.slice(0, 2),
            h2: page.h2,
            wordCount: page.textContent.split(/\s+/).length,
            images: page.images,
            hasSchema: page.schemaOrg.length > 0,
            loadTimeMs: page.loadTimeMs,
          }
        : null;
    })
  );

  const validCompetitors = competitorPages.filter(Boolean);

  // Step 4: Calculate on-page SEO metrics
  const wordCount = targetPage.textContent.split(/\s+/).length;
  const keywordLower = target_keyword.toLowerCase();
  const textLower = targetPage.textContent.toLowerCase();
  const titleLower = targetPage.title.toLowerCase();

  // Keyword occurrences
  const escapedKw = keywordLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keywordCount = (textLower.match(new RegExp(escapedKw, "g")) || []).length;
  const keywordDensity = wordCount > 0 ? ((keywordCount / wordCount) * 100).toFixed(2) : "0";

  // Title analysis
  const keywordInTitle = titleLower.includes(keywordLower);
  const titleLength = targetPage.title.length;

  // Meta description analysis
  const descLength = targetPage.description.length;
  const keywordInDesc = targetPage.description.toLowerCase().includes(keywordLower);

  // Heading analysis
  const keywordInH1 = targetPage.h1.some((h) =>
    h.toLowerCase().includes(keywordLower)
  );
  const keywordInH2 = targetPage.h2.some((h) =>
    h.toLowerCase().includes(keywordLower)
  );

  // Internal/external links
  const internalLinks = targetPage.links.filter((l) => {
    try {
      return new URL(l.href, url).hostname === new URL(url).hostname;
    } catch {
      return l.href.startsWith("/") || l.href.startsWith("#");
    }
  });
  const externalLinks = targetPage.links.filter((l) => {
    try {
      return (
        l.href.startsWith("http") &&
        new URL(l.href).hostname !== new URL(url).hostname
      );
    } catch {
      return false;
    }
  });

  const onPageMetrics = {
    wordCount,
    keywordCount,
    keywordDensity: `${keywordDensity}%`,
    titleLength,
    keywordInTitle,
    descriptionLength: descLength,
    keywordInDescription: keywordInDesc,
    h1Tags: targetPage.h1,
    keywordInH1,
    h2Tags: targetPage.h2,
    keywordInH2,
    imageCount: targetPage.images,
    hasSSL: targetPage.hasSSL,
    loadTimeMs: targetPage.loadTimeMs,
    internalLinks: internalLinks.length,
    externalLinks: externalLinks.length,
    hasSchemaMarkup: targetPage.schemaOrg.length > 0,
    ogTags: targetPage.ogTags,
    metaTags: targetPage.metaTags,
  };

  // Step 5: AI analysis
  const report = await analyze(
    `You are an expert on-page SEO optimizer. Analyze the page and provide detailed optimization recommendations.

Structure your report as:
## Content Optimization: [target keyword]
**Page:** [url]

### SEO Score: X/100
Give an overall score based on the metrics below.

### Title Tag Analysis
- Current title, character count, keyword presence
- Specific recommended title (aim for 50-60 chars, keyword near front)

### Meta Description Analysis
- Current description, character count, keyword presence
- Specific recommended meta description (150-160 chars, compelling CTA)

### Content Analysis
- Word count vs competitor average
- Keyword density assessment (target 1-2%)
- Content structure quality (headings, paragraphs, lists)
- Readability assessment

### Heading Structure
- H1 analysis (should be exactly 1, include keyword)
- H2 structure (logical flow, keyword variations)
- Recommended heading structure

### Technical SEO
- SSL status
- Page load time assessment
- Schema markup status
- Image optimization (alt tags, count)

### Internal & External Linking
- Internal link count and quality
- External link count and quality
- Recommended links to add

### Competitor Comparison
- How this page compares to top-ranking pages
- Content gaps vs competitors
- Unique advantages

### Priority Action Items
Numbered list of specific changes, ordered by impact:
1. [Highest impact change]
2. [Next highest]
...

Be extremely specific. Don't say "improve title" — say exactly what the new title should be.`,
    `Target URL: ${url}
Target Keyword: "${target_keyword}"

Current Page Metrics:
${JSON.stringify(onPageMetrics, null, 2)}

Page Content Preview (first 2000 chars):
${targetPage.textContent.slice(0, 2000)}

Competitor Pages Ranking for "${target_keyword}":
${JSON.stringify(validCompetitors, null, 2)}

SERP Context:
${serpResults.map((r) => `- [${r.title}](${r.url}): ${r.snippet}`).join("\n")}

Provide a detailed content optimization report with specific, actionable recommendations.`,
    3500
  );

  await log("info", "Content optimization complete", {
    url,
    target_keyword,
    seo_metrics: { wordCount, keywordDensity, keywordInTitle, titleLength },
  });

  return report;
}
