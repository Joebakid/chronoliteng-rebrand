import Product from "../models/Product.js";
import Order from "../models/Order.js";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeColorValue(value) {
  const normalized = String(value || "").trim().toLowerCase();

  const aliases = {
    steel: "#71797e",
    silver: "#c0c0c0",
    gold: "#d4af37",
    rosegold: "#b76e79",
    "rose gold": "#b76e79",
    champagne: "#f7e7ce",
    nude: "#e3bc9a",
    brown: "#8b4513",
    black: "#111111",
    white: "#f5f5f5",
    red: "#dc2626",
    blue: "#2563eb",
    green: "#16a34a",
    gray: "#6b7280",
    grey: "#6b7280",
  };

  return aliases[normalized] || normalized;
}

function parseColors(colors) {
  if (!colors) return [];

  return String(colors)
    .split(",")
    .map((color) => normalizeColorValue(color))
    .filter(Boolean);
}

async function uploadImageToCloudinary(file) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary environment variables are missing");
  }

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([file.buffer], { type: file.mimetype }),
    file.originalname
  );
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    console.error("Cloudinary upload failed", {
      cloudName,
      uploadPreset,
      status: response.status,
      payload,
      filename: file.originalname,
      mimetype: file.mimetype,
    });
    throw new Error(payload?.error?.message || "Cloudinary upload failed");
  }

  return payload.secure_url || payload.url || "";
}

export const getProducts = async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
};

export const getProductCategories = async (req, res) => {
  const rawCategories = await Product.distinct("category");
  const categories = rawCategories.filter(Boolean).sort((a, b) =>
    a.localeCompare(b)
  );

  res.json(categories);
};

export const getProductAnalytics = async (req, res) => {
  const products = await Product.find({}, { price: 1, category: 1, collection: 1 });
  const orders = await Order.find({}, { total: 1, items: 1, createdAt: 1 });
  const prices = products.map((product) => Number(product.price || 0));
  const categories = new Set(
    products.map((product) => product.category || product.collection || "Watches")
  );
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const totalItemsSold = orders.reduce(
    (sum, order) =>
      sum +
      (order.items || []).reduce(
        (itemSum, item) => itemSum + Number(item.quantity || 0),
        0
      ),
    0
  );

  res.json({
    totalProducts: products.length,
    totalCategories: categories.size,
    averagePrice: prices.length
      ? Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
      : 0,
    highestPrice: prices.length ? Math.max(...prices) : 0,
    totalOrders,
    totalRevenue,
    totalItemsSold,
  });
};

export const getProduct = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      brand,
      category,
      collection,
      strap,
      movement,
      caseSize,
      countInStock,
      colors,
    } = req.body;
    const slug = slugify(name);

    const existing = await Product.findOne({ slug });
    if (existing) {
      return res.status(409).json({ message: "Product with this name already exists" });
    }

    const imageUrl = req.file ? await uploadImageToCloudinary(req.file) : "";

    const product = new Product({
      name,
      slug,
      price,
      description,
      brand,
      category,
      collection,
      strap,
      movement,
      caseSize,
      countInStock: Number(countInStock || 0),
      colors: parseColors(colors),
      image: imageUrl,
    });

    const created = await product.save();
    res.status(201).json(created);
  } catch (error) {
    console.error("Create product failed", error);
    res.status(500).json({ message: error.message || "Unable to create product" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      brand,
      category,
      collection,
      strap,
      movement,
      caseSize,
      countInStock,
      colors,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const nextSlug = slugify(name || product.name);

    const existing = await Product.findOne({
      slug: nextSlug,
      _id: { $ne: product._id },
    });

    if (existing) {
      return res.status(409).json({ message: "Product with this name already exists" });
    }

    product.name = name || product.name;
    product.slug = nextSlug;
    product.price = price ?? product.price;
    product.description = description ?? product.description;
    product.brand = brand ?? product.brand;
    product.category = category ?? product.category;
    product.collection = collection ?? product.collection;
    product.strap = strap ?? product.strap;
    product.movement = movement ?? product.movement;
    product.caseSize = caseSize ?? product.caseSize;
    product.countInStock = Number(countInStock ?? product.countInStock ?? 0);
    product.colors = colors ? parseColors(colors) : product.colors;

    if (req.file) {
      product.image = await uploadImageToCloudinary(req.file);
    }

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    console.error("Update product failed", error);
    res.status(500).json({ message: error.message || "Unable to update product" });
  }
};

export const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
};
