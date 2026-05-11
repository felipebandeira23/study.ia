import {
  buildNoteTitle,
  buildDeckTitle,
  clampCardCount,
  stripMarkdownCodeBlock,
} from "@/lib/utils";

describe("buildNoteTitle", () => {
  it("returns default title for empty string", () => {
    expect(buildNoteTitle("")).toBe("Resumo de estudo");
  });

  it("returns default title for whitespace-only string", () => {
    expect(buildNoteTitle("   ")).toBe("Resumo de estudo");
  });

  it("returns content unchanged when it is within 80 characters", () => {
    const content = "Introdução ao JavaScript";
    expect(buildNoteTitle(content)).toBe(content);
  });

  it("truncates content longer than 80 characters with ellipsis", () => {
    const content = "A".repeat(81);
    const result = buildNoteTitle(content);
    expect(result).toHaveLength(80);
    expect(result.endsWith("...")).toBe(true);
  });

  it("normalises multiple spaces to a single space", () => {
    expect(buildNoteTitle("Olá   mundo")).toBe("Olá mundo");
  });

  it("returns content at exactly 80 characters without truncation", () => {
    const content = "A".repeat(80);
    expect(buildNoteTitle(content)).toBe(content);
  });
});

describe("buildDeckTitle", () => {
  it("returns default title for empty string", () => {
    expect(buildDeckTitle("")).toBe("Deck de estudos");
  });

  it("returns default title for whitespace-only string", () => {
    expect(buildDeckTitle("   ")).toBe("Deck de estudos");
  });

  it("prefixes short content with 'Deck: '", () => {
    const content = "Algoritmos de ordenação";
    expect(buildDeckTitle(content)).toBe(`Deck: ${content}`);
  });

  it("truncates content longer than 60 characters", () => {
    const content = "B".repeat(61);
    const result = buildDeckTitle(content);
    expect(result.startsWith("Deck: ")).toBe(true);
    const body = result.slice("Deck: ".length);
    expect(body).toHaveLength(60);
    expect(body.endsWith("...")).toBe(true);
  });

  it("returns content at exactly 60 characters without truncation", () => {
    const content = "C".repeat(60);
    expect(buildDeckTitle(content)).toBe(`Deck: ${content}`);
  });
});

describe("clampCardCount", () => {
  it("returns 10 when count is undefined", () => {
    expect(clampCardCount(undefined)).toBe(10);
  });

  it("returns 10 when count is null", () => {
    expect(clampCardCount(null)).toBe(10);
  });

  it("clamps to 1 for values below the minimum", () => {
    expect(clampCardCount(0)).toBe(1);
    expect(clampCardCount(-5)).toBe(1);
  });

  it("clamps to 50 for values above the maximum", () => {
    expect(clampCardCount(51)).toBe(50);
    expect(clampCardCount(100)).toBe(50);
  });

  it("returns the value as-is when within range", () => {
    expect(clampCardCount(1)).toBe(1);
    expect(clampCardCount(25)).toBe(25);
    expect(clampCardCount(50)).toBe(50);
  });
});

describe("stripMarkdownCodeBlock", () => {
  it("removes plain code fence", () => {
    const input = "```\n[{\"front\":\"Q\",\"back\":\"A\"}]\n```";
    expect(stripMarkdownCodeBlock(input)).toBe('[{"front":"Q","back":"A"}]');
  });

  it("removes json-tagged code fence", () => {
    const input = "```json\n[{\"front\":\"Q\",\"back\":\"A\"}]\n```";
    expect(stripMarkdownCodeBlock(input)).toBe('[{"front":"Q","back":"A"}]');
  });

  it("returns plain text unchanged", () => {
    const input = '[{"front":"Q","back":"A"}]';
    expect(stripMarkdownCodeBlock(input)).toBe(input);
  });

  it("trims surrounding whitespace", () => {
    const input = "  [1,2,3]  ";
    expect(stripMarkdownCodeBlock(input)).toBe("[1,2,3]");
  });
});
