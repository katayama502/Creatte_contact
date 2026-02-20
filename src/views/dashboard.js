import { getSchedules } from '../db.js';

export async function initDashboardView() {
    const container = document.querySelector('#view-dashboard .bg-white.rounded-2xl.overflow-hidden:last-child');

    const render = async () => {
        container.innerHTML = '<div class="px-6 py-4 border-b border-gray-100 font-medium">本日のスケジュール</div><div class="p-12 text-center text-gray-500"><div class="animate-pulse">読み込み中...</div></div>';

        try {
            const schedules = await getSchedules();
            const today = new Date().toISOString().split('T')[0]; // simple today string
            // Filter for mock today logic (assuming starting soon)
            const todaysSchedules = schedules.filter(s => {
                if (!s.startAt) return false;
                // Firestore timestamps usually have toDate()
                const date = s.startAt.toDate ? s.startAt.toDate() : new Date(s.startAt);
                return date.toISOString().startsWith(today);
            });

            if (todaysSchedules.length === 0) {
                container.innerHTML = `
          <div class="px-6 py-4 border-b border-gray-100 font-medium">本日のスケジュール</div>
          <div class="p-12 text-center text-gray-500">
            <i data-lucide="calendar" class="w-12 h-12 mx-auto text-gray-300 mb-3"></i>
            <p>今日の予定はありません</p>
          </div>
        `;
            } else {
                container.innerHTML = `
          <div class="px-6 py-4 border-b border-gray-100 font-medium">本日のスケジュール</div>
          <div class="divide-y divide-gray-100">
            ${todaysSchedules.map(s => `
              <div class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-4">
                    ${s.studentId ? s.studentId.substring(0, 1) : '?'}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">${s.studentName || '生徒(ID:' + s.studentId + ')'}</p>
                    <p class="text-sm text-gray-500">
                      <i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>
                      ${s.startAt?.toDate ? s.startAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '未定'}
                    </p>
                  </div>
                </div>
                <div>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.status === 'confirmed' ? 'bg-green-100 text-green-800' : s.status === 'canceled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
                    ${s.status === 'confirmed' ? '確定' : s.status === 'canceled' ? 'キャンセル' : '未定'}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
            }
            lucide.createIcons();
        } catch (err) {
            console.error(err);
            container.innerHTML = `
        <div class="px-6 py-4 border-b border-gray-100 font-medium">本日のスケジュール</div>
        <div class="p-12 text-center text-red-500">データの取得に失敗しました</div>
      `;
        }
    };

    return { render };
}
