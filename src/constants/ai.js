export const AI_PROVIDER_LABELS = {
  opencode: 'OpenCode',
  gemini: 'Gemini',
  local: 'Local engine',
};

export const getAiProviderLabel = (provider) =>
  AI_PROVIDER_LABELS[provider] || (provider ? String(provider) : 'Local engine');

export const DEFAULT_OPENCODE_MODEL = 'deepseek-v4.1-flash';
