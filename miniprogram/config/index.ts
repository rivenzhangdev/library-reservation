/**
 * 应用配置
 */

/**
 * 多环境支持的配置
 */
import { PROJECT_BACKEND_ENVS } from './backendEnvs';

type BackendEnvItem = {
  key: 'development' | 'test' | 'uat' | 'production';
  label: string;
  baseUrl: string;
  lanBaseUrl: string;
  isProd: boolean;
};

// 每次启动时使用的默认后端环境（修改这里即可切换）
export const BOOT_BACKEND_ENV_KEY: BackendEnvItem['key'] = 'production';

export const BACKEND_ENVS: BackendEnvItem[] = PROJECT_BACKEND_ENVS.map((env) => ({
  key: env.key,
  label: env.label,
  baseUrl: env.baseUrl,
  lanBaseUrl: env.lanBaseUrl || '',
  isProd: !!env.isProd,
}));

const DEFAULTS: Record<string, string> = BACKEND_ENVS.reduce(
  (acc: Record<string, string>, env) => {
    acc[env.key] = env.baseUrl;
    return acc;
  },
  {} as Record<string, string>
);

// 可选的 lan 地址映射（用于真机优先访问）
const LAN_DEFAULTS: Record<string, string> = BACKEND_ENVS.reduce(
  (acc: Record<string, string>, env) => {
    if (env.lanBaseUrl) {
      acc[env.key] = env.lanBaseUrl;
    }
    return acc;
  },
  {} as Record<string, string>
);

const STORAGE_KEY = 'backend_base_url';
const STORAGE_ENV_KEY = 'backend_env_key';

export function getCurrentBackendEnvKey(): BackendEnvItem['key'] | undefined {
  try {
    const storedKey = wx.getStorageSync(STORAGE_ENV_KEY) as string;
    if (storedKey && BACKEND_ENVS.some((item) => item.key === storedKey)) {
      return storedKey as BackendEnvItem['key'];
    }
  } catch (_e) {
    // ignore
  }

  const currentBase = getBaseUrl();
  const matched = BACKEND_ENVS.find(
    (item) => item.baseUrl === currentBase || item.lanBaseUrl === currentBase
  );
  return matched?.key;
}

export function isCurrentBackendEnvProd() {
  const currentKey = getCurrentBackendEnvKey();
  return !!currentKey && BACKEND_ENVS.some((item) => item.key === currentKey && item.isProd);
}

export function isReleasePackage() {
  try {
    const sys = wx.getSystemInfoSync && (wx.getSystemInfoSync() as any);
    return !!sys && sys.envVersion === 'release';
  } catch (_e) {
    return false;
  }
}

function resolveLanBaseUrl(baseUrl: string) {
  if (!/localhost|127\.0\.0\.1/.test(baseUrl)) {
    return baseUrl;
  }

  try {
    const sys = wx.getSystemInfoSync && wx.getSystemInfoSync();
    if (sys && sys.platform && sys.platform !== 'devtools') {
      const matchedEnv = (Object.keys(DEFAULTS) as Array<keyof typeof DEFAULTS>).find(
        (key) => DEFAULTS[key] === baseUrl
      );
      if (matchedEnv) {
        const matchedLan = LAN_DEFAULTS[matchedEnv];
        if (matchedLan) {
          return matchedLan;
        }
      }
      const firstLan = Object.values(LAN_DEFAULTS).find((v) => v && v.length > 0);
      if (firstLan) {
        return firstLan;
      }
    }
  } catch (_e) {
    // ignore
  }

  return baseUrl;
}

export function getBaseUrl() {
  try {
    const b = wx.getStorageSync(STORAGE_KEY) as string;
    if (b) return resolveLanBaseUrl(b);
  } catch (_e) {
    // ignore
  }

  // 如果在真机运行（非 devtools），且共享配置提供了 lanBaseUrl，优先使用 lanBaseUrl
  try {
    const sys = wx.getSystemInfoSync && wx.getSystemInfoSync();
    if (sys && sys.platform && sys.platform !== 'devtools') {
      if (isReleasePackage()) {
        return DEFAULTS.production;
      }

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

export function setBackendEnvKey(key: BackendEnvItem['key']) {
  try {
    wx.setStorageSync(STORAGE_ENV_KEY, key);
  } catch (_e) {
    // ignore
  }
}

export function resetBackendEnvStorageOnLaunch(key: BackendEnvItem['key'] = BOOT_BACKEND_ENV_KEY) {
  const found = BACKEND_ENVS.find((item) => item.key === key) || BACKEND_ENVS[0];
  if (!found) return;

  try {
    wx.removeStorageSync(STORAGE_KEY);
    wx.removeStorageSync(STORAGE_ENV_KEY);
  } catch (_e) {
    // ignore
  }

  setBackendEnvKey(found.key);
  setBaseUrl(found.baseUrl);
}

// 请求超时时间（毫秒）
export const REQUEST_TIMEOUT = 10000;

// 是否启用日志
export const ENABLE_LOG = true;

export default {
  BACKEND_ENVS,
  BOOT_BACKEND_ENV_KEY,
  getBaseUrl,
  setBaseUrl,
  setBackendEnvKey,
  resetBackendEnvStorageOnLaunch,
  isCurrentBackendEnvProd,
  REQUEST_TIMEOUT,
  ENABLE_LOG,
};
