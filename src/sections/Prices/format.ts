import { calculatorText } from '../../content/calculator';
import type { PriceItem } from '../../content/types';

const rub = new Intl.NumberFormat('ru-RU');

export const formatRub = (n: number) => `${rub.format(Math.round(n))} ₽`;

export function priceLabel(item: Pick<PriceItem, 'price' | 'from'>, qty = 1): string {
  if (item.price === null) return calculatorText.free;
  return `${item.from ? `${calculatorText.from} ` : ''}${formatRub(item.price * qty)}`;
}

export function plural(n: number, forms: [string, string, string]): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}
