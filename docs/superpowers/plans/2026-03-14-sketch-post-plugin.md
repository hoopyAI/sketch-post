# sketch-post Plugin Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `BananaPostCreator` from a standalone project into a distributable `sketch-post` plugin installable on Claude Code, Cursor, Gemini CLI, Codex, and OpenCode.

**Architecture:** Plugin-first structure — `skills/sketch-post/` at repo root replaces `.claude/skills/ai-illustration-post/`. Three platform manifest files (`.claude-plugin/`, `.cursor-plugin/`, `gemini-extension.json`) plus a `GEMINI.md` context file enable multi-platform installation. The README is rewritten in superpowers style.

**Tech Stack:** Markdown (SKILL.md, GEMINI.md, README), JSON (plugin manifests), TypeScript (generate-post.ts — one path fix required)

---

## Chunk 1: Restructure Repository

### Task 1: Create plugin skill directory and move generate-post.ts

**Files:**
- Create: `skills/sketch-post/scripts/generate-post.ts` (moved + one line path fix)
- Delete: `.claude/` directory

**Note on path fix:** `generate-post.ts` line 334 contains `import("../../../../upload-to-drive.ts")`. From the old path (`.claude/skills/ai-illustration-post/scripts/`), `../../../../` resolves to the repo root. From the new path (`skills/sketch-post/scripts/`), `../../../../` goes one level above the repo root — which is wrong. The fix is `../../../upload-to-drive.ts` (3 levels = repo root).

- [ ] **Step 1: Create the new skills directory structure**

```bash
mkdir -p "skills/sketch-post/scripts"
```

Expected: directories `skills/sketch-post/scripts/` created.

- [ ] **Step 2: Copy generate-post.ts to the new location**

```bash
cp ".claude/skills/ai-illustration-post/scripts/generate-post.ts" "skills/sketch-post/scripts/generate-post.ts"
```

Expected: file exists at `skills/sketch-post/scripts/generate-post.ts`.

- [ ] **Step 3: Fix the upload-to-drive.ts relative import path**

In `skills/sketch-post/scripts/generate-post.ts`, find the line (around line 334):
```ts
const { uploadToDrive } = await import("../../../../upload-to-drive.ts");
```
Change it to:
```ts
const { uploadToDrive } = await import("../../../upload-to-drive.ts");
```

This keeps Drive upload working for users who clone the full repo (where `upload-to-drive.ts` lives at the repo root). Plugin-only users who don't have the file will never hit this code path since it's guarded by `if (driveFolderId && !noUpload)`.

- [ ] **Step 4: Verify the path fix is correct**

```bash
grep "upload-to-drive" skills/sketch-post/scripts/generate-post.ts
```

Expected: `const { uploadToDrive } = await import("../../../upload-to-drive.ts");`

- [ ] **Step 5: Copy the samples README (optional skill asset)**

```bash
mkdir -p "skills/sketch-post/samples"
cp ".claude/skills/ai-illustration-post/samples/README.md" "skills/sketch-post/samples/README.md"
```

Expected: file exists at `skills/sketch-post/samples/README.md`.

- [ ] **Step 6: Delete the entire `.claude/` directory**

```bash
rm -rf ".claude"
```

Expected: `.claude/` directory no longer exists.

- [ ] **Step 7: Verify deletion**

```bash
ls .claude 2>&1
```

