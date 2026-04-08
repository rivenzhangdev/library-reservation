/**
 * 活动相关 API
 */

import { createApi } from '../utils/helpers';

const activityApi = createApi('/api/activity');

/**
 * 获取活动列表
 * GET /api/activity
 */
export const getActivities = (params?: any) => activityApi.get('', params, { needAuth: true });

/**
 * 获取活动详情
 * GET /api/activity/:id
 */
export const getActivityDetail = (id: string) =>
  activityApi.get(`/${id}`, null, { needAuth: true });

/**
 * 报名活动
 * POST /api/activity/join/:id
 */
export const joinActivity = (id: string) =>
  activityApi.post(`/join/${id}`, null, {
    needAuth: true,
    showLoading: true,
    loadingTitle: '报名中...',
  });

/**
 * 取消报名
 * POST /api/activity/cancel/:id
 */
export const cancelActivity = (id: string) =>
  activityApi.post(`/cancel/${id}`, null, { needAuth: true });

export default {
  getActivities,
  getActivityDetail,
  joinActivity,
  cancelActivity,
};
