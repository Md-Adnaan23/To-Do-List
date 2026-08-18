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

      const text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = task.text;

      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'close';
      close.setAttribute('aria-label', `Delete "${task.text}"`);
      close.innerHTML = '&times;';

      li.append(mark, text, close);
      myUL.appendChild(li);
    });
  }

  updateStatus();
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