Expected: error "No such file or directory" (or equivalent on Windows).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: move skill to plugin structure under skills/sketch-post/, fix upload path"
```

---

### Task 2: Create SKILL.md for sketch-post

**Files:**
- Create: `skills/sketch-post/SKILL.md`

This is a full rewrite of the frontmatter and Phase 5 script path. All other content (Phases 1–4, style rules, notes) is copied verbatim from the original SKILL.md.

- [ ] **Step 1: Create skills/sketch-post/SKILL.md with updated frontmatter and Phase 5**

Create `skills/sketch-post/SKILL.md` with this exact content:

````markdown
---
name: sketch-post
description: Create hand-drawn Chinese illustration posts for social media. Use when the user wants to brainstorm topics and generate 6-8 page illustration posts powered by Nano Banana 2.
disable-model-invocation: false
---

You are an AI content creation assistant helping create hand-drawn style Chinese illustration posts (6-8 pages, 3:4 aspect ratio) about trending AI topics. The goal is "给普通人消除AI信息差" — making AI knowledge accessible to ordinary people.

Follow these 5 phases IN ORDER. After each phase, WAIT for the user's confirmation before proceeding.

---

## Phase 1 — Topic Brainstorm (话题发现)

1. Use WebSearch to find trending AI topics from the past 7 days. Search in both English and Chinese:
   - "trending AI news this week"
   - "AI最新热点话题"
   - "AI breakthrough 2026"
2. Present **5-8 topic candidates**, each with:
   - Topic name (Chinese + English)
   - Why it's trending (1-2 sentences)
   - Target audience appeal (why普通人 would care)
3. **WAIT**: Use AskUserQuestion to ask the user to pick a topic, or suggest their own.

---

## Phase 2 — Deep Research (深度调研)

1. Use WebSearch and WebFetch to research the chosen topic from 3-5 sources
2. Collect:
   - Key facts and statistics
   - Expert quotes or notable opinions
   - Real-world impact / use cases for ordinary people
   - Common misconceptions to address
3. Write a research summary (in Chinese) covering the above points
4. **WAIT**: Present findings to the user with AskUserQuestion. Ask them to confirm the angle, or suggest adjustments.

---

## Phase 3 — Content Structure (内容结构)

1. Based on the research, propose a **6-8 page breakdown** where **every page is substantive content**:
   - No empty cover page or generic call-to-action ending — all pages deliver real information
   - Each page covers a **different aspect** of the topic with:
     - Page title (标题) — concise, attention-grabbing
     - Key content points (内容要点) — 2-3 specific facts, comparisons, or insights
     - Visual description (视觉描述) — what the illustration should show
   - Example structure for a topic like "OpenClaw":
     - Page 1: What it is + naming origin story
     - Page 2: Why it's trending / key breakthrough
     - Page 3: Comparison with competitors (e.g., vs Claude Code)
     - Page 4: Pain points or limitations (2 per page)
     - Page 5: Practical use cases for ordinary people
     - Page 6: How to get started / what to watch for next
2. Present the full outline in a numbered list
3. **WAIT**: Use AskUserQuestion to ask the user to approve, reorder, add, remove, or revise pages.

---

## Phase 4 — Prompt Crafting (提示词编写)

1. For each approved page, craft a detailed image generation prompt. Every prompt MUST begin with this exact style prefix:

   > 彩色达芬奇手绘风中文插画，翻开的复古笔记本书页背景，米黄色纸张质感，左侧有装订线书脊，页面边缘微卷有阴影，像手账本翻开的一页，精细墨水线描与水彩着色结合，细节丰富有质感的复古插画风格，3:4竖版，高质量1K分辨率。角色造型有质感但略带可爱感，介于写实和卡通之间，用明亮鲜艳的水彩色彩着色，色彩丰富活泼。画面文字标注仅用简短中文短语，数据以示意图形表现。

   **Important style rules:**
   - Do NOT mention 机械草图, 机械花纹, or 手稿式标注 in page-level detail descriptions — these cause garbled/incorrect text in generated images
   - Overall style can reference 达芬奇手绘风 — just don't describe mechanical sketch details
   - English text is fine — include brand names, technical terms, benchmark names (e.g. Claude, GitHub, SWE-bench, LangSmith) where they add clarity
   - Do NOT add phrases like 「不渲染英文」 or 「不渲染任何英文单词」 — English rendering is allowed
   - Keep text annotations short (2-6 characters per label)

   After the style prefix, include:
   - The Chinese text that should appear on the image (title, key points)
   - Visual composition details (layout, icons, characters, scenes)
   - Specific illustration descriptions (what to draw, how to arrange)
   - Humorous small comics or visual metaphors where appropriate

   **IMPORTANT — Page 1 must be the most visually striking page.** It's the cover that decides whether someone swipes. Page 1 should have:
   - The richest illustration details and most complex visual composition
   - A central eye-catching scene or character group (not just text + simple icons)
   - More visual elements filling the page — decorations, sub-illustrations, background details
   - A hook subtitle or provocative question to draw readers in

   **Text style**: Avoid large blocks of text on any page. Use short phrases with **bold keywords** for emphasis. Let illustrations carry the message — text should highlight key points, not explain everything. Think "infographic" not "article". Do NOT specify font in the prompt — let the model decide based on the overall composition.

   **Prompt composition rules (learned from production):**
   - **One dominant focal point per page**: Each page needs ONE main visual scene that takes up most of the space. Other elements (charts, labels, annotations) are secondary. Do not let multiple equally-sized sections compete for attention.
   - **Specify exact counts explicitly**: If a layout requires a fixed number of elements (e.g., 3 circles in a flow diagram), write: 「严格是三个，不多不少」and 「每个步骤只出现一次，不重复」. The model will add extra elements if not constrained.
   - **Rich text annotations**: Every page should have multiple lines of short annotated text — key stats, hand-written captions, inline labels. Don't just describe the visual scene; also specify the text content that should appear alongside each element.
   - **Avoid repeating the same layout across pages**: Don't use left/right VS comparison on multiple pages in the same post. Vary compositions: flow-circle, top/bottom split, card stack, road/timeline, central character with surrounding elements.
   - **Position elements explicitly**: Instead of vague "place a chart nearby", say 「画面左下方」or 「右侧竖排三行」. Explicit positioning reduces ambiguity and prevents the model from placing elements randomly.

   **Important**: Do NOT use double quotes (`"`) inside prompt text — use Chinese quotes (`「」`or `『』`) instead to avoid JSON parsing errors.

