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

/**
 * 统一错误处理
 */
function handleError(res: WechatMiniprogram.RequestSuccessCallbackResult) {
  const statusCode = res.statusCode;
  const error = (res.data as any)?.error;

  // HTTP 状态码错误
  if (statusCode !== 200) {
    const errorMessages: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权，请先登录',
      403: '权限不足',
      404: '请求的资源不存在',
      409: '请求冲突',
      500: '服务器内部错误',
    };

    const message = errorMessages[statusCode] || `请求失败 (${statusCode})`;
    wx.showToast({ title: message, icon: 'none', duration: 2000 });

    // 401 跳转到登录页
    if (statusCode === 401) {
      clearAuthState();
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/profile/profile' });
      }, 1500);
    }

    return Promise.reject({ code: `HTTP_${statusCode}`, message });
  }

  // 业务错误
  const responseData = res.data as HttpResponse;
  if (responseData && !responseData.success) {
    const errorCode = error?.code;
    const errorMessage = error?.message || '操作失败';

    // 业务错误码映射
    const errorMessages: Record<string, string> = {
      INVALID_PARAMS: '参数错误',
      SEAT_NOT_FOUND: '座位不存在',
      BOOKING_CONFLICT: '该时间段已被预约',
      ALREADY_BOOKED: '您已预约过该时间段',
      InvalidToken: '登录已过期，请重新登录',
      TokenExpired: 'Token 已过期',
      SeatNotAvailable: '座位当前不可用',
      CheckinTimeout: '签到超时',
    };

    const message = errorMessages[errorCode || ''] || errorMessage;
    wx.showToast({ title: message, icon: 'none', duration: 2000 });

    // Token 过期处理
    if (errorCode === 'InvalidToken' || errorCode === 'TokenExpired') {
      clearAuthState();
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/profile/profile' });
      }, 1500);
    }

    return Promise.reject({ code: errorCode, message });
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

    // 需要认证时添加 Token
    if (options.needAuth && token) {
      header['Authorization'] = `Bearer ${token}`;
    } else if (options.needAuth && !token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      reject(new Error('未登录'));
      return;
    }

    // 拼接完整 URL，优先使用 options.baseUrl，其次动态读取配置中的 baseUrl
    const baseUrl = options.baseUrl || getDefaultBase();

    // 如果在真机/模拟器运行且 baseUrl 使用 localhost，提示开发者使用主机局域网 IP 进行联调
    try {
      const sys = wx.getSystemInfoSync && wx.getSystemInfoSync();
      if (sys && sys.platform !== 'devtools' && /localhost|127\.0\.0\.1/.test(baseUrl)) {
        // 不阻塞请求，仅做提示
        wx.showToast({
          title:
            '检测到 baseUrl 为 localhost；真机调试请将后端地址改为主机 LAN IP（例如 192.168.x.x:3000）',
          icon: 'none',
          duration: 3500,
        });
      }
    } catch (_e) {
      // ignore
    }

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
          handleError(res);
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
    console.log('设置基础 URL:', baseUrl);
  }

  /**
   * 启用/禁用日志
   */
  enableLog(enable: boolean) {
    // 可以在这里实现全局的日志配置
    console.log('日志功能:', enable ? '已启用' : '已禁用');
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
