/* ===== State ===== */
const STORAGE_KEY = 'dailyRoutineTasks';

const myUL     = document.getElementById('myUL');
const input    = document.getElementById('myInput');
const addBtn   = document.getElementById('addBtn');
const inputRow = document.querySelector('.input-row');
const statusEl = document.getElementById('statusCount');

let tasks = loadTasks();

/* ===== Load / Save ===== */

// First run: read the tasks that were hardcoded in index.html so nothingi
// is lost. After that, localStorage is the source of truth.
function seedFromExistingMarkup() {
  return Array.from(myUL.querySelectorAll('li')).map(li => ({
    text: (li.querySelector('.task-text') || li).textContent.trim(),
    checked: li.classList.contains('checked')
  }));
}


function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (err) {
      console.warn('Could not read saved tasks, starting fresh.', err);
    }
  }
  const seeded = seedFromExistingMarkup();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}