import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
  const { items, total } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Order items are required" });
  }

  const normalizedItems = items
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0),
      image: item.image || "",
    }))
    .filter((item) => item.slug && item.name && item.quantity > 0);

  if (normalizedItems.length === 0) {
    return res.status(400).json({ message: "Order items are invalid" });
  }

  const computedTotal = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const order = await Order.create({
    user: req.user.id,
    items: normalizedItems,
    total: Number(total || computedTotal),
  });

  res.status(201).json(order);
};

export const getAdminOrders = async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json(orders);
};
