/* ==========================================================================
   To Do List Life Dashboard — app.js
   All behaviour: StorageService, GreetingWidget, FocusTimer,
   TaskManager, QuickLinks, and top-level init()
   ========================================================================== */

/* --------------------------------------------------------------------------
   StorageService — localStorage read/write with error handling
   Requirements: 8.1, 8.2, 8.3
   -------------------------------------------------------------------------- */
const StorageService = (() => {
  const KEYS = {
    TASKS: 'tld_tasks',
    LINKS: 'tld_links',
  };

  /**
   * Reads and parses a JSON value from localStorage.
   * Returns null on any error (missing key, parse failure, storage unavailable).
   * @param {string} key
   * @returns {*|null}
   */
  function get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Serialises value to JSON and writes it to localStorage.
   * Calls showStorageError() if localStorage throws.
   * @param {string} key
   * @param {*} value
   */
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      window.showStorageError('Unable to save data. Your browser storage may be full or unavailable.');
    }
  }

  return { KEYS, get, set };
})();

/**
 * Makes the #storage-error banner visible with the given message.
 * Exposed on window so test spies can intercept it via window.showStorageError.
 * @param {string} [message]
 */
function showStorageError(message = 'Storage error: data cannot be saved.') {
  const banner = document.getElementById('storage-error');
  if (!banner) return;
  banner.textContent = message;
  banner.classList.remove('hidden');
}
window.showStorageError = showStorageError;

/* --------------------------------------------------------------------------
   GreetingWidget — time, date, greeting display and auto-update
   Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
   -------------------------------------------------------------------------- */

/**
 * Returns a time-of-day greeting string for the given hour (0–23).
 * Ranges are mutually exclusive and collectively exhaustive.
 * @param {number} hour — integer in [0, 23]
 * @returns {'Good morning'|'Good afternoon'|'Good evening'|'Good night'}
 */
function getGreeting(hour) {
  if (hour >= 5  && hour <= 11) return 'Good morning Endry';
  if (hour >= 12 && hour <= 17) return 'Good afternoon Endry';
  if (hour >= 18 && hour <= 21) return 'Good evening Endry';
  return 'Good night'; // covers 22–23 and 0–4
}

/**
 * Formats a Date object as HH:MM (24-hour, zero-padded).
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Formats a Date object as a human-readable string, e.g. "Monday, 14 July 2025".
 * Uses the en-GB locale for day-month ordering.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const GreetingWidget = (() => {
  /**
   * Updates #greeting-text, #time-display, and #date-display with current values.
   */
  function render() {
    const now = new Date();
    const greetingEl = document.getElementById('greeting-text');
    const timeEl     = document.getElementById('time-display');
    const dateEl     = document.getElementById('date-display');

    if (greetingEl) greetingEl.textContent = getGreeting(now.getHours());
    if (timeEl)     timeEl.textContent     = formatTime(now);
    if (dateEl)     dateEl.textContent     = formatDate(now);
  }

  /**
   * Initialises the widget: renders immediately, then updates every minute.
   * Requirements: 1.1, 1.2, 1.7
   */
  function init() {
    render();
    setInterval(render, 60_000);
  }

  return { init };
})();

/* --------------------------------------------------------------------------
   FocusTimer — 25-minute countdown timer state machine
   Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
   -------------------------------------------------------------------------- */

/**
 * Formats a seconds value as a MM:SS string (zero-padded).
 * Pure function — no side effects.
 * @param {number} seconds — integer in [0, 1500]
 * @returns {string} e.g. "25:00", "04:37", "00:00"
 */
