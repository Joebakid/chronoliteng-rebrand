/**
 * Calculate net profit/loss across online orders and physical (walk-in) sales.
 * Matches cost prices by product ID (online) or product name (walk-in).
 */
export function calcProfit(orders = [], physicalSales = [], products = []) {
  const costByName = {};
  const costById = {};

  products.forEach((p) => {
    if (p.costPrice) {
      costById[p.id] = p.costPrice;
      costByName[p.name.toLowerCase()] = p.costPrice;
    }
  });

  let totalRevenue = 0;
  let totalCost = 0;

  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const qty = item.quantity || 1;
      totalRevenue += (item.price || 0) * qty;
      const cost = costById[item.productId] ?? item.costPrice ?? null;
      if (cost !== null) totalCost += cost * qty;
    });
  });

  physicalSales.forEach((sale) => {
    totalRevenue += sale.total || 0;
    (sale.items || []).forEach((item) => {
      const qty = item.quantity || 1;
      const cost = costByName[item.name?.toLowerCase()] ?? null;
      if (cost !== null) totalCost += cost * qty;
    });
  });

  return totalCost > 0 ? totalRevenue - totalCost : null;
}