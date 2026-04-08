/**
 * 认证相关 API
 */

import { createApi } from '../utils/helpers';

const authApi = createApi('/api/auth');

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

/**
 * 检查登录状态
 * GET /api/auth/check
 */
export const checkLogin = () => authApi.get('/check', null, { needAuth: true });

export default {
  wxLogin,
  bindStudentId,
  checkLogin,
};