function formatCountdown(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

const FocusTimer = (() => {
  /** @type {{ remaining: number, status: 'IDLE'|'RUNNING'|'PAUSED'|'ENDED', intervalId: number|null }} */
  const state = {
    remaining: 1500,
    status: 'IDLE',
    intervalId: null,
  };

  // DOM element references — populated in init()
  let displayEl   = null;
  let startBtn    = null;
  let stopBtn     = null;
  let resetBtn    = null;
  let endedMsgEl  = null;

  /**
   * Updates #timer-display and toggles button enabled/disabled states
   * according to the control visibility table in the design.
   *
   * | Status  | Start | Stop | Reset |
   * |---------|-------|------|-------|
   * | IDLE    |  ✓    |  ✗   |  ✗    |
   * | RUNNING |  ✗    |  ✓   |  ✓    |
   * | PAUSED  |  ✓    |  ✗   |  ✓    |
   * | ENDED   |  ✗    |  ✗   |  ✓    |
   */
  function updateDisplay() {
    if (displayEl)  displayEl.textContent = formatCountdown(state.remaining);

    const s = state.status;
    if (startBtn)  startBtn.disabled  = !(s === 'IDLE' || s === 'PAUSED');
    if (stopBtn)   stopBtn.disabled   = !(s === 'RUNNING');
    if (resetBtn)  resetBtn.disabled  = !(s === 'RUNNING' || s === 'PAUSED' || s === 'ENDED');

    if (endedMsgEl) {
      if (s === 'ENDED') {
        endedMsgEl.classList.remove('hidden');
      } else {
        endedMsgEl.classList.add('hidden');
      }
    }
  }

  /**
   * Transitions IDLE/PAUSED → RUNNING.
   * Starts a 1-second interval that decrements remaining and transitions to
   * ENDED when it reaches 0.
   * Requirements: 2.2, 2.3, 2.8
   */
  function start() {
    if (state.status !== 'IDLE' && state.status !== 'PAUSED') return;
    state.status = 'RUNNING';
    state.intervalId = setInterval(() => {
      state.remaining -= 1;
      if (state.remaining <= 0) {
        state.remaining = 0;
        state.status = 'ENDED';
        clearInterval(state.intervalId);
        state.intervalId = null;
      }
      updateDisplay();
    }, 1000);
    updateDisplay();
  }

  /**
   * Transitions RUNNING → PAUSED.
   * Clears the interval and retains the current remaining time.
   * Requirements: 2.4
   */
  function stop() {
    if (state.status !== 'RUNNING') return;
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.status = 'PAUSED';
    updateDisplay();
  }

  /**
   * Transitions any state → IDLE.
   * Clears the interval and restores remaining to 1500 (25:00).
   * Requirements: 2.5
   */
  function reset() {
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.remaining = 1500;
    state.status = 'IDLE';
    updateDisplay();
  }

  /**
   * Initialises the FocusTimer: queries DOM elements, wires click handlers,
   * and renders the initial display.
   * Requirements: 2.1, 2.9
   */
  function init() {
    displayEl  = document.getElementById('timer-display');
    startBtn   = document.getElementById('timer-start');
    stopBtn    = document.getElementById('timer-stop');
    resetBtn   = document.getElementById('timer-reset');
    endedMsgEl = document.getElementById('timer-ended-msg');

    if (startBtn)  startBtn.addEventListener('click', start);
    if (stopBtn)   stopBtn.addEventListener('click', stop);
    if (resetBtn)  resetBtn.addEventListener('click', reset);

    updateDisplay();
  }

  return { init };
})();

/* --------------------------------------------------------------------------
   TaskManager — task CRUD and DOM rendering
   Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5,
                 5.1, 5.2, 5.3, 5.4, 5.5
   -------------------------------------------------------------------------- */

/**
 * Task data model:
 * {
 *   id: string,          // crypto.randomUUID()
 *   text: string,        // non-empty, trimmed
 *   completed: boolean,
 *   createdAt: number    // Date.now() timestamp
 * }
 */
const TaskManager = (() => {
  const KEYS = StorageService.KEYS;

  /** @type {Array<{id: string, text: string, completed: boolean, createdAt: number}>} */
  let tasks = [];

  // DOM element references — populated in init()
  let taskForm    = null;
  let taskInput   = null;
  let taskError   = null;
  let taskList    = null;

  // -------------------------------------------------------------------------
  // 6.1 — addTask
  // -------------------------------------------------------------------------

  /**
   * Validates, creates, persists, and renders a new task.
   * Rejects empty/whitespace input by showing #task-error.
   * Requirements: 3.1, 3.2, 3.3, 3.4
   * @param {string} text
   */
  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) {
      showError('Task description cannot be empty.');
      return;
    }
    hideError();

    /** @type {{id: string, text: string, completed: boolean, createdAt: number}} */
    const task = {
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    tasks.push(task);
    StorageService.set(KEYS.TASKS, tasks);
    renderTask(task);
  }

  // -------------------------------------------------------------------------
  // Inline error helpers
  // -------------------------------------------------------------------------

  function showError(message) {
    if (!taskError) return;
    taskError.textContent = message;
    taskError.classList.remove('hidden');
  }

  function hideError() {
    if (!taskError) return;
    taskError.textContent = '';
    taskError.classList.add('hidden');
  }

  // -------------------------------------------------------------------------
  // 6.3 — renderTask and loadTasks
  // -------------------------------------------------------------------------

  /**
   * Creates a <li> element for the given task and appends it to #task-list.
   * Wires checkbox, edit, and delete handlers.
   * Requirements: 3.5, 3.6, 5.1, 5.2
   * @param {{id: string, text: string, completed: boolean, createdAt: number}} task
   */
  function renderTask(task) {
    if (!taskList) return;

    const li = document.createElement('li');
    li.dataset.id = task.id;
    if (task.completed) li.classList.add('completed');

    // Checkbox — completion toggle
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', 'Mark task complete');
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Text span
    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'task-edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.addEventListener('click', () => enterEditMode(task.id));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'task-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    taskList.appendChild(li);
  }

  /**
   * Reads tasks from localStorage and renders each one.
   * Defaults to an empty array if no data is stored.
   * Requirements: 3.5, 3.6, 5.1
   */
  function loadTasks() {
    tasks = StorageService.get(KEYS.TASKS) || [];
    tasks.forEach(renderTask);
  }

  // -------------------------------------------------------------------------
  // 6.5 — toggleTask and deleteTask
  // -------------------------------------------------------------------------

  /**
   * Flips the completed state of the task with the given id.
   * Saves to storage and updates the corresponding <li> in the DOM.
   * Requirements: 5.1, 5.2, 5.3
   * @param {string} id
   */
  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    StorageService.set(KEYS.TASKS, tasks);

    const li = taskList && taskList.querySelector(`li[data-id="${id}"]`);
    if (!li) return;

    if (task.completed) {
      li.classList.add('completed');
    } else {
      li.classList.remove('completed');
    }

    const checkbox = li.querySelector('input[type="checkbox"]');
    if (checkbox) checkbox.checked = task.completed;
  }

  /**
   * Removes the task with the given id from the array, saves, and removes its <li>.
   * Requirements: 5.4, 5.5
   * @param {string} id
   */
  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    StorageService.set(KEYS.TASKS, tasks);

    const li = taskList && taskList.querySelector(`li[data-id="${id}"]`);
    if (li) li.remove();
  }

  // -------------------------------------------------------------------------
  // 6.7 — enterEditMode, editTask, cancelEdit
  // -------------------------------------------------------------------------

  /**
   * Switches a task's <li> from display mode to edit mode.
   * Replaces the text <span> with a pre-populated <input> and swaps
   * Edit/Delete buttons for Confirm and Cancel buttons.
   * Requirements: 4.1, 4.2
   * @param {string} id
   */
  function enterEditMode(id) {
    const li = taskList && taskList.querySelector(`li[data-id="${id}"]`);
    if (!li) return;

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Replace text span with an input
    const span = li.querySelector('.task-text');
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'task-edit-input';
    editInput.value = task.text;
    editInput.setAttribute('aria-label', 'Edit task text');
    if (span) li.replaceChild(editInput, span);

    // Replace Edit and Delete buttons with Confirm and Cancel
    const editBtn   = li.querySelector('.task-edit-btn');
    const deleteBtn = li.querySelector('.task-delete-btn');

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'task-confirm-btn';
    confirmBtn.textContent = 'Confirm';
    confirmBtn.setAttribute('aria-label', 'Confirm edit');
    confirmBtn.addEventListener('click', () => editTask(id, editInput.value));

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'task-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');
    cancelBtn.addEventListener('click', () => cancelEdit(id));

    if (editBtn)   li.replaceChild(confirmBtn, editBtn);
    if (deleteBtn) li.replaceChild(cancelBtn, deleteBtn);

    editInput.focus();
  }

  /**
   * Validates newText, updates the task, saves, and exits edit mode.
   * Rejects empty/whitespace values — retains original text.
   * Requirements: 4.2, 4.3, 4.4
   * @param {string} id
   * @param {string} newText
   */
  function editTask(id, newText) {
    const trimmed = newText.trim();
    if (!trimmed) {
      // Reject empty — stay in edit mode, do not update
      return;
    }

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.text = trimmed;
    StorageService.set(KEYS.TASKS, tasks);

    exitEditMode(id);
  }

  /**
   * Discards any in-progress edit and restores the task to display mode.
   * Requirements: 4.5
   * @param {string} id
   */
  function cancelEdit(id) {
    exitEditMode(id);
  }

  /**
   * Restores a task's <li> from edit mode back to display mode.
   * Re-reads the current task text from the in-memory array.
   * @param {string} id
   */
  function exitEditMode(id) {
    const li = taskList && taskList.querySelector(`li[data-id="${id}"]`);
    if (!li) return;

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Restore text span
    const editInput = li.querySelector('.task-edit-input');
    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;
    if (editInput) li.replaceChild(span, editInput);

    // Restore Edit and Delete buttons
    const confirmBtn = li.querySelector('.task-confirm-btn');
    const cancelBtn  = li.querySelector('.task-cancel-btn');

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'task-edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.addEventListener('click', () => enterEditMode(id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'task-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.addEventListener('click', () => deleteTask(id));

    if (confirmBtn) li.replaceChild(editBtn, confirmBtn);
    if (cancelBtn)  li.replaceChild(deleteBtn, cancelBtn);
  }

  // -------------------------------------------------------------------------
  // init
  // -------------------------------------------------------------------------

  /**
   * Queries DOM elements, wires the form submit handler, and loads persisted tasks.
   * Requirements: 3.1, 3.5, 3.6
   */
  function init() {
    taskForm  = document.getElementById('task-form');
    taskInput = document.getElementById('task-input');
    taskError = document.getElementById('task-error');
    taskList  = document.getElementById('task-list');

    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(taskInput ? taskInput.value : '');
        if (taskInput) taskInput.value = '';
      });
    }

    loadTasks();
  }

  return { init, addTask, toggleTask, deleteTask, editTask, enterEditMode, cancelEdit, loadTasks };
})();

