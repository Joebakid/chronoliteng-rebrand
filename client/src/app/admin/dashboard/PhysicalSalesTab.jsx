"use client";

/**
 * Physical Sales Tab - Main Entry Point
 *
 * This module handles walk-in sales recording and history display.
 *
 * Structure:
 * - index.js       - Main PhysicalSalesTab component (orchestrates Form + History)
 * - SaleForm.jsx   - Form for recording new walk-in sales
 * - SaleHistory.jsx - History list with month grouping and pagination
 * - SaleCard.jsx   - Individual sale card component
 * - utils.js       - Utility functions for formatting and calculations
 *
 * Usage:
 *   import PhysicalSalesTab from "./PhysicalSalesTab";
 *   // or
 *   import { SaleForm, SaleCard } from "./physical-sales";
 */
export { default } from "./physical-sales";