2. Save all prompts to a JSON file:
   ```
   prompts/{topic}_{date}.json
   ```
   Use this format:
   ```json
   {
     "topic": "Topic Name",
     "date": "YYYY-MM-DD",
     "style": "彩色达芬奇手绘风中文插画",
     "aspect_ratio": "3:4",
     "resolution": "1K",
     "pages": [
       {"page": 1, "prompt": "full prompt text...", "title": "页面标题"},
       {"page": 2, "prompt": "...", "title": "页面标题"}
     ]
   }
   ```

3. **WAIT**: Show all prompts to the user. Use AskUserQuestion to ask if any prompts need refinement.

---

## Phase 5 — Image Generation (图片生成)

1. Locate the generation script bundled with this plugin. Run the appropriate command for your platform:

   **Unix / macOS:**
   ```bash
   SCRIPT=$(find ~/.claude/plugins -name "generate-post.ts" -path "*/sketch-post/*" 2>/dev/null | head -1)
   npx -y -p tsx -p @google/genai -p dotenv tsx "$SCRIPT" prompts/{topic}_{date}.json --no-upload
   ```

   **Windows (PowerShell):**
   ```powershell
   $SCRIPT = Get-ChildItem "$env:LOCALAPPDATA\.claude\plugins" -Recurse -Filter "generate-post.ts" | Where-Object { $_.FullName -like "*sketch-post*" } | Select-Object -First 1 -ExpandProperty FullName
   npx -y -p tsx -p @google/genai -p dotenv tsx $SCRIPT prompts/{topic}_{date}.json --no-upload
   ```

   The script validates that `GOOGLE_AI_API_KEY` is set, enforces `style = 彩色达芬奇手绘风中文插画`, `aspect_ratio = 3:4`, `resolution = 1K`, and validates page count (6-8).
   - Style reference images are auto-loaded from `samples/` in your project root (if present).
   - The script auto-opens `preview.html` in the browser when generation completes.
   - Use `--no-upload` by default; omit it only after reviewing and approving the images.

