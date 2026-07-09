const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_TIMEOUT_MS = 30000;

export function getGeminiConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    timeoutMs: Number(process.env.GEMINI_API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
    baseUrl: process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
  };
}

export function assertGeminiConfigured() {
  const { apiKey } = getGeminiConfig();
  if (!apiKey) {
    const err = new Error('Gemini API is not configured. Set GEMINI_API_KEY in environment variables.');
    err.status = 503;
    err.code = 'GEMINI_NOT_CONFIGURED';
    throw err;
  }
}

export function getGenerateContentUrl() {
  const { baseUrl, model } = getGeminiConfig();
  return `${baseUrl}/models/${model}:generateContent`;
}
