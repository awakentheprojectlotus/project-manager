const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] || char);

export const isValidTelegramChatId = (value) => {
  const chatId = String(value ?? '').trim();
  return /^(@[A-Za-z0-9_]{4,}|-?\d{1,20})$/.test(chatId);
};

export const buildReminderMessage = ({ memberName, tasks }) => {
  const name = escapeHtml(String(memberName || 'there').slice(0, 80));
  const list = (Array.isArray(tasks) ? tasks : []).slice(0, 15);

  if (!list.length) {
    return `Hi <b>${name}</b>, you have no open tasks right now. 🎉`;
  }

  const lines = list.map((task, index) => {
    const title = escapeHtml(String(task.title || 'Untitled task').slice(0, 140));
    const meta = [
      task.project ? `Project: ${escapeHtml(String(task.project).slice(0, 80))}` : '',
      task.status ? `Status: ${escapeHtml(String(task.status).slice(0, 40))}` : '',
      task.priority ? `Priority: ${escapeHtml(String(task.priority).slice(0, 20))}` : '',
      task.due ? `Due: ${escapeHtml(String(task.due).slice(0, 40))}` : '',
    ].filter(Boolean);
    return `${index + 1}. <b>${title}</b>${meta.length ? `\n   ${meta.join(' · ')}` : ''}`;
  });

  const extra =
    Array.isArray(tasks) && tasks.length > 15
      ? `\n\n…and ${tasks.length - 15} more.`
      : '';

  return `🔔 <b>Task reminder</b>\n\nHi <b>${name}</b>, here are your open tasks:\n\n${lines.join(
    '\n\n'
  )}${extra}\n\nPlease update your progress in Pulse.`;
};
