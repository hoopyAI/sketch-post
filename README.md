# BananaPostCreator

A Claude Code project for generating hand-drawn style Chinese illustration posts about AI topics, powered by Google's **Nano Banana 2** (Gemini 3.1 Flash Image / `gemini-3.1-flash-image-preview`) image generation model.

Each post is 6–8 pages in 3:4 portrait format — designed for social media platforms like Xiaohongshu and WeChat. The visual style is 彩色达芬奇手绘风 (Da Vinci sketch + bright watercolor, vintage notebook background).

---

## Setup

There are two ways to use this skill — pick whichever fits your workflow.

---

### Option A: Clone the full repo

Best if you want the complete project (scripts, prompts folder, preview output).

```bash
git clone https://github.com/your-username/BananaPostCreator.git
cd BananaPostCreator
```

Then open the folder in Claude Code:

```bash
claude .
```

Install dependencies and configure your API key (see [API Setup](#api-setup)):

```bash
npm install
cp .env.example .env
# edit .env and add your GOOGLE_AI_API_KEY
```

---

### Option B: Copy just the skill

If you already have a project open in Claude Code and just want the skill, copy the skill folder into your project:

```bash
cp -r .claude/skills/ai-illustration-post /your-project/.claude/skills/
```

Then install dependencies in your project root:

```bash
npm install tsx @google/genai dotenv
```

And create a `.env` with your API key. The skill will be available immediately in Claude Code — no restart needed.

---

### Run the skill

Once set up, open the project in Claude Code and type:

```
/ai-illustration-post
```

Or just describe what you want and Claude will pick up the skill automatically:

```
帮我做一个关于 Claude Code Skill 的小红书图文
```

---

## API Setup

This project uses the **Google AI (Gemini) API** for image generation.

### Get a free API key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API key**
4. Copy the key and paste it into your `.env` file:

```
GOOGLE_AI_API_KEY=AIza...
```

### Model used

| Model | API name | Notes |
|---|---|---|
| Nano Banana 2 | `gemini-3.1-flash-image-preview` | Default — fast, high quality |

The free tier allows limited requests per minute. If you hit rate limits, the script will automatically retry with exponential backoff.

For higher throughput, upgrade to a paid plan in [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## The `ai-illustration-post` Skill

Located at `.claude/skills/ai-illustration-post/SKILL.md`, this skill runs a **5-phase workflow** inside Claude Code to go from topic idea to finished images.

### How it works

```
Phase 1 → Topic Brainstorm    搜索本周AI热点，让用户选题
Phase 2 → Deep Research       多源调研，整理关键事实
Phase 3 → Content Structure   设计6-8页内容结构，用户确认
Phase 4 → Prompt Crafting     为每页生成图像提示词，保存JSON
Phase 5 → Image Generation    调用 Nano Banana 2 批量生成图片
```

Each phase waits for your confirmation before proceeding.

### Skill structure

```
.claude/skills/ai-illustration-post/
├── SKILL.md                  ← Workflow instructions for Claude
└── scripts/
    └── generate-post.ts      ← Image generation script (TypeScript)
```

### Triggering the skill

**Manual** — type the slash command:
```
/ai-illustration-post
```

**Automatic** — Claude picks it up when you describe a post creation task in Chinese or English.

### Image generation script

The script is called automatically in Phase 5, but you can also run it directly:

```bash
# Generate all pages
npx tsx .claude/skills/ai-illustration-post/scripts/generate-post.ts prompts/your-topic_2026-02-27.json

# Regenerate specific pages only
npx tsx .claude/skills/ai-illustration-post/scripts/generate-post.ts prompts/your-topic_2026-02-27.json --pages 1,3

# Dry run (preview prompts without calling the API)
npx tsx .claude/skills/ai-illustration-post/scripts/generate-post.ts prompts/your-topic_2026-02-27.json --dry-run
```

Output is saved to `output/{topic}_{date}/`. Open `preview.html` in that folder to view all pages in a grid.

---

## Project Structure

```
BananaPostCreator/
├── .claude/
│   └── skills/
│       └── ai-illustration-post/
│           ├── SKILL.md              ← Claude Code skill definition
│           └── scripts/
│               └── generate-post.ts  ← Nano Banana 2 image generator
├── prompts/                          ← Generated prompt JSON files (gitignored)
├── output/                           ← Generated images + preview HTML (gitignored)
├── .env                              ← Your API key (gitignored)
├── .env.example                      ← Template for .env
└── package.json
```

