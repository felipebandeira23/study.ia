import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createClient } from "@/lib/supabase/server";
import { generateStudySummary } from "@/lib/ai/gemini";
import { buildNoteTitle, buildPdfNoteTitle } from "@/lib/utils";

const MAX_CONTENT_CHARS = 50000;
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

class BadRequestError extends Error {
  statusCode = 400;
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

async function extractPdfText(file: File): Promise<string> {
  const parser = new PDFParse({
    data: Buffer.from(await file.arrayBuffer()),
  });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
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

async function parseSummaryInput(request: NextRequest): Promise<SummaryInput> {
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
        throw new BadRequestError("Não foi possível extrair texto deste PDF.");
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

  const body = await request.json();
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
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { content, title } = await parseSummaryInput(request);

    const summary = await generateStudySummary(content);

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
      console.error("Error saving summary note:", insertError);
      return NextResponse.json(
        { error: "Resumo gerado, mas não foi possível salvar no histórico" },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary, note, saved: true });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    if (
      error instanceof Error &&
      error.message.includes("GOOGLE_AI_STUDIO_API_KEY environment variable is not set")
    ) {
      return NextResponse.json(
        { error: "Configuração da IA ausente no servidor. Tente novamente mais tarde." },
        { status: 503 }
      );
    }

    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar resumo" },
      { status: 500 }
    );
  }
}
