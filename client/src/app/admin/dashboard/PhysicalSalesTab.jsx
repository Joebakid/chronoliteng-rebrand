"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createPhysicalSale, getPhysicalSales, deletePhysicalSale } from "@/lib/api";
import SaleForm from "./physical-sales/SaleForm";
import SaleHistory from "./physical-sales/SaleHistory";
import { buildCostMap } from "./dashboardUtils";

const ITEMS_PER_PAGE = 1; // Syncs with SaleHistory

export default function PhysicalSalesTab({ products = [], onSaleRecorded }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const costMap = useMemo(() => buildCostMap(products), [products]);

  useEffect(() => {
    let mounted = true;
    const fetchSales = async () => {
      setLoading(true);
      try {
        const data = await getPhysicalSales();
        if (mounted) setSales(data);
      } catch (err) { console.error(err); } 
      finally { if (mounted) setLoading(false); }
    };
    fetchSales();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = useCallback(async (payload) => {
    setSubmitting(true);
    try {
      await createPhysicalSale(payload);
      const data = await getPhysicalSales();
      setSales(data);
      setPage(1); // Return to current month (first page)
      if (onSaleRecorded) onSaleRecorded();
    } finally { setSubmitting(false); }
  }, [onSaleRecorded]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deletePhysicalSale(id);
      const data = await getPhysicalSales();
      setSales(data);
      // Ensure we don't land on an empty page if a month becomes empty
      const totalPages = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
      if (page > totalPages) setPage(totalPages);
      if (onSaleRecorded) onSaleRecorded();
    } catch (err) { console.error(err); }
  }, [onSaleRecorded, page]);

  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_420px] lg:items-start">
      <div className="order-1 lg:sticky lg:top-24">
        <SaleForm products={products} costMap={costMap} submitting={submitting} onSubmit={handleSubmit} />
      </div>
      <div className="order-2">
        <SaleHistory sales={sales} costMap={costMap} loading={loading} page={page} onPageChange={setPage} onDelete={handleDelete} />
      </div>
    </div>
  );
}