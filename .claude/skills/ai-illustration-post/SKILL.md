---
name: ai-illustration-post
description: Create AI topic illustration posts for social media. Use when the user wants to brainstorm AI topics and generate hand-drawn Chinese illustration pages.
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

1. Run the skill script:
   ```bash
   npx -y -p tsx -p @google/genai -p dotenv tsx .claude/skills/ai-illustration-post/scripts/generate-post.ts prompts/{topic}_{date}.json
   ```
   The skill-local generator enforces `style = 彩色手绘风中文插画`, `aspect_ratio = 3:4`, `resolution = 1K`, and validates page count (6-8).
2. Monitor the output and report progress to the user as pages are generated.
3. When generation completes, tell the user:
   - How many pages were generated successfully
   - Where the files are saved
   - How to open the preview: `output/{topic}_{date}/preview.html`
4. **WAIT**: Use AskUserQuestion to ask if any pages need to be regenerated.
   - If yes, run: `npx -y -p tsx -p @google/genai -p dotenv tsx .claude/skills/ai-illustration-post/scripts/generate-post.ts prompts/{topic}_{date}.json --pages X,Y`
   - Repeat until the user is satisfied.

---

## Important Notes

- All illustration content should be in **Chinese (中文)**
- Keep text on each page concise — social media style, not essay style
- Each page should be self-contained (understandable without other pages)
- Visual style: 彩色达芬奇手绘风 — book page background, Da Vinci ink lines + bright watercolor, slightly cute characters, rich details
- Ensure GOOGLE_AI_API_KEY is set before Phase 5. If not set, remind the user.
