import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/* ─────────────────────────────────────────────────────────────
    ANALYTICS
───────────────────────────────────────────────────────────── */

export async function getAdminAnalytics() {
  const [productsSnap, ordersSnap] = await Promise.all([
    getDocs(collection(db, "products")),
    getDocs(collection(db, "orders")),
  ]);

  const orders = ordersSnap.docs.map((d) => d.data());
  const prices = productsSnap.docs.map((d) => Number(d.data().price || 0));
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return {
    totalProducts: productsSnap.size,
    totalOrders: ordersSnap.size,
    totalRevenue,
    averagePrice: prices.length
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : 0,
    highestPrice: prices.length ? Math.max(...prices) : 0,
    totalItemsSold: orders.reduce(
      (sum, o) =>
        sum + (o.items?.reduce((is, i) => is + Number(i.quantity || 0), 0) || 0),
      0
    ),
  };
}