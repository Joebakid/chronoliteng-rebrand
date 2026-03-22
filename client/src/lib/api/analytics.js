import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/* ─────────────────────────────────────────────────────────────
    ANALYTICS
───────────────────────────────────────────────────────────── */

export async function getAdminAnalytics() {
  const [productsSnap, ordersSnap, physicalSnap] = await Promise.all([
    getDocs(collection(db, "products")),
    getDocs(collection(db, "orders")),
    getDocs(collection(db, "physicalSales")),
  ]);

  const orders = ordersSnap.docs.map((d) => d.data());
  const physicalSales = physicalSnap.docs.map((d) => d.data());
  const prices = productsSnap.docs.map((d) => Number(d.data().price || 0));

  // Revenue: online orders only (walk-in revenue is added separately in the dashboard)
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  // Items sold: count from both online orders AND walk-in sales
  const onlineItemsSold = orders.reduce(
    (sum, o) =>
      sum + (o.items?.reduce((is, i) => is + Number(i.quantity || 0), 0) || 0),
    0
  );

  const walkInItemsSold = physicalSales.reduce(
    (sum, s) =>
      sum + (s.items?.reduce((is, i) => is + Number(i.quantity || 0), 0) || 0),
    0
  );

  return {
    totalProducts: productsSnap.size,
    totalOrders: ordersSnap.size,
    totalRevenue,
    averagePrice: prices.length
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : 0,
    highestPrice: prices.length ? Math.max(...prices) : 0,
    totalItemsSold: onlineItemsSold + walkInItemsSold,
  };
}