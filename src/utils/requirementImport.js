import { normalizeUrl } from './links';
import { parseAmount, parseQuantity } from './currency';

const pick = (object, keys) => {
  for (const key of keys) {
    if (object?.[key] !== undefined && object?.[key] !== null && object?.[key] !== '') {
      return object[key];
    }
  }
  return undefined;
};

const normalizeType = (value, fallback) => {
  const text = String(value || '').toLowerCase();
  if (text.includes('soft') || text.includes('license') || text.includes('subscription')) {
    return 'software';
  }
  if (text.includes('hard') || text.includes('device') || text.includes('equipment')) {
    return 'hardware';
  }
  return fallback === 'hardware' ? 'hardware' : 'software';
};

export const parseRequirementJson = (text, defaultType = 'software') => {
  const trimmed = String(text || '').trim();
  if (!trimmed) return { items: [], errors: ['Paste a JSON list first.'] };

  let data;
  try {
    data = JSON.parse(trimmed);
  } catch (error) {
    return { items: [], errors: [`Invalid JSON: ${error.message}`] };
  }

  const groups = [];
  if (Array.isArray(data)) {
    groups.push({ type: null, items: data });
  } else if (data && typeof data === 'object') {
    if (Array.isArray(data.items)) {
      groups.push({ type: data.type || null, items: data.items });
    } else {
      ['software', 'hardware'].forEach((type) => {
        if (Array.isArray(data[type])) groups.push({ type, items: data[type] });
      });
      if (!groups.length) groups.push({ type: data.type || null, items: [data] });
    }
  } else {
    return { items: [], errors: ['JSON must be an array or an object.'] };
  }

  const items = [];
  const errors = [];

  groups.forEach((group) => {
    group.items.forEach((row, index) => {
      const label = `Item ${items.length + index + 1}`;
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        errors.push(`${label}: must be an object.`);
        return;
      }
      const name = pick(row, ['name', 'title', 'item', 'product', 'itemName']);
      if (!name) {
        errors.push(`${label}: missing "name".`);
        return;
      }
      const rawType = pick(row, ['type', 'category', 'kind']) || group.type || defaultType;
      const rawLink = pick(row, ['link', 'url', 'buyLink', 'purchaseLink', 'href']);
      const link = rawLink ? normalizeUrl(rawLink) : '';
      if (rawLink && !link) {
        errors.push(`${label}: invalid link was ignored.`);
      }
      items.push({
        name: String(name).trim(),
        type: normalizeType(rawType, defaultType),
        price: parseAmount(pick(row, ['price', 'cost', 'unitPrice', 'amount', 'priceValue'])),
        quantity: parseQuantity(pick(row, ['quantity', 'qty', 'count', 'units'])),
        shop: String(
          pick(row, ['shop', 'shopName', 'store', 'vendor', 'seller']) || ''
        ).trim(),
        link: link || '',
        notes: String(pick(row, ['notes', 'description', 'note']) || '').trim(),
      });
    });
  });

  if (!items.length && !errors.length) errors.push('No items found in that JSON.');
  return { items, errors };
};

export const SAMPLE_REQUIREMENT_JSON = JSON.stringify(
  [
    {
      name: 'Figma Professional',
      type: 'software',
      price: 15,
      quantity: 2,
      shop: 'Figma',
      link: 'https://www.figma.com/pricing',
    },
    {
      name: 'USB-C Hub',
      type: 'hardware',
      price: 49.99,
      quantity: 3,
      shop: 'Amazon',
      link: 'https://www.amazon.com',
    },
  ],
  null,
  2
);
