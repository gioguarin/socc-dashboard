/**
 * OpenAPI / Swagger configuration for SOCC Dashboard API
 * Documentation available at /api-docs when server is running
 */

import swaggerJsdoc from 'swagger-jsdoc';
import type { OAS3Options } from 'swagger-jsdoc';

const options: OAS3Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SOCC Dashboard API',
      version: '1.0.0',
      description: 'Security Operations Command Center dashboard API for threat intelligence, news aggregation, and stock tracking',
      contact: {
        name: 'API Support',
        url: 'https://github.com/riot/socc-dashboard',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://socc.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'socc_token',
          description: 'Session token stored in httpOnly cookie',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token in Authorization header',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
          required: ['error'],
        },
        ThreatItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            cveId: { type: 'string', nullable: true },
            title: { type: 'string' },
            description: { type: 'string' },
            severity: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low', 'info'],
            },
            cvssScore: { type: 'number', nullable: true },
            source: { type: 'string' },
            publishedAt: { type: 'string', format: 'date-time' },
            affectedProducts: {
              type: 'array',
              items: { type: 'string' },
              nullable: true,
            },
            patchUrls: {
              type: 'array',
              items: { type: 'string' },
              nullable: true,
            },
            affectedVendors: {
              type: 'array',
              items: { type: 'string' },
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['new', 'investigating', 'mitigated', 'not_applicable'],
            },
            cisaKev: { type: 'boolean' },
            url: { type: 'string', nullable: true },
          },
          required: ['id', 'title', 'description', 'severity', 'source', 'publishedAt', 'status', 'cisaKev'],
        },
        NewsItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            summary: { type: 'string' },
            source: {
              type: 'string',
              enum: ['akamai', 'cloudflare', 'fastly', 'zscaler', 'crowdstrike', 'paloalto', 'f5', 'general'],
            },
            url: { type: 'string' },
            publishedAt: { type: 'string', format: 'date-time' },
            category: {
              type: 'string',
              enum: ['product', 'security', 'business', 'research', 'incident'],
            },
            status: {
              type: 'string',
              enum: ['new', 'reviewed', 'flagged', 'dismissed'],
            },
            sentiment: {
              type: 'string',
              enum: ['positive', 'negative', 'neutral'],
              nullable: true,
            },
            tldr: { type: 'string', nullable: true },
          },
          required: ['id', 'title', 'summary', 'source', 'url', 'publishedAt', 'category', 'status'],
        },
        StockData: {
          type: 'object',
          properties: {
            symbol: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            change: { type: 'number' },
            changePercent: { type: 'number' },
            sparkline: {
              type: 'array',
              items: { type: 'number' },
            },
            lastUpdated: { type: 'string', format: 'date-time' },
          },
          required: ['symbol', 'name', 'price', 'change', 'changePercent', 'sparkline', 'lastUpdated'],
        },
        Briefing: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            date: { type: 'string', format: 'date' },
            content: { type: 'string' },
            highlights: {
              type: 'array',
              items: { type: 'string' },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'date', 'content', 'highlights', 'createdAt'],
        },
        Anomaly: {
          type: 'object',
          properties: {
            detected: { type: 'boolean' },
            message: { type: 'string', nullable: true },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              nullable: true,
            },
          },
          required: ['detected'],
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User authentication and session management' },
      { name: 'Threats', description: 'CVE and vulnerability data' },
      { name: 'News', description: 'Security news aggregation' },
      { name: 'Stocks', description: 'Stock price tracking' },
      { name: 'Briefings', description: 'Daily briefing management' },
      { name: 'RSS Sources', description: 'RSS feed configuration' },
    ],
  },
  apis: ['./server/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
