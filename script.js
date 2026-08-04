
//     let  myNodeList = document.getElementsByTagName("LI");

//     for(let i = 0; i < myNodeList.length; i++){
//         let span = document.createElement("SPAN");
//         let txt = document.createTextNode("\u00D7");
//         span.className = "close";
//         span.appendChild(txt);
//         myNodeList[i].appendChild(span);
//     }


//     //click on close button
//     let close = document.getElementsByClassName("close");

//     for(let i=0; i < close.length ; i++){
//         close[i].onclick = function () {
//             let div = this.parentElement;
//             div.style.display = "none";
//         }}

//     let list = document.querySelector('ul');
//     list.addEventListener('click',function(ev)
//     { 
//         if (ev.target.tagName === 'LI') {
//            ev.target.classList.toggle('checked');
//     }
// },false);

//     //Add new Element
//     function newElement() {
//          let li = document.createElement("li");
//          let inputValue = document.getElementById("myInput").value;
//          let t = document.createTextNode(inputValue);
//          li.appendChild(t);
//          if(inputValue === '') {alert("You must write something");
//          }
//         else{document.getElementById("myUL").appendChild(li);
//          }
//         document.getElementById("myInput").value ="";
//         let span = document.createElement("SPAN");
//         let txt = document.createTextNode("\u00D7");
//         span.className = "close";
//         span.appendChild(txt);
//         li.appendChild(span);
//         span.onclick = function(){
//             let div = this.parentElement;
//             div.style.display = "none";
//         }
        
   
//     }
//      document.getElementById("myInput").addEventListener("keypress",function(event){
//         if(event.key === "Enter"){
//             newElement();
//         }
//     });    







        
    // //Add new Element
    // function newElement() {
    //      let li = document.createElement("li");
    //      let inputValue = document.getElementById("myInput").value;
    //      let t = document.createTextNode(inputValue);
    //      li.appendChild(t);
    //      if(inputValue === '') {alert("You must write something");
    //      }
    //     else{document.getElementById("myUL").appendChild(li);
    //      }
    //     document.getElementById("myInput").value ="";

        
   
    // }
    //  document.getElementById("myInput").addEventListener("keypress",function(event){
    //     if(event.key === "Enter"){
    //         newElement();
    //     }
    // });    
/* ==========================================================================
   TO-DO APP — script.js
   --------------------------------------------------------------------------
   Architecture, in one sentence: `tasks` (an array) is the single source of
   truth, and every time it changes we call render(), which rebuilds the
   <ul> to match it and saves it to localStorage. Nothing else touches the
   DOM directly. This "state -> render" pattern is the same idea used by
   frameworks like React, just done by hand — it's why the whole app only
   needs one render() function instead of separate code for "add a row",
   "remove a row", "gray out a row", etc.
   ========================================================================== */

// --- Grab every DOM element we need once, up front, instead of re-querying
// the document every time a function runs (small performance/readability win).
const taskForm       = document.getElementById("taskForm");
const input           = document.getElementById("myInput");
const list             = document.getElementById("myUL");
const emptyState       = document.getElementById("emptyState");
const progressFill     = document.getElementById("progressFill");
const progressLabel    = document.getElementById("progressLabel");
const itemsLeftLabel   = document.getElementById("itemsLeft");
const clearCompletedBtn = document.getElementById("clearCompleted");

// The localStorage key. Namespacing it like this avoids clashing with any
// other app that might store data under a generic key like "tasks".
const STORAGE_KEY = "todo-app.tasks";

/* --------------------------------------------------------------------------
   STATE
   `tasks` is an array of plain objects: { id, text, completed }.
   We try to load a previously-saved list from localStorage first; if there
   isn't one (first visit), we fall back to a small starter list so the app
   isn't empty on first load.
   -------------------------------------------------------------------------- */
function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // If the saved data is somehow corrupted, ignore it rather than crash.
      return [];
    }
  }
  // Starter tasks (kept from the original list), each with a unique id.
  return [
    "Read Quran", "Coding", "Read PDFs", "Breakfast",
    "Learn", "Take nap", "Web Dev", "Lunch"
  ].map((text, i) => ({
    id: Date.now() + i,
    text,
    completed: text === "Coding" // "Coding" started checked in the original markup
  }));
}

let tasks = loadTasks();

