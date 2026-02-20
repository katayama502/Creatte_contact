import { getStudents, addStudent, updateStudent } from '../db.js';
import { modal, addStudentModal, editStudentModal } from '../ui.js';

export async function initStudentsView() {
  const tbody = document.querySelector('#view-students tbody');

  // Render function
  const render = async () => {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-12 text-gray-500"><div class="animate-pulse">読み込み中...</div></td></tr>';
    try {
      const students = await getStudents();
      if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-12 text-gray-500">生徒データがありません</td></tr>';
        return;
      }

      tbody.innerHTML = students.map(student => `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4 font-medium text-gray-900">${student.name}</td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
              ${student.status === 'active' ? '有効' : '停止中'}
            </span>
          </td>
          <td class="px-6 py-4">
            <span class="text-sm ${student.lineId ? 'text-primary-600 font-medium' : 'text-gray-400'}">
              ${student.lineId ? '連携済み' : '未連携'}
            </span>
          </td>
          <td class="px-6 py-4 text-right">
            <button data-id="${student.id}" data-name="${student.name}" data-line="${student.lineId || ''}" data-status="${student.status}" class="edit-student-btn inline-flex items-center px-2 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 mr-2">
              <i data-lucide="edit" class="w-4 h-4 mr-1 text-gray-400"></i>編集
            </button>
            <button data-id="${student.id}" data-name="${student.name}" class="send-msg-btn inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
              <i data-lucide="message-square" class="w-4 h-4 mr-1.5 text-gray-400"></i>内容編集して送信
            </button>
          </td>
        </tr>
      `).join('');
      lucide.createIcons(); // Re-initialize icons for new DOM elements
    } catch (err) {
      console.error(err);
      tbody.innerHTML = '<tr><td colspan="4" class="text-center py-12 text-red-500">データ取得に失敗しました</td></tr>';
    }
  };

  // Event delegation for message sending and editing
  tbody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-student-btn');
    if (editBtn) {
      editStudentModal.open({
        id: editBtn.dataset.id,
        name: editBtn.dataset.name,
        lineId: editBtn.dataset.line,
        status: editBtn.dataset.status
      });
      return;
    }

    const sendBtn = e.target.closest('.send-msg-btn');
    if (!sendBtn) return;

    const studentName = sendBtn.dataset.name;
    const defaultText = `${studentName}様\nご案内事項がございます。\nよろしくお願いします。`;

    modal.open({
      title: '個別メッセージ送信',
      text: defaultText,
      onConfirm: async (finalText) => {
        try {
          const res = await fetch('/.netlify/functions/sendPushMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer DUMMY_TOKEN' },
            body: JSON.stringify({ studentId: sendBtn.dataset.id, text: finalText })
          });
          if (res.ok) {
            alert('メッセージを送信しました');
          } else {
            const err = await res.json();
            alert('送信に失敗しました: ' + (err.error || '不明なエラー'));
          }
        } catch (error) {
          console.error('API Error', error);
          alert('ネットワークエラーが発生しました');
        }
      }
    });
  });

  const addStudentBtn = document.getElementById('add-student-btn');
  if (addStudentBtn && !addStudentBtn.dataset.initialized) {
    addStudentBtn.dataset.initialized = 'true';
    addStudentBtn.addEventListener('click', () => {
      addStudentModal.open();
    });

    addStudentModal.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('student-name').value;
      const lineId = document.getElementById('student-line-id').value;
      const status = document.getElementById('student-status').value;

      try {
        await addStudent({
          name,
          lineId,
          status
        });
        addStudentModal.close();
        await render();
      } catch (err) {
        console.error("Failed to add student", err);
        alert('生徒の追加に失敗しました。');
      }
    });
    editStudentModal.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-student-id').value;
      const name = document.getElementById('edit-student-name').value;
      const lineId = document.getElementById('edit-student-line-id').value;
      const status = document.getElementById('edit-student-status').value;

      try {
        await updateStudent(id, { name, lineId, status });
        editStudentModal.close();
        await render();
      } catch (err) {
        console.error("Failed to update student", err);
        alert('生徒の更新に失敗しました。');
      }
    });
  }

  return { render };
}
