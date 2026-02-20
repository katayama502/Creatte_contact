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

// Add Student Modal UI
export const addStudentModal = {
    overlay: document.getElementById('add-student-modal'),
    closeBtn: document.getElementById('add-student-close'),
    cancelBtn: document.getElementById('add-student-cancel'),
    form: document.getElementById('add-student-form'),
    init() {
        if (!this.overlay) return;
        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => this.close());
    },
    open() {
        this.form.reset();
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('flex');
    },
    close() {
        this.overlay.classList.add('hidden');
        this.overlay.classList.remove('flex');
    }
};

// Add Schedule Modal UI
export const addScheduleModal = {
    overlay: document.getElementById('add-schedule-modal'),
    closeBtn: document.getElementById('add-schedule-close'),
    cancelBtn: document.getElementById('add-schedule-cancel'),
    form: document.getElementById('add-schedule-form'),
    init() {
        if (!this.overlay) return;
        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => this.close());
    },
    open() {
        this.form.reset();
        // default to tomorrow 20:00 for convenience
        const tmr = new Date();
        tmr.setDate(tmr.getDate() + 1);
        tmr.setHours(20, 0, 0, 0);
        // format as YYYY-MM-DDThh:mm
        const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
        const localISOTime = (new Date(tmr - tzoffset)).toISOString().slice(0, 16);
        document.getElementById('schedule-datetime').value = localISOTime;

        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('flex');
    },
    close() {
        this.overlay.classList.add('hidden');
        this.overlay.classList.remove('flex');
    }
};
