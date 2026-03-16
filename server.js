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
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const ROOT = __dirname;
const MAX_BODY_SIZE = 1_000_000;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        reject(new HttpError(413, "Request body too large."));
        req.destroy();
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function validateEntry(entry, categories, label) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new HttpError(422, `${label} entries must be objects.`);
  }

  if (!isFiniteNumber(entry.id)) {
    throw new HttpError(422, `${label} entry ids must be numbers.`);
  }

  if (typeof entry.title !== "string" || !entry.title.trim()) {
    throw new HttpError(422, `${label} entry titles are required.`);
  }

  if (!isFiniteNumber(entry.amount) || entry.amount <= 0) {
    throw new HttpError(422, `${label} entry amounts must be greater than zero.`);
  }

  if (typeof entry.category !== "string" || !categories.includes(entry.category)) {
    throw new HttpError(422, `${label} entry category is invalid.`);
  }

  if (typeof entry.date !== "string" || !DATE_PATTERN.test(entry.date)) {
    throw new HttpError(422, `${label} entry date must use YYYY-MM-DD.`);
  }
}

function validateSnapshot(snapshot) {
  const spendingCategories = ["Housing", "Food", "Transport", "Bills", "Fun", "Debt", "Health", "Travel", "Other"];
  const budgetCategories = [...spendingCategories, "Savings"];
  const incomeCategories = ["Fixed Salary", "Extra Income", "Other"];
  const savingsCategories = ["Emergency Fund", "General Savings", "Vacation Fund"];

  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new HttpError(400, "Request body must be a JSON object.");
  }

  if (typeof snapshot.month !== "string" || !MONTH_PATTERN.test(snapshot.month)) {
    throw new HttpError(422, "Month must use YYYY-MM format.");
  }

  if (!snapshot.budgets || typeof snapshot.budgets !== "object" || Array.isArray(snapshot.budgets)) {
    throw new HttpError(422, "Budgets must be an object.");
  }

  budgetCategories.forEach((category) => {
    const amount = snapshot.budgets[category];
    if (!isFiniteNumber(amount) || amount < 0) {
      throw new HttpError(422, `Budget for ${category} must be a non-negative number.`);
    }
  });

  if (!snapshot.totals || typeof snapshot.totals !== "object" || Array.isArray(snapshot.totals)) {
    throw new HttpError(422, "Totals must be an object.");
  }

  ["income", "spent", "saved", "remaining", "planned", "savingsGoal"].forEach((key) => {
    if (!isFiniteNumber(snapshot.totals[key])) {
      throw new HttpError(422, `Totals.${key} must be a number.`);
    }
  });

  if (!snapshot.spentByCategory || typeof snapshot.spentByCategory !== "object" || Array.isArray(snapshot.spentByCategory)) {
    throw new HttpError(422, "spentByCategory must be an object.");
  }

  spendingCategories.forEach((category) => {
    if (!isFiniteNumber(snapshot.spentByCategory[category]) || snapshot.spentByCategory[category] < 0) {
      throw new HttpError(422, `spentByCategory.${category} must be a non-negative number.`);
    }
  });

  if (!Array.isArray(snapshot.incomes) || !Array.isArray(snapshot.expenses) || !Array.isArray(snapshot.savingsActivities)) {
    throw new HttpError(422, "Income, expenses, and savingsActivities must be arrays.");
  }

  snapshot.incomes.forEach((entry) => validateEntry(entry, incomeCategories, "Income"));
  snapshot.expenses.forEach((entry) => validateEntry(entry, spendingCategories, "Expense"));
  snapshot.savingsActivities.forEach((entry) => validateEntry(entry, savingsCategories, "Savings"));

  if (!Array.isArray(snapshot.topCategories) || !Array.isArray(snapshot.overBudgetCategories)) {
    throw new HttpError(422, "topCategories and overBudgetCategories must be arrays.");
  }
}

function buildAnalysisPrompt(snapshot) {
  return JSON.stringify(snapshot, null, 2);
}

async function analyzeBudget(snapshot) {
  if (!OPENAI_API_KEY) {
    throw new HttpError(500, "Missing OPENAI_API_KEY. Add it to your environment before running the server.");
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
        "Treat savings activity separately from expenses and compare savings progress to the savings goal.",
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
              risks: { type: "array", items: { type: "string" } },
              actions: { type: "array", items: { type: "string" } },
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
    throw new HttpError(502, message);
  }

  const outputText = payload.output_text;
  if (!outputText) {
    throw new HttpError(502, "The model did not return analysis text.");
  }

  try {
    return JSON.parse(outputText);
  } catch (error) {
    throw new HttpError(502, "The model returned invalid JSON.");
  }
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

async function handleAnalyzeBudget(req, res) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("application/json")) {
    sendJson(res, 415, { error: "Content-Type must be application/json." });
    return;
  }

  try {
    const body = await readBody(req);

    let snapshot;
    try {
      snapshot = JSON.parse(body || "{}");
    } catch (error) {
      throw new HttpError(400, "Request body must contain valid JSON.");
    }

    validateSnapshot(snapshot);
    const analysis = await analyzeBudget(snapshot);
    sendJson(res, 200, { analysis });
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    sendJson(res, statusCode, { error: error.message || "Unexpected server error." });
  }
}

function handlePublicConfig(res) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    sendJson(res, 500, {
      error: "Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY. Add them to the environment before running the app.",
    });
    return;
  }

  sendJson(res, 200, {
    supabaseUrl: SUPABASE_URL,
    supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY,
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/api/config") {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      sendJson(res, 405, { error: "Method not allowed." });
      return;
    }

    handlePublicConfig(res);
    return;
  }

  if (req.url === "/api/analyze-budget") {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      sendJson(res, 405, { error: "Method not allowed." });
      return;
    }

    await handleAnalyzeBudget(req, res);
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
});

server.listen(PORT, () => {
  console.log(`Budget app running at http://localhost:${PORT}`);
});
