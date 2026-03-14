# sketch-post Plugin Design

**Date:** 2026-03-14
**Status:** Approved

---

## Summary

Convert `BananaPostCreator` from a standalone project into a distributable plugin named `sketch-post`, installable on any supported agent platform. The first bundled skill is `sketch-post` — a 5-phase workflow for generating hand-drawn Chinese AI illustration posts using Google's Gemini Flash Image model ("Nano Banana 2"). The plugin name is intentionally broad to accommodate future skills beyond AI post creation.

---

## Goals

- Any user on any supported agent (Claude Code, Cursor, Gemini CLI, Codex, OpenCode) can install the plugin with a single command
- The repo is plugin-first: no project-level `.claude/skills/` directory
- The skill is renamed from `ai-illustration-post` to `sketch-post` (directory name + SKILL.md frontmatter `name` field)
- README follows the superpowers style (narrative how-it-works, per-platform install, workflow list, what's inside)

---

## Repository Structure

```
BananaPostCreator/
├── .claude-plugin/
│   └── plugin.json                        ← Claude Code manifest
├── .cursor-plugin/
│   └── plugin.json                        ← Cursor manifest
├── gemini-extension.json                  ← Gemini CLI manifest
├── GEMINI.md                              ← Gemini CLI skill context file
├── skills/
│   └── sketch-post/
│       ├── SKILL.md                       ← 5-phase skill (renamed from ai-illustration-post)
│       └── scripts/
│           └── generate-post.ts           ← Gemini image generator (logic unchanged)
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-03-14-sketch-post-plugin-design.md
├── README.md                              ← Superpowers-style (rewritten)
├── .env.example
├── .gitignore
└── package.json
```

**Removed:** `.claude/` directory entirely.

**Note on Codex and OpenCode:** These platforms use a fetch-and-follow URL pattern — no special manifest files. The README documents the URL. No additional files required.

---

## Plugin Manifests

### `.claude-plugin/plugin.json`

```json
{
  "name": "sketch-post",
  "description": "AI-powered workflow for generating hand-drawn illustration posts for social media",
  "version": "1.0.0",
  "author": { "name": "hoopyAI" },
  "homepage": "https://github.com/hoopyAI/BananaPostCreator",
  "repository": "https://github.com/hoopyAI/BananaPostCreator",
  "license": "MIT",
  "keywords": ["image-generation", "illustration", "social-media", "gemini", "xiaohongshu", "chinese"],
  "skills": "./skills/"
}
```

### `.cursor-plugin/plugin.json`

```json
{
  "name": "sketch-post",
  "displayName": "Sketch Post",
  "description": "AI-powered workflow for generating hand-drawn illustration posts for social media",
  "version": "1.0.0",
  "author": { "name": "hoopyAI" },
  "homepage": "https://github.com/hoopyAI/BananaPostCreator",
  "repository": "https://github.com/hoopyAI/BananaPostCreator",
  "license": "MIT",
  "keywords": ["image-generation", "illustration", "social-media", "gemini", "xiaohongshu", "chinese"],
  "skills": "./skills/"
}
```

### `gemini-extension.json`

```json
{
  "name": "sketch-post",
  "description": "AI-powered workflow for generating hand-drawn illustration posts for social media",
  "version": "1.0.0",
  "contextFileName": "GEMINI.md"
}
```

### `GEMINI.md`

A Gemini CLI context file that loads the `sketch-post` skill instructions. Contains the same 5-phase workflow content as `skills/sketch-post/SKILL.md`, formatted as a system context document (not frontmatter-gated).

---

## Skill: `sketch-post`

### SKILL.md Changes

The only changes to `SKILL.md` are:
1. **Frontmatter `name`**: `ai-illustration-post` → `sketch-post`
2. **Frontmatter `description`**: updated to match new name
3. **Phase 5 script invocation**: updated path (see below)

All 5-phase workflow content, style rules, and prompt instructions remain unchanged.

### Phase 5 Script Path Resolution

When the plugin is installed, `generate-post.ts` is bundled inside the plugin cache. The SKILL.md instructs the agent to resolve the script path dynamically before running Phase 5:

**Unix/macOS (Claude Code default):**
```bash
SCRIPT=$(find ~/.claude/plugins -name "generate-post.ts" -path "*/sketch-post/*" 2>/dev/null | head -1)
npx -y -p tsx -p @google/genai -p dotenv tsx "$SCRIPT" prompts/{topic}_{date}.json --no-upload
```

**Windows (PowerShell fallback):**
```powershell
$SCRIPT = Get-ChildItem "$env:LOCALAPPDATA\.claude\plugins" -Recurse -Filter "generate-post.ts" | Where-Object { $_.FullName -like "*sketch-post*" } | Select-Object -First 1 -ExpandProperty FullName
npx -y -p tsx -p @google/genai -p dotenv tsx $SCRIPT prompts/{topic}_{date}.json --no-upload
```

The `--no-upload` flag is a supported flag in `generate-post.ts` that suppresses the optional Google Drive upload step.

### Phase Summary

| Phase | Name (EN) | Name (ZH) | Description |
|---|---|---|---|
| 1 | Topic Brainstorm | 话题发现 | Web-search trending AI topics, user picks one |
| 2 | Deep Research | 深度调研 | Multi-source research, summarize in Chinese |
| 3 | Content Structure | 内容结构 | Design 6-8 page outline, user confirms |
| 4 | Prompt Crafting | 提示词编写 | Generate image prompts per page, save JSON |
| 5 | Image Generation | 图片生成 | Run generate-post.ts, auto-open preview |

Each phase waits for user confirmation before proceeding.

---

## README Structure (Superpowers Style)

| Section | Content |
|---|---|
| Header + tagline | Plugin name, model name, one-sentence purpose |
| How it works | Narrative paragraph — the 5-phase workflow told as a story |
| Installation | Per-platform blocks: Claude Code, Cursor, Gemini CLI, Codex, OpenCode |
| Prerequisites | `GOOGLE_AI_API_KEY` setup — Google AI Studio link, free tier note, model table |
| The 5-Phase Workflow | Numbered list: phase name + one-line description |
| What's Inside | Skills table (name, trigger, purpose) |
| Updating | `/plugin update sketch-post` |
| License | MIT |

### Installation Commands (per platform)

| Platform | Command |
|---|---|
| Claude Code (official marketplace) | `/plugin install sketch-post@hoopyAI` |
| Claude Code (GitHub) | `/plugin install github:hoopyAI/BananaPostCreator` |
| Cursor | `/add-plugin sketch-post` |
| Gemini CLI | `gemini extensions install https://github.com/hoopyAI/BananaPostCreator` |
| Codex | Fetch-and-follow URL (raw GitHub README) |
| OpenCode | Fetch-and-follow URL (raw GitHub README) |

---

## What Changes

| File | Change |
|---|---|
| `.claude/` (entire dir) | **Deleted** |
| `skills/sketch-post/SKILL.md` | New path; frontmatter `name` + script path updated |
| `skills/sketch-post/scripts/generate-post.ts` | Moved from `.claude/skills/ai-illustration-post/scripts/` |
| `.claude-plugin/plugin.json` | **New file** |
| `.cursor-plugin/plugin.json` | **New file** |
| `gemini-extension.json` | **New file** |
| `GEMINI.md` | **New file** |
| `README.md` | **Rewritten** in superpowers style |

## What Does Not Change

| File | Notes |
|---|---|
| `generate-post.ts` logic | All generation code unchanged |
| 5-phase workflow content | All prompts, style rules, phase instructions unchanged |
| `.env.example` | Unchanged |
| `package.json` | Unchanged |
| `output/.gitkeep`, `prompts/.gitkeep` | Unchanged |

---

## Out of Scope

- Adding new skills beyond `sketch-post` (planned for future)
- Renaming the GitHub repository (remains `BananaPostCreator`)
- Publishing to the official Claude plugin marketplace (manual step for user)
