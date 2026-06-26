interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Metals API MCP — wraps Metals-API (metals-api.com)
 *
 * BYO key: requires an API key from https://metals-api.com/
 * Passed via _apiKey parameter. Free tier: 50 requests/month.
 *
 * Tools:
 * - get_latest: get latest precious/base metal prices
 * - get_historical: get metal prices for a specific date
 */


const BASE = 'https://metals-api.com/api';

// ── Helpers ───────────────────────────────────────────────────────────

function extractKey(args: Record<string, unknown>): string {
  const key = args._apiKey as string;
  delete args._apiKey;
  if (!key) throw new Error('Metals-API key required. Get one at https://metals-api.com/ and pass via _apiKey.');
  return key;
}

async function metalsGet(apiKey: string, path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('access_key', apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Metals-API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  if (data.success === false) {
    const err = data.error as { info?: string; type?: string } | undefined;
    throw new Error(`Metals-API error: ${err?.info ?? err?.type ?? 'Unknown error'}`);
  }

  return data;
}

// ── Tool definitions ──────────────────────────────────────────────────

const tools: McpToolExport['tools'] = [
  {
    name: 'get_latest',
    description:
      'Get the latest precious and base metal spot prices (gold, silver, platinum, palladium, copper, etc.). Prices are per troy ounce. Optionally specify base currency and metal symbols.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'Metals-API key' },
        base: {
          type: 'string',
          description: 'Base currency (default "USD"). E.g., "EUR", "GBP"',
        },
        symbols: {
          type: 'string',
          description: 'Comma-separated metal symbols to filter (e.g., "XAU,XAG,XPT"). XAU=gold, XAG=silver, XPT=platinum, XPD=palladium, XCU=copper',
        },
      },
      required: ['_apiKey'],
    },
  },
  {
    name: 'get_historical',
    description:
      'Get metal prices for a specific historical date. Returns spot prices per troy ounce for that day. Useful for tracking price changes or computing returns.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'Metals-API key' },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (e.g., "2024-01-15")',
        },
        base: {
          type: 'string',
          description: 'Base currency (default "USD")',
        },
        symbols: {
          type: 'string',
          description: 'Comma-separated metal symbols (e.g., "XAU,XAG")',
        },
      },
      required: ['_apiKey', 'date'],
    },
  },
];

// ── callTool dispatcher ───────────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const key = extractKey(args);

  switch (name) {
    case 'get_latest':
      return getLatest(key, args.base as string | undefined, args.symbols as string | undefined);
    case 'get_historical':
      return getHistorical(key, args.date as string, args.base as string | undefined, args.symbols as string | undefined);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── Tool implementations ─────────────────────────────────────────────

async function getLatest(apiKey: string, base?: string, symbols?: string) {
  const params: Record<string, string> = {};
  if (base) params.base = base;
  if (symbols) params.symbols = symbols;

  const data = (await metalsGet(apiKey, '/latest', params)) as {
    success: boolean;
    base: string;
    date: string;
    rates: Record<string, number>;
    timestamp: number;
  };

  return {
    base: data.base,
    date: data.date,
    timestamp: data.timestamp,
    rates: data.rates,
  };
}

async function getHistorical(apiKey: string, date: string, base?: string, symbols?: string) {
  const params: Record<string, string> = {};
  if (base) params.base = base;
  if (symbols) params.symbols = symbols;

  const data = (await metalsGet(apiKey, `/${date}`, params)) as {
    success: boolean;
    base: string;
    date: string;
    rates: Record<string, number>;
    timestamp: number;
  };

  return {
    base: data.base,
    date: data.date,
    timestamp: data.timestamp,
    rates: data.rates,
  };
}

export default { tools, callTool, meter: { credits: 5 } } satisfies McpToolExport;
