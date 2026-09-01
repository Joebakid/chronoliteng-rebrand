"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createPhysicalSale, getPhysicalSales, deletePhysicalSale } from "@/lib/api";
import SaleForm from "./SaleForm";
import SaleHistory from "./SaleHistory";
import { buildCostMap } from "../dashboardUtils";

const ITEMS_PER_PAGE = 1;

export default function PhysicalSalesTab({ products = [], onSaleRecorded }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const costMap = useMemo(() => buildCostMap(products), [products]);

  const imageMap = useMemo(() => {
    const map = {};
    for (const p of products) {
      let img = null;
      if (typeof p.image === 'string') img = p.image;
      else if (typeof p.imageUrl === 'string') img = p.imageUrl;
      else if (typeof p.coverImage === 'string') img = p.coverImage;
      else if (typeof p.thumbnail === 'string') img = p.thumbnail;
      else if (Array.isArray(p.images) && p.images.length > 0) {
        img = typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url;
      }

      if (p.id) map[p.id] = img;
      if (p.name) map[p.name.toLowerCase()] = img;
    }
    return map;
  }, [products]);

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
      setPage(1);
      if (onSaleRecorded) onSaleRecorded();
    } finally { setSubmitting(false); }
  }, [onSaleRecorded]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deletePhysicalSale(id);
      const data = await getPhysicalSales();
      setSales(data);
      const totalPages = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
      if (page > totalPages) setPage(totalPages);
      if (onSaleRecorded) onSaleRecorded();
    } catch (err) { console.error(err); }
  }, [onSaleRecorded, page]);

  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_420px] lg:items-start w-full min-w-0 overflow-hidden">
      <div className="order-1 lg:sticky lg:top-24 min-w-0 w-full">
        <SaleForm 
          products={products} 
          costMap={costMap} 
          submitting={submitting} 
          onSubmit={handleSubmit} 
        />
      </div>
      <div className="order-2 min-w-0 w-full">
        <SaleHistory 
          sales={sales} 
          costMap={costMap} 
          imageMap={imageMap} 
          loading={loading} 
          page={page} 
          onPageChange={setPage} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
}

export { default as SaleForm } from "./SaleForm";
export { default as SaleCard } from "./SaleCard";
export { default as SaleHistory } from "./SaleHistory";
export * from "./utils";