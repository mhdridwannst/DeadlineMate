import { createGroq } from "@ai-sdk/groq";

export function ambilModel() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const modelId = process.env.AI_MODEL?.trim();

  if (!apiKey) {
    throw new Error("GROQ_API_KEY belum diisi di file .env");
  }
  if (!modelId) {
    throw new Error(
      "AI_MODEL belum diisi di file .env. Salin ID model persis dari console.groq.com/docs/models",
    );
  }

  const groq = createGroq({ apiKey });
  return { provider: "groq" as const, modelId, model: groq(modelId) };
}
