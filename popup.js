let countdownInterval;
let workHours = 9; // 工作時數

function updateEndTimeAndCountdown() {
  const startTime = document.getElementById('startTime').value;
  const leaveHours = parseFloat(document.getElementById('leaveHours').value);

  const endTime = calculateEndTime(startTime, leaveHours);
  document.getElementById('endTime').value = endTime.toTimeString().slice(0, 5);

  clearInterval(countdownInterval); // 清除計時器
  updateCountdown(endTime.getTime()); // ms
  countdownInterval = setInterval(() => updateCountdown(endTime.getTime()), 1000); // 每秒更新一次倒數計時

  // 清除所有鬧鐘
  chrome.runtime.sendMessage({ action: 'clearAlarms' });
  // 設置新的鬧鐘
  chrome.runtime.sendMessage({ action: 'setAlarm', endTime: endTime.getTime() });
}

// 計算下班時間 = 上班時間 + 工作時數 - 請假時數
function calculateEndTime(startTime, leaveHours) {
  const [hours, minutes] = startTime.split(':');
  const endTime = new Date();
  endTime.setHours(parseInt(hours) + workHours, parseInt(minutes), 0);
  endTime.setTime(endTime.getTime() - leaveHours * 60 * 60 * 1000);
  chrome.storage.local.set({ endTime: endTime.toTimeString().slice(0, 5) }); // 儲存下班時間
  return endTime;
}

// 更新倒數計時
function updateCountdown(endTime) {
  const now = Date.now();
  const timeLeft = endTime - now;
  const countdownElement = document.getElementById('countdown');
  const warningElement = document.getElementById('warning');

  if (timeLeft > 0) {
    countdownElement.textContent = formatTime(timeLeft);
    countdownElement.style.color = '';
    warningElement.style.display = 'none';
  } else {
    const overtimeMs = Math.abs(timeLeft);
    countdownElement.textContent = formatTime(overtimeMs);
    countdownElement.style.color = '#f17171';
    warningElement.style.display = 'block';
  }
}

// 格式化時間
function formatTime(time) {
  const hours = Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((time % (1000 * 60)) / 1000);
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

// 儲存上班時間和請假時數
function saveSettings() {
  const startTime = document.getElementById('startTime').value;
  const leaveHours = document.getElementById('leaveHours').value;
  chrome.storage.local.set({ startTime: startTime, leaveHours: leaveHours });
}

// 為上班時間 startTime 和請假時數 leaveHours 添加 blur 事件監聽器
document.getElementById('startTime').addEventListener('blur', () => {
  chrome.storage.local.set({ workEndAlarmRing: false, tenMinutesBeforeEndRing: false });
  updateEndTimeAndCountdown();
  saveSettings();
});

document.getElementById('leaveHours').addEventListener('blur', () => {
  chrome.storage.local.set({ workEndAlarmRing: false, tenMinutesBeforeEndRing: false });
  updateEndTimeAndCountdown();
  saveSettings();
});

// 取得保存的上班時間和請假時數
chrome.storage.local.get(['startTime', 'leaveHours'], (data) => {
  document.getElementById('startTime').value = data.startTime || '08:00';
  document.getElementById('leaveHours').value = data.leaveHours || 0;
  updateEndTimeAndCountdown();
});