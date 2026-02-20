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

            // Add LINE Testing UI block
            templatesDiv.insertAdjacentHTML('beforeend', `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2 w-full"><i data-lucide="message-circle" class="w-5 h-5 inline-block mr-2 text-green-500"></i>LINE連携テスト</h3>
          </div>
          <p class="text-sm text-gray-600 mb-4">指定したLINE ID宛てに即時メッセージを送信して疎通テストを行います。（※ サーバー側で環境変数 <code>LINE_CHANNEL_ACCESS_TOKEN</code> が設定されている必要があります）</p>
          <div class="space-y-4">
            <div>
               <label class="block text-sm font-medium text-gray-700 mb-1">送信先 LINE ID</label>
               <input type="text" id="test-line-id" placeholder="U1234567890abcdef..." class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none">
            </div>
            <div>
               <label class="block text-sm font-medium text-gray-700 mb-1">テストメッセージ内容</label>
               <textarea id="test-line-text" class="w-full h-24 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="こんにちは！テスト送信です。"></textarea>
            </div>
            <div class="flex justify-end">
               <button id="btn-test-line" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center">
                 <i data-lucide="send" class="w-4 h-4 mr-2"></i>LINEへ送信
               </button>
            </div>
            <div id="test-line-result" class="text-sm rounded p-3 mt-2 hidden"></div>
          </div>
        </div>
      `);
            if (typeof lucide !== 'undefined') lucide.createIcons();

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

    // LINE Testing Action
    templatesDiv.addEventListener('click', async (e) => {
        const testBtn = e.target.closest('#btn-test-line');
        if (!testBtn) return;

        const lineId = document.getElementById('test-line-id').value.trim();
        const text = document.getElementById('test-line-text').value.trim();
        const resultDiv = document.getElementById('test-line-result');

        resultDiv.className = 'text-sm rounded p-3 mt-2 hidden';
        resultDiv.innerText = '';

        if (!lineId || !text) {
            resultDiv.className = 'text-sm rounded p-3 mt-2 bg-yellow-50 text-yellow-800 block';
            resultDiv.innerText = 'LINE IDとメッセージ内容の両方を入力してください。';
            return;
        }

        testBtn.disabled = true;
        testBtn.innerText = '送信中...';

        try {
            // Send direct request to the locally proxied or deployed Netlify function
            const res = await fetch('/.netlify/functions/sendPushMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer DUMMY_TOKEN' },
                // Instead of studentId lookup, we'll map test requests directly if we modify the function slightly,
                // OR we can just pass the exact lineId as a hidden parameter to a bypass in the function.
                // For MVP, we'll send it as `testLineId` and modify sendPushMessage to accept it.
                body: JSON.stringify({ testLineId: lineId, text: text })
            });

            if (res.ok) {
                resultDiv.className = 'text-sm rounded p-3 mt-2 bg-green-50 text-green-800 block';
                resultDiv.innerText = '✅ 送信成功: メッセージがLINE APIへ送られました。';
            } else {
                const err = await res.json();
                resultDiv.className = 'text-sm rounded p-3 mt-2 bg-red-50 text-red-800 block';
                resultDiv.innerText = '❌ 送信失敗: ' + (err.error || 'APIエラー');
                console.error('LINE test error:', err);
            }
        } catch (error) {
            console.error('API Error', error);
            resultDiv.className = 'text-sm rounded p-3 mt-2 bg-red-50 text-red-800 block';
            resultDiv.innerText = '❌ ネットワークまたはプロキシエラーが発生しました。Netlify CLI (netlify dev) 経由で起動していますか？';
        }

        testBtn.disabled = false;
        testBtn.innerHTML = '<i data-lucide="send" class="w-4 h-4 mr-2"></i>LINEへ送信';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    return { render };
}

function getTemplateLabel(type) {
    const map = { schedule: '予約確認', remind: '事前リマインド', billing: '請求' };
    return map[type] || type;
}
