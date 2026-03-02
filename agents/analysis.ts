#!/usr/bin/env npx tsx
import { runAgent, parseCLIFlags, type AgentConfig } from "./runner.ts";
import type { AnalysisReport } from "./types.ts";

const DEFAULT_MODEL = "claude-sonnet-4-6";

const systemPrompt = `You are a senior security engineer and code analyst reviewing the SOCC Dashboard codebase.

Your job is to perform a thorough code analysis covering:

1. **Security Issues** (SQL injection, XSS, auth bypass, insecure crypto, SSRF, path traversal, command injection)
2. **Anti-Patterns** (error swallowing, race conditions, memory leaks, improper async handling, hardcoded secrets)
3. **Refactoring Opportunities** (code duplication, overly complex functions, poor separation of concerns, missing types)

## Analysis Order
Start with the most security-sensitive areas:
1. \`server/\` — Express routes, middleware, database queries, auth logic
2. \`src/auth/\` — Authentication adapters, JWT handling, session management
3. \`src/hooks/\` and \`src/utils/\` — Shared utilities and data fetching
4. \`src/components/\` — React components (focus on user input handling, dangerouslySetInnerHTML, etc.)

## Guidelines
- Read actual source files; do not guess at contents
- Provide specific file paths and line numbers for every finding
- Classify each finding by severity (critical/high/medium/low/info)
- Include actionable suggestions with code-level detail
- Focus on real, exploitable issues — avoid theoretical concerns
- Populate securityFindings, antiPatterns, and refactorOpportunities arrays with categorized findings
- The findings array should contain ALL findings combined`;

const taskPrompt = `Analyze the SOCC Dashboard codebase for security vulnerabilities, anti-patterns, and refactoring opportunities.

Use Glob to discover files, Read to examine them, and Grep to search for patterns across the codebase.

Start by understanding the project structure, then systematically review each area in priority order.

Return your analysis as a structured JSON report.`;

const config: AgentConfig = {
  name: "analysis",
  systemPrompt,
  taskPrompt,
  allowedTools: ["Read", "Glob", "Grep"],
  permissionMode: "default",
  defaultModel: DEFAULT_MODEL,
};

const flags = parseCLIFlags({ model: DEFAULT_MODEL });
const report = await runAgent(config, flags) as AnalysisReport;

if (report.securityFindings?.length) {
  console.log(`\n  Security: ${report.securityFindings.length} findings`);
}
if (report.antiPatterns?.length) {
  console.log(`  Anti-patterns: ${report.antiPatterns.length} findings`);
}
if (report.refactorOpportunities?.length) {
  console.log(`  Refactor: ${report.refactorOpportunities.length} opportunities`);
}
