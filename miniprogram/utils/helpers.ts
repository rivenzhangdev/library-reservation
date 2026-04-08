/**
 * API 辅助工具
 * 提供工厂函数，自动处理基础路径拼接和请求封装
 */

import { http, RequestOptions } from './http';

/**
 * API 方法集合接口
 */
interface ApiMethods {
  get: (
    path?: string,
    data?: any,
    options?: Partial<Omit<RequestOptions, 'url' | 'method' | 'data'>>
  ) => ReturnType<typeof http.get>;
  post: (
    path?: string,
    data?: any,
    options?: Partial<Omit<RequestOptions, 'url' | 'method' | 'data'>>
  ) => ReturnType<typeof http.post>;
  put: (
    path?: string,
    data?: any,
    options?: Partial<Omit<RequestOptions, 'url' | 'method' | 'data'>>
  ) => ReturnType<typeof http.put>;
  delete: (
    path?: string,
    data?: any,
    options?: Partial<Omit<RequestOptions, 'url' | 'method' | 'data'>>
  ) => ReturnType<typeof http.delete>;
}

/**
 * 创建带基础路径的 API 方法
 *
 * @param basePath - API 基础路径，如 '/api/auth'
 * @returns 包含便捷方法的对象
 *
 * @example
 * const authApi = createApi('/api/auth');
 * authApi.post('/wxlogin', { code, userInfo });
 * // 实际请求：POST http://localhost:3000/api/auth/wxlogin
 */
export function createApi(basePath: string): ApiMethods {
  return {
    /**
     * GET 请求（自动拼接 basePath）
     */
    get: (
      path = '',
      data?: any,
      options?: Partial<Omit<RequestOptions, 'url' | 'method' | 'data'>>
    ) => http.get(`${basePath}${path}`, data, options),

    /**
     * POST 请求（自动拼接 basePath）
     */
    post: (
      path = '',
      data?: any,
      options?: Partial<Omit<RequestOptions, 'url' | 'method' | 'data'>>
    ) => http.post(`${basePath}${path}`, data, options),

    /**
     * PUT 请求（自动拼接 basePath）
     */
    put: (
      path = '',
      data?: any,
      options?: Partial<Omit<RequestOptions, 'url' | 'method' | 'data'>>
    ) => http.put(`${basePath}${path}`, data, options),

    /**
     * DELETE 请求（自动拼接 basePath）
     */
    delete: (
      path = '',
      data?: any,
      options?: Partial<Omit<RequestOptions, 'url' | 'method' | 'data'>>
    ) => http.delete(`${basePath}${path}`, data, options),
  };
}

export default createApi;