/* --------------------------------------------------------------------------
   QuickLinks — link CRUD and DOM rendering
   Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5
   -------------------------------------------------------------------------- */

/**
 * Link data model:
 * {
 *   id: string,     // crypto.randomUUID()
 *   label: string,  // non-empty, trimmed
 *   url: string     // non-empty, trimmed
 * }
 */
const QuickLinks = (() => {
  const KEYS = StorageService.KEYS;

  /** @type {Array<{id: string, label: string, url: string}>} */
  let links = [];

  // DOM element references — populated in init()
  let linkForm   = null;
  let linkLabel  = null;
  let linkUrl    = null;
  let linkError  = null;
  let linksPanel = null;

  // -------------------------------------------------------------------------
  // Inline error helpers
  // -------------------------------------------------------------------------

  function showError(message) {
    if (!linkError) return;
    linkError.textContent = message;
    linkError.classList.remove('hidden');
  }

  function hideError() {
    if (!linkError) return;
    linkError.textContent = '';
    linkError.classList.add('hidden');
  }

  // -------------------------------------------------------------------------
  // addLink
  // -------------------------------------------------------------------------

  /**
   * Validates, creates, persists, and renders a new link.
   * Rejects empty/whitespace label or URL by showing #link-error.
   * Requirements: 7.1, 7.2, 7.3
   * @param {string} label
   * @param {string} url
   */
  function addLink(label, url) {
    const trimmedLabel = label.trim();
    const trimmedUrl   = url.trim();

    if (!trimmedLabel || !trimmedUrl) {
      showError('Both label and URL are required.');
      return;
    }
    hideError();

    /** @type {{id: string, label: string, url: string}} */
    const link = {
      id: crypto.randomUUID(),
      label: trimmedLabel,
      url: trimmedUrl,
    };

    links.push(link);
    StorageService.set(KEYS.LINKS, links);
    renderLink(link);
  }

  // -------------------------------------------------------------------------
  // renderLink
  // -------------------------------------------------------------------------

  /**
   * Creates a container <div> with a link <button> and a delete <button>,
   * then appends it to #links-panel.
   * Requirements: 6.1, 6.2, 6.3, 6.4
   * @param {{id: string, label: string, url: string}} link
   */
  function renderLink(link) {
    if (!linksPanel) return;

    const container = document.createElement('div');
    container.className = 'link-item';
    container.dataset.linkId = link.id;

    // Link button — opens URL in a new tab
    const linkBtn = document.createElement('button');
    linkBtn.type = 'button';
    linkBtn.className = 'link-open-btn';
    linkBtn.textContent = link.label;
    linkBtn.onclick = () => window.open(link.url, '_blank');

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'link-delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
    deleteBtn.dataset.id = link.id;
    deleteBtn.addEventListener('click', () => deleteLink(link.id));

    container.appendChild(linkBtn);
    container.appendChild(deleteBtn);
    linksPanel.appendChild(container);
  }

  // -------------------------------------------------------------------------
  // loadLinks
  // -------------------------------------------------------------------------

  /**
   * Reads links from localStorage and renders each one.
   * Defaults to an empty array if no data is stored.
   * Requirements: 6.3, 6.4
   */
  function loadLinks() {
    links = StorageService.get(KEYS.LINKS) || [];
    links.forEach(renderLink);
  }

  // -------------------------------------------------------------------------
  // deleteLink
  // -------------------------------------------------------------------------

  /**
   * Removes the link with the given id from the in-memory array, saves,
   * and removes its container element from #links-panel.
   * Requirements: 7.4, 7.5
   * @param {string} id
   */
  function deleteLink(id) {
    links = links.filter(l => l.id !== id);
    StorageService.set(KEYS.LINKS, links);

    const container = linksPanel && linksPanel.querySelector(`[data-link-id="${id}"]`);
    if (container) container.remove();
  }

  // -------------------------------------------------------------------------
  // init
  // -------------------------------------------------------------------------

  /**
   * Queries DOM elements, wires the form submit handler, and loads persisted links.
   * Requirements: 6.3, 7.1
   */
  function init() {
    linkForm   = document.getElementById('link-form');
    linkLabel  = document.getElementById('link-label');
    linkUrl    = document.getElementById('link-url');
    linkError  = document.getElementById('link-error');
    linksPanel = document.getElementById('links-panel');

    if (linkForm) {
      linkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addLink(
          linkLabel ? linkLabel.value : '',
          linkUrl   ? linkUrl.value   : ''
        );
        // Clear inputs only on success (error was not shown)
        if (linkError && linkError.classList.contains('hidden')) {
          if (linkLabel) linkLabel.value = '';
          if (linkUrl)   linkUrl.value   = '';
        }
      });
    }

    loadLinks();
  }

  return { init, addLink, deleteLink, loadLinks };
})();

/* --------------------------------------------------------------------------
   Top-level init — bootstraps all modules on DOMContentLoaded
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', init);

function init() {
  GreetingWidget.init();
  FocusTimer.init();
  TaskManager.init();
  QuickLinks.init();
}
