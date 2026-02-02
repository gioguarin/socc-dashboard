#!/usr/bin/env bash
# SOCC Dashboard — Run All Pipelines
# Populates the dashboard with real data from all sources.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Running all pipelines..."

echo "--- News ---"
bash "$SCRIPT_DIR/pipeline-news.sh" 2>&1

echo "--- Threats ---"
bash "$SCRIPT_DIR/pipeline-threats.sh" 2>&1

echo "--- Stocks ---"
bash "$SCRIPT_DIR/pipeline-stocks.sh" 2>&1

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] All pipelines complete."
