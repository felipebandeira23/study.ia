import { getContestNewsFeed } from "@/lib/contests/news-feed";

const originalFetch = global.fetch;

const rssWithINSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[Novo edital do INSS é publicado]]></title>
      <description><![CDATA[Concurso INSS com atualização do cronograma e vagas.]]></description>
      <link>https://example.com/inss-edital</link>
      <pubDate>Mon, 05 May 2026 10:00:00 GMT</pubDate>
      <source url="https://example.com">Portal Confiável A</source>
    </item>
  </channel>
</rss>`;

const rssGeneral = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[Concurso da área fiscal abre inscrições]]></title>
      <description><![CDATA[Órgão anuncia novas vagas em concurso público.]]></description>
      <link>https://example.com/fiscal-inscricoes</link>
      <pubDate>Tue, 06 May 2026 12:30:00 GMT</pubDate>
      <source url="https://example.com">Portal Confiável B</source>
    </item>
  </channel>
</rss>`;

beforeEach(() => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      text: async () => rssWithINSS,
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      text: async () => rssGeneral,
    } as Response);
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("getContestNewsFeed", () => {
  it("returns real-news shaped items with required metadata", async () => {
    const result = await getContestNewsFeed([], 6);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toMatchObject({
      title: expect.any(String),
      summary: expect.any(String),
      source: expect.any(String),
      url: expect.stringContaining("https://"),
      aiAssisted: false,
    });
  });

  it("prioritizes items related to tracked contests", async () => {
    const result = await getContestNewsFeed([{ name: "INSS" }], 6);

    expect(result[0]?.contestName).toBe("INSS");
    expect(result[0]?.title).toMatch(/INSS/i);
  });

  it("filters items when search query is provided", async () => {
    const result = await getContestNewsFeed([], 6, "fiscal");

    expect(result).toHaveLength(1);
    expect(result[0]?.title).toMatch(/fiscal/i);
  });
});
