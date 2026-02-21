# SEO & Marketing Analysis MCP Server

[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/runtime-Bun-black)](https://bun.sh)

AI-powered SEO and marketing intelligence tools via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io). Give your AI assistant the ability to research keywords, analyze SERPs, check backlinks, and optimize content for search engines — all in real time.

## Tools

| Tool | Description |
|------|-------------|
| `keyword_research` | Research keyword opportunities — search volume indicators, difficulty, related terms, content suggestions |
| `analyze_serp` | Analyze search engine results — top ranking pages, content patterns, ranking opportunity assessment |
| `check_backlinks` | Analyze backlink profile — referring domains, anchor text, link quality, link building opportunities |
| `optimize_content` | On-page SEO analysis — keyword density, readability, structure, meta tags, improvement suggestions |

## Quick Start (Hosted)

**No installation required.** Use the hosted version:

1. Get a free API key at [seo.ezbizservices.com/signup](https://seo.ezbizservices.com/signup)
2. Add to your MCP client config (Claude Desktop, Cursor, etc.):

```json
{
  "mcpServers": {
    "seo-marketing": {
      "url": "https://seo.ezbizservices.com/mcp",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}
```

3. Ask your AI assistant to analyze any keyword or website!

### Example Prompts

- "Research keyword opportunities for 'AI consulting services'"
- "Analyze the SERP for 'best CRM software 2026'"
- "Check the backlink profile for example.com"
- "Optimize the SEO for my homepage targeting 'business automation'"

## Self-Hosting

```bash
git clone https://github.com/sjcripps/mcp-seo-marketing.git
cd mcp-seo-marketing
bun install

cp .env.example .env
# Edit .env with your OpenAI API key and admin secret

bun run server.ts
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI-powered analysis |
| `ADMIN_SECRET` | Yes | Secret for admin API endpoints |
| `MCP_PORT` | No | Server port (default: 4201) |

## Pricing

| Tier | Price | Requests/Month |
|------|-------|----------------|
| **Free** | $0 | 10 |
| Starter | $19/mo | 200 |
| Pro | $49/mo | 1,000 |
| Business | $99/mo | 5,000 |

Start free at [seo.ezbizservices.com](https://seo.ezbizservices.com)

## Architecture

- **Runtime:** [Bun](https://bun.sh)
- **Protocol:** [MCP SDK](https://www.npmjs.com/package/@modelcontextprotocol/sdk) (Streamable HTTP transport)
- **AI:** OpenAI GPT-4o for analysis
- **Scraping:** Cheerio for web data extraction
- **Auth:** API key-based with tiered rate limiting

## Links

- **Homepage:** [seo.ezbizservices.com](https://seo.ezbizservices.com)
- **API Docs:** [seo.ezbizservices.com/docs](https://seo.ezbizservices.com/docs)
- **Sign Up:** [seo.ezbizservices.com/signup](https://seo.ezbizservices.com/signup)
- **Server Card:** [seo.ezbizservices.com/.well-known/mcp/server-card.json](https://seo.ezbizservices.com/.well-known/mcp/server-card.json)

## License

MIT — see [LICENSE](LICENSE)
