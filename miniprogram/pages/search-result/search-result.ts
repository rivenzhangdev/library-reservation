import { favoriteSeat } from '../../apis/user';
import { getFloors, searchSeats } from '../../apis/seats';
import { getSeatFacilityConfigs, getSeatTypeConfigs } from '../../apis/config';
import { t, getLangClassName } from '../../utils/i18n';
import { openReservationWithParams } from '../../utils/reservationNavigator';
import { sortBySeatPosition } from '../../utils/sort';
import { getToday } from '../../utils/time';

function decodeKeyword(value?: string) {
  if (!value) return '';

  try {
    return decodeURIComponent(value);
  } catch (error) {
    console.warn('decode keyword failed', error);
    return value;
  }
}

function buildDefaultSeatFacilityOptions() {
  return [
    { key: 'power', label: t('searchResult.filter.hasSocket') },
    { key: 'window', label: t('searchResult.filter.isWindow') },
  ];
}

function normalizeSeat(
  seat: any,
  seatTypeValueByCode: Record<string, string>,
  seatTypeLabelByValue: Record<string, string>,
  facilityOptions: Array<{ key: string; label: string }>
) {
  const statusMap: Record<string, string> = {
    '0': 'available',
    '1': 'booked',
    '2': 'maintenance',
    available: 'available',
    booked: 'booked',
    maintenance: 'maintenance',
  };

  const row = Number(seat.row ?? seat.rowNum ?? 0);
  const col = Number(seat.col ?? seat.colNum ?? 0);
  const floor = String(seat.floorName || '').trim();
  const zone = String(seat.zone || '').trim();
  const rawTypeCode = String(seat.type ?? '').trim();
  const rawTypeValue = String(seat.typeValue ?? '').trim();
  const rawTypeLabel = String(seat.typeLabel ?? '').trim();
  const typeValue =
    rawTypeValue ||
    seatTypeValueByCode[rawTypeCode] ||
    seatTypeValueByCode[String(Number(rawTypeCode))] ||
    rawTypeCode;
  const typeLabel = seatTypeLabelByValue[typeValue] || rawTypeLabel || typeValue;

  const facilityFlags: Record<string, boolean> = {};
  facilityOptions.forEach((option) => {
    if (option.key === 'power') {
      facilityFlags[option.key] = Boolean(seat.hasSocket);
      return;
    }
    if (option.key === 'window') {
      facilityFlags[option.key] = Boolean(seat.isWindow);
      return;
    }
    facilityFlags[option.key] = Boolean(seat[option.key]);
  });

  const facilities = facilityOptions
    .filter((option) => facilityFlags[option.key])
    .map((option) => option.label);

  const seatNameParts = [floor, zone, row > 0 && col > 0 ? `R${row}C${col}` : ''].filter(Boolean);

  return {
    id: String(seat.id),
    name: seatNameParts.join(' '),
    zone,
    floor,
    floorId: seat.floorId === undefined || seat.floorId === null ? '' : String(seat.floorId),
    row,
    col,
    description: seat.description || '',
    status: statusMap[String(seat.status)] || 'available',
    facilities,
    facilityFlags,
    distance: '',
    typeValue,
    typeLabel,
    type: typeLabel,
  };
}