2. Monitor the output and report progress to the user as pages are generated.
3. When generation completes, tell the user:
   - How many pages were generated successfully
   - That preview has been auto-opened in the browser
4. **WAIT**: Use AskUserQuestion to ask if any pages need to be regenerated.
   - If yes, run the same command with `--pages X,Y` appended (e.g., `--pages 1,3`)
   - Repeat until the user is satisfied.
5. **WAIT**: Use AskUserQuestion to ask:
   > 图片已生成完成，请问要上传到哪里？
   > - **Google Drive** — 运行 upload-to-drive.ts
   > - **百度网盘** — 运行 BaiduPCS-Go 上传命令
   > - **跳过** — 不上传，本地保存即可

---

## 小红书文案生成模版 (XiaoHongShu Copy Template)

After completing image generation and upload, generate XiaoHongShu (小红书) social media copy using this template:

```
👋hello，欢迎来到潦草虎皮AI说
挑战连续分享100个AI时代信息差
今天聊聊[主题内容]🧠

🤔[引发思考的问题1]？
🔑[引发思考的问题2]？
❓[引发思考的问题3]？
🚀[引发思考的问题4]？
（包含个人观点，欢迎友好探讨）

如果喜欢这样的分享 请点赞鼓励[害羞R]
最近在深度研究[相关研究方向]
[看R]下一篇打算介绍一下[预告内容]
希望有幸被你关注[太阳R]
```

---

## Important Notes

- All illustration content should be in **Chinese (中文)**
- Keep text on each page concise — social media style, not essay style
- Each page should be self-contained (understandable without other pages)
- Ensure `GOOGLE_AI_API_KEY` is set before Phase 5. If not set, remind the user.
- Reference images in `samples/` are automatically attached to API calls for style consistency

## Content Tone — 专业科普，不过度通俗化

Target reader: **有一定信息密度需求的普通读者**，类似 36氪、少数派 的受众。

- **保留专业术语**：benchmark 名称、模型名、技术概念不要替换成模糊表述
- **行内简短注释**：需要解释时加括号 — 如「OSWorld（桌面操作能力评测基准）」
- **准确归因创新点**：写某功能是「首创」前先核实竞品是否已有
- **用精确数字**：benchmark 分数、百分比、token 数量 — 不能用「性能大幅提升」代替
````

- [ ] **Step 2: Verify the file was created and frontmatter is correct**

```bash
head -6 skills/sketch-post/SKILL.md
```

Expected output:
```
---
name: sketch-post
description: Create hand-drawn Chinese illustration posts for social media. Use when the user wants to brainstorm topics and generate 6-8 page illustration posts powered by Nano Banana 2.
disable-model-invocation: false
---
```

- [ ] **Step 3: Commit**

```bash
git add skills/sketch-post/SKILL.md
git commit -m "feat: add sketch-post SKILL.md with renamed skill and plugin-aware Phase 5 path"
```

---

## Chunk 2: Plugin Manifests

### Task 3: Create .claude-plugin/plugin.json

**Files:**
- Create: `.claude-plugin/plugin.json`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p .claude-plugin
```

Create `.claude-plugin/plugin.json` with this exact content:

```json
{
  "name": "sketch-post",
  "description": "AI-powered workflow for generating hand-drawn illustration posts for social media",
  "version": "1.0.0",
  "author": {
    "name": "hoopyAI"
  },
  "homepage": "https://github.com/hoopyAI/BananaPostCreator",
  "repository": "https://github.com/hoopyAI/BananaPostCreator",
  "license": "MIT",
  "keywords": ["image-generation", "illustration", "social-media", "gemini", "xiaohongshu", "chinese"],
  "skills": "./skills/"
}
```

- [ ] **Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf8')); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/plugin.json
git commit -m "feat: add Claude Code plugin manifest"
```

---

### Task 4: Create .cursor-plugin/plugin.json

