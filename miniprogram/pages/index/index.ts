Page({
  data: {
    value: '',
  },

  /**
   * 座位预约事件
   */
  onSeatReserve(e: any) {
    const { seatLabel, seatName } = e.detail;
    wx.showToast({
      title: `预约 ${seatLabel}${seatName}`,
      icon: 'none',
    });
    // TODO: 跳转到预约页面
  },

  /**
   * 座位收藏事件
   */
  onSeatFavorite(e: any) {
    const { seatLabel, seatName } = e.detail;
    wx.showToast({
      title: `已收藏 ${seatLabel}${seatName}`,
      icon: 'success',
    });
  },

  /**
   * 座位详情事件
   */
  onSeatDetail(e: any) {
    const { seatLabel, seatName } = e.detail;
    wx.showToast({
      title: `查看 ${seatLabel}${seatName} 详情`,
      icon: 'none',
    });
    // TODO: 跳转到座位详情页面
  },
});
