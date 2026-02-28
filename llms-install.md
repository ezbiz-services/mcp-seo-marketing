# Installing SEO & Marketing MCP Server

This is a hosted MCP server — no local installation needed.

## Setup (30 seconds)

1. Get a free API key: https://seo.ezbizservices.com/signup
2. Add this to your MCP client configuration:

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

## Available Tools

- `keyword_research` — Keyword analysis with volume, difficulty, and opportunity scoring
- `serp_analysis` — Search results analysis with ranking patterns and featured snippets
- `backlink_check` — Backlink profile analysis with link quality scoring
- `content_optimizer` — On-page content optimization with actionable suggestions

## Requirements

- Any MCP-compatible client (Claude Desktop, Cursor, Cline, Windsurf, etc.)
- Free API key (no credit card required)
