"use client";

import { useMemo, useState, useEffect } from "react";
import { formatCurrency } from "./physical-sales/utils"; 
import { getSuppliers, createSupplier, getCategories, updateProduct } from "@/lib/api"; 

const ITEMS_PER_PAGE = 6; 

export default function SupplierTab({ products = [], user, onRefresh }) {
  const [dbSuppliers, setDbSuppliers] = useState([]);
  const [dbCategories, setDbCategories] = useState(["Watches", "Perfumes"]); 
  
  // --- LOCAL OVERRIDE ENGINE ---
  const [localEdits, setLocalEdits] = useState({});
  const [localProducts, setLocalProducts] = useState(products); 

  useEffect(() => {
    const mergedProducts = products.map((p) => {
      if (localEdits[p.id]) {
        return { ...p, ...localEdits[p.id] };
      }
      return p;
    });
    setLocalProducts(mergedProducts);
  }, [products, localEdits]);

  const [isAdding, setIsAdding] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Bulk Move & Undo States
  const [bulkMoveCat, setBulkMoveCat] = useState("");
  const [bulkMoveSup, setBulkMoveSup] = useState("");
  const [isBulkMoving, setIsBulkMoving] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState([]);
  const [undoTimeLeft, setUndoTimeLeft] = useState(0);
  const [undoTimerId, setUndoTimerId] = useState(null);

  useEffect(() => {
    return () => {
      if (undoTimerId) clearInterval(undoTimerId);
    };
  }, [undoTimerId]);

  useEffect(() => {
    getSuppliers()
      .then((data) => {
        if (Array.isArray(data)) setDbSuppliers(data);
      })
      .catch((err) => console.error("Failed to load suppliers:", err));

    getCategories(user?.id, user?.email)
      .then((data) => {
        if (data.length > 0) setDbCategories(data.map((c) => c.name));
      })
      .catch((err) => console.error("Failed to load categories:", err));
  }, [user?.id, user?.email]);

  const groupedBySource = useMemo(() => {
    const groups = {};

    dbSuppliers.forEach((sup) => {
      groups[sup.name] = { name: sup.name, products: [], totalCost: 0 };
    });
    
    localProducts.forEach((product) => {
      const sourceName = product.source?.trim() || "Uncategorized";
      
      if (!groups[sourceName]) {
        groups[sourceName] = { name: sourceName, products: [], totalCost: 0 };
      }
      
      groups[sourceName].products.push(product);
      
      const cost = parseFloat(product.costPrice) || 0;
      const qty = parseInt(product.inStock) || 1; 
      groups[sourceName].totalCost += (cost * qty);
    });

    return Object.values(groups).sort((a, b) => {
      if (a.name === "Uncategorized") return 1;
      if (b.name === "Uncategorized") return -1;
      return a.name.localeCompare(b.name);
    });
  }, [localProducts, dbSuppliers]);

  const [selectedSource, setSelectedSource] = useState(
    groupedBySource.length > 0 ? groupedBySource[0].name : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (groupedBySource.length > 0 && !groupedBySource.find(g => g.name === selectedSource)) {
      setSelectedSource(groupedBySource[0].name);
    }
  }, [groupedBySource, selectedSource]);

  const activeGroup = groupedBySource.find((g) => g.name === selectedSource);

  const displayedProducts = useMemo(() => {
    if (!activeGroup) return [];
    if (!searchQuery.trim()) return activeGroup.products;

    const query = searchQuery.toLowerCase();
    return activeGroup.products.filter(
      (product) =>
        product.name?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
    );
  }, [activeGroup, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(displayedProducts.length / ITEMS_PER_PAGE));
  
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [displayedProducts, currentPage]);

  const handleSourceChange = (name) => {
    setSelectedSource(name);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSaveSupplier = async () => {
    if (!newSupplierName.trim()) return;
    setIsSaving(true);
    try {
      const created = await createSupplier(newSupplierName.trim());
      setDbSuppliers((prev) => [...prev, created]);
      setNewSupplierName("");
      setIsAdding(false);
      setSelectedSource(created.name);
    } catch (err) {
      console.error("Error creating supplier:", err);
      alert(err.message || "Failed to create supplier");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryUpdate = async (productId, newCategory) => {
    setUpdatingId(productId);
    
    setLocalEdits((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], category: newCategory }
    }));

    try {
      await updateProduct(productId, { category: newCategory });
      if (onRefresh) onRefresh(); 
    } catch (err) {
      console.error("Failed to update category:", err);
      alert("Could not update category.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSupplierUpdate = async (productId, newSource) => {
    setUpdatingId(productId);
    
    setLocalEdits((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], source: newSource }
    }));

    try {
      await updateProduct(productId, { source: newSource });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to update supplier:", err);
      alert("Could not update supplier.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkMove = async () => {
    if (!bulkMoveCat || !bulkMoveSup) return;

    const productsToMove = localProducts.filter(
      (p) => (p.category || "").toLowerCase() === bulkMoveCat.toLowerCase() && p.source !== bulkMoveSup
    );

    if (productsToMove.length === 0) {
      alert(`No products found in "${bulkMoveCat}" that aren't already under "${bulkMoveSup}".`);
      return;
    }

    setIsBulkMoving(true);
    try {
      setUndoSnapshot(productsToMove.map(p => ({ id: p.id, oldSource: p.source || "" })));

      const newEdits = {};
      productsToMove.forEach((p) => {
        newEdits[p.id] = { ...localEdits[p.id], source: bulkMoveSup };
      });
      setLocalEdits((prev) => ({ ...prev, ...newEdits }));
      
      setSelectedSource(bulkMoveSup); 
      setBulkMoveCat("");
      setBulkMoveSup("");

      await Promise.all(
        productsToMove.map(p => updateProduct(p.id, { source: bulkMoveSup }))
      );
      if (onRefresh) onRefresh();

      if (undoTimerId) clearInterval(undoTimerId);
      setUndoTimeLeft(60);
      
      const timerId = setInterval(() => {
        setUndoTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            setUndoSnapshot([]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setUndoTimerId(timerId);

    } catch (err) {
      console.error("Bulk move failed:", err);
      alert("Failed to move products.");
    } finally {
      setIsBulkMoving(false);
    }
  };

  const handleUndo = async () => {
    if (!undoSnapshot.length) return;
    setIsBulkMoving(true);

    try {
      const revertEdits = {};
      undoSnapshot.forEach((snap) => {
        revertEdits[snap.id] = { ...localEdits[snap.id], source: snap.oldSource };
      });
      setLocalEdits((prev) => ({ ...prev, ...revertEdits }));

      clearInterval(undoTimerId);
      setUndoTimeLeft(0);
      
      await Promise.all(
        undoSnapshot.map((snap) => updateProduct(snap.id, { source: snap.oldSource }))
      );
      if (onRefresh) onRefresh();
      
      setUndoSnapshot([]);
    } catch (err) {
      console.error("Undo failed:", err);
      alert("Failed to undo changes.");
    } finally {
      setIsBulkMoving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] lg:items-start relative w-full">
      
      {/* UNDO TOAST NOTIFICATION */}
      {undoTimeLeft > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 shadow-2xl animate-in slide-in-from-bottom-5">
          <div>
            <p className="text-sm font-bold text-[var(--foreground)]">Moved {undoSnapshot.length} items</p>
            <p className="text-xs font-medium text-[var(--muted)]">Undo available for {undoTimeLeft}s</p>
          </div>
          <button
            onClick={handleUndo}
            disabled={isBulkMoving}
            className="rounded-xl bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
          >
            {isBulkMoving ? "..." : "Undo"}
          </button>
        </div>
      )}

      {/* LEFT SIDE: List of Suppliers (Responsive Strip/Sidebar) */}
      <div className="order-1 flex flex-col gap-2 lg:sticky lg:top-24 w-full">
        <h2 className="px-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
          Suppliers & Sources
        </h2>
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-2 sm:p-3 shadow-sm">
          
          {/* Scrollable Container: Horizontal on Mobile, Vertical on Desktop */}
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[60vh] no-scrollbar pb-2 lg:pb-0 snap-x">
            {groupedBySource.map((group) => (
              <button
                key={group.name}
                onClick={() => handleSourceChange(group.name)}
                className={`flex shrink-0 snap-start items-center justify-between rounded-xl px-4 py-3 text-left transition-all min-w-[200px] lg:min-w-0 ${
                  selectedSource === group.name
                    ? "bg-[var(--foreground)] text-[var(--surface)] shadow-md"
                    : "hover:bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] lg:border-transparent"
                }`}
              >
                <span className="text-sm font-bold truncate max-w-[140px] lg:max-w-[180px]">
                  {group.name}
                </span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ml-2 ${
                  selectedSource === group.name 
                    ? "bg-[var(--surface)]/20 text-[var(--surface)]" 
                    : "bg-[var(--surface-strong)] text-[var(--muted)]"
                }`}>
                  {group.products.length}
                </span>
              </button>
            ))}
          </div>

          <hr className="hidden lg:block my-1 border-[var(--border)]/50" />

          {/* Add Supplier Section */}
          {isAdding ? (
            <div className="flex flex-col gap-2 rounded-xl bg-[var(--surface)] p-3 shadow-inner border border-[var(--border)] w-full shrink-0">
              <input
                type="text"
                placeholder="Supplier name..."
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                autoFocus
                className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSupplier}
                  disabled={isSaving || !newSupplierName.trim()}
                  className="flex-1 rounded-lg bg-[var(--foreground)] py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--surface)] disabled:opacity-50 transition"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/10 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              + Add Supplier
            </button>
          )}

        </div>
      </div>

      {/* RIGHT SIDE: Workspace */}
      <div className="order-2 space-y-6 w-full min-w-0">
        
        {/* BULK ACTION BAR (Flex Wrap for Responsiveness) */}
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] whitespace-nowrap">
            Bulk Assign:
          </span>
          <div className="flex flex-col sm:flex-row flex-wrap flex-1 gap-2 sm:gap-3">
            <select
              value={bulkMoveCat}
              onChange={(e) => setBulkMoveCat(e.target.value)}
              className="appearance-none flex-1 min-w-[150px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs font-bold text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] shadow-sm"
            >
              <option value="">1. Select Category...</option>
              {dbCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            
            <span className="hidden sm:flex items-center text-xs text-[var(--muted)] font-bold self-center">TO</span>
            
            <select
              value={bulkMoveSup}
              onChange={(e) => setBulkMoveSup(e.target.value)}
              className="appearance-none flex-1 min-w-[150px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs font-bold text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] shadow-sm"
            >
              <option value="">2. Select Target Supplier...</option>
              {groupedBySource.filter(g => g.name !== "Uncategorized").map(g => (
                <option key={g.name} value={g.name}>{g.name}</option>
              ))}
            </select>
            
            <button
              onClick={handleBulkMove}
              disabled={isBulkMoving || !bulkMoveCat || !bulkMoveSup}
              className="rounded-xl w-full sm:w-auto bg-[var(--foreground)] px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--surface)] disabled:opacity-50 transition hover:opacity-90 shadow-md whitespace-nowrap shrink-0"
            >
              {isBulkMoving ? "Moving..." : "Move All"}
            </button>
          </div>
        </div>

        {activeGroup && (
          <div className="space-y-4">
            {/* Header & Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
              <div className="truncate">
                <h2 className="text-lg font-black text-[var(--foreground)] truncate">
                  {activeGroup.name === "Uncategorized" ? "No Supplier Assigned" : activeGroup.name}
                </h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {displayedProducts.length} item(s) found
                </p>
              </div>

              <div className="relative w-full sm:max-w-xs shrink-0">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] shadow-sm"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] opacity-50">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {displayedProducts.length === 0 ? (
              <div className="py-12 text-center text-[var(--muted)] border border-dashed border-[var(--border)] rounded-2xl mx-1">
                {searchQuery.trim() 
                  ? `No items match "${searchQuery}"` 
                  : "No products currently assigned to this supplier."}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Dynamic Product Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {paginatedProducts.map((product) => {
                    const img = product.images?.[0] || product.image || product.imageUrl || product.coverImage;
                    
                    return (
                      <div key={product.id} className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-sm transition hover:shadow-md">
                        {/* Image Area */}
                        <div className="relative aspect-[4/3] sm:h-40 sm:aspect-auto w-full bg-[var(--surface)] border-b border-[var(--border)]">
                          {img ? (
                            <img src={img} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-[var(--muted)]">No Image</div>
                          )}
                        </div>
                        
                        {/* Details Area */}
                        <div className="flex flex-1 flex-col p-4 space-y-3">
                          <h3 className="text-sm font-bold text-[var(--foreground)] line-clamp-1">{product.name}</h3>
                          
                          <div className="space-y-2">
                            {/* CATEGORY SELECTOR */}
                            <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 transition-colors hover:border-[var(--accent)]">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] shrink-0">
                                Category
                              </span>
                              <div className="relative flex items-center w-full ml-2">
                                {updatingId === product.id && (
                                  <span className="absolute -left-3 h-2 w-2 rounded-full bg-[var(--accent)] animate-ping"></span>
                                )}
                                <select
                                  value={product.category || ""}
                                  onChange={(e) => handleCategoryUpdate(product.id, e.target.value)}
                                  disabled={updatingId === product.id || isBulkMoving}
                                  className="appearance-none bg-transparent text-xs font-bold text-[var(--accent)] outline-none cursor-pointer disabled:opacity-50 text-right w-full truncate"
                                >
                                  <option value="" disabled>Select...</option>
                                  {dbCategories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* SUPPLIER SELECTOR */}
                            <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 transition-colors hover:border-[var(--accent)]">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] shrink-0">
                                Supplier
                              </span>
                              <div className="relative flex items-center w-full ml-2">
                                {updatingId === product.id && (
                                  <span className="absolute -left-3 h-2 w-2 rounded-full bg-[var(--accent)] animate-ping"></span>
                                )}
                                <select
                                  value={product.source || ""}
                                  onChange={(e) => handleSupplierUpdate(product.id, e.target.value)}
                                  disabled={updatingId === product.id || isBulkMoving}
                                  className="appearance-none bg-transparent text-xs font-bold text-[var(--accent)] outline-none cursor-pointer disabled:opacity-50 text-right w-full truncate"
                                >
                                  <option value="">Unassigned</option>
                                  {groupedBySource
                                    .filter((g) => g.name !== "Uncategorized")
                                    .map((g) => (
                                      <option key={g.name} value={g.name}>{g.name}</option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto flex items-end justify-between pt-3">
                            <div>
                              <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Selling</p>
                              <p className="font-bold text-[var(--accent)]">{formatCurrency(product.price)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Cost</p>
                              <p className="font-medium text-[var(--foreground)]">{product.costPrice ? formatCurrency(product.costPrice) : "—"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* --- PAGINATION CONTROLS --- */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)]/50 pt-4 px-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-30 disabled:hover:bg-transparent transition w-full sm:w-auto"
                    >
                      Previous
                    </button>
                    
                    <span className="text-xs font-bold text-[var(--muted)] w-full sm:w-auto text-center order-first sm:order-none mb-2 sm:mb-0">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-30 disabled:hover:bg-transparent transition w-full sm:w-auto"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}