import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export type ProviderAI = "groq" | "google";

export function ambilModel() {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  const envProvider = process.env.AI_PROVIDER?.trim().toLowerCase();
  const rawModel =
    process.env.AI_MODEL?.trim() || process.env.GEMINI_MODEL?.trim() || "";

  // Pilih groq jika GROQ_API_KEY tersedia dan provider bukan dipaksa google
  const pakaiGroq =
    Boolean(groqKey) && (envProvider === "groq" || !envProvider || !googleKey);

  if (pakaiGroq && groqKey) {
    // Jika nama model di .env masih berawalan gemini, gunakan default model cepat Groq
    const modelId =
      !rawModel || rawModel.toLowerCase().includes("gemini")
        ? "llama-3.3-70b-versatile"
        : rawModel;

    const groq = createGroq({ apiKey: groqKey });
    return {
      provider: "groq" as const,
      modelId,
      model: groq(modelId),
    };
  }

  if (googleKey) {
    const modelId =
      rawModel && rawModel.toLowerCase().includes("gemini")
        ? rawModel
        : process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

    const google = createGoogleGenerativeAI({ apiKey: googleKey });
    return {
      provider: "google" as const,
      modelId,
      model: google(modelId),
    };
  }

  throw new Error(
    "Belum ada GROQ_API_KEY atau GOOGLE_GENERATIVE_AI_API_KEY yang aktif di file .env",
  );
}