Page({
  data: {
    searchValue: '',
    lastSearchKeyword: '',
    lastSearchParams: {} as Record<string, any>,
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

    // 高级筛选
    showAdvancedFilter: false,
    filterFloor: 'all',
    filterSeatType: 'all',
    floorOptions: [] as Array<{ id: string; name: string }>,
    seatTypeOptions: [] as Array<{ id: string; name: string }>,
    facilityOptions: [] as Array<{ key: string; label: string }>,
    facilityFilters: {} as Record<string, boolean>,
    seatTypeValueByCode: {} as Record<string, string>,
    seatTypeLabelByValue: {} as Record<string, string>,
    selectedFloorName: '',
    selectedSeatTypeName: '',
    activeFilterCount: 0,
    filterTitle: '',
    filterText: '',
    filterConditionsText: '',
    filterFloorText: '',
    filterSeatTypeText: '',
    filterFacilityText: '',
    filterResetText: '',
    filterApplyText: '',
    filterAllText: '',
    filterResultText: '',
  },

  onLoad(options: any) {
    const keyword = decodeKeyword(options.keyword || '');
    const tagType = decodeKeyword(options.tagType || '');
    const tagValue = decodeKeyword(options.tagValue || '');
    this.initLanguage(keyword);
    this.loadFilterOptions().finally(() => {
      if (tagType && tagValue) {
        this.applyTagFilterAndSearch(tagType, tagValue, keyword);
        return;
      }
      if (keyword) {
        this.performSearch(keyword);
      }
    });
  },

  onShow() {
    const globalLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    if (globalLang !== this.data.currentLang) {
      this.initLanguage(this.data.searchValue);
      this.loadFilterOptions().finally(() => {
        const hasSearchContext =
          Boolean(this.data.lastSearchKeyword) ||
          Object.keys(this.data.lastSearchParams || {}).length > 0;
        if (hasSearchContext) {
          this.performSearch(
            this.data.lastSearchKeyword,
            this.data.lastSearchParams,
            this.data.searchValue
          );
        }
      });
    }
  },

  initLanguage(keyword = '') {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    const allText = t('searchResult.filter.all');
    const defaultFacilityOptions = buildDefaultSeatFacilityOptions();
    const nextFacilityFilters = defaultFacilityOptions.reduce(
      (acc, item) => {
        acc[item.key] = Boolean(this.data.facilityFilters?.[item.key]);
        return acc;
      },
      {} as Record<string, boolean>
    );

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
      filterTitle: t('searchResult.filter.title'),
      filterText: t('searchResult.filter.title'),
      filterConditionsText: t('searchResult.filter.conditions'),
      filterFloorText: t('searchResult.filter.floor'),
      filterSeatTypeText: t('searchResult.filter.seatType'),
      filterFacilityText: t('searchResult.filter.facility'),
      filterResetText: t('searchResult.filter.reset'),
      filterApplyText: t('searchResult.filter.done') || t('searchResult.filter.apply'),
      filterResultText: t('searchResult.filter.result'),
      filterAllText: allText,
      floorOptions: [{ id: 'all', name: allText }],
      seatTypeOptions: [{ id: 'all', name: allText }],
      facilityOptions: defaultFacilityOptions,
      facilityFilters: nextFacilityFilters,
      seatTypeValueByCode: {},
      seatTypeLabelByValue: {},
    });

    this.syncFilterSelectionText();
  },

  async loadFilterOptions() {
    const allText = this.data.filterAllText || t('searchResult.filter.all');
    const fallbackFacilityOptions = buildDefaultSeatFacilityOptions();

    let floorOptions = [{ id: 'all', name: allText }];
    let seatTypeOptions = [{ id: 'all', name: allText }];
    let facilityOptions = fallbackFacilityOptions;
    let seatTypeValueByCode: Record<string, string> = {};
    let seatTypeLabelByValue: Record<string, string> = {};

    try {
      const [floorRes, seatTypeRes, seatFacilityRes] = await Promise.all([
        getFloors({ showLoading: false }),
        getSeatTypeConfigs(),
        getSeatFacilityConfigs(),
      ]);

      const rawFloorList = Array.isArray((floorRes as any)?.data?.list)
        ? (floorRes as any).data.list
        : Array.isArray((floorRes as any)?.data)
          ? (floorRes as any).data
          : [];
      if (rawFloorList.length > 0) {
        floorOptions = [
          { id: 'all', name: allText },
          ...rawFloorList
            .filter((item: any) => item && item.name)
            .map((item: any) => ({
              id: String(item.id),
              name: String(item.name),
            })),
        ];
      }

      const rawSeatTypeConfigs = Array.isArray((seatTypeRes as any)?.data)
        ? (seatTypeRes as any).data
        : [];
      const enabledSeatTypeConfigs = rawSeatTypeConfigs
        .filter(
          (item: any) =>
            item &&
            item.enabled !== false &&
            typeof item.value === 'string' &&
            typeof item.label === 'string'
        )
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      if (enabledSeatTypeConfigs.length > 0) {
        seatTypeOptions = [
          { id: 'all', name: allText },
          ...enabledSeatTypeConfigs.map((item: any) => ({
            id: String(item.value),
            name: String(item.label),
          })),
        ];
        seatTypeValueByCode = enabledSeatTypeConfigs.reduce(
          (acc: Record<string, string>, item: any) => {
            acc[String(item.type)] = String(item.value);
            return acc;
          },
          {}
        );
        seatTypeLabelByValue = enabledSeatTypeConfigs.reduce(
          (acc: Record<string, string>, item: any) => {
            acc[String(item.value)] = String(item.label);
            return acc;
          },
          {}
        );
      }

      const rawSeatFacilityConfigs = Array.isArray((seatFacilityRes as any)?.data)
        ? (seatFacilityRes as any).data
        : [];
      const enabledSeatFacilityConfigs = rawSeatFacilityConfigs
        .filter((item: any) => item && item.enabled !== false && item.key)
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      if (enabledSeatFacilityConfigs.length > 0) {
        facilityOptions = enabledSeatFacilityConfigs.map((item: any) => ({
          key: String(item.key),
          label: String(item.label || item.key),
        }));
      }
    } catch (error) {
      console.warn('load filter options failed', error);
    }

    const facilityFilters = facilityOptions.reduce(
      (acc, item) => {
        acc[item.key] = Boolean(this.data.facilityFilters?.[item.key]);
        return acc;
      },
      {} as Record<string, boolean>
    );

    const nextFilterFloor = floorOptions.some((item) => item.id === this.data.filterFloor)
      ? this.data.filterFloor
      : 'all';
    const nextFilterSeatType = seatTypeOptions.some((item) => item.id === this.data.filterSeatType)
      ? this.data.filterSeatType
      : 'all';

    this.setData(
      {
        floorOptions,
        seatTypeOptions,
        facilityOptions,
        facilityFilters,
        seatTypeValueByCode,
        seatTypeLabelByValue,
        filterFloor: nextFilterFloor,
        filterSeatType: nextFilterSeatType,
      },
      () => {
        this.syncFilterSelectionText();
        if (this.data.sourceResults.length > 0) {
          this.refreshFilteredResults();
        }
      }
    );
  },

  syncFilterSelectionText() {
    const selectedFloor =
      this.data.floorOptions.find((item) => item.id === this.data.filterFloor) ||
      this.data.floorOptions[0];
    const selectedSeatType =
      this.data.seatTypeOptions.find((item) => item.id === this.data.filterSeatType) ||
      this.data.seatTypeOptions[0];
    this.setData({
      selectedFloorName: selectedFloor?.name || this.data.filterAllText,
      selectedSeatTypeName: selectedSeatType?.name || this.data.filterAllText,
      activeFilterCount: this.getActiveFilterCount(),
    });
  },

  getActiveFilterCount() {
    let count = 0;
    if (this.data.filterFloor !== 'all') count += 1;
    if (this.data.filterSeatType !== 'all') count += 1;
    count += Object.values(this.data.facilityFilters || {}).filter(Boolean).length;
    return count;
  },

  refreshFilteredResults() {
    const filtered = this.applyAllFilters(this.data.sourceResults);
    this.setData({ searchResults: filtered, resultCount: filtered.length });
  },

  applyTagFilterAndSearch(tagType: string, tagValue: string, tagLabel = '') {
    const normalizedType = String(tagType || '').trim();
    const normalizedValue = String(tagValue || '').trim();
    if (!normalizedType || !normalizedValue) {
      if (tagLabel) this.performSearch(tagLabel);
      return;
    }

    const resetFacilityFilters = (this.data.facilityOptions || []).reduce(
      (acc, item) => {
        acc[item.key] = false;
        return acc;
      },
      {} as Record<string, boolean>
    );

    const nextState: Record<string, any> = {
      filterFloor: 'all',
      filterSeatType: 'all',
      facilityFilters: resetFacilityFilters,
    };

    if (normalizedType === 'seatType') {
      if (this.data.seatTypeOptions.some((item) => item.id === normalizedValue)) {
        nextState.filterSeatType = normalizedValue;
      }
    } else if (normalizedType === 'facility') {
      if (this.data.facilityOptions.some((item) => item.key === normalizedValue)) {
        nextState.facilityFilters = {
          ...resetFacilityFilters,
          [normalizedValue]: true,
        };
      }
    } else {
      if (tagLabel) {
        this.performSearch(tagLabel);
      }
      return;
    }

    this.setData(nextState, () => {
      this.syncFilterSelectionText();
      this.performSearch('', {}, tagLabel || normalizedValue);
    });
  },

  performSearch(keyword: string, params?: Record<string, any>, hintKeyword?: string) {
    const normalizedKeyword = String(keyword || '').trim();
    const searchParams = params || {};
    const displayKeyword = String(hintKeyword || normalizedKeyword).trim();

    wx.showLoading({ title: this.data.searchingHint });

    searchSeats(normalizedKeyword, searchParams)
      .then((res: any) => {
        const facilityOptions =
          this.data.facilityOptions.length > 0
            ? this.data.facilityOptions
            : buildDefaultSeatFacilityOptions();
        const results = sortBySeatPosition(
          (Array.isArray(res.data) ? res.data : []).map((seat: any) =>
            normalizeSeat(
              seat,
              this.data.seatTypeValueByCode,
              this.data.seatTypeLabelByValue,
              facilityOptions
            )
          )
        );
        this.setData(
          {
            sourceResults: results,
            hintText: displayKeyword
              ? t('searchResult.hint.searchKeyword', { keyword: displayKeyword })
              : '',
            searchValue: displayKeyword,
            lastSearchKeyword: normalizedKeyword,
            lastSearchParams: searchParams,
          },
          () => {
            this.refreshFilteredResults();
          }
        );
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

  applyAllFilters(list: any[]) {
    const { currentStatus, filterFloor, filterSeatType, floorOptions, facilityFilters } = this.data;
    let filtered = [...list];

    if (currentStatus !== 'all') {
      filtered = filtered.filter((seat) => seat.status === currentStatus);
    }

    if (filterFloor !== 'all') {
      const selectedFloor = floorOptions.find((item) => item.id === filterFloor);
      filtered = filtered.filter((seat) => {
        const byFloorId = seat.floorId && String(seat.floorId) === String(filterFloor);
        const byFloorName =
          selectedFloor && selectedFloor.name
            ? String(seat.floor || '').trim() === String(selectedFloor.name).trim()
            : false;
        return Boolean(byFloorId || byFloorName);
      });
    }

    if (filterSeatType !== 'all') {
      filtered = filtered.filter((seat) => seat.typeValue === filterSeatType);
    }

    const activeFacilityKeys = Object.keys(facilityFilters || {}).filter((key) =>
      Boolean(facilityFilters[key])
    );
    if (activeFacilityKeys.length > 0) {
      filtered = filtered.filter(
        (seat) =>
          seat.facilityFlags && activeFacilityKeys.every((key) => Boolean(seat.facilityFlags[key]))
      );
    }

    return filtered;
  },

  filterByStatus(list: any[], status: string) {
    if (status === 'all') return list;
    return list.filter((seat) => seat.status === status);
  },

  onSearchChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ searchValue: String(e.detail || '') });
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
      lastSearchKeyword: '',
      lastSearchParams: {},
    });
  },

  onStatusTap(e: WechatMiniprogram.TouchEvent) {
    const statusId = String(e.currentTarget.dataset.id || 'all');
    this.setData({ currentStatus: statusId }, () => {
      this.refreshFilteredResults();
    });
  },

  onToggleAdvancedFilter() {
    this.setData({ showAdvancedFilter: !this.data.showAdvancedFilter });
  },

  onFilterFloorTap() {
    if (!this.data.floorOptions.length) return;

    wx.showActionSheet({
      itemList: this.data.floorOptions.map((item) => item.name),
      success: (res) => {
        const target = this.data.floorOptions[res.tapIndex];
        if (!target) return;
        this.setData({ filterFloor: target.id }, () => {
          this.syncFilterSelectionText();
          this.refreshFilteredResults();
        });
      },
    });
  },

  onFilterSeatTypeTap() {
    if (!this.data.seatTypeOptions.length) return;

    wx.showActionSheet({
      itemList: this.data.seatTypeOptions.map((item) => item.name),
      success: (res) => {
        const target = this.data.seatTypeOptions[res.tapIndex];
        if (!target) return;
        this.setData({ filterSeatType: target.id }, () => {
          this.syncFilterSelectionText();
          this.refreshFilteredResults();
        });
      },
    });
  },

  onFilterFacilityTap(e: WechatMiniprogram.CustomEvent) {
    const key = String(e.currentTarget?.dataset?.key || '');
    if (!key) return;

    const nextValue =
      typeof e.detail?.value === 'boolean' ? e.detail.value : !this.data.facilityFilters?.[key];

    this.setData(
      {
        facilityFilters: {
          ...this.data.facilityFilters,
          [key]: nextValue,
        },
      },
      () => {
        this.syncFilterSelectionText();
        this.refreshFilteredResults();
      }
    );
  },

  onFilterReset() {
    const resetFacilityFilters = (this.data.facilityOptions || []).reduce(
      (acc, item) => {
        acc[item.key] = false;
        return acc;
      },
      {} as Record<string, boolean>
    );

    this.setData(
      {
        filterFloor: 'all',
        filterSeatType: 'all',
        facilityFilters: resetFacilityFilters,
        currentStatus: 'all',
      },
      () => {
        this.syncFilterSelectionText();
        this.refreshFilteredResults();
      }
    );
  },

  onFilterApply() {
    this.setData({ showAdvancedFilter: false });
  },

  onReserveTap(e: WechatMiniprogram.CustomEvent) {
    const { seatId, seatInfo } = e.detail;
    const facilityKeys = Object.keys(seatInfo?.facilityFlags || {}).filter((key) =>
      Boolean(seatInfo?.facilityFlags?.[key])
    );
    openReservationWithParams({
      seatId,
      seatName: seatInfo?.name,
      zone: seatInfo?.zone,
      floor: seatInfo?.floor,
      type: seatInfo?.typeLabel || seatInfo?.type,
      typeValue: seatInfo?.typeValue,
      typeLabel: seatInfo?.typeLabel,
      facilityKeys: facilityKeys.join(','),
      facilities: (seatInfo?.facilities || []).join(','),
      date: getToday(),
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
    if (!seatId) return;
    wx.navigateTo({
      url: `/pages/seat-detail/seat-detail?id=${seatId}`,
    });
  },
});
