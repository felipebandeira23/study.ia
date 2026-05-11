import { GoogleGenAI } from "@google/genai";
import { stripMarkdownCodeBlock } from "@/lib/utils";

export const DEFAULT_MODEL = "gemini-2.0-flash";

function getClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_STUDIO_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
}

export interface GenerateTextOptions {
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface StudyPlanContext {
  contestName?: string;
  organizer?: string;
  examDate?: string;
  editalText?: string;
  notes?: string;
  previousExamsNotes?: string;
}

export interface ContestNewsContext {
  name: string;
  organizer?: string | null;
  examDate?: string | null;
  notes?: string | null;
}

export interface ContestNewsItem {
  title: string;
  summary: string;
  relevance: string;
  contestName: string;
  sourceType: "ai_curated";
  sourceLabel: string;
}

/**
 * Generates text using Google AI Studio (Gemini).
 * This function must only be called server-side (Route Handlers, Server Actions, Server Components).
 */
export async function generateText(
  prompt: string,
  options: GenerateTextOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    systemInstruction,
    temperature = 0.7,
    maxOutputTokens = 2048,
  } = options;

  const ai = getClient();

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      ...(systemInstruction ? { systemInstruction } : {}),
      temperature,
      maxOutputTokens,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from AI model");
  }

  return text;
}

/**
 * Generates a study summary for the provided content.
 */
export async function generateStudySummary(content: string): Promise<string> {
  const systemInstruction = `Você é um assistente educacional especializado em criar resumos de estudo.
Seu objetivo é criar resumos claros, organizados e fáceis de entender.
Use marcadores, títulos e destaques quando apropriado.
Responda sempre em português do Brasil.`;

  return generateText(
    `Por favor, crie um resumo de estudo completo para o seguinte conteúdo:\n\n${content}`,
    { systemInstruction }
  );
}

/**
 * Generates flashcards from the provided content.
 * Returns JSON string with array of {front, back} objects.
 */
export async function generateFlashcards(
  content: string,
  count: number = 10
): Promise<Array<{ front: string; back: string }>> {
  const systemInstruction = `Você é um assistente educacional especializado em criar flashcards para estudo.
Crie flashcards com perguntas e respostas claras e concisas.
Responda APENAS com um array JSON válido no formato: [{"front": "pergunta", "back": "resposta"}]
Não inclua nenhum texto adicional, apenas o JSON.`;

  const text = await generateText(
    `Crie ${count} flashcards para estudar o seguinte conteúdo:\n\n${content}`,
    { systemInstruction, temperature: 0.5 }
  );

  try {
    const cleaned = stripMarkdownCodeBlock(text);
    return JSON.parse(cleaned) as Array<{ front: string; back: string }>;
  } catch {
    throw new Error("Failed to parse flashcards response as JSON");
  }
}

/**
 * Generates a study plan for a given topic and time frame.
 */
export async function generateStudyPlan(
  topic: string,
  durationDays: number,
  level: "iniciante" | "intermediário" | "avançado" = "iniciante",
  context: StudyPlanContext = {}
): Promise<string> {
  const systemInstruction = `Você é um especialista em educação e planejamento de estudos.
Crie planos de estudo detalhados, práticos e motivadores.
Organize o plano por dias/semanas de forma clara.
Inclua recursos sugeridos, exercícios e marcos de progresso.
Quando houver contexto de concurso, use-o para priorização das disciplinas e estratégia.
Não invente fatos externos. Se algum dado não for fornecido, declare a premissa.
Responda sempre em português do Brasil.`;

  const contestContext = [
    context.contestName ? `Concurso: ${context.contestName}` : null,
    context.organizer ? `Banca/organizador: ${context.organizer}` : null,
    context.examDate ? `Data da prova: ${context.examDate}` : null,
    context.editalText ? `Edital/texto-base:\n${context.editalText}` : null,
    context.previousExamsNotes
      ? `Informações sobre provas anteriores fornecidas pelo usuário:\n${context.previousExamsNotes}`
      : "Provas anteriores: não fornecidas. Oriente como validar e complementar esse ponto.",
    context.notes ? `Observações adicionais:\n${context.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return generateText(
    `Crie um plano de estudo de ${durationDays} dias para o tópico: "${topic}".
Nível do estudante: ${level}.
O plano deve ser detalhado, com atividades diárias e objetivos claros.

Contexto adicional:
${contestContext || "Nenhum contexto de concurso adicional informado."}`,
    { systemInstruction }
  );
}

export async function generateContestNewsFeed(
  contests: ContestNewsContext[],
  maxItems: number = 6
): Promise<ContestNewsItem[]> {
  const systemInstruction = `Você é um curador de notícias para estudantes de concursos públicos.
Retorne APENAS JSON válido, sem markdown e sem texto adicional.
Não afirme fatos externos como verificados. Trate o conteúdo como curadoria assistida por IA.
Sempre inclua orientação para confirmação em fontes oficiais no campo sourceLabel.`;

  const prompt = `Gere até ${Math.min(Math.max(maxItems, 1), 10)} itens de feed para concursos públicos.
Cada item deve seguir EXATAMENTE o formato:
{
  "title": "string",
  "summary": "string",
  "relevance": "string",
  "contestName": "string",
  "sourceType": "ai_curated",
  "sourceLabel": "Curadoria assistida por IA. Confirme em fontes oficiais."
}

Contexto de concursos rastreados pelo usuário:
${JSON.stringify(contests, null, 2)}

Regras:
- Se não houver concursos rastreados, gere itens gerais de orientação para concursos.
- Evite datas, números ou fatos específicos não comprovados.
- Use linguagem objetiva e útil para planejamento.
- Responda apenas com um array JSON.`;

  const text = await generateText(prompt, {
    systemInstruction,
    temperature: 0.4,
    maxOutputTokens: 1400,
  });

  try {
    const cleaned = stripMarkdownCodeBlock(text);
    const parsed = JSON.parse(cleaned) as ContestNewsItem[];
    return parsed
      .filter((item) => typeof item?.title === "string" && typeof item?.summary === "string")
      .slice(0, Math.min(Math.max(maxItems, 1), 10))
      .map((item) => ({
        ...item,
        sourceType: "ai_curated",
        sourceLabel: "Curadoria assistida por IA. Confirme em fontes oficiais.",
      }));
  } catch {
    throw new Error("Failed to parse contest news feed response as JSON");
  }
}
