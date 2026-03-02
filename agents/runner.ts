import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import type { AgentReport } from "./types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

// Load .env file from project root if it exists
function loadEnv() {
  const envPath = join(PROJECT_ROOT, ".env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    // Don't override existing env vars
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
loadEnv();

export interface AgentConfig {
  name: string;
  systemPrompt: string;
  taskPrompt: string;
  allowedTools: string[];
  permissionMode: "default" | "plan" | "acceptEdits" | "dontAsk" | "bypassPermissions";
  defaultModel: string;
}

export interface CLIFlags {
  verbose: boolean;
  save: boolean;
  model: string;
  focus: string | null;
  maxTurns: number;
}

export function parseCLIFlags(defaults: { model: string }): CLIFlags {
  const args = process.argv.slice(2);
  const flags: CLIFlags = {
    verbose: false,
    save: false,
    model: defaults.model,
    focus: null,
    maxTurns: 30,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--verbose":
      case "-v":
        flags.verbose = true;
        break;
      case "--save":
      case "-s":
        flags.save = true;
        break;
      case "--model":
      case "-m":
        flags.model = args[++i];
        break;
      case "--focus":
      case "-f":
        flags.focus = args[++i];
        break;
      case "--max-turns":
      case "-t":
        flags.maxTurns = parseInt(args[++i], 10);
        break;
    }
  }

  return flags;
}

export function loadClaudeMd(): string {
  try {
    return readFileSync(join(PROJECT_ROOT, "CLAUDE.md"), "utf-8");
  } catch {
    return "";
  }
}

export function buildSystemPrompt(agentPrompt: string, claudeMd: string): string {
  const parts: string[] = [];

  if (claudeMd) {
    parts.push(
      "# Project Context (from CLAUDE.md)\n\n" + claudeMd,
    );
  }

  parts.push(agentPrompt);

  parts.push(
    "\n# Output Requirements — CRITICAL\n\n" +
    "When you have completed your analysis, your FINAL message must contain ONLY a raw JSON object.\n" +
    "Rules:\n" +
    "- NO markdown, NO backticks, NO prose before or after the JSON\n" +
    "- The JSON object must start with { and end with }\n" +
    "- Do NOT summarize findings as text — put everything inside the JSON structure\n" +
    "- Required top-level keys: agent (string), summary (string), findings (array of objects), stats (object)\n" +
    "- Each finding must have: severity, category, file, line, title, description, suggestion\n" +
    "- If you output anything other than raw JSON as your final message, the report will fail to parse"
  );

  return parts.join("\n\n---\n\n");
}

/** Try to extract JSON from a result string that may have markdown fences or surrounding text */
function extractJson(text: string): string {
  // Try raw parse first
  try {
    JSON.parse(text);
    return text;
  } catch { /* continue */ }

  // Try extracting from markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Try finding the outermost { ... } block
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return text;
}

export async function runAgent(config: AgentConfig, flags: CLIFlags): Promise<AgentReport> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
    process.exit(1);
  }

  // Allow running from within a Claude Code session (e.g. spawned by the SDK)
  delete process.env.CLAUDECODE;

  const claudeMd = loadClaudeMd();
  const systemPrompt = buildSystemPrompt(config.systemPrompt, claudeMd);

  const taskPrompt = flags.focus
    ? `${config.taskPrompt}\n\nFocus your analysis on: ${flags.focus}`
    : config.taskPrompt;

  const startTime = Date.now();
  let turns = 0;
  let resultText = "";
  let lastAssistantText = "";

  if (flags.verbose) {
    console.log(`\n[${config.name}] Starting agent...`);
    console.log(`  Model: ${flags.model}`);
    console.log(`  Max turns: ${flags.maxTurns}`);
    console.log(`  Permission mode: ${config.permissionMode}`);
    if (flags.focus) console.log(`  Focus: ${flags.focus}`);
    console.log("");
  }

  for await (const message of query({
    prompt: taskPrompt,
    options: {
      cwd: PROJECT_ROOT,
      allowedTools: config.allowedTools,
      permissionMode: config.permissionMode,
      systemPrompt,
      model: flags.model,
      maxTurns: flags.maxTurns,
    },
  })) {
    if ("result" in message) {
      resultText = message.result;
    }

    // Track the last assistant text as a fallback for result extraction
    if (message.type === "assistant" && message.message) {
      const content = message.message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "text" && block.text) {
            lastAssistantText = block.text;
            if (flags.verbose) {
              turns++;
              process.stderr.write(`  [turn ${turns}] ${block.text.slice(0, 120)}...\n`);
            }
          } else if (block.type === "tool_use" && flags.verbose) {
            turns++;
            process.stderr.write(`  [turn ${turns}] Tool: ${block.name}\n`);
          }
        }
      }
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Use resultText if available, otherwise try the last assistant message
  const rawResult = resultText || lastAssistantText;
  const jsonText = extractJson(rawResult);

  let report: AgentReport;
  try {
    const parsed = JSON.parse(jsonText);
    // Normalize: ensure required fields exist
    report = {
      agent: parsed.agent || config.name,
      summary: typeof parsed.summary === "string"
        ? parsed.summary
        : JSON.stringify(parsed.summary || ""),
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      stats: parsed.stats || {},
      ...parsed,
    };
  } catch {
    console.error(`\n[${config.name}] Failed to parse agent output as JSON.`);
    if (flags.verbose) {
      console.error("Raw output (first 500 chars):", rawResult.slice(0, 500));
    }
    report = {
      agent: config.name,
      summary: rawResult || "Agent produced no output.",
      findings: [],
      stats: { parseError: 1 },
    };
  }

  // Print summary
  console.log(`\n[${config.name}] Complete in ${duration}s`);
  console.log(`  Findings: ${report.findings.length}`);

  const bySeverity: Record<string, number> = {};
  for (const f of report.findings) {
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
  }
  if (Object.keys(bySeverity).length > 0) {
    console.log(
      `  Severity: ${Object.entries(bySeverity)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`,
    );
  }

  if (report.stats && Object.keys(report.stats).length > 0) {
    console.log(`  Stats: ${JSON.stringify(report.stats)}`);
  }

  // Save report if requested
  if (flags.save) {
    const reportsDir = join(PROJECT_ROOT, "agents", "reports");
    mkdirSync(reportsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `${config.name}-${timestamp}.json`;
    const filepath = join(reportsDir, filename);
    writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`  Saved: ${filepath}`);
  }

  return report;
}
