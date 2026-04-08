import { favoriteSeat } from '../../apis/user';
import { searchSeats } from '../../apis/seats';
import { t, getLangClassName } from '../../utils/i18n';
import { openReservationWithParams } from '../../utils/reservationNavigator';
import { sortBySeatPosition } from '../../utils/sort';

function decodeKeyword(value?: string) {
  if (!value) return '';

  try {
    return decodeURIComponent(value);
  } catch (error) {
    console.warn('decode keyword failed', error);
    return value;
  }
}

function normalizeSeat(seat: any) {
  const statusMap: Record<string, string> = {
    '0': 'available',
    '1': 'booked',
    '2': 'maintenance',
    available: 'available',
    booked: 'booked',
    maintenance: 'maintenance',
  };

  const typeMap: Record<string, string> = {
    '0': t('reservation.seatType.single'),
    '1': t('reservation.seatType.double'),
    '2': t('reservation.seatType.group'),
  };

  const facilities = [
    ...(seat.hasSocket ? [t('common.seat.facilities.power')] : []),
    ...(seat.isWindow ? [t('common.seat.facilities.window')] : []),
  ];

  return {
    id: String(seat.id),
    name: `${seat.floorName || ''} ${seat.zone || ''} R${seat.row}C${seat.col}`.trim(),
    zone: seat.zone || '',
    floor: seat.floorName || '',
    description: seat.description || '',
    status: statusMap[String(seat.status)] || 'available',
    facilities,
    distance: '',
    type: typeMap[String(seat.type)] || t('reservation.seatType.single'),
  };
}

Page({
  data: {
    searchValue: '',
    currentStatus: 'all',
    statusList: [] as Array<{ id: string; name: string }>,
    searchResults: [] as any[],
    sourceResults: [] as any[],
    resultCount: 0,
    currentLang: 'zh' as 'zh' | 'en',
    languageClass: '',
    navTitle: '',
    hintText: '',
    searchingHint: '',
    noResultsHint: '',
    actionButtonText: '',
    searchPlaceholder: '',
  },

  onLoad(options: any) {
    const keyword = decodeKeyword(options.keyword || '');
    this.initLanguage(keyword);
    if (keyword) {
      this.performSearch(keyword);
    }
  },

  onShow() {
    const globalLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    if (globalLang !== this.data.currentLang) {
      this.initLanguage(this.data.searchValue);
      if (this.data.searchValue) {
        this.performSearch(this.data.searchValue);
      }
    }
  },

  initLanguage(keyword = '') {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';

    this.setData({
      currentLang,
      languageClass: getLangClassName(),
      navTitle: t('searchResult.title'),
      hintText: keyword ? t('searchResult.hint.searchKeyword', { keyword }) : '',
      searchingHint: t('common.hint.loading'),
      noResultsHint: t('common.hint.noData'),
      actionButtonText: t('searchResult.action.reserve'),
      searchPlaceholder: t('search.placeholder'),
      searchValue: keyword,
      statusList: [
        { id: 'all', name: t('common.status.all') },
        { id: 'available', name: t('common.status.available') },
        { id: 'booked', name: t('common.status.booked') },
        { id: 'maintenance', name: t('common.status.maintenance') },
      ],
    });
  },

  performSearch(keyword: string) {
    wx.showLoading({ title: this.data.searchingHint });

    searchSeats(keyword)
      .then((res: any) => {
        const results = sortBySeatPosition(
          (Array.isArray(res.data) ? res.data : []).map(normalizeSeat)
        );
        this.setData({
          sourceResults: results,
          searchResults: this.filterByStatus(results, this.data.currentStatus),
          resultCount: this.filterByStatus(results, this.data.currentStatus).length,
          hintText: t('searchResult.hint.searchKeyword', { keyword }),
          searchValue: keyword,
        });
      })
      .catch((error) => {
        console.error('search seats failed', error);
        this.setData({
          sourceResults: [],
          searchResults: [],
          resultCount: 0,
        });
        wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  filterByStatus(list: any[], status: string) {
    if (status === 'all') return list;
    return list.filter((seat) => seat.status === status);
  },

  onSearchChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ searchValue: e.detail });
  },

  onSearchConfirm(e: WechatMiniprogram.CustomEvent) {
    const keyword = String(e.detail || '').trim();
    if (!keyword) return;
    this.performSearch(keyword);
  },

  onSearchCancel() {
    this.setData({
      searchValue: '',
      hintText: '',
      sourceResults: [],
      searchResults: [],
      resultCount: 0,
      currentStatus: 'all',
    });
  },

  onStatusTap(e: WechatMiniprogram.TouchEvent) {
    const statusId = String(e.currentTarget.dataset.id || 'all');
    const filtered = this.filterByStatus(this.data.sourceResults, statusId);

    this.setData({
      currentStatus: statusId,
      searchResults: filtered,
      resultCount: filtered.length,
    });
  },

  onReserveTap(e: WechatMiniprogram.CustomEvent) {
    const { seatId, seatInfo } = e.detail;
    openReservationWithParams({
      seatId,
      seatName: seatInfo?.name,
      zone: seatInfo?.zone,
      floor: seatInfo?.floor,
      type: seatInfo?.type,
      facilities: (seatInfo?.facilities || []).join(','),
    });
  },

  onFavoriteTap(e: WechatMiniprogram.CustomEvent) {
    const { seatId, isFavorite } = e.detail;
    favoriteSeat(seatId)
      .then(() => {
        wx.showToast({
          title: isFavorite ? t('common.btn.favorite') : t('common.btn.unfavorite'),
          icon: 'success',
        });
      })
      .catch((error) => {
        console.error('toggle favorite failed', error);
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      });
  },

  onDetailTap(e: WechatMiniprogram.CustomEvent) {
    const { seatId } = e.detail;
    wx.navigateTo({
      url: `/pages/seat-detail/seat-detail?id=${seatId}`,
    });
  },
});
