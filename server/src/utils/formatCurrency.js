// src/utils/formatCurrency.js

const LAKH  = 100_000;
const CRORE = 10_000_000;

/**
 * Format a number as Nepali Rupee string.
 *
 * formatCurrency(4200000)   → "रू 4.2L"
 * formatCurrency(84200)     → "रू 84,200"
 * formatCurrency(15000000)  → "रू 1.5Cr"
 * formatCurrency(0)         → "रू 0"
 *
 * @param {number}  amount
 * @param {object}  options
 * @param {boolean} options.short     - Use L/Cr shorthand (default: true)
 * @param {boolean} options.symbol    - Include रू symbol (default: true)
 * @param {number}  options.decimals  - Decimal places for shorthand (default: 1)
 */
export function formatCurrency(amount, { short = true, symbol = true, decimals = 1 } = {}) {
  if (amount == null || isNaN(amount)) return symbol ? "रू 0" : "0";

  const prefix = symbol ? "रू " : "";

  if (!short || amount < LAKH) {
    return prefix + amount.toLocaleString("en-IN");
  }

  if (amount >= CRORE) {
    return `${prefix}${(amount / CRORE).toFixed(decimals)}Cr`;
  }

  return `${prefix}${(amount / LAKH).toFixed(decimals)}L`;
}

/**
 * Format as plain number with Nepali comma grouping.
 * formatAmount(1234567) → "12,34,567"
 */
export function formatAmount(amount) {
  if (amount == null || isNaN(amount)) return "0";
  return Number(amount).toLocaleString("en-IN");
}