import { getSchedules, addSchedule, updateScheduleStatus } from '../db.js';
import { Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { addScheduleModal, editScheduleModal } from '../ui.js';

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
                       <button data-id="${s.id}" data-student="${s.studentName}" data-teacher="${s.teacherName}" data-status="${s.status}" data-time="${s.startAt ? s.startAt.toMillis() : ''}" class="edit-schedule-btn text-primary-600 hover:text-primary-800 font-medium text-sm">詳細 / 変更</button>
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

  // Event delegation for schedule editing
  container.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-schedule-btn');
    if (editBtn) {
      const timeMillis = parseInt(editBtn.dataset.time, 10);
      editScheduleModal.open({
        id: editBtn.dataset.id,
        studentName: editBtn.dataset.student,
        teacherName: editBtn.dataset.teacher,
        status: editBtn.dataset.status,
        startAt: timeMillis ? Timestamp.fromMillis(timeMillis) : null
      });
    }
  });

  const addScheduleBtn = document.getElementById('add-schedule-btn');
  if (addScheduleBtn && !addScheduleBtn.dataset.initialized) {
    addScheduleBtn.dataset.initialized = 'true';
    addScheduleBtn.addEventListener('click', () => {
      addScheduleModal.open();
    });

    addScheduleModal.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const studentName = document.getElementById('schedule-student').value;
      const teacherName = document.getElementById('schedule-teacher').value;
      const datetimeStr = document.getElementById('schedule-datetime').value;
      const status = document.getElementById('schedule-status').value;

      try {
        const dateObj = new Date(datetimeStr);
        await addSchedule({
          studentId: 'added-' + Date.now(),
          studentName: studentName,
          teacherName: teacherName,
          status: status,
          startAt: Timestamp.fromDate(dateObj)
        });
        addScheduleModal.close();
        await render();
      } catch (err) {
        console.error("Failed to add schedule", err);
        alert('予定の追加に失敗しました。');
      }
    });

    editScheduleModal.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-schedule-id').value;
      const studentName = document.getElementById('edit-schedule-student').value;
      const teacherName = document.getElementById('edit-schedule-teacher').value;
      const datetimeStr = document.getElementById('edit-schedule-datetime').value;
      const status = document.getElementById('edit-schedule-status').value;

      try {
        const dateObj = new Date(datetimeStr);
        const docRef = doc(db, 'schedules', id);
        await updateDoc(docRef, {
          studentName,
          teacherName,
          status,
          startAt: Timestamp.fromDate(dateObj)
        });
        editScheduleModal.close();
        await render();
      } catch (err) {
        console.error("Failed to update schedule", err);
        alert('予定の更新に失敗しました。');
      }
    });
  }

  return { render };
}
