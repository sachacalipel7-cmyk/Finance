const MONTHLY_FACTORS = {
  monthly: 1,
  quarterly: 1 / 3,
  annual: 1 / 12,
  one_time: 0,
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value ?? 0);
};

export const toMonthlyAmount = (amount, frequency = 'monthly') => {
  const numericAmount = Number.parseFloat(amount ?? 0);
  const factor = MONTHLY_FACTORS[frequency] ?? 1;
  return numericAmount * factor;
};

export const sumMonthlyEquivalent = (items, amountKey = 'amount', frequencyKey = 'frequency') => {
  return items.reduce((total, item) => {
    return total + toMonthlyAmount(item?.[amountKey] ?? 0, item?.[frequencyKey]);
  }, 0);
};
