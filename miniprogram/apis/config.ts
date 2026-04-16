import { createApi } from '../utils/helpers';

const configApi = createApi('/api/config');

/**
 * 获取后台配置的时间段列表
 * GET /api/config/time-slots
 */
export const getTimeSlotConfigs = () => configApi.get('/time-slots');
export const getBookingRules = () => configApi.get('/booking-rules');

export const getSeatTypeConfigs = () => configApi.get('/seat-types');
export const getSeatFacilityConfigs = () => configApi.get('/seat-facilities');

export default {
  getTimeSlotConfigs,
  getSeatTypeConfigs,
  getSeatFacilityConfigs,
};
