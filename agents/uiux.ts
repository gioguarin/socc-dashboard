#!/usr/bin/env npx tsx
import { runAgent, parseCLIFlags, type AgentConfig } from "./runner.ts";
import type { UIUXReport } from "./types.ts";

const DEFAULT_MODEL = "claude-sonnet-4-6";

const systemPrompt = `You are a senior UI/UX engineer and accessibility specialist reviewing the SOCC Dashboard frontend.

Your job is to perform a thorough UI/UX review covering:

1. **Accessibility (WCAG 2.1 AA)**
   - Missing or incorrect ARIA attributes (aria-label, aria-describedby, role)
   - Missing alt text on images, icons without accessible names
   - Keyboard navigation gaps (missing tabIndex, focus traps, no skip links)
   - Color contrast issues (check Tailwind classes for low-contrast combinations)
   - Missing form labels, missing error announcements for screen readers
   - Motion/animation without prefers-reduced-motion support

2. **Design Consistency**
   - Inconsistent spacing, padding, or margin patterns
   - Mixed color schemes or theme variable usage
   - Inconsistent typography (font sizes, weights)
   - Inconsistent component patterns (buttons, cards, inputs)
   - Theme support gaps (dark/light/CRT themes)

3. **Responsive Behavior**
   - Missing responsive breakpoints or mobile considerations
   - Overflow issues with long content
   - Fixed widths that break on small screens
   - Grid layout issues with react-grid-layout

## Analysis Approach
Examine each component directory systematically:
- Read component files to understand their structure and Tailwind classes
- Check for consistent patterns across similar components
- Look for hardcoded values that should use theme variables
- Populate accessibilityFindings, consistencyFindings, and responsiveFindings arrays
- The findings array should contain ALL findings combined`;

const taskPrompt = `Review the SOCC Dashboard frontend for accessibility, design consistency, and responsive behavior.

Use Glob to discover component files, Read to examine them, and Grep to search for patterns.

Start by understanding the component structure in src/components/, then review each component systematically.
Also check src/App.tsx, src/index.css, and tailwind.config.* for global patterns.

Return your review as a structured JSON report.`;

const config: AgentConfig = {
  name: "uiux",
  systemPrompt,
  taskPrompt,
  allowedTools: ["Read", "Glob", "Grep"],
  permissionMode: "default",
  defaultModel: DEFAULT_MODEL,
};

const flags = parseCLIFlags({ model: DEFAULT_MODEL });
const report = await runAgent(config, flags) as UIUXReport;

if (report.accessibilityFindings?.length) {
  console.log(`\n  Accessibility: ${report.accessibilityFindings.length} findings`);
}
if (report.consistencyFindings?.length) {
  console.log(`  Consistency: ${report.consistencyFindings.length} findings`);
}
if (report.responsiveFindings?.length) {
  console.log(`  Responsive: ${report.responsiveFindings.length} findings`);
}
