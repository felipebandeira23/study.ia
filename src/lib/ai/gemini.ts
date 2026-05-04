import { GoogleGenAI } from "@google/genai";

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
    // Strip possible markdown code blocks
    const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
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
  level: "iniciante" | "intermediário" | "avançado" = "iniciante"
): Promise<string> {
  const systemInstruction = `Você é um especialista em educação e planejamento de estudos.
Crie planos de estudo detalhados, práticos e motivadores.
Organize o plano por dias/semanas de forma clara.
Inclua recursos sugeridos, exercícios e marcos de progresso.
Responda sempre em português do Brasil.`;

  return generateText(
    `Crie um plano de estudo de ${durationDays} dias para o tópico: "${topic}".
Nível do estudante: ${level}.
O plano deve ser detalhado, com atividades diárias e objetivos claros.`,
    { systemInstruction }
  );
}
