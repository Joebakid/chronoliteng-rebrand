"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 5;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(dateString));
}

function buildMonthOptions() {
  const now = new Date();
  const options = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({ key: `${d.getFullYear()}-${d.getMonth()}`, year: d.getFullYear(), month: d.getMonth() });
  }
  return options;
}

function isInMonth(dateValue, targetMonth, targetYear) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return false;
  return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
}

export default function InstallmentsTab({ orders = [] }) {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const [filter, setFilter] = useState("all"); // 'all' | 'in_progress' | 'completed'
  const [selectedMonthKey, setSelectedMonthKey] = useState("all"); // 'all' | 'YYYY-M'
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const monthOptions = useMemo(() => buildMonthOptions(), []);

  // Filter orders that have installment plans
  const allInstallmentOrders = useMemo(() => {
    return orders.filter(
      (order) => order.paymentType === "installment" || order.installmentPlan
    );
  }, [orders]);

  // Filter orders based on the selected month
  const monthFilteredOrders = useMemo(() => {
    if (selectedMonthKey === "all") return allInstallmentOrders;

    const [yearStr, monthStr] = selectedMonthKey.split("-");
    const targetYear = Number(yearStr);
    const targetMonth = Number(monthStr);

    return allInstallmentOrders.filter((order) => {
      const createdInMonth = isInMonth(order.createdAt, targetMonth, targetYear);
      const schedule = order.installmentPlan?.schedule || [];
      const hasPaymentInMonth = schedule.some(
        (slot) => slot.status === "paid" && isInMonth(slot.paidAt || order.createdAt, targetMonth, targetYear)
      );
      return createdInMonth || hasPaymentInMonth;
    });
  }, [allInstallmentOrders, selectedMonthKey]);

  // Calculate stats dynamically for selected month vs lifetime
  const stats = useMemo(() => {
    if (selectedMonthKey === "all") {
      const totalCollected = allInstallmentOrders.reduce((acc, o) => acc + Number(o.amountPaid || 0), 0);
      const totalOutstanding = allInstallmentOrders.reduce((acc, o) => acc + Number(o.balanceDue || 0), 0);
      const totalProjected = allInstallmentOrders.reduce((acc, o) => acc + Number(o.totalAmount || o.total || 0), 0);
      return { totalCollected, totalOutstanding, totalProjected, title: "All-Time Lifetime Totals" };
    }

    const [yearStr, monthStr] = selectedMonthKey.split("-");
    const targetYear = Number(yearStr);
    const targetMonth = Number(monthStr);

    let monthCollected = 0;
    monthFilteredOrders.forEach((order) => {
      const schedule = order.installmentPlan?.schedule || [];
      schedule.forEach((slot) => {
        if (slot.status === "paid" && isInMonth(slot.paidAt || order.createdAt, targetMonth, targetYear)) {
          monthCollected += Number(slot.amount || 0);
        }
      });
    });

    const monthOutstanding = monthFilteredOrders.reduce((acc, o) => acc + Number(o.balanceDue || 0), 0);
    const monthProjected = monthFilteredOrders.reduce((acc, o) => acc + Number(o.totalAmount || o.total || 0), 0);

    return {
      totalCollected: monthCollected,
      totalOutstanding: monthOutstanding,
      totalProjected: monthProjected,
      title: `${MONTH_NAMES[targetMonth]} ${targetYear} Monthly Breakdown`,
    };
  }, [allInstallmentOrders, monthFilteredOrders, selectedMonthKey]);

  // Filter by status (In Progress vs Completed)
  const displayedOrders = useMemo(() => {
    return monthFilteredOrders.filter((order) => {
      const isCompleted = order.paymentStatus === "fully_paid" || (order.balanceDue || 0) <= 0;
      if (filter === "in_progress") return !isCompleted;
      if (filter === "completed") return isCompleted;
      return true;
    });
  }, [monthFilteredOrders, filter]);

  const activePlans = monthFilteredOrders.filter(
    (o) => o.paymentStatus !== "fully_paid" && (o.balanceDue || 0) > 0
  );
  const completedPlans = monthFilteredOrders.filter(
    (o) => o.paymentStatus === "fully_paid" || (o.balanceDue || 0) <= 0
  );

  // Pagination calculation
  const totalPages = Math.ceil(displayedOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = displayedOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--muted)]">
            Installment Portfolio
          </p>
          <p className="text-sm font-bold text-[var(--foreground)]">{stats.title}</p>
        </div>

        {/* Month Selector Dropdown */}
        <select
          value={selectedMonthKey}
          onChange={(e) => setSelectedMonthKey(e.target.value)}
          className="text-xs font-bold uppercase tracking-wider rounded-xl bg-[var(--surface-strong)] border border-[var(--border)] px-4 py-2 text-[var(--foreground)] outline-none cursor-pointer hover:border-[var(--accent)] transition"
        >
          <option value="all">All Months (Lifetime)</option>
          {monthOptions.map(({ key, year, month }) => (
            <option key={key} value={key}>
              {MONTH_NAMES[month]} {year}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Active Plans</p>
          <p className="text-xl font-black text-[var(--foreground)] mt-1">{monthFilteredOrders.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            {selectedMonthKey === "all" ? "Lifetime Collected" : "Collected in Month"}
          </p>
          <p className="text-xl font-black text-emerald-500 mt-1">{formatPrice(stats.totalCollected)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Outstanding Balance</p>
          <p className="text-xl font-black text-[var(--accent)] mt-1">{formatPrice(stats.totalOutstanding)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Total Order Value</p>
          <p className="text-xl font-black text-[var(--foreground)] mt-1">{formatPrice(stats.totalProjected)}</p>
        </div>
      </div>

      {/* Filter Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xl transition ${
            filter === "all"
              ? "bg-[var(--foreground)] text-[var(--background)]"
              : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          All ({monthFilteredOrders.length})
        </button>
        <button
          onClick={() => setFilter("in_progress")}
          className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xl transition ${
            filter === "in_progress"
              ? "bg-[var(--foreground)] text-[var(--background)]"
              : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          In Progress ({activePlans.length})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xl transition ${
            filter === "completed"
              ? "bg-[var(--foreground)] text-[var(--background)]"
              : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Completed ({completedPlans.length})
        </button>
      </div>

      {/* Installment Orders List */}
      {displayedOrders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center text-xs text-[var(--muted)]">
          No installment plans found for the selected month and status filter.
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => {
            const plan = order.installmentPlan || {};
            const schedule = plan.schedule || [];
            const isCompleted = order.paymentStatus === "fully_paid" || (order.balanceDue || 0) <= 0;
            const totalAmt = Number(order.totalAmount || order.total || 0);
            const paidAmt = Number(order.amountPaid || 0);
            const progressPct = Math.min(100, Math.round((paidAmt / (totalAmt || 1)) * 100));
            const isExpanded = expandedOrderId === order.id;

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-sm space-y-4"
              >
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono font-bold text-[var(--foreground)]">
                        #{order.id}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          isCompleted
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}
                      >
                        {isCompleted ? "Fully Paid" : "In Progress"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] mt-1">
                      Customer: <strong className="text-[var(--foreground)]">{order.userName || order.delivery?.name || "N/A"}</strong> ({order.userEmail || order.delivery?.email || "N/A"})
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-sm font-black text-[var(--foreground)]">{formatPrice(totalAmt)}</p>
                    <p className="text-[10px] text-[var(--muted)]">
                      Remaining: <span className="font-bold text-[var(--accent)]">{formatPrice(order.balanceDue || 0)}</span>
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    <span>Paid Progress ({progressPct}%)</span>
                    <span>{plan.completedInstallments || 0} of {plan.totalInstallments || schedule.length} Paid</span>
                  </div>
                  <div className="w-full bg-[var(--surface)] rounded-full h-2 overflow-hidden border border-[var(--border)]">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? "bg-emerald-500" : "bg-[var(--accent)]"
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Toggle Schedule Timeline */}
                <button
                  type="button"
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="text-[11px] font-bold text-[var(--muted)] hover:text-[var(--foreground)] underline underline-offset-4"
                >
                  {isExpanded ? "Hide Schedule ▲" : "View Payment Schedule ▼"}
                </button>

                {/* Schedule Items */}
                {isExpanded && (
                  <div className="divide-y divide-[var(--border)]/40 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden text-xs">
                    {schedule.map((item) => {
                      const isPaid = item.status === "paid";
                      return (
                        <div
                          key={item.installment}
                          className="flex items-center justify-between p-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                isPaid ? "bg-emerald-500 text-black" : "bg-[var(--border)] text-[var(--muted)]"
                              }`}
                            >
                              {isPaid ? "✓" : item.installment}
                            </span>
                            <div>
                              <p className="font-bold text-[var(--foreground)]">Payment #{item.installment}</p>
                              <p className="text-[10px] text-[var(--muted)]">
                                {isPaid
                                  ? `Paid ${formatDate(item.paidAt)}`
                                  : `Due ${formatDate(item.dueDate)}`}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-[var(--foreground)]">{formatPrice(item.amount)}</p>
                            <span
                              className={`text-[9px] font-bold uppercase ${
                                isPaid ? "text-emerald-500" : "text-amber-500"
                              }`}
                            >
                              {isPaid ? "Paid" : "Pending"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination totalPages={totalPages} />
    </div>
  );
}