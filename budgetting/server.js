const http = require("http");
const fs = require("fs");
const path = require("path");

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const envLines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  envLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

const PORT = Number(process.env.PORT) || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5";
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large."));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function buildAnalysisPrompt(snapshot) {
  return [
    JSON.stringify(snapshot, null, 2),
  ].join("\n");
}

async function analyzeBudget(snapshot) {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY. Add it to your environment before running the server.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      reasoning: { effort: "low" },
      instructions: [
        "You are a budgeting coach.",
        "Analyze the monthly budget snapshot and return concise, practical advice.",
        "Focus on overspending, savings opportunities, and realistic next steps.",
        "Do not mention being an AI.",
      ].join(" "),
      input: buildAnalysisPrompt(snapshot),
      text: {
        format: {
          type: "json_schema",
          strict: true,
          name: "budget_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              risks: {
                type: "array",
                items: { type: "string" },
              },
              actions: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["summary", "risks", "actions"],
          },
        },
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload.error?.message || "OpenAI request failed.";
    throw new Error(message);
  }

  const outputText = payload.output_text;
  if (!outputText) {
    throw new Error("The model did not return analysis text.");
  }

  return JSON.parse(outputText);
}

function serveStatic(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(ROOT, path.normalize(requestPath).replace(/^(\.\.[/\\])+/, ""));

  if (!filePath.startsWith(ROOT)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/analyze-budget") {
    try {
      const body = await readBody(req);
      const snapshot = JSON.parse(body || "{}");
      const analysis = await analyzeBudget(snapshot);
      sendJson(res, 200, { analysis });
    } catch (error) {
      sendJson(res, 500, { error: error.message || "Unexpected server error." });
    }
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
});

server.listen(PORT, () => {
  console.log(`Budget app running at http://localhost:${PORT}`);
});
