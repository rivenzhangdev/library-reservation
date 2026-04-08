/**
 * API 统一导出文件
 * 所有 API 模块通过此文件导出，使用命名空间方式
 */

// HTTP 工具类
export { http, httpGet, httpPost, httpPut, httpDelete } from '../utils/http';
export type { RequestOptions, HttpResponse } from '../utils/http';

// API 辅助工具
export { createApi } from '../utils/helpers';

// 各模块 API（使用命名空间导出）
export * as authApi from './auth';
export * as seatsApi from './seats';
export * as bookingApi from './booking';
export * as userApi from './user';
export * as notificationApi from './notification';
export * as activityApi from './activity';
export * as feedbackApi from './feedback';
export * as uploadApi from './upload';

// 默认导出所有 API 模块（可选，方便批量导入）
import * as authApi from './auth';
import * as seatsApi from './seats';
import * as bookingApi from './booking';
import * as userApi from './user';
import * as notificationApi from './notification';
import * as activityApi from './activity';
import * as feedbackApi from './feedback';
import * as uploadApi from './upload';

export default {
  auth: authApi,
  seats: seatsApi,
  booking: bookingApi,
  user: userApi,
  notification: notificationApi,
  activity: activityApi,
  feedback: feedbackApi,
  upload: uploadApi,
};
