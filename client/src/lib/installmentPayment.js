/**
 * Installment Plan Utility for 30-Day Window (3 to 6 Installments)
 */

export const ALLOWED_INSTALLMENT_COUNTS = [1, 3, 4, 5, 6];

/**
 * Calculates payment split and generates due dates over a 30-day period.
 * 3 Installments: Day 0, 15, 30 (Every 15 days)
 * 4 Installments: Day 0, 10, 20, 30 (Every 10 days)
 * 5 Installments: Day 0, 8, 15, 23, 30 (Every ~7.5 days)
 * 6 Installments: Day 0, 6, 12, 18, 24, 30 (Every 6 days)
 */
export function generateInstallmentSchedule(totalAmount, count = 1, startDate = new Date()) {
  const installmentsCount = Number(count);

  if (!ALLOWED_INSTALLMENT_COUNTS.includes(installmentsCount)) {
    throw new Error("Invalid installment count. Choose 1 (full), 3, 4, 5, or 6.");
  }

  // Full Payment
  if (installmentsCount === 1) {
    return {
      type: "full",
      totalAmount: Math.round(totalAmount),
      amountPaidToday: Math.round(totalAmount),
      balanceDue: 0,
      totalInstallments: 1,
      schedule: [
        {
          installment: 1,
          amount: Math.round(totalAmount),
          dueDate: startDate.toISOString(),
          status: "pending",
        },
      ],
    };
  }

  // Installment Plan Calculation
  const roundedTotal = Math.round(totalAmount);
  const baseAmount = Math.floor(roundedTotal / installmentsCount);
  const remainder = roundedTotal - baseAmount * installmentsCount;

  // Day interval step size across 30 days
  const dayStep = 30 / (installmentsCount - 1);

  const schedule = [];
  for (let i = 0; i < installmentsCount; i++) {
    // Add remainder to the final installment so exact NGN total matches
    const isFinal = i === installmentsCount - 1;
    const installmentAmount = isFinal ? baseAmount + remainder : baseAmount;

    // Calculate due date
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + Math.round(i * dayStep));

    schedule.push({
      installment: i + 1,
      amount: installmentAmount,
      dueDate: dueDate.toISOString(),
      status: i === 0 ? "pending" : "unpaid",
    });
  }

  return {
    type: "installment",
    totalAmount: roundedTotal,
    amountPaidToday: schedule[0].amount,
    balanceDue: roundedTotal - schedule[0].amount,
    totalInstallments: installmentsCount,
    schedule,
  };
}