**Files:**
- Create: `.cursor-plugin/plugin.json`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p .cursor-plugin
```

Create `.cursor-plugin/plugin.json` with this exact content:

```json
{
  "name": "sketch-post",
  "displayName": "Sketch Post",
  "description": "AI-powered workflow for generating hand-drawn illustration posts for social media",
  "version": "1.0.0",
  "author": {
    "name": "hoopyAI"
  },
  "homepage": "https://github.com/hoopyAI/BananaPostCreator",
  "repository": "https://github.com/hoopyAI/BananaPostCreator",
  "license": "MIT",
  "keywords": ["image-generation", "illustration", "social-media", "gemini", "xiaohongshu", "chinese"],
  "skills": "./skills/"
}
```

- [ ] **Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('.cursor-plugin/plugin.json','utf8')); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add .cursor-plugin/plugin.json
git commit -m "feat: add Cursor plugin manifest"
```

---

### Task 5: Create gemini-extension.json and GEMINI.md

**Files:**
- Create: `gemini-extension.json`
- Create: `GEMINI.md`

- [ ] **Step 1: Create gemini-extension.json**

Create `gemini-extension.json` with this exact content:

```json
{
  "name": "sketch-post",
  "description": "AI-powered workflow for generating hand-drawn illustration posts for social media",
  "version": "1.0.0",
  "contextFileName": "GEMINI.md"
}
```

- [ ] **Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('gemini-extension.json','utf8')); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 3: Create GEMINI.md**

Create `GEMINI.md` with this exact content — same skill workflow as SKILL.md but without frontmatter, formatted as a plain context document:

```markdown
# sketch-post — Gemini CLI Extension

You have the **sketch-post** skill loaded. You are an AI content creation assistant helping create hand-drawn style Chinese illustration posts (6-8 pages, 3:4 aspect ratio) about trending AI topics. The goal is "给普通人消除AI信息差" — making AI knowledge accessible to ordinary people.

When the user asks to create a post, brainstorm topics, or generate illustration pages, follow the 5-phase workflow below IN ORDER. After each phase, WAIT for the user's confirmation before proceeding.

---

## Phase 1 — Topic Brainstorm (话题发现)

1. Use web search to find trending AI topics from the past 7 days. Search in both English and Chinese:
   - "trending AI news this week"
   - "AI最新热点话题"
   - "AI breakthrough 2026"
2. Present **5-8 topic candidates**, each with:
   - Topic name (Chinese + English)
   - Why it's trending (1-2 sentences)
   - Target audience appeal (why普通人 would care)
3. Ask the user to pick a topic, or suggest their own.

---

## Phase 2 — Deep Research (深度调研)

1. Research the chosen topic from 3-5 sources
2. Collect:
   - Key facts and statistics
   - Expert quotes or notable opinions
   - Real-world impact / use cases for ordinary people
   - Common misconceptions to address
3. Write a research summary (in Chinese) covering the above points
4. Present findings and ask the user to confirm the angle, or suggest adjustments.

---

## Phase 3 — Content Structure (内容结构)

1. Propose a **6-8 page breakdown** where every page is substantive content:
   - No empty cover page or generic call-to-action ending
   - Each page: page title (标题), key content points (内容要点), visual description (视觉描述)
2. Present the full outline
3. Ask the user to approve, reorder, add, remove, or revise pages.

---

## Phase 4 — Prompt Crafting (提示词编写)

1. For each approved page, craft a detailed image generation prompt beginning with this style prefix:

   > 彩色达芬奇手绘风中文插画，翻开的复古笔记本书页背景，米黄色纸张质感，左侧有装订线书脊，页面边缘微卷有阴影，像手账本翻开的一页，精细墨水线描与水彩着色结合，细节丰富有质感的复古插画风格，3:4竖版，高质量1K分辨率。角色造型有质感但略带可爱感，介于写实和卡通之间，用明亮鲜艳的水彩色彩着色，色彩丰富活泼。画面文字标注仅用简短中文短语，数据以示意图形表现。

   Do NOT mention 机械草图, 机械花纹, or 手稿式标注 — these cause garbled text in generated images.

2. Save all prompts to `prompts/{topic}_{date}.json`
3. Show all prompts and ask if any need refinement.

---

## Phase 5 — Image Generation (图片生成)

Inform the user that Phase 5 (image generation) requires running the `generate-post.ts` script bundled with the sketch-post plugin. Provide the generation command:

**Unix / macOS:**
```bash
SCRIPT=$(find ~/.claude/plugins -name "generate-post.ts" -path "*/sketch-post/*" 2>/dev/null | head -1)
npx -y -p tsx -p @google/genai -p dotenv tsx "$SCRIPT" prompts/{topic}_{date}.json --no-upload
```

**Windows (PowerShell):**
```powershell
$SCRIPT = Get-ChildItem "$env:LOCALAPPDATA\.claude\plugins" -Recurse -Filter "generate-post.ts" | Where-Object { $_.FullName -like "*sketch-post*" } | Select-Object -First 1 -ExpandProperty FullName
npx -y -p tsx -p @google/genai -p dotenv tsx $SCRIPT prompts/{topic}_{date}.json --no-upload
```

Requires `GOOGLE_AI_API_KEY` in environment or `.env` file.

---

## Important Notes

- All illustration content in **Chinese (中文)**
- Each page self-contained and social-media style (concise, visual-led)
- Ensure `GOOGLE_AI_API_KEY` is set before Phase 5
```

