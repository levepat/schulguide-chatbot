import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCacheSimulator } from "./cacheSimulator.ts";
import { countUserTurns, effectiveEffort, validationError } from "./inspectRequest.ts";
import type { MessagesRequest } from "./requestTypes.ts";
import { buildReplyEvents, encodeSse } from "./sse.ts";

export const VALID_KEY = "sk-ant-test-valid";
const MODEL = "claude-sonnet-5-5";

const ERROR_TYPES: Record<number, string> = {
  400: "invalid_request_error",
  401: "authentication_error",
  404: "not_found_error",
  429: "rate_limit_error",
  500: "api_error",
  529: "overloaded_error",
};

interface LastRequest {
  headers: IncomingMessage["headers"];
  body: unknown;
}

function corsHeaders(req: IncomingMessage): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": req.headers["access-control-request-headers"] ?? "*",
    "access-control-expose-headers": "request-id",
    "access-control-max-age": "600",
  };
}

function sendJson(req: IncomingMessage, res: ServerResponse, status: number, body: unknown, extra: Record<string, string> = {}) {
  res.writeHead(status, { ...corsHeaders(req), "content-type": "application/json", "request-id": "req_fake", ...extra });
  res.end(JSON.stringify(body));
}

function sendError(req: IncomingMessage, res: ServerResponse, status: number, message: string, extra: Record<string, string> = {}) {
  sendJson(
    req,
    res,
    status,
    { type: "error", error: { type: ERROR_TYPES[status] ?? "api_error", message }, request_id: "req_fake" },
    extra,
  );
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

function parseJson(text: string): unknown {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function apiKeyOf(req: IncomingMessage): string | undefined {
  const header = req.headers["x-api-key"];
  if (typeof header === "string") return header;
  return req.headers.authorization?.replace(/^Bearer\s+/i, "");
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

export interface FakeServerOptions {
  chunkDelayMs?: number;
}

export function createFakeServer(options: FakeServerOptions = {}): Server {
  const cache = createCacheSimulator();
  let lastRequest: LastRequest | null = null;
  let failNext: number | null = null;

  async function handleMessages(req: IncomingMessage, res: ServerResponse) {
    const body = parseJson(await readBody(req));
    lastRequest = { headers: req.headers, body };

    if (failNext !== null) {
      const status = failNext;
      failNext = null;
      sendError(req, res, status, `Injected failure with status ${status}`, { "x-should-retry": "false" });
      return;
    }
    if (apiKeyOf(req) !== VALID_KEY) {
      sendError(req, res, 401, "invalid x-api-key");
      return;
    }
    if (!isObject(body) || !Array.isArray(body.messages)) {
      sendError(req, res, 400, "messages: Field required");
      return;
    }
    const request = body as MessagesRequest;
    const betaHeader = req.headers["anthropic-beta"];
    const problem = validationError(request, Array.isArray(betaHeader) ? betaHeader.join(",") : betaHeader);
    if (problem) {
      sendError(req, res, 400, problem);
      return;
    }

    const effort = effectiveEffort(request);
    const events = buildReplyEvents({
      turn: countUserTurns(request),
      effort,
      withThinking: request.thinking?.display === "summarized" && ["high", "xhigh", "max"].includes(effort),
      usage: cache.simulate(request),
      model: request.model ?? MODEL,
      chunkDelayMs: options.chunkDelayMs,
    });

    let closed = false;
    res.on("close", () => {
      closed = true;
    });
    res.writeHead(200, {
      ...corsHeaders(req),
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
      "request-id": "req_fake",
    });
    for (const event of events) {
      if (closed) return;
      if (event.delayMs > 0) await sleep(event.delayMs);
      res.write(encodeSse(event.event, event.data));
    }
    res.end();
  }

  async function handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? "/", "http://localhost");
    const route = `${req.method} ${url.pathname}`;

    if (req.method === "OPTIONS") {
      res.writeHead(204, corsHeaders(req));
      res.end();
      return;
    }

    switch (route) {
      case "GET /v1/models":
        if (apiKeyOf(req) !== VALID_KEY) {
          sendError(req, res, 401, "invalid x-api-key");
          return;
        }
        sendJson(req, res, 200, {
          data: [{ type: "model", id: MODEL, display_name: "Claude Sonnet 5.5", created_at: "2026-09-01T00:00:00Z" }],
          has_more: false,
          first_id: MODEL,
          last_id: MODEL,
        });
        return;
      case "POST /v1/messages":
        await handleMessages(req, res);
        return;
      case "GET /__last-request":
        sendJson(req, res, 200, lastRequest ?? { headers: null, body: null });
        return;
      case "POST /__reset":
        await readBody(req);
        cache.reset();
        lastRequest = null;
        failNext = null;
        res.writeHead(204, corsHeaders(req));
        res.end();
        return;
      case "POST /__fail-next": {
        const body = parseJson(await readBody(req));
        const status = isObject(body) && typeof body.status === "number" ? body.status : null;
        if (status === null || status < 400) {
          sendError(req, res, 400, "body must be { status: number >= 400 }");
          return;
        }
        failNext = status;
        res.writeHead(204, corsHeaders(req));
        res.end();
        return;
      }
      default:
        sendError(req, res, 404, `Not found: ${route}`);
    }
  }

  return createServer((req, res) => {
    handle(req, res).catch((error: unknown) => {
      if (!res.headersSent) sendError(req, res, 500, String(error));
      else res.end();
    });
  });
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.env.FAKE_PORT ?? 4010);
  createFakeServer().listen(port, () => {
    console.log(`Fake Anthropic API listening on http://localhost:${port}`);
  });
}
