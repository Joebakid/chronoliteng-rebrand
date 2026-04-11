/**
 * Dashboard Utility Functions
 * Optimized for performance with minimal re-computation
 */

/**
 * Build a cost map for O(1) lookups
 * Call this once when products change
 */
export function buildCostMap(products = []) {
  const map = {};
  for (const p of products) {
    if (p.costPrice) {
      map[p.id] = p.costPrice;
      map[p.name?.toLowerCase()] = p.costPrice;
    }
  }
  return map;
}

/**
 * Calculate net profit/loss for a SPECIFIC month and year.
 * Uses pre-built costMap for O(1) lookups
 */
export function calcProfit(orders = [], physicalSales = [], costMap = {}, targetMonth = null, targetYear = null) {
  const now = new Date();
  const month = targetMonth !== null ? targetMonth : now.getMonth();
  const year = targetYear !== null ? targetYear : now.getFullYear();

  let revenue = 0;
  let cost = 0;

  // Process Online Orders
  for (const order of orders) {
    const d = new Date(order.createdAt);
    if (d.getMonth() !== month || d.getFullYear() !== year) continue;

    const items = order.items || [];
    for (const item of items) {
      const qty = item.quantity || 1;
      revenue += (item.price || 0) * qty;
      cost += (costMap[item.productId] || costMap[item.name?.toLowerCase()] || item.costPrice || 0) * qty;
    }
  }

  // Process Physical Sales
  for (const sale of physicalSales) {
    const d = new Date(sale.createdAt);
    if (d.getMonth() !== month || d.getFullYear() !== year) continue;

    revenue += sale.total || 0;
    const items = sale.items || [];
    for (const item of items) {
      const qty = item.quantity || 1;
      cost += (costMap[item.productId] || costMap[item.name?.toLowerCase()] || item.costPrice || 0) * qty;
    }
  }

  return revenue - cost;
}

/**
 * Check if date is in target month/year
 */
export function isInMonth(date, month, year) {
  const d = new Date(date);
  return d.getMonth() === month && d.getFullYear() === year;
}

/**
 * Group items by month-year key
 */
export function groupByMonth(items, getKey = (item) => item.createdAt) {
  const groups = {};

  for (const item of items) {
    const d = new Date(getKey(item));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  // Sort by key descending (most recent first)
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

/**
 * Format currency (memoized formatter)
 */
const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export const formatCurrency = (n) => currencyFormatter.format(n);

/**
 * Format date with time
 */
const dateTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatDateTime = (value) => {
  if (!value) return "—";
  return dateTimeFormatter.format(new Date(value));
};

/**
 * Format date only
 */
const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
});

export const formatDate = (value) => {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
};

/**
 * Format month name from key (e.g., "2026-04" -> "April 2026")
 */
const monthFormatter = new Intl.DateTimeFormat("en-NG", {
  month: "long",
  year: "numeric",
});

export const formatMonthName = (monthYear) => {
  const [year, month] = monthYear.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return monthFormatter.format(date);
};
