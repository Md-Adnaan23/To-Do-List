/* ===== State ===== */
const STORAGE_KEY = 'dailyRoutineTasks';

const myUL     = document.getElementById('myUL');
const input    = document.getElementById('myInput');
const addBtn   = document.getElementById('addBtn');
const inputRow = document.querySelector('.input-row');
const statusEl = document.getElementById('statusCount');

let tasks = loadTasks();
let editingIndex = null;   // index of the task currently being edited, or null
let isSubmittingEdit = false; // guards against blur firing after Enter/Escape

/* ===== Load / Save ===== */

// First run: read the tasks that were hardcoded in index.html so nothing
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

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/* ===== Render ===== */

function render() {
  myUL.innerHTML = '';

  if (tasks.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = '// your day is wide open — add a task above';
    myUL.appendChild(li);
  } else {
    tasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.dataset.index = String(index);
      if (task.checked) li.classList.add('checked');

      const mark = document.createElement('span');
      mark.className = 'mark';
      mark.setAttribute('role', 'checkbox');
      mark.setAttribute('tabindex', '0');
      mark.setAttribute('aria-checked', task.checked ? 'true' : 'false');

      if (index === editingIndex) {
        // Editing mode: swap the text for an inline input, hide the
        // edit/delete buttons so they don't get in the way.
        li.classList.add('editing');

        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'edit-input';
        editInput.value = task.text;
        editInput.setAttribute('aria-label', 'Edit task');

        li.append(mark, editInput);
      } else {
        const text = document.createElement('span');
        text.className = 'task-text';
        text.textContent = task.text;

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'edit-btn';
        editBtn.setAttribute('aria-label', `Edit "${task.text}"`);
        editBtn.innerHTML = '&#9998;'; // ✎

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'close';
        close.setAttribute('aria-label', `Delete "${task.text}"`);
        close.innerHTML = '&times;';

        li.append(mark, text, editBtn, close);
      }

      myUL.appendChild(li);
    });
  }

  updateStatus();

  // If a task just entered edit mode, focus its input.
  const activeEditInput = myUL.querySelector('.edit-input');
  if (activeEditInput) {
    activeEditInput.focus();
    activeEditInput.select();
  }
}

function updateStatus() {
  const total = tasks.length;
  const done = tasks.filter(t => t.checked).length;
  statusEl.textContent = `${total} task${total === 1 ? '' : 's'} · ${done} done`;
}

/* ===== Actions ===== */

function addTask() {
  const value = input.value.trim();

  if (!value) {
    flashError();
    return;
  }

  tasks.push({ text: value, checked: false });
  input.value = '';
  saveTasks();
  render();
  input.focus();
}

function toggleTask(index) {
  tasks[index].checked = !tasks[index].checked;
  saveTasks();
  render();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  render();
}

function startEdit(index) {
  editingIndex = index;
  render();
}

function commitEdit(index, newValue) {
  const trimmed = newValue.trim();
  if (trimmed) {
    tasks[index].text = trimmed;
    saveTasks();
  }
  // if the field was cleared, just cancel instead of leaving a blank task
  editingIndex = null;
  render();
}

function cancelEdit() {
  editingIndex = null;
  render();
}

function flashError() {
  inputRow.classList.remove('error');
  void inputRow.offsetWidth; // restart the animation if triggered twice in a row
  inputRow.classList.add('error');
  setTimeout(() => inputRow.classList.remove('error'), 300);
  input.focus();
}

/* ===== Events ===== */

addBtn.addEventListener('click', addTask);

input.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') addTask();
});

myUL.addEventListener('click', (event) => {
  const li = event.target.closest('li');
  if (!li || li.classList.contains('empty-state')) return;
  if (li.classList.contains('editing')) return; // let the input handle its own clicks

  const index = Number(li.dataset.index);

  if (event.target.closest('.edit-btn')) {
    startEdit(index);
    return;
  }

  if (event.target.closest('.close')) {
    deleteTask(index);
    return;
  }

  toggleTask(index);
});

myUL.addEventListener('keydown', (event) => {
  if (event.target.classList.contains('edit-input')) {
    const li = event.target.closest('li');
    const index = Number(li.dataset.index);

    if (event.key === 'Enter') {
      isSubmittingEdit = true;
      commitEdit(index, event.target.value);
      isSubmittingEdit = false;
    } else if (event.key === 'Escape') {
      isSubmittingEdit = true;
      cancelEdit();
      isSubmittingEdit = false;
    }
    return;
  }

  if (!event.target.classList.contains('mark')) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;

  event.preventDefault();
  const li = event.target.closest('li');
  toggleTask(Number(li.dataset.index));
});

// Clicking away from an in-progress edit cancels it (does not save).
myUL.addEventListener(
  'focusout',
  (event) => {
    if (event.target.classList.contains('edit-input') && !isSubmittingEdit) {
      cancelEdit();
    }
  },
  true
);

/* ===== Init ===== */
render();

/* ===== PWA: enable offline support ===== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}