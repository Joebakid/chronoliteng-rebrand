import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

// Main admin email - sees all analytics
const MAIN_ADMIN_EMAIL = "josephbawo@gmail.com";

/* ─────────────────────────────────────────────────────────────
   ANALYTICS
   ───────────────────────────────────────────────────────────── */

/**
 * Returns analytics based on admin role.
 * - Main admin (josephbawo@gmail.com) sees ALL analytics
 * - Other admins see only analytics for their products
 */
export async function getAdminAnalytics(adminId = null, adminEmail = null) {
  const [productsSnap, ordersSnap, physicalSnap] = await Promise.all([
    getDocs(query(collection(db, "products"), orderBy("createdAt", "desc"))),
    getDocs(collection(db, "orders")),
    getDocs(collection(db, "physicalSales")),
  ]);

  const allProducts = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Main admin sees everything
  if (adminEmail === MAIN_ADMIN_EMAIL) {
    const products = allProducts;
    const orders = ordersSnap.docs.map((d) => d.data());
    const physicalSales = physicalSnap.docs.map((d) => d.data());
    const prices = products.map((p) => Number(p.price || 0));

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const onlineItemsSold = orders.reduce(
      (sum, o) => sum + (o.items?.reduce((is, i) => is + Number(i.quantity || 0), 0) || 0),
      0
    );
    const walkInItemsSold = physicalSales.reduce(
      (sum, s) => sum + (s.items?.reduce((is, i) => is + Number(i.quantity || 0), 0) || 0),
      0
    );

    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      averagePrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      highestPrice: prices.length ? Math.max(...prices) : 0,
      totalItemsSold: onlineItemsSold + walkInItemsSold,
    };
  }

  // Other admins - filter by their products
  if (adminId) {
    const products = allProducts.filter((p) => p.createdBy === adminId);
    const productIds = new Set(products.map((p) => p.id));

    const orders = ordersSnap.docs
      .map((d) => d.data())
      .filter((order) => order.items?.some((item) => productIds.has(item.productId || item.id)));

    const physicalSales = physicalSnap.docs
      .map((d) => d.data())
      .filter((sale) => sale.items?.some((item) => productIds.has(item.productId || item.id)));

    const prices = products.map((p) => Number(p.price || 0));

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const onlineItemsSold = orders.reduce(
      (sum, o) => sum + (o.items?.reduce((is, i) => is + Number(i.quantity || 0), 0) || 0),
      0
    );
    const walkInItemsSold = physicalSales.reduce(
      (sum, s) => sum + (s.items?.reduce((is, i) => is + Number(i.quantity || 0), 0) || 0),
      0
    );

    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      averagePrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      highestPrice: prices.length ? Math.max(...prices) : 0,
      totalItemsSold: onlineItemsSold + walkInItemsSold,
    };
  }

  // No admin context - return all
  const products = allProducts;
  const orders = ordersSnap.docs.map((d) => d.data());
  const physicalSales = physicalSnap.docs.map((d) => d.data());
  const prices = products.map((p) => Number(p.price || 0));

  return {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + Number(o.total || 0), 0),
    averagePrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
    highestPrice: prices.length ? Math.max(...prices) : 0,
    totalItemsSold: orders.reduce((sum, o) => sum + (o.items?.reduce((is, i) => is + Number(i.quantity || 0), 0) || 0), 0) +
      physicalSales.reduce((sum, s) => sum + (s.items?.reduce((is, i) => is + Number(i.quantity || 0), 0) || 0), 0),
  };
}
