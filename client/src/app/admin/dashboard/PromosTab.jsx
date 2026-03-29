"use client";

import { useState, useEffect } from "react";
import { createPromo, getPromos, deletePromo } from "@/lib/promoApi";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full";
const labelCls = "text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] ml-0.5";

export default function PromosTab({ products = [], onStatusChange }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [form, setForm] = useState({
    code: "",
    discount: 10,
    expiryDate: "",
    minSpend: "", 
    message: "", // Custom DM alert
    isNewUserOnly: false,
    specificProductId: ""
  });

  const fetchAll = async () => {
    setFetching(true);
    try {
      const data = await getPromos();
      setPromos(data);
    } catch (err) {
      console.error("Error fetching promos:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createPromo(form);
      onStatusChange({ type: "success", message: "Campaign launched & Alerts sent!" });
      setForm({ code: "", discount: 10, expiryDate: "", minSpend: "", message: "", isNewUserOnly: false, specificProductId: "" });
      fetchAll();
    } catch (err) {
      onStatusChange({ type: "error", message: "Failed to create promotion." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePromo(id);
      fetchAll();
      onStatusChange({ type: "success", message: "Promo removed." });
    } catch (err) {
      onStatusChange({ type: "error", message: "Action failed." });
    }
  };

  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] lg:items-start">
      
      <div className="order-1 lg:sticky lg:top-24 space-y-6">
        <div className="px-1">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Campaign Manager</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)]/30 p-5 shadow-sm space-y-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] px-1">Targeting & Alerts</p>
            
            <div className="space-y-1.5">
              <label className={labelCls}>Promo Code</label>
              <input 
                value={form.code} 
                onChange={e => setForm({...form, code: e.target.value.toUpperCase().replace(/\s/g, '')})} 
                placeholder="e.g. WELCOME10" 
                required 
                className={inputCls} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Discount %</label>
                <select 
                  value={form.discount} 
                  onChange={e => setForm({...form, discount: Number(e.target.value)})} 
                  className={inputCls}
                >
                  {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}% OFF</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Min. Spend (₦)</label>
                <input 
                  type="number" 
                  value={form.minSpend} 
                  onChange={e => setForm({...form, minSpend: e.target.value})} 
                  placeholder="0 for none" 
                  className={inputCls} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} required className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Alert Message (DM to User)</label>
              <textarea 
                value={form.message} 
                onChange={e => setForm({...form, message: e.target.value})} 
                placeholder="Hey! Since you just joined, use this code..." 
                rows={3} 
                className={`${inputCls} resize-none h-24`} 
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={form.isNewUserOnly} onChange={e => setForm({...form, isNewUserOnly: e.target.checked})} className="sr-only" />
                <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-1 ${form.isNewUserOnly ? "bg-sky-500" : "bg-[var(--border)]"}`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${form.isNewUserOnly ? "translate-x-5" : "translate-x-0"}`} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-tight">New Sign-ups Only</span>
              </label>
            </div>
          </div>

          <button disabled={loading} className="w-full rounded-full bg-[var(--foreground)] py-4 text-sm font-bold uppercase tracking-widest text-[var(--surface-strong)] shadow-2xl transition active:scale-95 disabled:opacity-50">
            {loading ? "Launching..." : "Blast Promotion"}
          </button>
        </form>
      </div>

      <div className="order-2 space-y-4">
        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[var(--muted)] px-2">Active Alerts</h2>

        {fetching ? (
            <div className="animate-pulse space-y-3">
                {[1, 2].map(n => <div key={n} className="h-28 rounded-[2rem] bg-[var(--surface-strong)]" />)}
            </div>
        ) : promos.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[var(--border)] py-20 text-center">
            <p className="text-sm text-[var(--muted)]">No live campaigns.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {promos.map(p => (
              <div key={p.id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xl font-black">{p.code}</span>
                    <p className="text-[9px] font-bold text-[var(--accent)] uppercase mt-0.5">
                        {p.discount}% OFF • {p.minSpend > 0 ? `₦${Number(p.minSpend).toLocaleString()}+ spend` : "Sitewide"}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(p.id)} className="text-[10px] font-bold text-red-400 uppercase">End</button>
                </div>
                
                {p.message && (
                  <p className="text-[11px] text-[var(--muted)] italic border-t border-[var(--border)]/50 pt-2 line-clamp-2">
                    "{p.message}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[9px] font-bold uppercase text-[var(--muted)] opacity-60">
                    <span>Exp: {new Date(p.expiryDate).toLocaleDateString()}</span>
                    {p.isNewUserOnly && <span>Target: New</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}