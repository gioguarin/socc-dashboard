#!/usr/bin/env npx tsx
import { runAgent, parseCLIFlags, type AgentConfig } from "./runner.ts";
import type { QAReport } from "./types.ts";

const DEFAULT_MODEL = "claude-sonnet-4-6";

const systemPrompt = `You are a senior QA engineer reviewing the SOCC Dashboard test suite.

Your job is to:

1. **Assess Current Coverage**
   - Run \`npx vitest run --coverage\` using Bash to get coverage data
   - Analyze which files have tests and which don't
   - Identify the most critical untested code paths

2. **Propose Specific Test Cases**
   - For each coverage gap, propose concrete test cases with names and descriptions
   - Prioritize by risk: auth, data handling, API routes > UI components > utilities
   - Focus on edge cases, error paths, and security-sensitive flows

3. **Write Tests** (when coverage gaps are critical)
   - Create well-structured test files following the project's existing patterns
   - Use vitest + @testing-library/react for component tests
   - Use vitest for unit tests on utils/hooks
   - Co-locate tests with source: \`src/utils/foo.test.ts\` alongside \`src/utils/foo.ts\`
   - After writing tests, run them with Bash to verify they pass

## Test Writing Guidelines
- Import from 'vitest' for describe/it/expect
- Import from '@testing-library/react' for render/screen/fireEvent
- Use the @ path alias that maps to ./src
- Match existing test patterns in the codebase
- Populate testCoverage from vitest coverage output
- List proposed tests in proposedTests array
- List any test files you wrote in testsWritten array
- The findings array should contain ALL findings (coverage gaps, test quality issues, etc.)`;

const taskPrompt = `Analyze and improve the SOCC Dashboard test suite.

1. First, use Glob and Grep to discover existing test files and understand testing patterns.
2. Run \`npx vitest run --coverage\` with Bash to get current coverage metrics.
3. Read source files that lack test coverage to understand what needs testing.
4. Propose specific test cases for uncovered code.
5. Write test files for the most critical coverage gaps.
6. Run the new tests with Bash to verify they pass.

Return your analysis as a structured JSON report.`;

const config: AgentConfig = {
  name: "qa",
  systemPrompt,
  taskPrompt,
  allowedTools: ["Read", "Glob", "Grep", "Bash", "Write"],
  permissionMode: "acceptEdits",
  defaultModel: DEFAULT_MODEL,
};

const flags = parseCLIFlags({ model: DEFAULT_MODEL });
const report = await runAgent(config, flags) as QAReport;

if (report.testCoverage) {
  const cov = report.testCoverage;
  console.log(`\n  Coverage: statements=${cov.statementPct}% branches=${cov.branchPct}% functions=${cov.functionPct}% lines=${cov.linePct}%`);
  if (cov.uncoveredFiles.length) {
    console.log(`  Uncovered files: ${cov.uncoveredFiles.length}`);
  }
}
if (report.proposedTests?.length) {
  console.log(`  Proposed tests: ${report.proposedTests.length}`);
}
if (report.testsWritten?.length) {
  console.log(`  Tests written: ${report.testsWritten.join(", ")}`);
}
