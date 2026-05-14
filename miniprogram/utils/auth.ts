/**
 * 认证模块
 * 提供 Token 管理、用户信息管理等能力
 */

const TOKEN_KEY = 'library_reservation_token';
const USER_INFO_KEY = 'library_reservation_user_info';
const LOGIN_PAGE_DISMISSED_AT_KEY = 'library_reservation_login_page_dismissed_at';
const LOGIN_REDIRECT_SUPPRESS_MS = 2500;

function syncGlobalUserInfo(userInfo: any): void {
  try {
    const app = getApp<IAppOption>();
    if (app && app.globalData) {
      app.globalData.userInfo = userInfo || undefined;
    }
  } catch (_e) {
    // ignore before app init
  }
}

/**
 * 获取 Token
 */
export function getToken(): string {
  try {
    return wx.getStorageSync(TOKEN_KEY) || '';
  } catch (e) {
    console.error('获取 Token 失败:', e);
    return '';
  }
}

/**
 * 设置 Token
 */
export function setToken(token: string): void {
  try {
    wx.setStorageSync(TOKEN_KEY, token);
  } catch (e) {
    console.error('保存 Token 失败:', e);
  }
}

/**
 * 移除 Token
 */
export function removeToken(): void {
  try {
    wx.removeStorageSync(TOKEN_KEY);
  } catch (e) {
    console.error('清除 Token 失败:', e);
  }
}

/**
 * 获取用户信息
 */
export function getUserInfo(): any {
  try {
    return wx.getStorageSync(USER_INFO_KEY) || null;
  } catch (e) {
    console.error('获取用户信息失败:', e);
    return null;
  }
}

/**
 * 设置用户信息
 */
export function setUserInfo(userInfo: any): void {
  try {
    wx.setStorageSync(USER_INFO_KEY, userInfo);
    syncGlobalUserInfo(userInfo);
  } catch (e) {
    console.error('保存用户信息失败:', e);
  }
}

/**
 * 清除用户信息
 */
export function clearUserInfo(): void {
  try {
    wx.removeStorageSync(USER_INFO_KEY);
    syncGlobalUserInfo(null);
  } catch (e) {
    console.error('清除用户信息失败:', e);
  }
}

/**
 * 检查是否已登录
 */
export function isLogin(): boolean {
  const token = getToken();
  return !!token;
}

function getLoginDismissedAt(): number {
  try {
    return Number(wx.getStorageSync(LOGIN_PAGE_DISMISSED_AT_KEY) || 0);
  } catch (_e) {
    return 0;
  }
}

export function markLoginPageDismissed(): void {
  try {
    wx.setStorageSync(LOGIN_PAGE_DISMISSED_AT_KEY, Date.now());
  } catch (e) {
    console.warn('记录登录页关闭时间失败:', e);
  }
}

export function clearLoginRedirectSuppression(): void {
  try {
    wx.removeStorageSync(LOGIN_PAGE_DISMISSED_AT_KEY);
  } catch (e) {
    console.warn('清理登录页关闭标记失败:', e);
  }
}

export function shouldSuppressLoginRedirect(): boolean {
  const dismissedAt = getLoginDismissedAt();
  if (!dismissedAt) return false;
  return Date.now() - dismissedAt < LOGIN_REDIRECT_SUPPRESS_MS;
}

export function redirectToLogin(
  redirectUrl?: string,
  options?: {
    force?: boolean;
  }
): void {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as any;
  if (currentPage?.route === 'pages/login/login') {
    return;
  }

  if (!options?.force && shouldSuppressLoginRedirect()) {
    return;
  }

  const query = redirectUrl ? `?redirectUrl=${encodeURIComponent(redirectUrl)}` : '';
  wx.navigateTo({ url: `/pages/login/login${query}` });
}

export function hasBoundStudentInfo(userInfo?: any): boolean {
  const user = userInfo || getUserInfo();
  const studentId = String(user?.studentId || '').trim();
  return !!studentId && studentId !== '-';
}

/**
 * 需要登录才能执行的操作
 */
export function requireLogin(callback: () => void): void {
  if (isLogin()) {
    callback();
  } else {
    redirectToLogin();
  }
}

/**
 * 退出登录
 */
export function logout(): void {
  removeToken();
  clearUserInfo();
  wx.showToast({
    title: '已退出登录',
    icon: 'success',
  });
}

/**
 * 清理登录态
 */
export function clearAuthState(): void {
  removeToken();
  clearUserInfo();
}

export function ensureBoundStudentInfo(options?: {
  title?: string;
  content?: string;
  confirmText?: string;
  onBound?: () => void;
}): boolean {
  if (hasBoundStudentInfo()) {
    options?.onBound?.();
    return true;
  }

  wx.showModal({
    title: options?.title || '请先完善个人信息',
    content: options?.content || '绑定后才可以预约座位，是否前往个人信息页完成绑定？',
    confirmText: options?.confirmText || '去绑定',
    success: (res) => {
      if (!res.confirm) return;
      wx.navigateTo({
        url: '/pages/personal-info/personal-info',
      });
    },
  });

  return false;
}

export default {
  getToken,
  setToken,
  removeToken,
  getUserInfo,
  setUserInfo,
  clearUserInfo,
  isLogin,
  redirectToLogin,
  markLoginPageDismissed,
  clearLoginRedirectSuppression,
  shouldSuppressLoginRedirect,
  requireLogin,
  logout,
  clearAuthState,
  hasBoundStudentInfo,
  ensureBoundStudentInfo,
};
