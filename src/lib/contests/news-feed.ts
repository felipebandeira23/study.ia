export interface ContestNewsContext {
  name: string;
  organizer?: string | null;
  examDate?: string | null;
  notes?: string | null;
}

export interface ContestNewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string | null;
  contestName: string | null;
  aiAssisted: boolean;
}

type RssSource = {
  name: string;
  url: string;
};

type RawRssItem = {
  title: string;
  summary: string;
  url: string;
  publishedAt: string | null;
  source: string;
};

const RSS_SOURCES: RssSource[] = [
  {
    name: "Google News — Concursos Públicos",
    url: "https://news.google.com/rss/search?q=concurso+publico+edital+Brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  },
  {
    name: "Google News — Concursos Abertos",
    url: "https://news.google.com/rss/search?q=concursos+abertos+Brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  },
];

const FETCH_TIMEOUT_MS = 8000;
const RSS_REVALIDATE_SECONDS = 900; // 15 minutes balances recency and external source load.
const RELATED_CONTEST_SCORE = 10;
const PUBLISHED_AT_SCORE_DIVISOR = 1e11;

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(value.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(xmlChunk: string, tag: string): string {
  const match = xmlChunk.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function parsePubDate(value: string): string | null {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

function parseRssItems(xml: string, fallbackSource: string): RawRssItem[] {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return itemMatches
    .map((chunk) => {
      const title = stripHtml(extractTag(chunk, "title"));
      const summary = stripHtml(extractTag(chunk, "description"));
      const url = stripHtml(extractTag(chunk, "link"));
      const source = stripHtml(extractTag(chunk, "source")) || fallbackSource;
      const publishedAt = parsePubDate(stripHtml(extractTag(chunk, "pubDate")));

      return {
        title,
        summary,
        url,
        source,
        publishedAt,
      };
    })
    .filter((item) => item.title && item.url);
}

async function fetchRssSource(source: RssSource): Promise<RawRssItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      next: { revalidate: RSS_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.warn(`[contest-news] RSS source unavailable: ${source.name} (${response.status})`);
      return [];
    }

    const xml = await response.text();
    return parseRssItems(xml, source.name);
  } catch (error) {
    console.warn(
      `[contest-news] Failed to fetch RSS source: ${source.name}`,
      error instanceof Error ? error.message : error
    );
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function getRelatedContestName(item: RawRssItem, contests: ContestNewsContext[]): string | null {
  const content = normalize(`${item.title} ${item.summary}`);

  for (const contest of contests) {
    const contestName = contest.name.trim();
    if (!contestName) {
      continue;
    }

    const normalizedContest = normalize(contestName);
    if (content.includes(normalizedContest)) {
      return contestName;
    }
  }

  return null;
}

function containsSearch(item: RawRssItem, search: string): boolean {
  if (!search) {
    return true;
  }

  const haystack = normalize(`${item.title} ${item.summary} ${item.source}`);
  return haystack.includes(search);
}

export async function getContestNewsFeed(
  contests: ContestNewsContext[],
  maxItems: number = 6,
  searchQuery?: string
): Promise<ContestNewsItem[]> {
  const safeLimit = Math.min(Math.max(maxItems, 1), 12);
  const normalizedSearch = normalize(searchQuery?.trim() ?? "");

  const results = await Promise.all(RSS_SOURCES.map((source) => fetchRssSource(source)));
  const merged = results.flat();

  const deduplicated = Array.from(
    new Map(merged.map((item) => [item.url, item])).values()
  );

  const filteredBySearch = deduplicated.filter((item) => containsSearch(item, normalizedSearch));

  const withContext = filteredBySearch.map((item) => {
    const relatedContest = getRelatedContestName(item, contests);
    const score =
      (relatedContest ? RELATED_CONTEST_SCORE : 0) +
      (item.publishedAt ? Date.parse(item.publishedAt) / PUBLISHED_AT_SCORE_DIVISOR : 0);

    return {
      item,
      relatedContest,
      score,
    };
  });

  const sorted = withContext.sort((a, b) => b.score - a.score);

  return sorted.slice(0, safeLimit).map(({ item, relatedContest }) => ({
    title: item.title,
    summary: item.summary,
    source: item.source,
    url: item.url,
    publishedAt: item.publishedAt,
    contestName: relatedContest,
    aiAssisted: false,
  }));
}
