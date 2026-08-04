# mcp-metals-api

Metals API MCP — wraps Metals-API (metals-api.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_latest` | Get the latest precious and base metal spot prices (gold, silver, platinum, palladium, copper, etc.). Prices are per troy ounce. Optionally specify base currency and metal symbols. |
| `get_historical` | Get metal prices for a specific historical date. Returns spot prices per troy ounce for that day. Useful for tracking price changes or computing returns. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "metals-api": {
      "url": "https://gateway.pipeworx.io/metals-api/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Metals Api data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
