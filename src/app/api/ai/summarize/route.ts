import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStudySummary } from "@/lib/ai/gemini";
import { buildNoteTitle, buildPdfNoteTitle } from "@/lib/utils";

// Force Node.js runtime so pdf-parse (pdfjs) works correctly on Vercel.
export const runtime = "nodejs";

const MAX_CONTENT_CHARS = 50000;
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

class BadRequestError extends Error {
  statusCode = 400;
}

class PdfExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfExtractionError";
  }
}

type SummaryInput = {
  content: string;
  title: string;
};

function normalizeManualContent(content: unknown): string {
  if (typeof content !== "string") {
    return "";
  }

  return content.trim();
}

function validateContentLength(content: string) {
  if (content.length > MAX_CONTENT_CHARS) {
    throw new BadRequestError(
      "O conteúdo é muito longo (máximo 50.000 caracteres)"
    );
  }
}

export async function extractPdfText(file: File): Promise<string> {
  // Dynamic import isolates pdf-parse (and its native deps) from the text-only
  // code path. If the library fails to load in a given environment, only PDF
  // requests are affected; text-only requests continue to work normally.
  let PDFParse: (typeof import("pdf-parse"))["PDFParse"];
  try {
    ({ PDFParse } = await import("pdf-parse"));
  } catch (importErr) {
    console.error(
      "[summarize] Failed to load pdf-parse module:",
      importErr instanceof Error ? importErr.message : importErr
    );
    throw new PdfExtractionError(
      "O módulo de leitura de PDF não está disponível neste ambiente. Tente colar o texto manualmente."
    );
  }

  let parser: InstanceType<typeof PDFParse> | null = null;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text.trim();
  } catch (err) {
    console.error("[summarize] PDF extraction failed:", err instanceof Error ? err.message : err);
    throw new PdfExtractionError(
      err instanceof Error ? err.message : "Falha ao processar o PDF"
    );
  } finally {
    if (parser) {
      await parser.destroy().catch((err: unknown) => {
        console.warn("[summarize] Failed to destroy PDF parser:", err instanceof Error ? err.message : err);
      });
    }
  }
}

function validatePdf(file: File) {
  const isPdfType =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdfType) {
    throw new BadRequestError("Arquivo inválido. Envie um PDF.");
  }

  if (file.size === 0) {
    throw new BadRequestError("O arquivo PDF está vazio.");
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    throw new BadRequestError("O PDF é muito grande (máximo 10MB).");
  }
}

export async function parseSummaryInput(request: NextRequest): Promise<SummaryInput> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const uploadedFile = formData.get("file");
    const manualContent = normalizeManualContent(formData.get("content"));
    const file = uploadedFile instanceof File ? uploadedFile : null;

    if (file) {
      validatePdf(file);

      const extractedText = await extractPdfText(file);

      if (!extractedText) {
        throw new BadRequestError("Não foi possível extrair texto deste PDF. O arquivo pode estar protegido ou sem texto selecionável.");
      }

      validateContentLength(extractedText);

      return {
        content: extractedText,
        title: buildPdfNoteTitle(file.name, extractedText),
      };
    }

    if (!manualContent) {
      throw new BadRequestError(
        "Informe um texto para resumo ou envie um arquivo PDF."
      );
    }

    validateContentLength(manualContent);
    return { content: manualContent, title: buildNoteTitle(manualContent) };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new BadRequestError("Payload inválido. Envie JSON com o campo 'content'.");
  }

  const manualContent = normalizeManualContent((body as { content?: string })?.content);

  if (!manualContent) {
    throw new BadRequestError("O campo 'content' é obrigatório");
  }

  validateContentLength(manualContent);
  return { content: manualContent, title: buildNoteTitle(manualContent) };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("[summarize] Unauthenticated request");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { content, title } = await parseSummaryInput(request);

    console.info(`[summarize] Generating summary for user=${user.id} contentLength=${content.length}`);

    const summary = await generateStudySummary(content);

    console.info(`[summarize] Summary generated successfully, attempting to save for user=${user.id}`);

    const { data: note, error: insertError } = await supabase
      .from("study_notes")
      .insert({
        user_id: user.id,
        title,
        content,
        summary,
      })
      .select("id, title")
      .single();

    if (insertError) {
      // The summary was generated successfully — don't block the user.
      // Return it with saved: false so the UI can show it while also
      // making clear it wasn't persisted.
      console.error("[summarize] Error saving note to study_notes:", insertError.message, "code:", insertError.code ?? "unknown");
      return NextResponse.json({ summary, saved: false }, { status: 200 });
    }

    console.info(`[summarize] Summary saved note=${note.id} user=${user.id}`);
    return NextResponse.json({ summary, note, saved: true });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    if (error instanceof PdfExtractionError) {
      return NextResponse.json(
        { error: `Erro ao processar o PDF: ${error.message}` },
        { status: 422 }
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("GOOGLE_AI_STUDIO_API_KEY environment variable is not set")
    ) {
      console.error("[summarize] Missing GOOGLE_AI_STUDIO_API_KEY");
      return NextResponse.json(
        { error: "Configuração da IA ausente no servidor. Tente novamente mais tarde." },
        { status: 503 }
      );
    }

    console.error("[summarize] Unexpected error:", error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error("[summarize] Stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Erro interno ao gerar resumo" },
      { status: 500 }
    );
  }
}
