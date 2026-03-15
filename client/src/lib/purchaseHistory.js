import { createOrder, getUserOrders } from "@/lib/api";

export async function getPurchaseHistory(user) {
  return await getUserOrders(user);
}

export async function recordPurchase(user, items, total) {
  return await createOrder({ items, total }, user);
}