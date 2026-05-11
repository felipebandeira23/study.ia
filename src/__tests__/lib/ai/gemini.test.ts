import {
  generateContestNewsFeed,
  generateFlashcards,
  generateStudyPlan,
  DEFAULT_MODEL,
} from "@/lib/ai/gemini";

// Stable mock for `generateContent` shared across all tests.
const mockGenerateContent = jest.fn();

// Mock the Google AI SDK so tests never make real network calls.
jest.mock("@google/genai", () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GOOGLE_AI_STUDIO_API_KEY = "test-key";
});

describe("DEFAULT_MODEL", () => {
  it("is defined and non-empty", () => {
    expect(typeof DEFAULT_MODEL).toBe("string");
    expect(DEFAULT_MODEL.length).toBeGreaterThan(0);
  });
});

describe("generateFlashcards", () => {
  it("parses a plain JSON array returned by the model", async () => {
    const cards = [
      { front: "O que é JavaScript?", back: "Uma linguagem de programação" },
    ];
    mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(cards) });

    const result = await generateFlashcards("JavaScript basics", 1);
    expect(result).toEqual(cards);
  });

  it("strips markdown code fences before parsing JSON", async () => {
    const cards = [{ front: "Q", back: "A" }];
    mockGenerateContent.mockResolvedValueOnce({
      text: "```json\n" + JSON.stringify(cards) + "\n```",
    });

    const result = await generateFlashcards("any topic", 1);
    expect(result).toEqual(cards);
  });

  it("throws when the model returns invalid JSON", async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: "not valid json" });

    await expect(generateFlashcards("any topic", 1)).rejects.toThrow(
      "Failed to parse flashcards response as JSON"
    );
  });

  it("throws when the model returns an empty response", async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: null });

    await expect(generateFlashcards("any topic", 1)).rejects.toThrow(
      "Empty response from AI model"
    );
  });
});

describe("generateStudyPlan", () => {
  it("includes contest context when provided", async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: "plano gerado" });

    const result = await generateStudyPlan("Direito Administrativo", 60, "intermediário", {
      contestName: "TRT",
      organizer: "FCC",
      examDate: "2026-08-10",
      editalText: "Direito Constitucional e Administrativo",
      notes: "2h por dia",
      previousExamsNotes: "Questões sobre atos administrativos",
    });

    expect(result).toBe("plano gerado");
    const payload = mockGenerateContent.mock.calls[0][0];
    expect(payload.contents).toContain("Concurso: TRT");
    expect(payload.contents).toContain("Data da prova: 2026-08-10");
    expect(payload.contents).toContain("provas anteriores");
  });
});

describe("generateContestNewsFeed", () => {
  it("parses feed items from model JSON", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify([
        {
          title: "Possível foco em legislação",
          summary: "Revisar legislação seca nas próximas semanas.",
          relevance: "Tema recorrente em concursos similares.",
          contestName: "INSS",
          sourceType: "ai_curated",
          sourceLabel: "qualquer texto",
        },
      ]),
    });

    const feed = await generateContestNewsFeed([{ name: "INSS" }], 4);
    expect(feed).toHaveLength(1);
    expect(feed[0].sourceType).toBe("ai_curated");
    expect(feed[0].sourceLabel).toContain("Confirme em fontes oficiais");
  });
});
