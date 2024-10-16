chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setAlarm') {
    clearAllAlarms();
    const endTime = new Date(request.endTime);

    // 設置下班鬧鐘
    chrome.alarms.create('workEndAlarm', { when: endTime.getTime() });

    // 設置下班前10分鐘的鬧鐘
    const tenMinutesBefore = new Date(endTime.getTime() - 10 * 60 * 1000);
    chrome.alarms.create('tenMinutesBeforeEnd', { when: tenMinutesBefore.getTime() });

  } else if (request.action === 'clearAlarms') {
    clearAllAlarms();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'workEndAlarm') {
    chrome.storage.local.get('workEndAlarmRing', (data) => {
      if (!data.workEndAlarmRing) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: '下班提醒',
          message: '您的工作時間已結束，請注意及時下班！'
        });
        chrome.storage.local.set({ workEndAlarmRing: true });
      }
    });
  } else if (alarm.name === 'tenMinutesBeforeEnd') {
    chrome.storage.local.get('tenMinutesBeforeEndRing', (data) => {
      if (!data.tenMinutesBeforeEndRing) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: '下班前10分鐘提醒',
          message: '距離下班時間還有10分鐘，請做好準備！'
        });
        chrome.storage.local.set({ tenMinutesBeforeEndRing: true });
      }
    });
  }
});

// 釘選 icon 每秒更新倒數計時
setInterval(() => {
  chrome.storage.local.get('endTime', (data) => {
    if (data.endTime) {
      const [hours, minutes] = data.endTime.split(':');
      const endTime = new Date();
      endTime.setHours(hours, minutes, 0);
      const now = new Date().getTime();
      const timeLeft = endTime.getTime() - now;
      if (timeLeft > 0 && timeLeft < 1000 * 10000) {
        chrome.action.setBadgeText({ text: Math.floor(timeLeft / 1000).toString() });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    }
  });
}, 1000);

// 清除所有鬧鐘
function clearAllAlarms() {
  chrome.alarms.clearAll();
}