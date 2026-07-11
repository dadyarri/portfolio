import * as cheerio from "cheerio";
import type { AnyNode, Element, ParentNode } from "domhandler";
import { normalizeWhitespace } from "./text.ts";
import type { VacancyExtraction } from "./types.ts";

const dropSelectors = [
  "script",
  "style",
  "noscript",
  "svg",
  "header",
  "footer",
  "nav",
  "aside",
  "form",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  "[aria-label*='cookie' i]",
  "[class*='cookie' i]",
  "[id*='cookie' i]",
  "[class*='consent' i]",
  "[id*='consent' i]",
  "[class*='footer' i]",
  "[class*='header' i]",
  "[class*='nav' i]",
  "[class*='sidebar' i]",
  "[class*='subscribe' i]",
  "[class*='recommend' i]",
  "[class*='vacancy-similar' i]",
  "[class*='related' i]",
] as const;

const preferredSelectors = [
  "main article",
  "main",
  "article",
  "[role='main']",
  "[class*='vacancy' i]",
  "[class*='job' i]",
  "[class*='description' i]",
  "[class*='content' i]",
] as const;

const blockTags = new Set([
  "address","article","br","dd","div","dl","dt","fieldset","figcaption","figure","footer",
  "h1","h2","h3","h4","h5","h6","header","hr","li","main","ol","p","section","table",
  "tbody","td","th","thead","tr","ul",
]);

function extractTextWithBreaks(node: AnyNode | null | undefined): string {
  if (!node) {
    return "";
  }

  if (node.type === "text") {
    return node.data ?? "";
  }

  if (node.type !== "tag" && node.type !== "root") {
    return "";
  }

  const tagName = node.type === "tag" ? node.name.toLowerCase() : "";
  if (tagName === "br") {
    return "\n";
  }

  const chunks: string[] = [];
  for (const child of ("children" in node ? node.children : []) ?? []) {
    chunks.push(extractTextWithBreaks(child));
  }

  const combined = chunks.join("");
  if (tagName && blockTags.has(tagName)) {
    return `\n${combined}\n`;
  }

  return combined;
}

function cleanTextBlock(text: string): string {
  return normalizeWhitespace(text)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 2)
    .filter((line) => !/^accept|cookie|privacy policy|sign in|log in/i.test(line))
    .join("\n");
}

function normalizeVacancyTitle(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const compact = value.replace(/\s+/g, " ").trim();
  const patterns = [
    /^вакансия\s+(.+?)\s+в\s+.+?,\s+работа\s+в\s+компании\s+.+$/i,
    /^вакансия\s+(.+?)\s+в\s+.+$/i,
    /^(.+?)\s+в\s+.+?,\s+работа\s+в\s+компании\s+.+$/i,
    /^(.+?)\s+\|\s*.+$/,
  ];

  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return compact;
}

function scoreCandidate(element: Element) {
  const text = cleanTextBlock(extractTextWithBreaks(element));
  if (!text) {
    return { score: -1, text };
  }

  const paragraphs = text.split("\n").length;
  const lengthScore = Math.min(text.length / 250, 20);
  const paragraphScore = Math.min(paragraphs, 20);
  const headingBonus = /(requirements|responsibilities|about the role|обязанности|требования|условия)/i.test(text)
    ? 10
    : 0;

  return { score: lengthScore + paragraphScore + headingBonus, text };
}

function extractFragments($: cheerio.CheerioAPI, root: ParentNode | undefined) {
  const title = normalizeVacancyTitle(cleanTextBlock($("title").first().text())) || undefined;
  const canonicalUrl = $("link[rel='canonical']").attr("href") || undefined;
  const heading =
    normalizeVacancyTitle(
      cleanTextBlock(
        $(root)
          .find("h1, [data-qa*='title' i], [class*='title' i]")
          .first()
          .text(),
      ),
    ) || undefined;
  const company = cleanTextBlock(
    $(root)
      .find("[class*='company' i], [data-qa*='company' i], [itemprop='hiringOrganization']")
      .first()
      .text(),
  ) || undefined;
  const location = cleanTextBlock(
    $(root)
      .find("[class*='location' i], [data-qa*='location' i], [itemprop='jobLocation']")
      .first()
      .text(),
  ) || undefined;

  return { title, canonicalUrl, heading, company, location };
}

export function extractVacancyContent(html: string, sourceUrl: string): VacancyExtraction {
  const $ = cheerio.load(html);
  $(dropSelectors.join(",")).remove();

  let best: { score: number; text: string; element?: Element } = {
    score: -1,
    text: "",
    element: $("body").get(0) as Element | undefined,
  };

  for (const selector of preferredSelectors) {
    $(selector).each((_, element) => {
      const candidate = scoreCandidate(element);
      if (candidate.score > best.score) {
        best = { ...candidate, element };
      }
    });
  }

  if (best.score < 0) {
    const fallback = cleanTextBlock(extractTextWithBreaks($("body").get(0) as Element | undefined));
    best = { score: fallback.length, text: fallback, element: $("body").get(0) as Element | undefined };
  }

  const fragments = extractFragments($, best.element);

  return {
    sourceUrl,
    title: fragments.heading ?? fragments.title,
    canonicalUrl: fragments.canonicalUrl,
    company: fragments.company,
    location: fragments.location,
    normalizedText: best.text,
  };
}
