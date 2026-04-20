import { t } from '../../utils/i18n';
import { getCredit, getCreditRecords } from '../../apis/user';
import { isLogin, redirectToLogin } from '../../utils/auth';

interface CreditRecordItem {
  id: string;
  type: number;
  typeLabel: string;
  points: number;
  pointsLabel: string;
  pointsClass: string;
  date: string;
  dateText: string;
  reason: string;
}

interface CreditPageData {
  currentLang: 'zh' | 'en';
  languageClass: string;
  pageTitle: string;
  summaryLabel: string;
  scoreTip: string;
  benefitTitle: string;
  benefitDesc: string;
  ruleTitle: string;
  ruleDesc: string;
  summaryHint: string;
  recordsTitle: string;
  trustTag: string;
  creditScore: string | number;
  creditLevelLabel: string;
  creditLevelText: string;
  nextLevelHint: string;
  progressPercent: number;
  records: CreditRecordItem[];
  page: number;
  limit: number;
  total: number;
  loading: boolean;
  recordsLoading: boolean;
  hasMore: boolean;
  emptyText: string;
  loadingText: string;
}

function formatCreditType(type: number) {
  if (type === 0) return t('credit.type.add');
  if (type === 1) return t('credit.type.deduct');
  return t('credit.type.unknown');
}

function getLevelText(level: number) {
  if (level === 3) return t('credit.level.excellent');
  if (level === 2) return t('credit.level.good');
  if (level === 1) return t('credit.level.normal');
  if (level === 0) return t('credit.level.poor');
  return t('credit.level.normal');
}

function getNextLevelInfo(score: number) {
  if (score >= 90) {
    return {
      progress: 100,
      hint: t('credit.level.max'),
    };
  }
  if (score >= 80) {
    return {
      progress: ((score - 80) / 10) * 100,
      hint: t('credit.nextLevelHint', { count: String(90 - score) }),
    };
  }
  if (score >= 60) {
    return {
      progress: ((score - 60) / 20) * 100,
      hint: t('credit.nextLevelHint', { count: String(80 - score) }),
    };
  }
  return {
    progress: (score / 60) * 100,
    hint: t('credit.nextLevelHint', { count: String(60 - score) }),
  };
}

function getPointsLabel(type: number, points: number) {
  const value = Math.abs(points);
  if (type === 1) {
    return `-${value}`;
  }
  return `+${value}`;
}

Page({
  data: {
    currentLang: 'zh',
    languageClass: 'lang-zh',
    pageTitle: t('credit.title'),
    summaryLabel: t('credit.summary'),
    scoreTip: t('credit.scoreTip'),
    benefitTitle: t('credit.benefitTitle'),
    benefitDesc: t('credit.benefitDesc'),
    ruleTitle: t('credit.ruleTitle'),
    ruleDesc: t('credit.ruleDesc'),
    summaryHint: t('credit.summaryHint'),
    recordsTitle: t('credit.records'),
    trustTag: t('credit.trustTag'),
    creditScore: '-',
    creditLevelLabel: t('credit.level.label'),
    creditLevelText: '',
    nextLevelHint: '',
    progressPercent: 0,
    records: [],
    page: 1,
    limit: 10,
    total: 0,
    loading: false,
    recordsLoading: false,
    hasMore: true,
    emptyText: t('credit.empty'),
    loadingText: t('common.hint.loading'),
  } as CreditPageData,

  onLoad() {
    this.updateLanguage();
  },

  onShow() {
    this.updateLanguage();
    this.loadPageData();
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.recordsLoading) return;
    this.loadCreditRecords(this.data.page + 1);
  },

  updateLanguage() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    this.setData({
      currentLang,
      languageClass: currentLang === 'en' ? 'lang-en' : 'lang-zh',
      pageTitle: t('credit.title'),
      summaryLabel: t('credit.summary'),
      scoreTip: t('credit.scoreTip'),
      benefitTitle: t('credit.benefitTitle'),
      benefitDesc: t('credit.benefitDesc'),
      ruleTitle: t('credit.ruleTitle'),
      ruleDesc: t('credit.ruleDesc'),
      summaryHint: t('credit.summaryHint'),
      recordsTitle: t('credit.records'),
      trustTag: t('credit.trustTag'),
      emptyText: t('credit.empty'),
      loadingText: t('common.hint.loading'),
    });
  },

  loadPageData() {
    if (!isLogin()) {
      redirectToLogin('/pages/credit/credit');
      return;
    }
    this.loadCredit();
    this.setData({ page: 1, records: [], hasMore: true });
    this.loadCreditRecords(1);
  },

  async loadCredit() {
    this.setData({ loading: true });
    try {
      const res: any = await getCredit();
      const data = res?.data ?? res;
      const score = Number(data.creditScore ?? data.score ?? 0);
      const level = Number(data.level ?? 0);
      const nextInfo = getNextLevelInfo(score);
      this.setData({
        creditScore: Number.isFinite(score) ? score : '-',
        creditLevelText: getLevelText(level),
        progressPercent: Math.min(Math.max(nextInfo.progress, 0), 100),
        nextLevelHint: nextInfo.hint,
      });
    } catch (_error) {
      this.setData({ creditScore: '-', creditLevelLabel: t('credit.level.normal') });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadCreditRecords(page: number) {
    if (!isLogin()) return;
    this.setData({ recordsLoading: true });
    try {
      const res: any = await getCreditRecords({ page, limit: this.data.limit });
      const payload = res?.data ?? res;
      const list = Array.isArray(payload?.list) ? payload.list : [];
      const total = Number(payload?.total ?? 0);
      const mapped = list.map((item: any) => {
        const type = Number(item.type);
        const points = Number(item.points || 0);
        return {
          id: item.id,
          type,
          typeLabel: formatCreditType(type),
          points,
          pointsLabel: getPointsLabel(type, points),
          pointsClass: type === 1 ? 'record-points--deduct' : 'record-points--add',
          date: item.date || item.createdAt || '',
          dateText: item.date || item.createdAt || '',
          reason: item.reason || item.typeLabel || '-',
        };
      });
      this.setData({
        records: page === 1 ? mapped : [...this.data.records, ...mapped],
        page,
        total,
        hasMore:
          mapped.length >= this.data.limit && this.data.records.length + mapped.length < total,
      });
    } catch (_error) {
      if (page === 1) {
        this.setData({ records: [], total: 0, hasMore: false });
      }
    } finally {
      this.setData({ recordsLoading: false });
    }
  },
});
