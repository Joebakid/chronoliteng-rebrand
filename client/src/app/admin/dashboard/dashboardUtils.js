/**
 * Calculate net profit/loss for a SPECIFIC month and year.
 * Defaults to current month if targets are not provided.
 */
export function calcProfit(orders = [], physicalSales = [], products = [], targetMonth = null, targetYear = null) {
  const now = new Date();
  const month = targetMonth !== null ? targetMonth : now.getMonth();
  const year = targetYear !== null ? targetYear : now.getFullYear();

  // 1. Map costs for quick lookup
  const costMap = {};
  products.forEach((p) => {
    if (p.costPrice) {
      costMap[p.id] = p.costPrice;
      costMap[p.name.toLowerCase()] = p.costPrice;
    }
  });

  let filteredRevenue = 0;
  let filteredCost = 0;

  // 2. Process Online Orders for the SELECTED month
  orders.forEach((order) => {
    const d = new Date(order.createdAt);
    if (d.getMonth() === month && d.getFullYear() === year) {
      (order.items || []).forEach((item) => {
        const qty = item.quantity || 1;
        filteredRevenue += (item.price || 0) * qty;

        const unitCost = costMap[item.productId] || costMap[item.name?.toLowerCase()] || item.costPrice || 0;
        filteredCost += unitCost * qty;
      });
    }
  });

  // 3. Process Physical Sales for the SELECTED month
  physicalSales.forEach((sale) => {
    const d = new Date(sale.createdAt);
    if (d.getMonth() === month && d.getFullYear() === year) {
      filteredRevenue += sale.total || 0;
      (sale.items || []).forEach((item) => {
        const qty = item.quantity || 1;
        const unitCost = costMap[item.name?.toLowerCase()] || item.costPrice || 0;
        filteredCost += unitCost * qty;
      });
    }
  });

  // Return the calculated value
  return filteredRevenue - filteredCost;
}