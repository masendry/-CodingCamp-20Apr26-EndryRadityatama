# Design Document: To Do List Life Dashboard

## Overview

The To Do List Life Dashboard is a single-page, client-side web application built with plain HTML, CSS, and Vanilla JavaScript. It requires no build tools, no frameworks, and no backend. All state is persisted in the browser's `localStorage`. The entire application ships as three files:

- `index.html` — markup and widget structure
- `css/styles.css` — all visual styling
- `js/app.js` — all behaviour and state management

---

## Architecture

### File Structure

```
todo-life-dashboard/
├── index.html
├── css/
│   └── styles.css
└── js/
    └── app.js
```

### Module Organisation (within `app.js`)

`app.js` is structured as a set of self-contained IIFE-style modules, each responsible for one widget. A top-level `init()` function bootstraps all modules on `DOMContentLoaded`.

```
app.js
├── StorageService       — localStorage read/write with error handling
├── GreetingWidget       — time, date, greeting display and auto-update
├── FocusTimer           — countdown timer state machine
├── TaskManager          — task CRUD and rendering
├── QuickLinks           — link CRUD and rendering
└── init()               — wires all modules together on page load
```

---

## Component Designs

### 1. StorageService

Wraps `localStorage` with a try/catch on every read and write. Exposes:

```javascript
StorageService.get(key)          // returns parsed JSON or null
StorageService.set(key, value)   // serialises to JSON and writes
StorageService.KEYS = {
  TASKS: 'tld_tasks',
  LINKS: 'tld_links'
}
```

If `localStorage` throws, `StorageService` calls `showStorageError()` which renders a visible banner in the DOM.

**Storage Keys:**
- Tasks: `tld_tasks` — stores an array of Task objects
- Links: `tld_links` — stores an array of Link objects

The keys are distinct string constants, preventing collisions (Requirement 8.2).

---

### 2. GreetingWidget

**Responsibilities:** Display current time (HH:MM), current date (human-readable), and a time-of-day greeting. Update every minute via `setInterval`.

**Greeting Logic (pure function):**

```javascript
function getGreeting(hour) {
  if (hour >= 5  && hour <= 11) return 'Good morning';
  if (hour >= 12 && hour <= 17) return 'Good afternoon';
  if (hour >= 18 && hour <= 21) return 'Good evening';
  return 'Good night'; // 22–23 and 0–4
}
```

**Time Formatting (pure function):**

```javascript
function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
```

**Date Formatting (pure function):**

```javascript
function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  // e.g. "Monday, 14 July 2025"
}
```

**Update Cycle:** On init, render immediately, then call `setInterval(render, 60_000)`.

---

### 3. FocusTimer

**State Machine:**

```
IDLE ──start──► RUNNING ──stop──► PAUSED ──start──► RUNNING
  ▲                │                  │
  └──reset─────────┘                  └──reset──► IDLE
                   │
              (reaches 0)
                   ▼
                ENDED
```

**State Object:**

```javascript
{
  totalSeconds: 1500,   // 25 * 60
  remaining: 1500,
  status: 'IDLE'        // 'IDLE' | 'RUNNING' | 'PAUSED' | 'ENDED'
}
```

**Timer Display (pure function):**

```javascript
function formatCountdown(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}
```

**Control Visibility Rules:**

| Status  | Start | Stop | Reset |
|---------|-------|------|-------|
| IDLE    | ✓     | ✗    | ✗     |
| RUNNING | ✗     | ✓    | ✓     |
| PAUSED  | ✓     | ✗    | ✓     |
| ENDED   | ✗     | ✗    | ✓     |

**Tick:** `setInterval` at 1000ms decrements `remaining` by 1. When `remaining === 0`, transitions to `ENDED` and clears the interval.

---

### 4. TaskManager

**Task Data Model:**

```javascript
{
  id: string,          // crypto.randomUUID() or Date.now().toString()
  text: string,        // non-empty, trimmed
  completed: boolean,
  createdAt: number    // Date.now() timestamp for stable ordering
}
```

**Operations:**

| Operation | Behaviour |
|-----------|-----------|
| `addTask(text)` | Validates non-empty after trim; creates Task; appends to array; saves; renders |
| `editTask(id, newText)` | Validates non-empty after trim; updates text; saves; re-renders item |
| `toggleTask(id)` | Flips `completed`; saves; updates item visual |
| `deleteTask(id)` | Removes from array; saves; removes DOM element |

**Rendering:** Each task renders as a `<li>` containing:
- Checkbox (completion toggle)
- `<span>` for text (with `text-decoration: line-through` when completed)
- Edit button
- Delete button

**Edit Mode:** Activating edit replaces the `<span>` with an `<input>` pre-filled with current text, and replaces Edit/Delete buttons with Confirm and Cancel buttons.

**Validation:** Empty or whitespace-only input shows an inline `<span class="error">` message adjacent to the input.

**Persistence:** Every mutating operation calls `StorageService.set(KEYS.TASKS, tasks)` after updating the in-memory array.

**Load:** On init, `StorageService.get(KEYS.TASKS)` returns the array (or `[]` if null) and renders all tasks.

---

### 5. QuickLinks

**Link Data Model:**

