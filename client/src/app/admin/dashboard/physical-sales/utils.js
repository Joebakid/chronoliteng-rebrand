/**
 * Physical Sales Utility Functions
 * Optimized with cached Intl formatters and efficient algorithms
 */

// Cached formatters (created once)
const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
});

const monthFormatter = new Intl.DateTimeFormat("en-NG", {
  month: "long",
  year: "numeric",
});

// Export formatters
export const formatCurrency = (n) => currencyFormatter.format(n);
export const formatDate = (value) => value ? dateFormatter.format(new Date(value)) : "—";
export const formatDateTime = (value) => value ? dateTimeFormatter.format(new Date(value)) : "—";
export const formatMonthName = (monthYear) => {
  const [year, month] = monthYear.split("-");
  return monthFormatter.format(new Date(parseInt(year), parseInt(month) - 1));
};

/**
 * Get month-year key from date (e.g., "2026-04")
 */
export const getMonthYearKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Get cost price for an item using cost map
 * O(1) lookup instead of array search
 */
export const getCostPrice = (item, costMap) => {
  // Check stored costPrice first
  if (item.costPrice && item.costPrice > 0) return item.costPrice;

  // Lookup by productId or name
  return costMap[item.productId] || costMap[item.name?.toLowerCase()] || 0;
};

/**
 * Calculate item totals
 */
export const calculateItemTotals = (item, costMap) => {
  const revenue = (item.price || 0) * (item.quantity || 1);
  const cost = getCostPrice(item, costMap) * (item.quantity || 1);
  return { revenue, cost, profit: revenue - cost };
};

/**
 * Calculate sale totals
 */
export const calculateSaleTotals = (sale, costMap) => {
  let cost = 0;
  const items = sale.items || [];

  for (const item of items) {
    cost += getCostPrice(item, costMap) * (item.quantity || 1);
  }

  const revenue = sale.total || 0;
  return { revenue, cost, profit: revenue - cost };
};

/**
 * Group sales by month - optimized
 */
export const groupSalesByMonth = (sales) => {
  const groups = {};

  for (const sale of sales) {
    const key = getMonthYearKey(sale.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(sale);
  }

  // Sort by key descending
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
};

/**
 * Calculate month totals - optimized with single pass
 */
export const calculateMonthTotals = (monthSales, costMap) => {
  let revenue = 0;
  let cost = 0;

  for (const sale of monthSales) {
    revenue += sale.total || 0;
    const items = sale.items || [];

    for (const item of items) {
      cost += getCostPrice(item, costMap) * (item.quantity || 1);
    }
  }

  return { revenue, cost, profit: revenue - cost };
};
