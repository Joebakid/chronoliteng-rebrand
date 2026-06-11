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

  // Build image map once to match product IDs or names to their images
  const imageMap = useMemo(() => {
    const map = {};
    for (const p of products) {
      // Robust extraction: checks multiple common property names for the image
      let img = null;
      if (typeof p.image === 'string') img = p.image;
      else if (typeof p.imageUrl === 'string') img = p.imageUrl;
      else if (typeof p.coverImage === 'string') img = p.coverImage;
      else if (typeof p.thumbnail === 'string') img = p.thumbnail;
      else if (Array.isArray(p.images) && p.images.length > 0) {
        // Handles cases where images is an array of strings OR an array of objects
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
        <SaleForm 
          products={products} 
          costMap={costMap} 
          submitting={submitting} 
          onSubmit={handleSubmit} 
        />
      </div>
      <div className="order-2">
        <SaleHistory 
          sales={sales} 
          costMap={costMap} 
          imageMap={imageMap} // Pass the generated image map down
          loading={loading} 
          page={page} 
          onPageChange={setPage} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
}