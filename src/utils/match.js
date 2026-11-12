const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'to',
  'for',
  'of',
  'in',
  'on',
  'at',
  'and',
  'or',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'my',
  'me',
  'i',
  'we',
  'you',
  'it',
  'that',
  'this',
  'please',
  'can',
  'could',
  'would',
  'should',
  'project',
  'projects',
  'task',
  'tasks',
  'called',
  'named',
  'titled',
  'new',
  'create',
  'add',
  'make',
  'set',
  'update',
  'change',
  'delete',
  'remove',
  'mark',
  'move',
  'assign',
  'assigned',
  'show',
  'list',
  'find',
  'all',
  'any',
  'about',
  'what',
  'which',
  'who',
  'has',
  'have',
  'with',
  'from',
  'by',
  'as',
]);

export const normalize = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (text) =>
  normalize(text)
    .split(' ')
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));

export const findBestMatch = (query, items, { getText, threshold = 0.55, extra = '' } = {}) => {
  const q = normalize(`${query} ${extra}`);
  if (!q) return null;
  const qTokens = new Set(q.split(' '));
  let best = null;

  items.forEach((item) => {
    const text = normalize(getText(item));
    if (!text) return;
    let score = 0;

    if (q.includes(text)) {
      score = 1 + Math.min(text.length, 40) / 100;
    } else {
      const tokens = tokenize(text);
      if (tokens.length) {
        const matched = tokens.filter(
          (t) =>
            qTokens.has(t) ||
            [...qTokens].some(
              (qt) => qt.length > 3 && (t.startsWith(qt) || qt.startsWith(t))
            )
        );
        score = matched.length / tokens.length;
      }
    }

    if (score > (best?.score ?? 0)) best = { item, score };
  });

  return best && best.score >= threshold ? best.item : null;
};

export const findProjectByName = (query, projects) =>
  findBestMatch(query, projects, {
    getText: (p) => `${p.name} ${p.key}`,
    threshold: 0.55,
  });

export const findMemberByName = (query, members) =>
  findBestMatch(query, members, {
    getText: (m) => `${m.name} ${m.email} ${m.role}`,
    threshold: 0.6,
  });

export const findTaskByName = (query, tasks, { projectId = null, threshold = 0.6 } = {}) => {
  const pool = projectId ? tasks.filter((t) => t.projectId === projectId) : tasks;
  const found = findBestMatch(query, pool, { getText: (t) => t.title, threshold });
  if (found) return found;
  return findBestMatch(query, pool, {
    getText: (t) => t.title,
    threshold: Math.min(threshold, 0.45),
  });
};

export const extractQuoted = (text) => {
  const match = text.match(/["“”']([^"“”']{2,120})["“”']/);
  return match ? match[1].trim() : null;
};
