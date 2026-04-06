"use client";

import { useState } from "react";
import ProductForm from "./ProductForm";
import ProductInventory from "./ProductInventory";

export default function ProductsTab({ products, fetching, onRefresh, onStatusChange, user }) {
  const [editingProduct, setEditingProduct] = useState(null);

  const handleSuccess = () => {
    setEditingProduct(null);
    onRefresh();
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingProduct(null);
  };

  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] lg:items-start">
      {/* Form */}
      <div className="order-1 lg:sticky lg:top-24">
        <ProductForm
          editingProduct={editingProduct}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onStatusChange={onStatusChange}
          user={user}
        />
      </div>

      {/* Inventory */}
      <div className="order-2">
        <ProductInventory
          products={products}
          onEdit={handleEdit}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  );
}
