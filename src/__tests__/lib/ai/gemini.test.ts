import { generateFlashcards, DEFAULT_MODEL } from "@/lib/ai/gemini";

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
