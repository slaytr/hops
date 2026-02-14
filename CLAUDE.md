# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled server

## Architecture

Fastify server in TypeScript using ES modules. Source code is in `src/`, compiled output goes to `dist/`.

Entry point: `src/server.ts`

## Design Guide

### Icons
- **Prioritize Codicons**: Use icons from the Codicon library (https://microsoft.github.io/vscode-codicons/dist/codicon.html)
- Avoid emoji icons when a suitable Codicon is available
- Common Codicon usage:
  - `codicon-search` for search functionality
  - `codicon-calendar` for date/time features
  - `codicon-arrow-right`, `codicon-arrow-left` for navigation
  - `codicon-chevron-*` for expandable sections
  - Refer to the Codicon reference for complete icon set
