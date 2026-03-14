import "dotenv/config";
import { GoogleGenAI, type Part } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface PagePrompt {
  page: number;
  prompt: string;
  title: string;
}

interface PromptsData {
  topic: string;
  date: string;
  style: string;
  aspect_ratio: string;
  resolution: string;
  pages: PagePrompt[];
}

const STYLE = "彩色达芬奇手绘风中文插画";
const ASPECT_RATIO = "3:4";
const RESOLUTION = "1K";

function parseArgs(): { promptsFile: string; pages?: number[]; dryRun: boolean } {
  const args = process.argv.slice(2);
  let promptsFile = "";
  let pages: number[] | undefined;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--pages" && args[i + 1]) {
      pages = args[i + 1].split(",").map((n) => parseInt(n.trim(), 10));
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (!args[i].startsWith("--")) {
      promptsFile = args[i];
    }
  }

  if (!promptsFile) {
    console.error(
      "Usage: npx tsx .claude/skills/ai-illustration-post/scripts/generate-post.ts <prompts.json> [--pages 3,5] [--dry-run]"
    );
    process.exit(1);
  }

  return { promptsFile, pages, dryRun };
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderPreview(outputDir: string, data: PromptsData): string {
  const cards = data.pages
    .map((page) => {
      const filename = String(page.page).padStart(2, "0");
      return `
        <div class="card">
          <img src="page_${filename}.png" alt="Page ${page.page}: ${escapeHtml(page.title)}">
          <div class="card-info">
            <div class="page-num">Page ${page.page}</div>
            <div class="page-title">${escapeHtml(page.title)}</div>
          </div>
        </div>
      `;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.topic)} — Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; background: #f5f5f5; color: #333; padding: 2rem; }
    h1 { text-align: center; margin-bottom: 0.5rem; font-size: 1.8rem; }
    .meta { text-align: center; color: #888; margin-bottom: 2rem; font-size: 0.9rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); transition: transform 0.2s; }
    .card:hover { transform: translateY(-4px); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); }
    .card img { width: 100%; display: block; aspect-ratio: 3 / 4; object-fit: cover; }
    .card-info { padding: 0.75rem 1rem; }
    .page-num { font-size: 0.75rem; color: #aaa; text-transform: uppercase; letter-spacing: 0.05em; }
    .page-title { font-size: 1rem; font-weight: 600; margin-top: 0.25rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(data.topic)}</h1>
  <div class="meta">${escapeHtml(data.date)} &middot; ${data.pages.length} pages</div>
  <div class="grid">${cards}</div>
</body>
</html>`;

  const previewPath = path.join(outputDir, "preview.html");
  fs.writeFileSync(previewPath, html, "utf-8");
  return previewPath;
}

async function generateImage(
  client: GoogleGenAI,
  prompt: string
): Promise<Buffer | null> {
  const parts: Part[] = [{ text: prompt }];

  const response = await client.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: ASPECT_RATIO as "3:4",
        imageSize: RESOLUTION as "1K",
      },
    },
  });

  const responseParts = response.candidates?.[0]?.content?.parts;
  if (!responseParts) return null;

  for (const part of responseParts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePromptsData(data: PromptsData): PromptsData {
  const normalized = { ...data };
  normalized.style = STYLE;
  normalized.aspect_ratio = ASPECT_RATIO;
  normalized.resolution = RESOLUTION;
  return normalized;
}

async function main() {
  const { promptsFile, pages: targetPages, dryRun } = parseArgs();
  const promptsPath = path.resolve(process.cwd(), promptsFile);

  if (!fs.existsSync(promptsPath)) {
    console.error(`Prompts file not found: ${promptsPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(promptsPath, "utf-8");
  const parsed = JSON.parse(raw) as PromptsData;
  const data = normalizePromptsData(parsed);

  if (!data.pages || data.pages.length < 6 || data.pages.length > 8) {
    console.error("Skill rule check failed: pages must be 6-8.");
    process.exit(1);
  }

  let pagesToGenerate = data.pages;
  if (targetPages) {
    const targetSet = new Set(targetPages);
    pagesToGenerate = data.pages.filter((page) => targetSet.has(page.page));
    if (pagesToGenerate.length === 0) {
      console.error(`Error: No matching pages found for: ${targetPages.join(",")}`);
      process.exit(1);
    }
  }

  const safeTopic = data.topic.replace(/ /g, "_").replace(/\//g, "_");
  const outputDir = path.join(process.cwd(), "output", `${safeTopic}_${data.date}`);
  fs.mkdirSync(outputDir, { recursive: true });

  if (dryRun) {
    console.log(`=== Dry Run: ${data.topic} (${data.date}) ===\n`);
    for (let i = 0; i < pagesToGenerate.length; i++) {
      const page = pagesToGenerate[i];
      const promptPreview =
        page.prompt.length > 200 ? `${page.prompt.slice(0, 200)}...` : page.prompt;
      console.log(`[${i + 1}/${pagesToGenerate.length}] Page ${page.page}: ${page.title}`);
      console.log(`  Prompt: ${promptPreview}`);
      console.log();
    }
    console.log(`Output would be saved to: ${outputDir}`);
    return;
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error("Error: GOOGLE_AI_API_KEY environment variable is not set.");
    process.exit(1);
  }

  const client = new GoogleGenAI({ apiKey });

  console.log(`=== Generating: ${data.topic} (${data.date}) ===\n`);

  let successCount = 0;
  for (let i = 0; i < pagesToGenerate.length; i++) {
    const page = pagesToGenerate[i];
    console.log(`[${i + 1}/${pagesToGenerate.length}] Generating: ${page.title}...`);

    let imageData: Buffer | null = null;
    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        imageData = await generateImage(client, page.prompt);
        if (imageData) break;
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        if (attempt < maxRetries - 1) {
          const backoff = Math.min(2000 * Math.pow(2, attempt), 60000);
          console.log(`  Attempt ${attempt + 1}/${maxRetries} failed: ${errMsg}`);
          console.log(`  Retrying in ${backoff / 1000}s...`);
          await sleep(backoff);
        } else {
          console.log(`  Failed after ${maxRetries} attempts: ${errMsg}`);
        }
      }
    }

    if (imageData) {
      const filename = `page_${String(page.page).padStart(2, "0")}.png`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, imageData);
      console.log(`  Saved: ${filepath}`);
      successCount++;
    } else {
      console.log(`  FAILED: Could not generate image for page ${page.page}`);
    }

    if (i < pagesToGenerate.length - 1) {
      await sleep(1000);
    }
  }

  const previewPath = renderPreview(outputDir, data);

  console.log("\n=== Done ===");
  console.log(`Generated: ${successCount}/${pagesToGenerate.length} pages`);
  console.log(`Output: ${outputDir}`);
  console.log(`Preview: ${previewPath}`);
}

main();
