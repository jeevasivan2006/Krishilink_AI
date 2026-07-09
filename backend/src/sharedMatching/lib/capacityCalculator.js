/**
 * Pure capacity calculation utilities — no DB or HTTP dependencies.
 */

export function calculateUsedCapacity(members) {
  if (!Array.isArray(members) || members.length === 0) return 0;
  return members.reduce((sum, m) => sum + Number(m.cargo_weight_kg || m.cargoWeightKg || 0), 0);
}

export function calculateRemainingCapacity(totalCapacityKg, usedCapacityKg) {
  const total = Number(totalCapacityKg);
  const used = Number(usedCapacityKg);
  if (Number.isNaN(total) || Number.isNaN(used)) return 0;
  return Math.max(0, roundKg(total - used));
}

export function canAccommodate(totalCapacityKg, usedCapacityKg, requestedWeightKg) {
  const remaining = calculateRemainingCapacity(totalCapacityKg, usedCapacityKg);
  return Number(requestedWeightKg) > 0 && Number(requestedWeightKg) <= remaining;
}

export function isGroupFull(totalCapacityKg, usedCapacityKg) {
  return calculateRemainingCapacity(totalCapacityKg, usedCapacityKg) <= 0;
}

export function deriveGroupStatus(totalCapacityKg, usedCapacityKg, currentStatus = 'open') {
  if (currentStatus === 'cancelled' || currentStatus === 'completed') {
    return currentStatus;
  }
  return isGroupFull(totalCapacityKg, usedCapacityKg) ? 'full' : 'open';
}

export function roundKg(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(Number(value) * factor) / factor;
}

export function roundCurrency(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(Number(value) * factor) / factor;
}
