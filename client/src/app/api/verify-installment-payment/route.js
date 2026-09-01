import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { orderId, reference, payFullBalance, installmentNumber } = body;

    if (!orderId || !reference) {
      return NextResponse.json(
        { error: "Missing required order ID or payment reference" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error("[verify-installment-payment] PAYSTACK_SECRET_KEY is missing in process.env");
      return NextResponse.json(
        { error: "Server configuration error: missing Paystack secret key" },
        { status: 500 }
      );
    }

    /* 1. Verify Transaction with Paystack */
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!paystackRes.ok) {
      const errText = await paystackRes.text();
      console.error("[verify-installment-payment] Paystack HTTP error:", paystackRes.status, errText);
      return NextResponse.json(
        { error: "Paystack verification HTTP request failed" },
        { status: 402 }
      );
    }

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data?.status !== "success") {
      return NextResponse.json(
        { error: "Payment was not successful", details: paystackData.message },
        { status: 402 }
      );
    }

    const paidAmount = Number(paystackData.data.amount || 0) / 100;
    if (isNaN(paidAmount) || paidAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount returned by Paystack" },
        { status: 400 }
      );
    }

    /* 2. Fetch Existing Order from Firestore */
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json({ error: "Order not found in database" }, { status: 404 });
    }

    const orderData = orderSnap.data();

    const orderTotal = Number(orderData.totalAmount || orderData.total || 0);
    const previousAmountPaid = Number(orderData.amountPaid || 0);
    const newAmountPaid = previousAmountPaid + paidAmount;
    const newBalanceDue = Math.max(0, orderTotal - newAmountPaid);
    const isFullyPaid = Boolean(payFullBalance) || newBalanceDue <= 1;

    /* 3. Update Installment Schedule Array Safely */
    const existingPlan = orderData.installmentPlan || {};
    const currentSchedule = Array.isArray(existingPlan.schedule) ? existingPlan.schedule : [];

    let completedCount = 0;
    const updatedSchedule = currentSchedule.map((slot) => {
      const slotInstallment = Number(slot.installment);
      const isTargetInstallment = Number(installmentNumber) === slotInstallment;

      if (payFullBalance || isTargetInstallment || slot.status === "paid") {
        completedCount++;
        return {
          installment: slotInstallment || 1,
          amount: Number(slot.amount || 0),
          dueDate: slot.dueDate || new Date().toISOString(),
          status: "paid",
          paidAt: slot.paidAt || new Date().toISOString(),
          reference: slot.reference || reference,
        };
      }

      return {
        installment: slotInstallment || 1,
        amount: Number(slot.amount || 0),
        dueDate: slot.dueDate || new Date().toISOString(),
        status: slot.status || "unpaid",
      };
    });

    /* 4. Build Clean Firestore Payload */
    const updatedInstallmentPlan = {
      totalInstallments: Number(existingPlan.totalInstallments || currentSchedule.length || 1),
      completedInstallments: completedCount,
      schedule: updatedSchedule,
    };

    const updatePayload = {
      amountPaid: newAmountPaid,
      balanceDue: isFullyPaid ? 0 : newBalanceDue,
      paymentStatus: isFullyPaid ? "fully_paid" : "partially_paid",
      status: isFullyPaid ? "paid" : "partially_paid",
      dispatchStatus: isFullyPaid ? "pending" : "hold_payment_plan",
      installmentPlan: updatedInstallmentPlan,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(orderRef, updatePayload);

    return NextResponse.json({
      success: true,
      newBalanceDue: isFullyPaid ? 0 : newBalanceDue,
      isFullyPaid,
    });
  } catch (err) {
    console.error("[verify-installment-payment] Fatal Server Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}