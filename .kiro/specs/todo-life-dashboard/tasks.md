# Implementation Plan: To Do List Life Dashboard

## Overview

Build a single-page, client-side productivity dashboard using plain HTML, CSS, and Vanilla JavaScript. The implementation proceeds in layers: project scaffolding → StorageService → GreetingWidget → FocusTimer → TaskManager → QuickLinks → layout/styling → wiring and integration.

## Tasks

- [x] 1. Scaffold project structure and base HTML
  - Create `index.html` with the full widget markup as specified in the design (four `<section>` elements inside `.dashboard`, storage error banner, correct IDs)
  - Create `css/styles.css` as an empty file with a comment header
  - Create `js/app.js` as an empty file with a comment header and a `DOMContentLoaded` listener calling `init()`
  - Verify all three files are linked correctly (`<link>` for CSS, `<script>` for JS)
  - _Requirements: 9.1, 9.3, 9.4_

- [x] 2. Implement StorageService
  - [x] 2.1 Write the `StorageService` module in `js/app.js`
    - Define `StorageService.KEYS = { TASKS: 'tld_tasks', LINKS: 'tld_links' }`
    - Implement `StorageService.get(key)` — reads from `localStorage`, parses JSON, returns `null` on any error
    - Implement `StorageService.set(key, value)` — serialises to JSON, writes to `localStorage`, calls `showStorageError()` on any thrown exception
    - Implement `showStorageError()` — makes the `#storage-error` banner visible with an appropriate message
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 2.2 Write property test for storage key distinctness
    - **Property 6: Storage Key Distinctness**
    - Assert `StorageService.KEYS.TASKS !== StorageService.KEYS.LINKS`
    - **Validates: Requirement 8.2**

  - [x] 2.3 Write unit tests for StorageService
    - Test `get` returns `null` when key is absent
    - Test `get` returns parsed value when key is present
    - Test `set` writes serialised JSON to `localStorage`
    - Test `set` calls `showStorageError` when `localStorage.setItem` throws
    - Test `get` returns `null` (no throw) when `localStorage.getItem` throws
    - _Requirements: 8.1, 8.3_

- [x] 3. Implement GreetingWidget
  - [x] 3.1 Write pure helper functions for greeting, time, and date formatting
    - Implement `getGreeting(hour)` — returns the correct greeting string for hours 0–23
    - Implement `formatTime(date)` — returns `HH:MM` string
    - Implement `formatDate(date)` — returns human-readable date string (e.g., "Monday, 14 July 2025")
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 3.2 Write property test for greeting coverage
    - **Property 1: Greeting Coverage**
    - For every integer h in [0, 23], assert `getGreeting(h)` returns one of the four valid strings and never throws
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [x] 3.3 Write property test for greeting partition
    - **Property 2: Greeting Partition**
    - For every integer h in [0, 23], assert no two different ranges both match h (mutual exclusivity)
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [x] 3.4 Implement `GreetingWidget.init()` and render loop
    - Query `#greeting-text`, `#time-display`, `#date-display` from the DOM
    - Implement `render()` — calls helpers and updates the three DOM elements
    - Call `render()` immediately on init, then schedule `setInterval(render, 60_000)`
    - _Requirements: 1.1, 1.2, 1.7_