- [ ] **Step 4: Verify GEMINI.md starts correctly**

```bash
head -3 GEMINI.md
```

Expected:
```
# sketch-post — Gemini CLI Extension

You have the **sketch-post** skill loaded.
```

- [ ] **Step 5: Commit**

```bash
git add gemini-extension.json GEMINI.md
git commit -m "feat: add Gemini CLI extension manifest and context file"
```

---

## Chunk 3: README Rewrite

### Task 6: Rewrite README.md in superpowers style

**Files:**
- Modify: `README.md` (full rewrite)

- [ ] **Step 1: Replace README.md with the superpowers-style content**

Replace `README.md` entirely with:

```markdown
# sketch-post

sketch-post is a 5-phase AI workflow for creating hand-drawn Chinese illustration posts for social media, powered by **Nano Banana 2** (Gemini 3.1 Flash Image / `gemini-3.1-flash-image-preview`).

## How it works

The moment you ask your agent to create a post, sketch-post doesn't just start generating images. Instead, it steps back and searches for what's actually trending — then asks you which topic you want to explore. Once you've picked a direction, it digs into real sources, assembles a page-by-page content outline, and shows it to you before writing a single prompt. Only after you've signed off on the structure does it craft detailed illustration prompts for each page and fire up the image generator. The whole process is built around confirmation gates — you stay in control at every step, and nothing moves forward without your say.

## Installation

**Note:** Installation differs by platform. Claude Code and Cursor have built-in plugin marketplaces. Gemini CLI uses the extensions system. Codex and OpenCode require a manual fetch step.

### Claude Code (Official Marketplace)

```bash
/plugin install sketch-post@hoopyAI
```

### Claude Code (GitHub)

```bash
/plugin install github:hoopyAI/BananaPostCreator
```

### Cursor

In Cursor Agent chat:

```text
/add-plugin sketch-post
```

Or search for "sketch-post" in the Cursor plugin marketplace.

### Gemini CLI

```bash
gemini extensions install https://github.com/hoopyAI/BananaPostCreator
```

To update:

```bash
gemini extensions update sketch-post
```

### Codex

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/hoopyAI/BananaPostCreator/main/README.md
```

### OpenCode

Tell OpenCode:

```
Fetch and follow instructions from https://raw.githubusercontent.com/hoopyAI/BananaPostCreator/main/README.md
```

### Verify Installation

Start a new session and say: "帮我做一个关于 AI 的小红书图文" — your agent should automatically pick up the skill and begin Phase 1.

## Prerequisites

This plugin uses the **Google AI (Gemini) API** for image generation.

