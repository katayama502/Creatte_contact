import { getSchedules, addSchedule } from '../db.js';
import { Timestamp } from 'firebase/firestore';

export async function initCalendarView() {
  const container = document.querySelector('#view-calendar .bg-white.rounded-2xl');

  const render = async () => {
    container.innerHTML = '<div class="p-12 text-center text-gray-500"><div class="animate-pulse">カレンダー読み込み中...</div></div>';

    try {
      const schedules = await getSchedules();

      // Simple mock calendar list view instead of complex grid for MVP
      if (schedules.length === 0) {
        container.innerHTML = '<div class="p-12 text-center text-gray-500">直近の予定はありません</div>';
        return;
      }

      container.innerHTML = `
        <div class="w-full">
          <table class="w-full text-left">
            <thead class="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
              <tr>
                <th class="px-6 py-4 font-medium">日時</th>
                <th class="px-6 py-4 font-medium">生徒名</th>
                <th class="px-6 py-4 font-medium">担当講師</th>
                <th class="px-6 py-4 font-medium">状態</th>
                <th class="px-6 py-4 font-medium text-right">アクション</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${schedules.map(s => {
        const dateStr = s.startAt?.toDate ? s.startAt.toDate().toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '未定';
        return `
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 font-medium">${dateStr}</td>
                    <td class="px-6 py-4">${s.studentName || 'ID:' + s.studentId}</td>
                    <td class="px-6 py-4 text-gray-500">${s.teacherName || '-'}</td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.status === 'confirmed' ? 'bg-green-100 text-green-800' : s.status === 'canceled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
                        ${s.status === 'confirmed' ? '確定' : s.status === 'canceled' ? 'キャンセル' : '未定'}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                       <button class="text-primary-600 hover:text-primary-800 font-medium text-sm">詳細 / 変更</button>
                    </td>
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        </div>
      `;
      lucide.createIcons();
    } catch (err) {
      console.error(err);
      container.innerHTML = '<div class="p-12 text-center text-red-500">カレンダーデータの取得に失敗しました</div>';
    }
  };

  const addScheduleBtn = document.getElementById('add-schedule-btn');
  if (addScheduleBtn && !addScheduleBtn.dataset.initialized) {
    addScheduleBtn.dataset.initialized = 'true';
    addScheduleBtn.addEventListener('click', async () => {
      const studentName = prompt('生徒名（またはID）を入力してください:');
      if (studentName) {
        try {
          // Mock tomorrow's date for simplicity
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(20, 0, 0, 0);

          await addSchedule({
            studentId: 'mock-id-' + Date.now(),
            studentName: studentName,
            teacherName: '先生A',
            status: 'confirmed',
            startAt: Timestamp.fromDate(tomorrow)
          });
          await render();
        } catch (e) {
          console.error("Failed to add schedule", e);
          alert('予定の追加に失敗しました。');
        }
      }
    });
  }

  return { render };
}
