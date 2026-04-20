/**
 * 变更申请相关 API
 */

import { createApi } from '../utils/helpers';
import type { ApiResponse, ChangeRequest, CreateChangeRequestParams } from '../types/api.types';

const changeRequestApi = createApi('/api/booking/change-requests');

/**
 * 提交变更申请
 * POST /api/booking/change-requests
 */
export const createChangeRequest = (
  data: CreateChangeRequestParams
): Promise<ApiResponse<ChangeRequest>> =>
  changeRequestApi.post('', data, {
    needAuth: true,
    showLoading: true,
    loadingTitle: '提交中...',
  }) as any;

/**
 * 获取我的变更申请列表
 * GET /api/booking/change-requests
 */
export const getMyChangeRequests = (params?: {
  status?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
}): Promise<ApiResponse<{ requests: ChangeRequest[]; total: number }>> =>
  changeRequestApi.get(
    '',
    {
      ...params,
      pageSize: params?.pageSize ?? params?.limit,
    },
    { needAuth: true }
  ) as any;
