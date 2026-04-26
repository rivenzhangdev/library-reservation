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
): Promise<ApiResponse<ChangeRequest>> => {
  const payload: any = {
    ...data,
    changeType: (data as any).changeType ?? (data as any).type,
    targetDate: (data as any).targetDate ?? (data as any).newDate,
    targetTimeSlot: (data as any).targetTimeSlot ?? (data as any).newTimeSlot,
    targetStartTime: (data as any).targetStartTime ?? (data as any).newStartTime,
    targetEndTime: (data as any).targetEndTime ?? (data as any).newEndTime,
    targetSeatId: (data as any).targetSeatId ?? (data as any).newSeatId,
  };

  delete payload.type;
  delete payload.newDate;
  delete payload.newTimeSlot;
  delete payload.newStartTime;
  delete payload.newEndTime;
  delete payload.newSeatId;

  return changeRequestApi.post('', payload, {
    needAuth: true,
    showLoading: true,
    loadingTitle: '提交中...',
  }) as any;
};

/**
 * 获取我的变更申请列表
 * GET /api/booking/change-requests
 */
export const getMyChangeRequests = (params?: {
  status?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
}): Promise<ApiResponse<{ requests: ChangeRequest[]; total: number }>> => {
  const normalizedStatus = String(params?.status ?? '').trim();
  const requestParams: any = {
    page: params?.page,
    pageSize: params?.pageSize ?? params?.limit,
  };

  if (
    normalizedStatus &&
    normalizedStatus !== 'undefined' &&
    normalizedStatus !== 'null' &&
    normalizedStatus !== 'all'
  ) {
    requestParams.status = normalizedStatus;
  }

  return changeRequestApi.get('', requestParams, { needAuth: true }) as any;
};

/**
 * 撤销变更申请
 * POST /api/booking/change-requests/:id/withdraw
 */
export const withdrawChangeRequest = (id: number) => {
  return changeRequestApi.post(
    `/${id}/withdraw`,
    {},
    {
      needAuth: true,
      showLoading: true,
      loadingTitle: '正在撤销',
    }
  );
};
