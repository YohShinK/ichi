import { APP_FILING_QUERY_URL } from "./app-filing-config.js";

export const copyAppFilingQueryUrl = (): void => {
  wx.setClipboardData({
    data: APP_FILING_QUERY_URL,
    success: () => {
      wx.showToast({
        title: "查询网址已复制，请在浏览器打开",
        icon: "none",
      });
    },
    fail: () => {
      wx.showModal({
        title: "工信部备案查询",
        content: `复制暂未完成，可在浏览器打开 ${APP_FILING_QUERY_URL}`,
        showCancel: false,
        confirmText: "知道了",
      });
    },
  });
};