- [x] 4. Implement FocusTimer
  - [x] 4.1 Write `formatCountdown(seconds)` pure function
    - Returns a `MM:SS` string for any integer seconds value in [0, 1500]
    - _Requirements: 2.7_

  - [x] 4.2 Write property tests for countdown format
    - **Property 3: Countdown Format Validity**
    - For every integer s in [0, 1500], assert output matches `/^\d{2}:\d{2}$/`
    - **Property 4: Countdown Format Correctness**
    - For every integer s in [0, 1500], assert minutes part equals `Math.floor(s/60)` zero-padded and seconds part equals `s % 60` zero-padded
    - **Validates: Requirement 2.7**

  - [x] 4.3 Implement `FocusTimer` state machine and controls
    - Define timer state object: `{ remaining: 1500, status: 'IDLE', intervalId: null }`
    - Implement `start()` — transitions IDLE/PAUSED → RUNNING, starts `setInterval` at 1000ms, decrements `remaining`, transitions to ENDED at 0
    - Implement `stop()` — transitions RUNNING → PAUSED, clears interval
    - Implement `reset()` — transitions any state → IDLE, clears interval, restores `remaining` to 1500
    - Implement `updateDisplay()` — updates `#timer-display` with `formatCountdown(remaining)` and toggles button enabled/disabled states per the control visibility table in the design
    - Show `#timer-ended-msg` when status is ENDED, hide otherwise
    - Wire `#timer-start`, `#timer-stop`, `#timer-reset` click handlers
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [x] 4.4 Write unit tests for FocusTimer state transitions
    - Test initial state is IDLE with remaining = 1500
    - Test start transitions IDLE → RUNNING
    - Test stop transitions RUNNING → PAUSED and retains remaining value
    - Test reset from RUNNING restores remaining to 1500 and status to IDLE
    - Test reaching 0 transitions to ENDED
    - _Requirements: 2.1, 2.4, 2.5, 2.6_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement TaskManager
  - [x] 6.1 Implement task data model and `addTask(text)`
    - Define the Task shape: `{ id, text, completed, createdAt }`
    - Implement `addTask(text)` — trims input, rejects empty/whitespace (shows `#task-error`), creates task with `crypto.randomUUID()`, appends to in-memory array, calls `StorageService.set`, calls `renderTask(task)`
    - Wire `#task-form` submit handler
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 6.2 Write property test for task text trimming consistency
    - **Property 7: Task Text Trimming Consistency**
    - For any non-empty string s (after trim), assert the stored task's `text` equals `s.trim()`
    - **Validates: Requirement 3.2**

  - [x] 6.3 Implement `renderTask(task)` and task list loading
    - Implement `renderTask(task)` — creates `<li>` with checkbox, text `<span>`, Edit button, Delete button; applies `completed` class when `task.completed` is true
    - Implement `loadTasks()` — reads from `StorageService.get(KEYS.TASKS)`, defaults to `[]`, calls `renderTask` for each task
    - Call `loadTasks()` from `init()`
    - _Requirements: 3.5, 3.6, 5.1, 5.2_

  - [x] 6.4 Write property test for task order preservation
    - **Property 8: Task Order Preservation**
    - After saving and reloading N tasks, assert the order of task IDs in the loaded array matches the insertion order
    - **Validates: Requirement 3.5**

  - [x] 6.5 Implement `toggleTask(id)` and `deleteTask(id)`
    - Implement `toggleTask(id)` — flips `completed` on the matching task, saves, updates the task's `<li>` class and checkbox state
    - Implement `deleteTask(id)` — removes task from array, saves, removes the `<li>` from the DOM
    - Wire checkbox change and delete button click handlers inside `renderTask`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.6 Write property test for toggle involution
    - **Property 5: Toggle Involution**
    - For any task t, assert `toggle(toggle(t)).completed === t.completed`
    - **Validates: Requirements 5.2, 5.3**

  - [x] 6.7 Implement `editTask(id, newText)` and edit mode UI
    - Implement `enterEditMode(id)` — replaces text `<span>` with a pre-populated `<input>`, replaces Edit/Delete buttons with Confirm and Cancel buttons
    - Implement `editTask(id, newText)` — trims input, rejects empty (retains original text), updates task in array, saves, exits edit mode
    - Implement `cancelEdit(id)` — discards changes, restores display mode
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.8 Write unit tests for TaskManager edge cases
    - Test empty task submission shows error and does not add task
    - Test whitespace-only task submission is rejected
    - Test edit with empty value retains original text
    - Test cancel edit restores original display
    - _Requirements: 3.3, 4.3, 4.4, 4.5_

