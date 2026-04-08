import { getCredit, getCreditRecords } from '../../apis/user';
import { t } from '../../utils/i18n';

function getLevelLabel(level: number) {
  const map: Record<number, string> = {
    0: t('credit.level.poor'),
    1: t('credit.level.normal'),
    2: t('credit.level.good'),
    3: t('credit.level.excellent'),
  };
  return map[level] || t('credit.level.normal');
}

function getLevelTone(level: number) {
  if (level >= 3) return 'excellent';
  if (level === 2) return 'good';
  if (level === 1) return 'normal';
  return 'poor';
}

Page({
  data: {
    navTitle: '',
    currentLang: 'zh' as 'zh' | 'en',
    summary: null as any,
    records: [] as any[],
    statCards: [] as Array<{ label: string; value: string; tone: string }>,
  },

  onLoad() {
    this.refreshLanguage();
    this.loadCredit();
  },

  onShow() {
    this.refreshLanguage();
  },

  refreshLanguage() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    this.setData({
      currentLang,
      navTitle: t('credit.title'),
    });
  },

  buildStatCards(records: any[]) {
    const positiveCount = records.filter((item) => Number(item.points) >= 0).length;
    const negativeCount = records.length - positiveCount;
    const latestDate = records[0]?.date || '-';

    return [
      {
        label: this.data.currentLang === 'zh' ? '累计记录' : 'Records',
        value: String(records.length),
        tone: 'neutral',
      },
      {
        label: this.data.currentLang === 'zh' ? '加分次数' : 'Positive',
        value: String(positiveCount),
        tone: 'good',
      },
      {
        label: this.data.currentLang === 'zh' ? '扣分次数' : 'Deductions',
        value: String(negativeCount),
        tone: negativeCount > 0 ? 'warning' : 'neutral',
      },
      {
        label: this.data.currentLang === 'zh' ? '最近更新' : 'Updated',
        value: latestDate ? String(latestDate).split('T')[0] : '-',
        tone: 'neutral',
      },
    ];
  },

  loadCredit() {
    Promise.all([getCredit(), getCreditRecords({ page: 1, limit: 50 })])
      .then(([summaryRes, recordsRes]: any) => {
        const summary = summaryRes.data || {};
        const recordData = recordsRes.data?.records || summary.records || [];
        const score = Number(summary.creditScore ?? summary.score ?? 0);
        const level = Number(summary.level ?? 1);
        const normalizedRecords = recordData.map((item: any) => {
          const points = Number(item.points || 0);
          return {
            ...item,
            points,
            date: item.date ? String(item.date).split('T')[0] : '-',
            pointsText: `${points >= 0 ? '+' : ''}${points}`,
            pointsClass: points >= 0 ? 'plus' : 'minus',
          };
        });

        this.setData({
          summary: {
            score,
            level,
            levelLabel: getLevelLabel(level),
            levelTone: getLevelTone(level),
            scorePercent: `${Math.max(0, Math.min(100, score))}%`,
            intro:
              this.data.currentLang === 'zh'
                ? '按时签到、正常结束预约和参与活动都会影响信用分。'
                : 'Check-ins, completed bookings and activity participation all affect your credit score.',
          },
          records: normalizedRecords,
          statCards: this.buildStatCards(normalizedRecords),
        });
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
      });
  },
});
