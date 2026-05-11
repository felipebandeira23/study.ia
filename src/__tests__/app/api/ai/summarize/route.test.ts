import { NextRequest } from "next/server";
import { POST, extractPdfText, parseSummaryInput } from "@/app/api/ai/summarize/route";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGenerateContent = jest.fn();

jest.mock("@google/genai", () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

const mockGetUser = jest.fn();
const mockInsert = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockImplementation(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockInsert,
          }),
        }),
      }),
    })
  ),
}));

const mockPdfGetText = jest.fn();
const mockPdfDestroy = jest.fn();

jest.mock("pdf-parse", () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: mockPdfGetText,
    destroy: mockPdfDestroy,
  })),
}));
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeJsonRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/ai/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeFormRequest(fields: Record<string, string | File>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  return new NextRequest("http://localhost/api/ai/summarize", {
    method: "POST",
    body: formData,
  });
}

function makePdfFile(content: string, name = "test.pdf", type = "application/pdf") {
  return new File([content], name, { type });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GOOGLE_AI_STUDIO_API_KEY = "test-key";

  // Authenticated user by default
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });

  // Successful summary generation
  mockGenerateContent.mockResolvedValue({ text: "Resumo gerado pela IA" });

  // Successful DB insert
  mockInsert.mockResolvedValue({
    data: { id: "note-1", title: "Título do resumo" },
    error: null,
  });

  // PDF extraction succeeds by default
  mockPdfGetText.mockResolvedValue({ text: "Texto extraído do PDF" });
  mockPdfDestroy.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// POST — unauthenticated
// ---------------------------------------------------------------------------

describe("POST /api/ai/summarize — authentication", () => {
  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = makeJsonRequest({ content: "Conteúdo de teste" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/não autorizado/i);
  });
});

// ---------------------------------------------------------------------------
// POST — text input (JSON)
// ---------------------------------------------------------------------------

describe("POST /api/ai/summarize — text input", () => {
  it("returns 200 with summary for valid text content", async () => {
    const req = makeJsonRequest({ content: "A fotossíntese é o processo..." });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { summary: string; saved: boolean };
    expect(body.summary).toBe("Resumo gerado pela IA");
    expect(body.saved).toBe(true);
  });

  it("returns 400 when content is missing", async () => {
    const req = makeJsonRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/content/i);
  });

  it("returns 400 when content is empty string", async () => {
    const req = makeJsonRequest({ content: "   " });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 when content exceeds 50,000 characters", async () => {
    const req = makeJsonRequest({ content: "A".repeat(50_001) });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/longo/i);
  });

  it("returns 400 when JSON body is malformed", async () => {
    const req = new NextRequest("http://localhost/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-valid-json",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/payload/i);
  });
});

// ---------------------------------------------------------------------------
// POST — PDF upload
// ---------------------------------------------------------------------------

describe("POST /api/ai/summarize — PDF upload", () => {
  it("returns 200 with summary when a valid PDF is uploaded", async () => {
    const file = makePdfFile("binary-pdf-data");
    const req = makeFormRequest({ file });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { summary: string };
    expect(body.summary).toBe("Resumo gerado pela IA");
  });

  it("returns 400 when uploaded file is not a PDF", async () => {
    const file = new File(["content"], "notes.txt", { type: "text/plain" });
    const req = makeFormRequest({ file });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/PDF/i);
  });

  it("returns 400 when PDF file is empty", async () => {
    const file = new File([], "empty.pdf", { type: "application/pdf" });
    const req = makeFormRequest({ file });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/vazio/i);
  });

  it("returns 400 when extracted PDF text is empty", async () => {
    mockPdfGetText.mockResolvedValue({ text: "" });

    const file = makePdfFile("data");
    const req = makeFormRequest({ file });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/extrair texto/i);
  });

  it("returns 422 when PDF parser throws an error", async () => {
    mockPdfGetText.mockRejectedValue(new Error("PDF parse failure"));

    const file = makePdfFile("corrupt");
    const req = makeFormRequest({ file });

    const res = await POST(req);

    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/PDF/i);
  });
});

// ---------------------------------------------------------------------------
// POST — AI failure
// ---------------------------------------------------------------------------

describe("POST /api/ai/summarize — AI failure", () => {
  it("returns 503 when AI API key is not configured", async () => {
    mockGenerateContent.mockRejectedValue(
      new Error("GOOGLE_AI_STUDIO_API_KEY environment variable is not set")
    );

    const req = makeJsonRequest({ content: "Conteúdo" });
    const res = await POST(req);

    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/IA/i);
  });

  it("returns 500 on unexpected AI error", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Network timeout"));

    const req = makeJsonRequest({ content: "Conteúdo" });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST — persistence failure
// ---------------------------------------------------------------------------

describe("POST /api/ai/summarize — persistence failure", () => {
  it("returns 200 with summary and saved:false when DB insert fails", async () => {
    mockInsert.mockResolvedValue({
      data: null,
      error: { message: "unique constraint violated", code: "23505" },
    });

    const req = makeJsonRequest({ content: "Conteúdo" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { summary: string; saved: boolean };
    expect(body.summary).toBe("Resumo gerado pela IA");
    expect(body.saved).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// extractPdfText — unit tests
// ---------------------------------------------------------------------------

describe("extractPdfText", () => {
  it("returns trimmed text from a PDF file", async () => {
    mockPdfGetText.mockResolvedValue({ text: "  Conteúdo do PDF  " });

    const file = makePdfFile("data");
    const result = await extractPdfText(file);

    expect(result).toBe("Conteúdo do PDF");
    expect(mockPdfDestroy).toHaveBeenCalled();
  });

  it("calls destroy even when getText throws", async () => {
    mockPdfGetText.mockRejectedValue(new Error("parse error"));

    const file = makePdfFile("data");
    await expect(extractPdfText(file)).rejects.toThrow();
    expect(mockPdfDestroy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// parseSummaryInput — multipart with text fallback
// ---------------------------------------------------------------------------

describe("parseSummaryInput — multipart text fallback", () => {
  it("falls back to manual text when no file is provided in multipart", async () => {
    const req = makeFormRequest({ content: "Texto manual via form" });
    const input = await parseSummaryInput(req);

    expect(input.content).toBe("Texto manual via form");
  });

  it("returns 400 when neither file nor content is present in multipart", async () => {
    const req = makeFormRequest({});
    await expect(parseSummaryInput(req)).rejects.toThrow(/texto|PDF/i);
  });
});
