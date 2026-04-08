interface IAppOption {
  globalData: {
    userInfo?: {
      id?: string,
      username?: string,
      name?: string,
      nickName?: string,
      avatar?: string,
      avatarUrl?: string,
      studentId?: string | null,
      role?: string,
      phone?: string,
      creditScore?: number,
      [key: string]: any,
    },
    currentLang: 'zh' | 'en',
    langData: any,
    languageClass: string,
  }
  userInfoReadyCallback: WechatMiniprogram.GetUserInfoSuccessCallback,
  t: (key: string, params?: Record<string, any>) => string,
  switchLanguage: ((lang: 'zh' | 'en') => void) | undefined,
  getLangClassName: (() => string) | undefined,
  customSwitchLanguage: (lang: 'zh' | 'en') => void,
  doWxLogin: (userProfile?: Record<string, any>) => Promise<any>,
  onLaunch: () => void,
}
