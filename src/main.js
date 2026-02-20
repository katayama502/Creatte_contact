import './style.css'
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { modal, addStudentModal, addScheduleModal } from './ui.js';
import { initDashboardView } from './views/dashboard.js';
import { initCalendarView } from './views/calendar.js';
import { initStudentsView } from './views/students.js';
import { initSettingsView } from './views/settings.js';

// Initialize Icons
lucide.createIcons();

// Global references to view modules
let viewsModules = {};

// Simple Router
const views = ['dashboard', 'calendar', 'students', 'settings'];

async function navigateTo(viewId) {
  // Hide all views
  views.forEach(view => {
    document.getElementById(`view-${view}`).classList.add('hidden');
  });

  // Remove active class from nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('bg-primary-50', 'text-primary-600');
    link.classList.add('text-gray-600', 'hover:bg-gray-50', 'hover:text-gray-900');
  });

  // Show target view
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.remove('hidden');
  }

  // Add active class to target nav link
  const activeLink = document.querySelector(`a[href="#${viewId}"]`);
  if (activeLink) {
    activeLink.classList.remove('text-gray-600', 'hover:bg-gray-50', 'hover:text-gray-900');
    activeLink.classList.add('bg-primary-50', 'text-primary-600');
  }

  // Trigger Render
  if (viewsModules[viewId]) {
    await viewsModules[viewId].render();
  }
}

// Handle Hash Change
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  if (views.includes(hash)) {
    navigateTo(hash);
  }
});

// Initial Load and Auth State setup
document.addEventListener('DOMContentLoaded', async () => {
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');
  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');
  const userEmailDisplay = document.getElementById('user-email-display');

  // Initialize UI components
  modal.init();
  addStudentModal.init();
  addScheduleModal.init();

  // Initialize View Modules
  try {
    const [dashboard, calendar, students, settings] = await Promise.all([
      initDashboardView(),
      initCalendarView(),
      initStudentsView(),
      initSettingsView()
    ]);
    viewsModules = { dashboard, calendar, students, settings };
  } catch (e) {
    console.error("Failed to initialize views", e);
  }

  // Handle Auth State Changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      loginContainer.classList.add('hidden');
      appContainer.classList.remove('hidden');
      userEmailDisplay.textContent = user.email;

      // Load initial view
      const initialHash = window.location.hash.replace('#', '') || 'dashboard';
      navigateTo(views.includes(initialHash) ? initialHash : 'dashboard');
    } else {
      // User is signed out
      loginContainer.classList.remove('hidden');
      appContainer.classList.add('hidden');
      window.location.hash = ''; // Clear hash
    }
  });

  // Handle Login Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    loginError.textContent = '';

    const email = loginEmail.value;
    const password = loginPassword.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      loginError.textContent = 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';
      loginError.classList.remove('hidden');
      console.error("Login map error:", error);
    }
  });

  // Handle Logout
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  });
});
