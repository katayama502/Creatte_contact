import { getTemplates, updateTemplate } from '../db.js';

export async function initSettingsView() {
    const container = document.querySelector('#view-settings');
    const templatesDiv = document.createElement('div');
    templatesDiv.className = 'space-y-6';
    container.appendChild(templatesDiv);

    const render = async () => {
        templatesDiv.innerHTML = '<div class="animate-pulse text-gray-500 p-6">テンプレート読み込み中...</div>';
        try {
            let templates = await getTemplates();

            // Fallback if no templates in DB
            if (templates.length === 0) {
                templates = [
                    { id: 't1', type: 'schedule', body: '{name}様、ご予約ありがとうございます。\n以下の日程で予定を承りました。\n日時：{date} {time}' },
                    { id: 't2', type: 'remind', body: '{name}様\n明日の授業のリマインドです。\n日時：{date} {time}\nお待ちしております！' }
                ];
            }

            templatesDiv.innerHTML = templates.map(t => `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">${getTemplateLabel(t.type)}テンプレート</h3>
            <span class="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">ID: ${t.type}</span>
          </div>
          <textarea id="tpl-${t.id}" class="w-full h-32 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow mb-3" disabled>${t.body}</textarea>
          <div class="flex flex-wrap text-sm text-gray-500 mb-4 gap-2">
            利用可能変数: 
            <span class="bg-primary-50 text-primary-700 px-1.5 rounded">{name}</span>
            <span class="bg-primary-50 text-primary-700 px-1.5 rounded">{date}</span>
            <span class="bg-primary-50 text-primary-700 px-1.5 rounded">{time}</span>
          </div>
          <div class="flex justify-end space-x-3">
             <button data-id="${t.id}" class="edit-tpl-btn bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">編集する</button>
             <button data-id="${t.id}" class="save-tpl-btn bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors hidden">保存する</button>
          </div>
        </div>
      `).join('');

        } catch (err) {
            console.error(err);
            templatesDiv.innerHTML = '<div class="text-red-500 p-6">テンプレートの取得に失敗しました</div>';
        }
    };

    // Event Delegation for Edit/Save
    templatesDiv.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-tpl-btn');
        const saveBtn = e.target.closest('.save-tpl-btn');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const textarea = document.getElementById(`tpl-${id}`);
            textarea.disabled = false;
            textarea.focus();
            editBtn.classList.add('hidden');
            editBtn.nextElementSibling.classList.remove('hidden'); // Show Save button
        }

        if (saveBtn) {
            const id = saveBtn.dataset.id;
            const textarea = document.getElementById(`tpl-${id}`);
            const newBody = textarea.value;
            saveBtn.innerText = '保存中...';
            saveBtn.disabled = true;

            try {
                await updateTemplate(id, newBody);
            } catch (err) {
                console.error('Update template skipped, acting as mock for now', err);
            }

            textarea.disabled = true;
            saveBtn.innerText = '保存する';
            saveBtn.disabled = false;
            saveBtn.classList.add('hidden');
            saveBtn.previousElementSibling.classList.remove('hidden'); // Show Edit button
        }
    });

    return { render };
}

function getTemplateLabel(type) {
    const map = { schedule: '予約確認', remind: '事前リマインド', billing: '請求' };
    return map[type] || type;
}
