/**
 * Budget calculation utilities.
 * These are pure functions – no DB access.
 */

export function computeUtilization(approvedSum: number, allocated: number): number {
  if (allocated <= 0) return 1;
  return approvedSum / allocated;
}

export function isOverBudget(projectedTotal: number, allocated: number): boolean {
  return projectedTotal > allocated;
}

export function isThresholdBreached(utilization: number, threshold = 0.8): boolean {
  return utilization >= threshold;
}
