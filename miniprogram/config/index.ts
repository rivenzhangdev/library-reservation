/**
 * 应用配置
 */

/**
 * 多环境支持的配置
 */
import { PROJECT_BACKEND_ENVS } from './backendEnvs';

let DEFAULTS: Record<string, string> = PROJECT_BACKEND_ENVS.reduce(
  (acc: Record<string, string>, env) => {
    acc[env.key] = env.baseUrl;
    return acc;
  },
  {} as Record<string, string>
);

// 可选的 lan 地址映射（从共享配置读取，用于真机优先访问）
let LAN_DEFAULTS: Record<string, string> = PROJECT_BACKEND_ENVS.reduce(
  (acc: Record<string, string>, env) => {
    if (env.lanBaseUrl) {
      acc[env.key] = env.lanBaseUrl;
    }
    return acc;
  },
  {} as Record<string, string>
);

// 尝试读取 workspace 根目录下的共享配置文件（若存在）
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const shared = { BACKEND_ENVS: PROJECT_BACKEND_ENVS };
  if (shared && Array.isArray(shared.BACKEND_ENVS)) {
    const map = (shared.BACKEND_ENVS as Array<any>).reduce(
      (acc: Record<string, string>, e: any) => {
        if (e && e.key && e.baseUrl) acc[e.key] = e.baseUrl;
        return acc;
      },
      {}
    );
    DEFAULTS = { ...DEFAULTS, ...map };

    // 收集可选的 lanBaseUrl 字段
    LAN_DEFAULTS = (shared.BACKEND_ENVS as Array<any>).reduce(
      (acc: Record<string, string>, e: any) => {
        if (e && e.key && e.lanBaseUrl) acc[e.key] = e.lanBaseUrl;
        return acc;
      },
      {}
    );
  }
} catch (_e) {
  // ignore and keep built-in defaults
}

const STORAGE_KEY = 'backend_base_url';

export const BACKEND_ENVS = [
  {
    key: 'development',
    label: '本地',
    baseUrl: DEFAULTS.development,
    lanBaseUrl: LAN_DEFAULTS.development || '',
  },
  { key: 'test', label: '测试', baseUrl: DEFAULTS.test, lanBaseUrl: LAN_DEFAULTS.test || '' },
  { key: 'uat', label: 'UAT', baseUrl: DEFAULTS.uat, lanBaseUrl: LAN_DEFAULTS.uat || '' },
  {
    key: 'production',
    label: '线上',
    baseUrl: DEFAULTS.production,
    lanBaseUrl: LAN_DEFAULTS.production || '',
  },
];

export function getBaseUrl() {
  try {
    const b = wx.getStorageSync(STORAGE_KEY) as string;
    if (b) return b;
  } catch (_e) {
    // ignore
  }

  // 如果在真机运行（非 devtools），且共享配置提供了 lanBaseUrl，优先使用 lanBaseUrl
  try {
    const sys = wx.getSystemInfoSync && wx.getSystemInfoSync();
    if (sys && sys.platform && sys.platform !== 'devtools') {
      const devLan = LAN_DEFAULTS.development;
      if (devLan) return devLan;
      // 否则尝试取第一个有配置的 lanBaseUrl
      const firstLan = Object.values(LAN_DEFAULTS).find((v) => v && v.length > 0);
      if (firstLan) return firstLan;
    }
  } catch (_e) {
    // ignore
  }

  return DEFAULTS.development;
}

export function setBaseUrl(baseUrl: string) {
  try {
    wx.setStorageSync(STORAGE_KEY, baseUrl);
  } catch (_e) {
    // ignore
  }
}

// 请求超时时间（毫秒）
export const REQUEST_TIMEOUT = 10000;

// 是否启用日志
export const ENABLE_LOG = true;

export default {
  BACKEND_ENVS,
  getBaseUrl,
  setBaseUrl,
  REQUEST_TIMEOUT,
  ENABLE_LOG,
};
