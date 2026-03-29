"use client";

import { useEffect, useState } from "react";
import { getPromos } from "@/lib/promoApi";

export default function PromoBanner({ isNewUser }) {
  const [activePromos, setActivePromos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPromos()
      .then(all => {
        const now = Date.now();
        const valid = all.filter(p => {
          const notExpired = p.expiryDate > now;
          // If promo is new user only, user must be new. Otherwise, show to everyone.
          const userMatch = p.isNewUserOnly ? isNewUser : true;
          return notExpired && userMatch;
        });
        setActivePromos(valid);
      })
      .catch(err => console.error("Banner fetch error:", err))
      .finally(() => setLoading(false));
  }, [isNewUser]);

  if (loading || activePromos.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar animate-in fade-in slide-in-from-top-4 duration-500">
      {activePromos.map(p => (
        <div 
          key={p.id} 
          className="min-w-[300px] sm:min-w-[340px] rounded-[2rem] bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-2xl relative overflow-hidden group transition-transform hover:scale-[1.02]"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-200">Exclusive Reward</p>
              {p.isNewUserOnly && (
                <span className="text-[8px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase">Welcome Gift</span>
              )}
            </div>
            
            <h3 className="text-3xl font-black mb-1 italic tracking-tighter">
              {p.discount}% DISCOUNT
            </h3>
            
            <p className="text-[11px] font-medium text-indigo-100 mb-5">
              Copy and use code <span className="font-black text-white underline decoration-2 underline-offset-4">{p.code}</span> at checkout.
            </p>
            
            <div className="flex items-center justify-between">
              <div className="text-[9px] font-bold bg-black/20 backdrop-blur-md inline-block px-3 py-1.5 rounded-full border border-white/10">
                Ends {new Date(p.expiryDate).toLocaleDateString("en-NG", { day: 'numeric', month: 'short' })}
              </div>
              <span className="text-[10px] font-black uppercase opacity-40 group-hover:opacity-100 transition-opacity">Claim Now →</span>
            </div>
          </div>

          {/* Decorative design elements */}
          <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-3xl transition-transform group-hover:scale-150" />
          <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-indigo-400/20 blur-2xl" />
        </div>
      ))}
    </div>
  );
}