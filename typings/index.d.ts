interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    currentLang: 'zh' | 'en',
    langData: any,
    languageClass: string,
  }
  userInfoReadyCallback: WechatMiniprogram.GetUserInfoSuccessCallback,
  t: (key: string, params?: Record<string, any>) => string,
  switchLanguage: ((lang: 'zh' | 'en') => void) | undefined,
  getLangClassName: (() => string) | undefined,
  customSwitchLanguage: (lang: 'zh' | 'en') => void,
  onLaunch: () => void,
}