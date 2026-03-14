import { t } from '../../utils/i18n';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentLang: 'zh',
    // 多语言文案
    pageTitle: t('profile.pageTitle'),
    sectionTitle: t('profile.sectionTitle'),
    // 用户信息
    userName: t('profile.user.name'),
    studentId: t('profile.user.studentId'),
    phone: t('profile.user.phone'),
    creditScore: t('profile.user.creditScore'),
    balance: t('profile.user.balance'),
    // 服务菜单
    myReservationLabel: t('profile.service.myReservation'),
    myCollectionLabel: t('profile.service.myCollection'),
    historyLabel: t('profile.service.history'),
    settingsLabel: t('profile.service.settings'),
    // 徽章数量
    reservationBadge: 2,
    // 语言切换按钮文案
    langSwitchLabel: t('common.lang.en'),
    langSwitchDesc: '切换到英文',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.updateLanguage();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.updateLanguage();
  },

  /**
   * 更新页面语言
   */
  updateLanguage() {
    const app = getApp<IAppOption>();
    if (app && app.globalData) {
      const currentLang = app.globalData.currentLang || 'zh';
      const isZh = currentLang === 'zh';

      this.setData({
        currentLang,
        pageTitle: t('profile.pageTitle'),
        sectionTitle: t('profile.sectionTitle'),
        userName: t('profile.user.name'),
        studentId: t('profile.user.studentId'),
        phone: t('profile.user.phone'),
        creditScore: t('profile.user.creditScore'),
        balance: t('profile.user.balance'),
        myReservationLabel: t('profile.service.myReservation'),
        myCollectionLabel: t('profile.service.myCollection'),
        historyLabel: t('profile.service.history'),
        settingsLabel: t('profile.service.settings'),
        // 语言切换按钮文案
        langSwitchLabel: isZh ? t('common.lang.en') : t('common.lang.zh'),
        langSwitchDesc: isZh ? '切换到英文' : 'Switch to Chinese',
      });
    }
  },

  /**
   * 切换到语言设置
   */
  onLanguageSwitch() {
    const app = getApp<IAppOption>();
    if (app && app.switchLanguage) {
      const currentLang = app.globalData.currentLang || 'zh';
      const newLang = currentLang === 'zh' ? 'en' : 'zh';
      app.switchLanguage(newLang);
    }
  },

  /**
   * 跳转到我的预约
   */
  onMyReservationTap() {
    wx.navigateTo({
      url: '/pages/reservation/reservation',
    });
  },

  /**
   * 跳转到我的收藏
   */
  onMyCollectionTap() {
    // TODO: 跳转到收藏页面
    wx.showToast({
      title: '敬请期待',
      icon: 'none',
    });
  },

  /**
   * 跳转到预约历史
   */
  onHistoryTap() {
    // TODO: 跳转到历史页面
    wx.showToast({
      title: '敬请期待',
      icon: 'none',
    });
  },

  /**
   * 跳转到设置
   */
  onSettingsTap() {
    // TODO: 跳转到设置页面
    wx.showToast({
      title: '敬请期待',
      icon: 'none',
    });
  },
});
