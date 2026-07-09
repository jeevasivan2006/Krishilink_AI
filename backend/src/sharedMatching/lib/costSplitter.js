import { roundCurrency } from './capacityCalculator.js';

/**
 * Proportional cost split by cargo weight.
 * Each member pays: (memberWeight / totalWeight) * totalCost
 */

export function calculateMemberShare(totalCost, memberWeightKg, totalWeightKg) {
  const cost = Number(totalCost);
  const memberWeight = Number(memberWeightKg);
  const totalWeight = Number(totalWeightKg);

  if (totalWeight <= 0 || memberWeight <= 0) return 0;
  if (cost <= 0) return 0;

  return roundCurrency((memberWeight / totalWeight) * cost);
}

export function splitCostProportionally(totalCost, members) {
  const activeMembers = members.filter(
    m => (m.status === undefined || m.status === 'active') && Number(m.cargo_weight_kg || m.cargoWeightKg) > 0,
  );

  const totalWeight = activeMembers.reduce(
    (sum, m) => sum + Number(m.cargo_weight_kg ?? m.cargoWeightKg),
    0,
  );

  if (totalWeight <= 0) {
    return activeMembers.map(m => ({
      bookingId: m.booking_id ?? m.bookingId,
      farmerId: m.farmer_id ?? m.farmerId,
      cargoWeightKg: Number(m.cargo_weight_kg ?? m.cargoWeightKg),
      allocatedCost: 0,
      sharePercent: 0,
    }));
  }

  const cost = Number(totalCost) || 0;
  const splits = activeMembers.map(m => {
    const weight = Number(m.cargo_weight_kg ?? m.cargoWeightKg);
    const allocatedCost = calculateMemberShare(cost, weight, totalWeight);
    const sharePercent = roundCurrency((weight / totalWeight) * 100, 2);
    return {
      bookingId: m.booking_id ?? m.bookingId,
      farmerId: m.farmer_id ?? m.farmerId,
      cargoWeightKg: weight,
      allocatedCost,
      sharePercent,
    };
  });

  return reconcileRounding(splits, cost);
}

/**
 * Adjust the last member's share so split totals exactly match totalCost.
 */
function reconcileRounding(splits, totalCost) {
  if (splits.length === 0) return splits;

  const sum = splits.reduce((acc, s) => acc + s.allocatedCost, 0);
  const diff = roundCurrency(totalCost - sum);

  if (diff !== 0) {
    const last = splits[splits.length - 1];
    last.allocatedCost = roundCurrency(last.allocatedCost + diff);
  }

  return splits;
}

export function computeGroupTotalCost(members, fallbackPerKgRate = 0) {
  const activeMembers = members.filter(m => m.status === undefined || m.status === 'active');

  const fromEstimates = activeMembers.reduce(
    (sum, m) => sum + Number(m.estimated_cost ?? m.estimatedCost ?? 0),
    0,
  );

  if (fromEstimates > 0) return roundCurrency(fromEstimates);

  const totalWeight = activeMembers.reduce(
    (sum, m) => sum + Number(m.cargo_weight_kg ?? m.cargoWeightKg ?? 0),
    0,
  );

  return roundCurrency(totalWeight * fallbackPerKgRate);
}
