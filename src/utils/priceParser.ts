import type { ParsedPrice } from '../types';

const MONEY = /(US\s?\$|\$|£|€|₪|ILS|USD|GBP|EUR|CAD|AUD)\s?(\d+(?:[.,]\d+)*)/g;
const SYMBOL_CURRENCIES: Record<string, string> = { $: 'USD', '£': 'GBP', '€': 'EUR', '₪': 'ILS' };

const toCurrency = (symbol: string) => (symbol.startsWith('US') ? 'USD' : (SYMBOL_CURRENCIES[symbol] ?? symbol));

function toAmount(raw: string) {
  const decimalComma = /,\d{2}$/.test(raw);
  return Number(decimalComma ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, ''));
}

export function parsePrice(text: string, preferredCurrency?: string): ParsedPrice | null {
  const itemPriceText = text.split(/\+|shipping/i)[0];
  const amounts = [...itemPriceText.matchAll(MONEY)].map(([, symbol, amount]) => ({
    currency: toCurrency(symbol),
    amount: toAmount(amount),
  }));
  if (amounts.length === 0) return null;

  const currency = amounts.some((a) => a.currency === preferredCurrency) ? preferredCurrency : amounts[0].currency;
  const [low, high] = amounts.filter((a) => a.currency === currency);

  const isRange = high !== undefined && /\bto\b/i.test(itemPriceText);
  return {
    value: low.amount,
    currency: low.currency,
    isRange,
    min: low.amount,
    max: isRange ? high.amount : low.amount,
  };
}

export function parsePriceIn(text: string, currency: string): ParsedPrice | null {
  const price = parsePrice(text, currency);
  return price?.currency === currency ? price : null;
}

export const isWithinBudget = (price: ParsedPrice, maxPrice: number) => price.max <= maxPrice;
