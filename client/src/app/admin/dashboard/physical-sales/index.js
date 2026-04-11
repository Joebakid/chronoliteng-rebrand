"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createPhysicalSale, getPhysicalSales, deletePhysicalSale } from "@/lib/api";
import SaleForm from "./SaleForm";
import SaleHistory from "./SaleHistory";
import { buildCostMap } from "../dashboardUtils";

/**
 * Main Physical Sales Tab component
 * Optimized with memoization and efficient re-renders
 */
export default function PhysicalSalesTab({ products = [], onSaleRecorded }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  // Build cost map once
  const costMap = useMemo(() => buildCostMap(products), [products]);

  // Fetch sales on mount only
  useEffect(() => {
    let mounted = true;

    const fetchSales = async () => {
      setLoading(true);
      try {
        const data = await getPhysicalSales();
        if (mounted) setSales(data);
      } catch (err) {
        console.error("[PhysicalSalesTab] fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSales();

    return () => {
      mounted = false;
    };
  }, []);

  // Memoized submit handler
  const handleSubmit = useCallback(async (payload) => {
    setSubmitting(true);
    try {
      await createPhysicalSale(payload);
      const data = await getPhysicalSales();
      setSales(data);
      if (onSaleRecorded) onSaleRecorded();
      setPage(1);
    } finally {
      setSubmitting(false);
    }
  }, [onSaleRecorded]);

  // Memoized delete handler
  const handleDelete = useCallback(async (id) => {
    try {
      await deletePhysicalSale(id);
      const data = await getPhysicalSales();
      setSales(data);
      if (onSaleRecorded) onSaleRecorded();
    } catch (err) {
      console.error("[PhysicalSalesTab] delete error:", err);
    }
  }, [onSaleRecorded]);

  // Memoized page change handler
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_420px] lg:items-start">
      {/* Form */}
      <div className="order-1 lg:sticky lg:top-24">
        <SaleForm
          products={products}
          costMap={costMap}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </div>

      {/* History */}
      <div className="order-2">
        <SaleHistory
          sales={sales}
          costMap={costMap}
          loading={loading}
          page={page}
          onPageChange={handlePageChange}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

// Re-exports
export { default as SaleForm } from "./SaleForm";
export { default as SaleCard } from "./SaleCard";
export { default as SaleHistory } from "./SaleHistory";
export * from "./utils";
