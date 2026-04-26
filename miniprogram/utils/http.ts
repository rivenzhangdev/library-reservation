/**
 * HTTP 请求封装模块
 * 提供统一的 HTTP 请求方法，支持配置、Token、错误处理等
 */

import { clearAuthState, getToken } from './auth';
import { getBaseUrl, ENABLE_LOG as LOG_ENABLED } from '../config/index';

// API 基础 URL 动态获取
const getDefaultBase = () => getBaseUrl();

// 是否启用日志
const ENABLE_LOG = LOG_ENABLED;

/**
 * HTTP 请求配置接口
 */
export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: any;
  needAuth?: boolean; // 是否需要认证（自动添加 Token）
  showLoading?: boolean; // 是否显示加载中
  loadingTitle?: string; // 加载中提示文案
  baseUrl?: string; // 自定义基础 URL
  timeout?: number; // 超时时间（毫秒）
}

/**
 * HTTP 响应数据结构
 */
export interface HttpResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface RequestAuthRequiredError {
  code: 'AUTH_REQUIRED';
  message: string;
  silent: true;
}

/**
 * 统一错误处理
 */
function handleError(res: WechatMiniprogram.RequestSuccessCallbackResult) {
  const statusCode = res.statusCode;
  const error = (res.data as any)?.error;

  // HTTP 状态码错误
  if (statusCode !== 200) {
    const responseData = (res.data || {}) as HttpResponse;
    const businessCode = String((error as any)?.code || '').trim();
    const businessMessage =
      ((error as any)?.message && String((error as any).message).trim()) ||
      (responseData as any)?.message ||
      '';

    const errorMessages: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权，请先登录',
      403: '权限不足',
      404: '请求的资源不存在',
      409: '请求冲突',
      500: '服务器内部错误',
    };

    const message = businessMessage || errorMessages[statusCode] || `请求失败 (${statusCode})`;
    wx.showToast({ title: message, icon: 'none', duration: 2000 });

    // 401 跳转到登录页
    if (statusCode === 401) {
      clearAuthState();
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/login/login' });
      }, 1500);
    }

    return Promise.reject({
      code: businessCode || `HTTP_${statusCode}`,
      message,
      data: (responseData as any)?.data,
      statusCode,
      raw: res.data,
    });
  }

  // 业务错误
  const responseData = res.data as HttpResponse;
  if (responseData && !responseData.success) {
    const errorCode = String(error?.code || (responseData as any)?.code || '').trim();
    const errorMessage =
      error?.message ||
      (responseData as any)?.message ||
      (responseData as any)?.error?.message ||
      '操作失败';

    // 业务错误码映射
    const errorMessages: Record<string, string> = {
      INVALID_PARAMS: '参数错误',
      SEAT_NOT_FOUND: '座位不存在',
      BOOKING_CONFLICT: '该时间段已被预约',
      ALREADY_BOOKED: '您已预约过该时间段',
      USER_BLACKLISTED: '您的账号已被列入黑名单，无法继续操作',
      InvalidToken: '登录已过期，请重新登录',
      TokenExpired: 'Token 已过期',
      SeatNotAvailable: '座位当前不可用',
      CheckinTimeout: '签到超时',
      // 数字错误码
      '1001': '参数错误',
      '1002': '未授权，请先登录',
      '1003': '权限不足',
      '1004': '资源不存在',
      '2004': '登录已过期，请重新登录',
      '2005': 'Token 已过期',
      '3008': '您的账号已被列入黑名单，无法继续操作',
      '4001': '座位不存在',
      '5001': '该时间段已被预约',
      '5002': '您已预约过该时间段',
      '5003': '创建预约失败',
      '5005': '预约不存在',
      '5007': '签到失败',
      '5008': '不允许签到',
      '5009': '续约失败',
      '5101': '当前请求名额已满',
      '5102': '您已提交过该请求',
      '5103': '相关记录不存在',
      '5104': '当前请求已超时',
      '5105': '该时段仍有空位，请直接预约',
      '5201': '变更申请不存在',
      '5202': '该申请已审批',
      '5203': '请勿重复提交申请',
      '5204': '目标时段/座位不可用',
      '5301': '续约次数已达上限',
      '5302': '续约目标时段不可用',
      '5303': '每日预约次数已达上限',
      '7001': '活动不存在',
      '7005': '活动已结束',
      '7007': '您已报名该活动',
      '7008': '活动人数已满',
      '7009': '您未报名该活动',
      '7011': '活动未开始',
      '7101': '活动名额已满',
      '7102': '您已提交过该活动请求',
      '7103': '报名已截止',
    };

    const message = errorMessage || errorMessages[errorCode || ''] || '操作失败';
    wx.showToast({ title: message, icon: 'none', duration: 2000 });

    // Token 过期处理
    if (
      errorCode === 'InvalidToken' ||
      errorCode === 'TokenExpired' ||
      errorCode === '2004' ||
      errorCode === '2005' ||
      errorCode === 2004 ||
      errorCode === 2005
    ) {
      clearAuthState();
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/login/login' });
      }, 1500);
    }

    return Promise.reject({
      code: errorCode || undefined,
      message,
      data: (responseData as any)?.data,
      raw: res.data,
    });
  }

  return Promise.reject(responseData);
}

