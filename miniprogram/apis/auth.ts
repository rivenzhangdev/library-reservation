/**
 * 认证相关 API
 */

import { createApi } from '../utils/helpers';

const authApi = createApi('/api/auth');
const api = createApi('/api');

/**
 * 微信登录
 * POST /api/auth/wxlogin
 */
export const wxLogin = (code: string, userInfo: any) =>
  authApi.post(
    '/wxlogin',
    { code, userInfo },
    {
      showLoading: true,
      loadingTitle: '登录中...',
    }
  );

/**
 * 绑定学号
 * POST /api/auth/bindStudentId
 */
export const bindStudentId = (studentId: string, realName: string) =>
  authApi.post(
    '/bindStudentId',
    { studentId, realName },
    {
      needAuth: true,
      showLoading: true,
    }
  );

export const precheckStudentId = (studentId: string, options?: { forChange?: boolean }) =>
  authApi.post(
    '/student-id/precheck',
    { studentId, forChange: !!options?.forChange },
    {
      needAuth: true,
      showLoading: false,
    }
  );

export const submitStudentIdBindAppeal = (payload: {
  studentId: string;
  realName: string;
  reason?: string;
  precheckReasonCode?: string;
}) =>
  authApi.post('/student-id/appeals', payload, {
    needAuth: true,
    showLoading: true,
    loadingTitle: '提交中...',
  });

export const requestStudentIdChange = (
  newStudentId: string,
  newRealName: string,
  reason?: string
) =>
  api.post(
    '/student-id-change-requests',
    { newStudentId, newRealName, reason },
    {
      needAuth: true,
      showLoading: true,
    }
  );

export const getMyPendingChangeRequest = () =>
  api.get('/student-id-change-requests/my-pending', null, { needAuth: true });

export const requestPhoneChange = (newPhone: string, reason?: string) =>
  authApi.post(
    '/phone-change-requests',
    { newPhone, reason },
    {
      needAuth: true,
      showLoading: true,
    }
  );

/**
 * 检查登录状态
 * GET /api/auth/check
 */
export const checkLogin = () => authApi.get('/check', null, { needAuth: true });

export default {
  wxLogin,
  bindStudentId,
  precheckStudentId,
  submitStudentIdBindAppeal,
  requestStudentIdChange,
  getMyPendingChangeRequest,
  requestPhoneChange,
  checkLogin,
};
