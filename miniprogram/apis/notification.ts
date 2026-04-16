/**
 * 通知相关 API
 */

import { createApi } from '../utils/helpers';

const notificationApi = createApi('/api/notification');

/**
 * 获取通知列表
 * GET /api/notification
 */
export const getNotifications = (params?: any) =>
  notificationApi.get('', params, { needAuth: true });

/**
 * 获取通知详情
 * GET /api/notification/:id
 */
export const getNotificationDetail = (id: string) =>
  notificationApi.get(`/${id}`, null, { needAuth: true });

/**
 * 获取当前配置的 WeChat 订阅模板 ID
 * GET /api/notification/template-ids
 */
export const getWechatTemplateIds = () =>
  notificationApi.get('/template-ids', null, { needAuth: true });

/**
 * 标记通知已读
 * POST /api/notification/read/:id
 */
export const markAsRead = (id: string) =>
  notificationApi.post(`/read/${id}`, null, { needAuth: true });

/**
 * 批量标记已读
 * POST /api/notification/read-all
 */
export const markAllAsRead = () => notificationApi.post('/read-all', null, { needAuth: true });

/**
 * 删除通知
 * DELETE /api/notification/:id
 */
export const deleteNotification = (id: string) =>
  notificationApi.delete(`/${id}`, null, { needAuth: true });

export default {
  getNotifications,
  getNotificationDetail,
  getWechatTemplateIds,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
