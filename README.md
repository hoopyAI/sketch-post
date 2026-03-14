# sketch-post

sketch-post is a 5-phase AI workflow for creating hand-drawn Chinese illustration posts for social media, powered by **Nano Banana 2** (Gemini 3.1 Flash Image / `gemini-3.1-flash-image-preview`).

## How it works

The moment you ask your agent to create a post, sketch-post doesn't just start generating images. Instead, it steps back and searches for what's actually trending — then asks you which topic you want to explore. Once you've picked a direction, it digs into real sources, assembles a page-by-page content outline, and shows it to you before writing a single prompt. Only after you've signed off on the structure does it craft detailed illustration prompts for each page and fire up the image generator. The whole process is built around confirmation gates — you stay in control at every step, and nothing moves forward without your say.

## Installation

**Note:** Installation differs by platform. Claude Code and Cursor have built-in plugin marketplaces. Gemini CLI uses the extensions system. OpenClaw uses ClawHub. Codex and OpenCode require a manual fetch step.

### Claude Code (Official Marketplace)

```bash
/plugin install sketch-post@hoopyAI
```

### Claude Code (GitHub)

```bash
/plugin install github:hoopyAI/sketch-post
```

### Cursor

In Cursor Agent chat:

```text
/add-plugin sketch-post
```

Or search for "sketch-post" in the Cursor plugin marketplace.

### Gemini CLI

```bash
gemini extensions install https://github.com/hoopyAI/sketch-post
```

To update:

```bash
gemini extensions update sketch-post
```

### OpenClaw

```bash
clawhub install hoopyAI/sketch-post
```

To update:

```bash
clawhub update sketch-post
```

### Codex

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/hoopyAI/sketch-post/main/README.md
```

### OpenCode

Tell OpenCode:

```
Fetch and follow instructions from https://raw.githubusercontent.com/hoopyAI/sketch-post/main/README.md
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

- **Issues**: https://github.com/hoopyAI/sketch-post/issues

