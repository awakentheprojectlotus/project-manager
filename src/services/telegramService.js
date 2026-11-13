const API_BASE = (import.meta.env.VITE_AI_API_BASE || '').replace(/\/$/, '');
const REMINDER_TIMEOUT_MS = 25000;

export const sendTelegramReminder = async ({ chatId, memberName, tasks }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMINDER_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/api/telegram/reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, memberName, tasks }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error || 'Telegram reminder failed.');
      error.code = data.code || 'TELEGRAM_ERROR';
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Telegram request timed out.');
      timeoutError.code = 'NETWORK_ERROR';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};
