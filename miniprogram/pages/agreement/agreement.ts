import { getLangClassName } from '../../utils/i18n';

Page({
  data: {
    pageTitle: '用户协议',
    languageClass: '',
    contentTitle: '用户协议',
    contentItems: [] as string[],
  },

  onLoad(options: Record<string, string>) {
    const type = String(options?.type || 'agreement');
    const isPrivacy = type === 'privacy';
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';

    const zhAgreement = [
      '1. 使用本应用即视为同意遵守预约规则与校园管理规范。',
      '2. 用户需确保个人信息真实有效，不得冒用他人身份。',
      '3. 预约成功后请按时签到与签退，违规将触发信用扣分。',
      '4. 禁止利用系统漏洞进行恶意占座或批量刷请求。',
      '5. 平台保留在必要时调整规则与处理异常账号的权利。',
    ];

    const zhPrivacy = [
      '1. 我们仅收集实现预约服务所必需的信息（账号、预约记录等）。',
      '2. 仅在用户授权场景下访问必要能力（如登录、消息通知）。',
      '3. 用户数据仅用于业务处理与安全审计，不用于未经授权的用途。',
      '4. 你可以在个人资料与设置页面管理可编辑信息。',
      '5. 如有隐私问题，可联系管理员发起反馈处理。',
    ];

    const enAgreement = [
      '1. By using this app, you agree to follow booking rules and campus policies.',
      '2. You must provide authentic profile information and avoid impersonation.',
      '3. Check-in/check-out on time after booking; violations may reduce credit score.',
      '4. Exploiting system loopholes for malicious seat occupation is prohibited.',
      '5. The platform may adjust rules and handle abnormal accounts when needed.',
    ];

    const enPrivacy = [
      '1. We collect only data required for booking services (account and booking records).',
      '2. We access capabilities only with authorization when necessary.',
      '3. Data is used for service processing and security audit only.',
      '4. You can manage editable profile fields in personal settings.',
      '5. Contact administrators through feedback if you have privacy concerns.',
    ];

    const isZh = currentLang !== 'en';
    const contentItems = isZh
      ? isPrivacy
        ? zhPrivacy
        : zhAgreement
      : isPrivacy
        ? enPrivacy
        : enAgreement;

    this.setData({
      languageClass: getLangClassName(),
      pageTitle: isZh
        ? isPrivacy
          ? '隐私政策'
          : '用户协议'
        : isPrivacy
          ? 'Privacy Policy'
          : 'User Agreement',
      contentTitle: isZh
        ? isPrivacy
          ? '隐私政策'
          : '用户协议'
        : isPrivacy
          ? 'Privacy Policy'
          : 'User Agreement',
      contentItems,
    });
  },
});