/* --------------------------------------------------------------------------
   PERSISTENCE
   Called after every change so a page refresh doesn't lose the list.
   -------------------------------------------------------------------------- */
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/* --------------------------------------------------------------------------
   RENDER
   Rebuilds the <ul> from the `tasks` array. Called once at startup and
   again after every add/toggle/delete/clear action.
   -------------------------------------------------------------------------- */
function render() {
  // Clear the list and rebuild it. For a list this small, wiping and
  // redrawing is simpler than diffing — and simple is worth more than
  // micro-optimizing here.
  list.innerHTML = "";

  tasks.forEach((task) => {
    // <li class="task [completed]" data-id="...">
    const li = document.createElement("li");
    li.className = "task" + (task.completed ? " completed" : "");
    li.dataset.id = task.id; // stash the id on the element so click handlers know which task it is

    // Custom round checkbox with an inline SVG checkmark. The checkmark's
    // stroke-dashoffset is animated in style.css based on the .completed class.
    li.innerHTML = `
      <span class="task-check" aria-hidden="true">
        <svg viewBox="0 0 14 14"><path d="M2 7 L6 11 L12 3" /></svg>
      </span>
      <span class="task-text"></span>
      <button type="button" class="task-delete" aria-label="Delete task">&times;</button>
    `;

    // Set the task text via textContent (not innerHTML) so a task typed as
    // e.g. "<b>hi</b>" is shown as literal text, not executed as HTML —
    // this prevents a basic XSS/markup-injection bug.
    li.querySelector(".task-text").textContent = task.text;

    list.appendChild(li);
  });

  updateProgress();
  updateEmptyState();
}

/* --------------------------------------------------------------------------
   ADD TASK
   Triggered by submitting the form (covers both clicking "Add" and
   pressing Enter in the input — native form submission handles both,
   which is why we no longer need a manual "keypress === Enter" listener).
   -------------------------------------------------------------------------- */
taskForm.addEventListener("submit", function (event) {
  event.preventDefault(); // stop the browser from actually reloading the page

  const value = input.value.trim(); // trim() removes accidental leading/trailing spaces

  if (value === "") {
    // A gentle inline nudge instead of a blocking alert() popup, which is
    // jarring and was the old approach.
    input.placeholder = "Type something first...";
    input.focus();
    return;
  }

  tasks.push({
    id: Date.now(), // Date.now() as an id is unique enough for a personal to-do list
    text: value,
    completed: false
  });

  input.value = "";
  input.placeholder = "Add a task...";

  saveTasks();
  render();
});

/* --------------------------------------------------------------------------
   TOGGLE / DELETE — EVENT DELEGATION
   Instead of attaching a click listener to every single <li> and its
   delete button (which you'd also have to re-attach every time render()
   rebuilds the list), we attach ONE listener to the <ul> itself. Clicks
   "bubble up" from whatever was clicked inside it, and we check what was
   actually clicked using event.target. This is the standard, more
   performant pattern for lists that change over time.
   -------------------------------------------------------------------------- */
list.addEventListener("click", function (event) {
  const li = event.target.closest(".task");
  if (!li) return; // click landed outside any task row, ignore it

  const id = Number(li.dataset.id);

  if (event.target.closest(".task-delete")) {
    // Delete button was clicked: remove this task from the array.
    tasks = tasks.filter((t) => t.id !== id);
  } else {
    // Anywhere else on the row was clicked: flip its completed state.
    tasks = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
  }

  saveTasks();
  render();
});

/* --------------------------------------------------------------------------
   CLEAR COMPLETED
   Removes every task currently marked done in one click.
   -------------------------------------------------------------------------- */
clearCompletedBtn.addEventListener("click", function () {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  render();
});

/* --------------------------------------------------------------------------
   PROGRESS BAR + COUNTERS
   Derives everything it needs from the `tasks` array — nothing here is
   stored separately, so it can never drift out of sync with the real data.
   -------------------------------------------------------------------------- */
function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  progressFill.style.width = percent + "%";
  progressLabel.textContent = `${done} / ${total} done`;
  itemsLeftLabel.textContent = `${total - done} task${total - done === 1 ? "" : "s"} left`;
}

/* --------------------------------------------------------------------------
   EMPTY STATE
   Shows the "Nothing here yet" message only when there are zero tasks,
   and hides the (empty) <ul> underneath it.
   -------------------------------------------------------------------------- */
function updateEmptyState() {
  const isEmpty = tasks.length === 0;
  emptyState.hidden = !isEmpty;
  list.hidden = isEmpty;
}

// --- Initial paint: render whatever we loaded (saved list or starter list)
// as soon as the script runs.
render();