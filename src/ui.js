// Modal UI logic
export const modal = {
    overlay: document.getElementById('modal-overlay'),
    title: document.getElementById('modal-title'),
    editor: document.getElementById('modal-editor'),
    closeBtn: document.getElementById('modal-close'),
    cancelBtn: document.getElementById('modal-cancel'),
    confirmBtn: document.getElementById('modal-confirm'),
    onConfirmCallback: null,

    init() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => this.close());
        this.confirmBtn.addEventListener('click', () => {
            if (this.onConfirmCallback) {
                this.onConfirmCallback(this.editor.innerText);
            }
            this.close();
        });
    },

    open({ title, text, onConfirm }) {
        this.title.textContent = title;
        this.editor.innerText = text;
        this.onConfirmCallback = onConfirm;
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('flex');
        // small delay to autofocus
        setTimeout(() => this.editor.focus(), 100);
    },

    close() {
        this.overlay.classList.add('hidden');
        this.overlay.classList.remove('flex');
        this.onConfirmCallback = null;
        this.editor.innerText = '';
    }
};