- [x] 7. Implement QuickLinks
  - [x] 7.1 Implement link data model and `addLink(label, url)`
    - Define the Link shape: `{ id, label, url }`
    - Implement `addLink(label, url)` — trims both fields, rejects if either is empty (shows `#link-error`), creates link with `crypto.randomUUID()`, appends to array, saves, calls `renderLink(link)`
    - Wire `#link-form` submit handler
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.2 Implement `renderLink(link)` and link panel loading
    - Implement `renderLink(link)` — creates a `<button>` with `link.label` as text and an `onclick` that calls `window.open(link.url, '_blank')`; adds a delete icon button adjacent to it
    - Implement `loadLinks()` — reads from `StorageService.get(KEYS.LINKS)`, defaults to `[]`, calls `renderLink` for each link
    - Call `loadLinks()` from `init()`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 7.3 Implement `deleteLink(id)`
    - Implement `deleteLink(id)` — removes link from array, saves, removes the link's DOM elements
    - Wire delete button click handler inside `renderLink`
    - _Requirements: 7.4, 7.5_

  - [x] 7.4 Write unit tests for QuickLinks validation
    - Test empty label submission shows error and does not add link
    - Test empty URL submission shows error and does not add link
    - Test valid submission adds link to array and saves
    - Test delete removes link from array and saves
    - _Requirements: 7.2, 7.3, 7.5_

- [x] 8. Implement CSS layout and visual styling
  - [x] 8.1 Write responsive grid layout in `css/styles.css`
    - Implement `.dashboard` CSS Grid with `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` and appropriate gap/padding
    - Add `max-width: 1400px; margin: 0 auto` for large viewports
    - _Requirements: 9.1, 9.6_

  - [x] 8.2 Style widgets, typography, and interactive controls
    - Style `.widget` cards with background, border-radius, padding, and box-shadow
    - Style `h2` widget titles with distinct font size and weight
    - Style buttons with consistent padding, border-radius, and hover/focus states
    - Style `.error` class for inline validation messages (red, small text)
    - Style `.hidden` utility class (`display: none`)
    - Style `#storage-error` banner (prominent, full-width, warning colour)
    - _Requirements: 9.2, 9.5_

  - [x] 8.3 Style task list and completed task visual distinction
    - Style `#task-list` `<li>` items with flex layout for checkbox, text, and action buttons
    - Apply `text-decoration: line-through` and reduced opacity to completed task text
    - _Requirements: 5.2_

  - [x] 8.4 Style timer display and Quick Links panel
    - Style `#timer-display` with a large, monospace font
    - Style `.timer-controls` button group with appropriate spacing
    - Style `#links-panel` as a flex-wrap container for link buttons
    - _Requirements: 2.7, 6.1_

- [x] 9. Wire all modules together in `init()` and final integration
  - [x] 9.1 Implement `init()` function in `js/app.js`
    - Call `GreetingWidget.init()`, `FocusTimer.init()`, `TaskManager.init()`, `QuickLinks.init()` in sequence inside the `DOMContentLoaded` handler
    - Ensure `loadTasks()` and `loadLinks()` are called during their respective `init()` calls
    - _Requirements: 9.1, 9.4_

  - [x] 9.2 Verify end-to-end data persistence flow
    - Confirm that adding a task, reloading the page, and checking `#task-list` shows the persisted task
    - Confirm that adding a link, reloading the page, and checking `#links-panel` shows the persisted link
    - Write automated tests that mock `localStorage` to verify the full save-and-load cycle for both tasks and links
    - _Requirements: 3.4, 3.5, 6.3, 8.1, 8.4_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 5 and 10 ensure incremental validation
- Property tests validate universal correctness properties (Properties 1–8 from the design)
- Unit tests validate specific examples and edge cases
- No build tools or package manager are required — the app runs directly in a browser