/**
 * 核心请求方法
 */
function request(options: RequestOptions): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    // 显示加载中
    if (options.showLoading) {
      wx.showLoading({
        title: options.loadingTitle || '加载中...',
        mask: true,
      });
    }

    // 获取 Token
    const token = getToken();

    // 构建请求头
    const header: any = {
      'Content-Type': 'application/json',
      ...options.header,
    };

    // 自动携带 Token（如果存在），同时支持 needAuth 强制认证
    const hasAuthHeader =
      header['Authorization'] || header['authorization'] || header['Authorization'.toLowerCase()];
    if (!hasAuthHeader && token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    if (options.needAuth && !token) {
      reject({
        code: 'AUTH_REQUIRED',
        message: '未登录，已跳过需要登录态的请求',
        silent: true,
      } as RequestAuthRequiredError);
      return;
    }

    // 拼接完整 URL，优先使用 options.baseUrl，其次动态读取配置中的 baseUrl
    const baseUrl = options.baseUrl || getDefaultBase();

    const fullUrl = `${baseUrl}${options.url}`;

    if (ENABLE_LOG) {
      console.log('🚀 HTTP Request:', {
        url: fullUrl,
        method: options.method,
        data: options.data,
        header,
      });
    }

    wx.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: options.timeout || 10000,
      success: (res) => {
        if (ENABLE_LOG) {
          console.log('✅ HTTP Response:', res.data);
        }

        // 隐藏加载中
        if (options.showLoading) {
          wx.hideLoading();
        }

        // 成功响应
        if (res.statusCode === 200 && (res.data as HttpResponse)?.success) {
          resolve(res.data as HttpResponse);
        } else {
          // 错误处理
          handleError(res).catch(reject);
          return;
        }
      },
      fail: (err) => {
        if (ENABLE_LOG) {
          console.error('❌ HTTP Error:', err);
        }

        // 隐藏加载中
        if (options.showLoading) {
          wx.hideLoading();
        }

        wx.showToast({
          title: '网络请求失败，请检查网络连接',
          icon: 'none',
          duration: 2000,
        });

        reject(err);
      },
    });
  });
}

/**
 * HTTP 工具类 - 支持链式调用和便捷方法
 */
class HttpUtils {
  /**
   * GET 请求
   * @param url 请求路径
   * @param data 请求数据
   * @param options 其他配置项
   */
  get<T = any>(
    url: string,
    data?: any,
    options?: Partial<Omit<RequestOptions, 'url' | 'method' | 'data'>>
  ) {
    return request({
      url,
      method: 'GET',
      data,
      ...options,
    }) as Promise<HttpResponse<T>>;
  }

  /**
   * POST 请求
   * @param url 请求路径
   * @param data 请求数据
   * @param options 其他配置项
   */
  post<T = any>(
    url: string,
    data?: any,
    options?: Partial<Omit<RequestOptions, 'url' | 'method' | 'data'>>
  ) {
    return request({
      url,
      method: 'POST',
      data,
      ...options,
    }) as Promise<HttpResponse<T>>;
  }

  /**
   * PUT 请求
   * @param url 请求路径
   * @param data 请求数据
   * @param options 其他配置项
   */
  put<T = any>(
    url: string,
    data?: any,
    options?: Partial<Omit<RequestOptions, 'url' | 'method' | 'data'>>
  ) {
    return request({
      url,
      method: 'PUT',
      data,
      ...options,
    }) as Promise<HttpResponse<T>>;
  }

  /**
   * DELETE 请求
   * @param url 请求路径
   * @param data 请求数据
   * @param options 其他配置项
   */
  delete<T = any>(
    url: string,
    data?: any,
    options?: Partial<Omit<RequestOptions, 'url' | 'method' | 'data'>>
  ) {
    return request({
      url,
      method: 'DELETE',
      data,
      ...options,
    }) as Promise<HttpResponse<T>>;
  }

  /**
   * 通用请求方法
   * @param options 请求配置
   */
  request(options: RequestOptions) {
    return request(options);
  }

  /**
   * 设置基础 URL（动态配置）
   */
  setBaseUrl(baseUrl: string) {
    // 设置小程序端运行时的基础 URL（保存到 storage）
    try {
      const cfg = require('../config/index');
      if (cfg && typeof cfg.setBaseUrl === 'function') {
        cfg.setBaseUrl(baseUrl);
      }
    } catch (_e) {
      // ignore
    }
  }

  /**
   * 启用/禁用日志
   */
  enableLog(enable: boolean) {
    // 可以在这里实现全局的日志配置
    void enable;
  }
}

// 导出单例
export const http = new HttpUtils();

// 同时导出快捷方法（兼容旧代码）
export const httpGet = <T = any>(url: string, data?: any, options?: any) =>
  http.get<T>(url, data, options);

export const httpPost = <T = any>(url: string, data?: any, options?: any) =>
  http.post<T>(url, data, options);

export const httpPut = <T = any>(url: string, data?: any, options?: any) =>
  http.put<T>(url, data, options);

export const httpDelete = <T = any>(url: string, data?: any, options?: any) =>
  http.delete<T>(url, data, options);

export default http;
