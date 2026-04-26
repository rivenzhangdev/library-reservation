// i18n.ts - 多语言工具模块（支持 WXML 直接调用）
import langPacks from '../data/langs/index';

type LangCode = 'zh' | 'en';
type LangData = (typeof langPacks)['zh'];

class I18n {
  private currentLang: LangCode = 'zh';
  private langData: LangData = {} as LangData;
  private missingKeys = new Set<string>();

  constructor(defaultLang: LangCode = 'zh') {
    this.currentLang = defaultLang;
    this.loadLanguage(this.currentLang);
  }

  // 加载语言包
  loadLanguage(lang: LangCode) {
    this.currentLang = lang;
    this.langData = langPacks[lang] || {};

    // 更新全局数据
    const app = getApp<IAppOption>();
    if (app && app.globalData) {
      app.globalData.currentLang = lang;
      app.globalData.langData = this.langData;

      // 将 t 函数挂载到 App 实例，供 WXML 使用
      app.t = (key: string, params?: Record<string, any>) => this.t(key as keyof LangData, params);
    }

    // 设置页面语言属性
    this.setPageLangAttribute();
  }

  // 获取当前语言
  getLanguage(): LangCode {
    return this.currentLang;
  }

  // 获取语言类名，用于动态样式
  getLangClassName(): string {
    return `lang-${this.currentLang}`;
  }

  // 翻译函数 - 支持 t('key') 调用方式
  t(key: keyof LangData, params?: Record<string, any>): string {
    let result = this.langData[key];

    // 如果当前语言找不到，尝试从默认语言查找
    if (!result && this.currentLang !== 'zh') {
      result = (langPacks['zh'] as any)[key];
    }

    if (!result) {
      const rawKey = String(key || '').trim();
      if (rawKey && !this.missingKeys.has(rawKey)) {
        this.missingKeys.add(rawKey);
        console.warn(`[i18n] Missing translation key: ${rawKey}`);
      }

      const fallbackLabel = rawKey.split('.').pop() || rawKey;
      result = fallbackLabel;
    }

    // 处理参数替换
    if (typeof result === 'string' && params) {
      Object.keys(params).forEach((paramKey) => {
        result = result.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }
    return result || String(key);
  }

  // 切换语言
  switchLanguage(lang: LangCode) {
    if (lang !== this.currentLang) {
      this.loadLanguage(lang);

      // 刷新当前页面
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1] as any;
        if (currentPage && currentPage.onShow) {
          currentPage.onShow();
        }
      }

      // 更新全局语言类名
      const app = getApp<IAppOption>();
      if (app && app.globalData) {
        app.globalData.languageClass = this.getLangClassName();
      }
    }
  }

  // 设置页面语言属性（用于样式选择器 [lang='en']）
  private setPageLangAttribute() {
    const pages = getCurrentPages();
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1] as any;
      if (currentPage) {
        currentPage.setData({
          currentLang: this.currentLang,
          languageClass: this.getLangClassName(),
        });
      }
    }
  }
}

// 创建全局 i18n 实例
const i18n = new I18n('zh');

// 导出 t 函数，支持直接调用 t('key')
export const t = (key: string, params?: Record<string, any>) =>
  i18n.t(key as keyof LangData, params);

// 导出语言切换函数
export const switchLanguage = (lang: LangCode) => i18n.switchLanguage(lang);

// 导出语言类名获取函数
export const getLangClassName = () => i18n.getLangClassName();

// 导出 i18n 实例
export default i18n;
