export const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'MMK', label: 'MMK — Myanmar Kyat' },
  { value: 'THB', label: 'THB — Thai Baht' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
];

export const formatCurrency = (value, currency = 'USD') => {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const parseAmount = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.max(0, value) : 0;
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const amount = Number.parseFloat(cleaned);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
};

export const parseQuantity = (value) => {
  const quantity = Number.parseInt(value, 10);
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, quantity);
};
