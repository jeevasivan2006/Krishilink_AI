import * as notificationService from '../services/notificationService.js';
import { created, success } from '../../utils/apiResponse.js';

export const sendBooking = async (req, res) => {
  const notification = await notificationService.sendBookingNotification(req.body);
  return created(res, notification, 'Booking notification queued');
};

export const sendTrip = async (req, res) => {
  const notification = await notificationService.sendTripNotification(req.body);
  return created(res, notification, 'Trip notification queued');
};

export const sendReturnTrip = async (req, res) => {
  const notification = await notificationService.sendReturnTripAlert(req.body);
  return created(res, notification, 'Return trip alert queued');
};

export const sendSharedTruck = async (req, res) => {
  const notification = await notificationService.sendSharedTruckAlert(req.body);
  return created(res, notification, 'Shared truck alert queued');
};

export const preview = async (req, res) => {
  const previewResult = await notificationService.previewNotification(req.body);
  return success(res, previewResult, 'Notification preview generated');
};

export const list = async (req, res) => {
  const result = await notificationService.listNotifications({
    userId: req.user.id,
    category: req.query.category,
    unreadOnly: req.query.unread_only,
    page: req.query.page,
    limit: req.query.limit,
  });
  return success(res, result, 'Notifications retrieved');
};

export const getById = async (req, res) => {
  const notification = await notificationService.getNotificationById(req.params.id, req.user.id);
  return success(res, notification, 'Notification retrieved');
};

export const markRead = async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  return success(res, notification, 'Notification marked as read');
};

export const markAllRead = async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);
  return success(res, result, 'All notifications marked as read');
};

export const deleteNotification = async (req, res) => {
  const result = await notificationService.deleteNotification(req.params.id, req.user.id);
  return success(res, result, 'Notification deleted');
};

export const getEvents = async (_req, res) => {
  const events = notificationService.getSupportedEvents();
  return success(res, events, 'Supported notification events');
};
