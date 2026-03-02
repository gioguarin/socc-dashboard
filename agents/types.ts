// Shared types and JSON schemas for agent structured output

export interface Finding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  file: string;
  line?: number;
  title: string;
  description: string;
  suggestion: string;
}

export interface AgentReport {
  agent: string;
  summary: string;
  findings: Finding[];
  stats: Record<string, number>;
}

// QA Agent extensions
export interface ProposedTest {
  file: string;
  testName: string;
  description: string;
  targetFile: string;
}

export interface QAReport extends AgentReport {
  agent: "qa";
  testCoverage: {
    statementPct: number;
    branchPct: number;
    functionPct: number;
    linePct: number;
    uncoveredFiles: string[];
  };
  proposedTests: ProposedTest[];
  testsWritten: string[];
}

// Code Analysis Agent extensions
export interface AnalysisReport extends AgentReport {
  agent: "analysis";
  securityFindings: Finding[];
  antiPatterns: Finding[];
  refactorOpportunities: Finding[];
}

// UI/UX Agent extensions
export interface UIUXReport extends AgentReport {
  agent: "uiux";
  accessibilityFindings: Finding[];
  consistencyFindings: Finding[];
  responsiveFindings: Finding[];
}

// JSON Schema for structured output — shared Finding schema
const findingSchema = {
  type: "object" as const,
  properties: {
    severity: {
      type: "string" as const,
      enum: ["critical", "high", "medium", "low", "info"],
    },
    category: { type: "string" as const },
    file: { type: "string" as const },
    line: { type: "number" as const },
    title: { type: "string" as const },
    description: { type: "string" as const },
    suggestion: { type: "string" as const },
  },
  required: ["severity", "category", "file", "title", "description", "suggestion"] as const,
  additionalProperties: false as const,
};

const findingsArray = {
  type: "array" as const,
  items: findingSchema,
};

const baseReportProperties = {
  agent: { type: "string" as const },
  summary: { type: "string" as const },
  findings: findingsArray,
  stats: {
    type: "object" as const,
    additionalProperties: { type: "number" as const },
  },
};

export const qaReportSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "qa_report",
    schema: {
      type: "object" as const,
      properties: {
        ...baseReportProperties,
        testCoverage: {
          type: "object" as const,
          properties: {
            statementPct: { type: "number" as const },
            branchPct: { type: "number" as const },
            functionPct: { type: "number" as const },
            linePct: { type: "number" as const },
            uncoveredFiles: {
              type: "array" as const,
              items: { type: "string" as const },
            },
          },
          required: ["statementPct", "branchPct", "functionPct", "linePct", "uncoveredFiles"] as const,
          additionalProperties: false as const,
        },
        proposedTests: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              file: { type: "string" as const },
              testName: { type: "string" as const },
              description: { type: "string" as const },
              targetFile: { type: "string" as const },
            },
            required: ["file", "testName", "description", "targetFile"] as const,
            additionalProperties: false as const,
          },
        },
        testsWritten: {
          type: "array" as const,
          items: { type: "string" as const },
        },
      },
      required: ["agent", "summary", "findings", "stats", "testCoverage", "proposedTests", "testsWritten"] as const,
      additionalProperties: false as const,
    },
  },
};

export const analysisReportSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "analysis_report",
    schema: {
      type: "object" as const,
      properties: {
        ...baseReportProperties,
        securityFindings: findingsArray,
        antiPatterns: findingsArray,
        refactorOpportunities: findingsArray,
      },
      required: [
        "agent", "summary", "findings", "stats",
        "securityFindings", "antiPatterns", "refactorOpportunities",
      ] as const,
      additionalProperties: false as const,
    },
  },
};

export const uiuxReportSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "uiux_report",
    schema: {
      type: "object" as const,
      properties: {
        ...baseReportProperties,
        accessibilityFindings: findingsArray,
        consistencyFindings: findingsArray,
        responsiveFindings: findingsArray,
      },
      required: [
        "agent", "summary", "findings", "stats",
        "accessibilityFindings", "consistencyFindings", "responsiveFindings",
      ] as const,
      additionalProperties: false as const,
    },
  },
};
