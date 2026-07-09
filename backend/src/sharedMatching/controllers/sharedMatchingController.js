import * as sharedMatchingService from '../services/sharedMatchingService.js';
import { success } from '../../utils/apiResponse.js';

export const autoMatch = async (req, res) => {
  const result = await sharedMatchingService.autoMatchBooking(req.params.bookingId, {
    farmerId: req.user.id,
    actorId: req.user.id,
    truckCapacityKg: req.body?.truck_capacity_kg,
    truckId: req.body?.truck_id,
  });
  return success(res, result, `Shared group ${result.action}`);
};

export const findMatches = async (req, res) => {
  const result = await sharedMatchingService.findMatchesForBooking(req.params.bookingId, {
    farmerId: req.user.id,
  });
  return success(res, result, 'Compatible shared groups found');
};

export const joinGroup = async (req, res) => {
  const result = await sharedMatchingService.joinSharedGroup(
    req.params.groupId,
    req.params.bookingId,
    { farmerId: req.user.id, actorId: req.user.id },
  );
  return success(res, result, 'Joined shared group');
};

export const leaveGroup = async (req, res) => {
  const result = await sharedMatchingService.leaveSharedGroup(
    req.params.groupId,
    req.params.bookingId,
    { farmerId: req.user.id, actorId: req.user.id },
  );
  return success(res, result, 'Left shared group');
};

export const getGroup = async (req, res) => {
  const group = await sharedMatchingService.getSharedGroupById(req.params.groupId);
  return success(res, group, 'Shared group retrieved');
};

export const getCapacity = async (req, res) => {
  const capacity = await sharedMatchingService.getRemainingCapacity(req.params.groupId);
  return success(res, capacity, 'Remaining capacity retrieved');
};

export const getCostSplit = async (req, res) => {
  const group = await sharedMatchingService.getSharedGroupById(req.params.groupId);
  return success(res, group.cost_split, 'Cost split calculated');
};

export const listGroups = async (req, res) => {
  const result = await sharedMatchingService.listSharedGroups(req.query);
  return success(res, result, 'Shared groups retrieved');
};