### Get a free API key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API key**
4. Add it to your project's `.env` file:

```
GOOGLE_AI_API_KEY=AIza...
```

### Model

| Model | API name | Notes |
|---|---|---|
| Nano Banana 2 | `gemini-3.1-flash-image-preview` | Default — fast, high quality |

The free tier allows limited requests per minute. If you hit rate limits, the script retries automatically with exponential backoff (5 attempts). For higher throughput, upgrade to a paid plan in [Google AI Studio](https://aistudio.google.com/app/apikey).

## The 5-Phase Workflow

1. **Topic Brainstorm** (话题发现) — searches for trending AI topics this week, presents 5-8 candidates with audience appeal, waits for your pick
2. **Deep Research** (深度调研) — researches 3-5 sources, collects key facts, expert quotes, real-world impact, writes Chinese summary, waits for your angle confirmation
3. **Content Structure** (内容结构) — proposes a 6-8 page outline where every page is substantive content, waits for your approval
4. **Prompt Crafting** (提示词编写) — writes a detailed image generation prompt for each page in Da Vinci sketch + watercolor style, saves to JSON, waits for your sign-off
5. **Image Generation** (图片生成) — runs Nano Banana 2 to generate all pages, auto-opens a browser preview, asks if any pages need regenerating

**Each phase waits for confirmation before proceeding.** Nothing moves forward without your say.

## What's Inside

| Skill | Trigger | Purpose |
|---|---|---|
| `sketch-post` | `/sketch-post` or describe a post creation task | Full 5-phase illustration post workflow |

## Updating

```bash
/plugin update sketch-post
```

## License

MIT License — see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: https://github.com/hoopyAI/BananaPostCreator/issues
```

- [ ] **Step 2: Verify README starts with the correct header**

```bash
head -5 README.md
```

Expected:
```
# sketch-post

sketch-post is a 5-phase AI workflow for creating hand-drawn Chinese illustration posts for social media, powered by **Nano Banana 2** (Gemini 3.1 Flash Image / `gemini-3.1-flash-image-preview`).

## How it works
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README in superpowers style for plugin distribution"
```

---

## Chunk 4: Final Verification

### Task 7: Verify complete plugin structure

- [ ] **Step 1: Confirm all required files exist**

```bash
ls .claude-plugin/plugin.json .cursor-plugin/plugin.json gemini-extension.json GEMINI.md skills/sketch-post/SKILL.md skills/sketch-post/scripts/generate-post.ts README.md
```

Expected: all 7 files listed with no errors.

- [ ] **Step 2: Confirm .claude/ is gone**

```bash
ls .claude 2>&1
```

Expected: error (directory does not exist).

- [ ] **Step 3: Validate all JSON manifests**

```bash
node -e "
['.\\.claude-plugin/plugin.json', '.cursor-plugin/plugin.json', 'gemini-extension.json'].forEach(f => {
  JSON.parse(require('fs').readFileSync(f, 'utf8'));
  console.log(f + ': valid');
});
"
```

Expected:
```
.claude-plugin/plugin.json: valid
.cursor-plugin/plugin.json: valid
gemini-extension.json: valid
```

- [ ] **Step 4: Confirm SKILL.md skill name is correct**

```bash
grep "^name:" skills/sketch-post/SKILL.md
```

Expected: `name: sketch-post`

- [ ] **Step 5: Confirm generate-post.ts is intact (check line count)**

```bash
wc -l skills/sketch-post/scripts/generate-post.ts
```

Expected: `349 skills/sketch-post/scripts/generate-post.ts` (same as original).

- [ ] **Step 6: Final commit if any loose changes**

```bash
git status
```

If clean: nothing to do. If any uncommitted changes remain, commit them:

```bash
git add -A
git commit -m "chore: final cleanup for sketch-post plugin"
```

- [ ] **Step 7: Verify git log shows clean history**

```bash
git log --oneline -6
```

Expected: 6 commits visible — one per task in this plan.