```javascript
{
  id: string,
  label: string,   // non-empty, trimmed
  url: string      // non-empty, trimmed
}
```

**Operations:**

| Operation | Behaviour |
|-----------|-----------|
| `addLink(label, url)` | Validates both fields non-empty; creates Link; appends; saves; renders button |
| `deleteLink(id)` | Removes from array; saves; removes DOM element |

**Rendering:** Each link renders as a `<button>` with an `onclick` that calls `window.open(url, '_blank')`. A delete icon button is overlaid or adjacent.

**Validation:** Empty label or URL shows an inline error message.

**Persistence:** Every mutating operation calls `StorageService.set(KEYS.LINKS, links)`.

**Load:** On init, `StorageService.get(KEYS.LINKS)` returns the array (or `[]`) and renders all links.

---

## HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Life Dashboard</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div id="storage-error" class="storage-error hidden" role="alert"></div>

  <main class="dashboard">
    <!-- Widget 1: Greeting -->
    <section id="greeting-widget" class="widget">
      <p id="greeting-text"></p>
      <p id="time-display"></p>
      <p id="date-display"></p>
    </section>

    <!-- Widget 2: Focus Timer -->
    <section id="focus-timer" class="widget">
      <h2>Focus Timer</h2>
      <p id="timer-display">25:00</p>
      <div class="timer-controls">
        <button id="timer-start">Start</button>
        <button id="timer-stop" disabled>Stop</button>
        <button id="timer-reset" disabled>Reset</button>
      </div>
      <p id="timer-ended-msg" class="hidden">Session complete!</p>
    </section>

    <!-- Widget 3: Task Manager -->
    <section id="task-manager" class="widget">
      <h2>To-Do List</h2>
      <form id="task-form">
        <input id="task-input" type="text" placeholder="Add a task…" autocomplete="off">
        <button type="submit">Add</button>
        <span id="task-error" class="error hidden"></span>
      </form>
      <ul id="task-list"></ul>
    </section>

    <!-- Widget 4: Quick Links -->
    <section id="quick-links" class="widget">
      <h2>Quick Links</h2>
      <form id="link-form">
        <input id="link-label" type="text" placeholder="Label">
        <input id="link-url" type="url" placeholder="https://…">
        <button type="submit">Add</button>
        <span id="link-error" class="error hidden"></span>
      </form>
      <div id="links-panel"></div>
    </section>
  </main>

  <script src="js/app.js"></script>
</body>
</html>
```

---

## CSS Design

`css/styles.css` uses CSS custom properties for theming and a CSS Grid layout for the dashboard.

**Layout:**

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}
```

This single rule provides responsiveness from 320px to 1920px without media queries (Requirement 9.6).

**Visual Hierarchy:** Widget titles use `<h2>` elements styled with a distinct font size and weight. Interactive controls use consistent button styles. Content areas use lighter background cards.

---

## Data Flow

```
User Action
    │
    ▼
Event Handler (in app.js)
    │
    ├─► Validate input
    │       └─► Show inline error if invalid
    │
    ├─► Update in-memory state
    │
    ├─► StorageService.set(key, state)
    │       └─► Show storage error banner if localStorage throws
    │
    └─► Re-render affected DOM nodes
```

---

## Correctness Properties

The following universal properties hold for all valid inputs and must be verified by property-based tests.

### Property 1: Greeting Coverage
**For every integer hour h in [0, 23], `getGreeting(h)` returns exactly one of {"Good morning", "Good afternoon", "Good evening", "Good night"} and never returns undefined or throws.**
- Validates: Requirements 1.3, 1.4, 1.5, 1.6

### Property 2: Greeting Partition
**The four time ranges (05–11, 12–17, 18–21, 22–04) are mutually exclusive and collectively exhaustive over [0, 23]. No hour maps to more than one greeting.**
- Validates: Requirements 1.3, 1.4, 1.5, 1.6

### Property 3: Countdown Format Validity
**For every integer seconds value s in [0, 1500], `formatCountdown(s)` returns a string matching the pattern `/^\d{2}:\d{2}$/`.**
- Validates: Requirement 2.7

### Property 4: Countdown Format Correctness
**For every integer s in [0, 1500], `formatCountdown(s)` satisfies: the minutes part equals `Math.floor(s / 60)` zero-padded to 2 digits, and the seconds part equals `s % 60` zero-padded to 2 digits.**
- Validates: Requirement 2.7

### Property 5: Toggle Involution
**For any task t, `toggleTask` applied twice returns t to its original `completed` state. That is, `toggle(toggle(t)).completed === t.completed`.**
- Validates: Requirements 5.2, 5.3

### Property 6: Storage Key Distinctness
**`StorageService.KEYS.TASKS !== StorageService.KEYS.LINKS` — the two storage keys are never equal.**
- Validates: Requirement 8.2

### Property 7: Task Text Trimming Consistency
**For any non-empty string s (after trimming), `addTask(s.trim())` produces a task whose `text` equals `s.trim()`. Leading/trailing whitespace is never stored.**
- Validates: Requirement 3.2

### Property 8: Task Order Preservation
**After loading tasks from LocalStorage, the order of tasks in the rendered list matches the order in which they were saved. For any sequence of add operations, the loaded order equals the insertion order.**
- Validates: Requirement 3.5
