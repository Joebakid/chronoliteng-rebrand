/**
 * Dashboard Utility Functions
 * Synchronizes Revenue, Orders, and Items Sold with cash flow
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
 * Check if a date falls within target month and year
 */
export function isInMonth(dateValue, targetMonth, targetYear) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return false;
  return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
}

/**
 * Calculate total revenue, active orders, and items sold for a specific month/year.
 * Counts any order created OR paid for during the selected month.
 */
export function calcMonthlyStats(orders = [], physicalSales = [], targetMonth = null, targetYear = null) {
  const now = new Date();
  const month = targetMonth !== null ? targetMonth : now.getMonth();
  const year = targetYear !== null ? targetYear : now.getFullYear();

  let revenue = 0;
  let onlineOrdersCount = 0;
  let itemsSold = 0;

  // Process Online Orders
  for (const order of orders) {
    const isCreatedInMonth = isInMonth(order.createdAt, month, year);
    let hasPaymentInMonth = false;

    if (order.paymentType === "installment" && Array.isArray(order.installmentPlan?.schedule)) {
      for (const slot of order.installmentPlan.schedule) {
        if (slot.status === "paid") {
          const paymentDate = slot.paidAt || order.createdAt;
          if (isInMonth(paymentDate, month, year)) {
            revenue += Number(slot.amount || 0);
            hasPaymentInMonth = true;
          }
        }
      }
    } else if (isCreatedInMonth) {
      revenue += Number(order.totalAmount || order.total || 0);
      hasPaymentInMonth = true;
    }

    // Count order and items if created OR paid for during this month
    if (isCreatedInMonth || hasPaymentInMonth) {
      onlineOrdersCount += 1;
      const items = order.items || [];
      for (const item of items) {
        itemsSold += Number(item.quantity || 1);
      }
    }
  }

  // Process Physical Sales
  let physicalCount = 0;
  for (const sale of physicalSales) {
    if (isInMonth(sale.createdAt, month, year)) {
      physicalCount += 1;
      revenue += Number(sale.total || 0);
      const items = sale.items || [];
      for (const item of items) {
        itemsSold += Number(item.quantity || 1);
      }
    }
  }

  return {
    revenue,
    count: onlineOrdersCount + physicalCount,
    physicalCount,
    itemsSold,
  };
}

/**
 * Calculate net profit/loss for a SPECIFIC month and year.
 */
export function calcProfit(orders = [], physicalSales = [], costMap = {}, targetMonth = null, targetYear = null) {
  const now = new Date();
  const month = targetMonth !== null ? targetMonth : now.getMonth();
  const year = targetYear !== null ? targetYear : now.getFullYear();

  const { revenue } = calcMonthlyStats(orders, physicalSales, month, year);
  let cost = 0;

  for (const order of orders) {
    if (isInMonth(order.createdAt, month, year)) {
      const items = order.items || [];
      for (const item of items) {
        const qty = Number(item.quantity || 1);
        cost += (costMap[item.productId] || costMap[item.name?.toLowerCase()] || item.costPrice || 0) * qty;
      }
    }
  }

  for (const sale of physicalSales) {
    if (isInMonth(sale.createdAt, month, year)) {
      const items = sale.items || [];
      for (const item of items) {
        const qty = Number(item.quantity || 1);
        cost += (costMap[item.productId] || costMap[item.name?.toLowerCase()] || item.costPrice || 0) * qty;
      }
    }
  }

  return revenue - cost;
}

export function groupByMonth(items, getKey = (item) => item.createdAt) {
  const groups = {};

  for (const item of items) {
    const d = new Date(getKey(item));
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export const formatCurrency = (n) => currencyFormatter.format(n || 0);

const dateTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatDateTime = (value) => {
  if (!value) return "—";
  return dateTimeFormatter.format(new Date(value));
};

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
});

export const formatDate = (value) => {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
};

const monthFormatter = new Intl.DateTimeFormat("en-NG", {
  month: "long",
  year: "numeric",
});

export const formatMonthName = (monthYear) => {
  const [year, month] = monthYear.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return monthFormatter.format(date);
};