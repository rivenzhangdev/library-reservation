/**
 * 反馈相关 API
 */

import { createApi } from '../utils/helpers';

const feedbackApi = createApi('/api/feedback');

/**
 * 提交反馈
 * POST /api/feedback
 */
export const submitFeedback = (data: any) =>
  feedbackApi.post('', data, {
    needAuth: true,
    showLoading: true,
    loadingTitle: '提交中...',
  });

/**
 * 获取我的反馈列表
 * GET /api/feedback/my
 */
export const getMyFeedbacks = (params?: any) => feedbackApi.get('/my', params, { needAuth: true });

/**
 * 获取反馈详情
 * GET /api/feedback/:id
 */
export const getFeedbackDetail = (id: string) =>
  feedbackApi.get(`/${id}`, null, { needAuth: true });

export default {
  submitFeedback,
  getMyFeedbacks,
  getFeedbackDetail,
};
