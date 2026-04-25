# Requirements Document

## Introduction

The To Do List Life Dashboard is a client-side web application that serves as a personal productivity hub. It combines a live greeting with time/date display, a Pomodoro-style focus timer, a persistent to-do list, and a quick-access links panel — all in a single, minimal HTML/CSS/Vanilla JS page. All data is stored in the browser's Local Storage; no backend server is required. The app can be used as a standalone web page or packaged as a browser extension.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-of-day greeting.
- **Focus_Timer**: The UI component that implements a 25-minute countdown timer with start, stop, and reset controls.
- **Task_Manager**: The UI component that manages the to-do list, including adding, editing, completing, and deleting tasks.
- **Quick_Links**: The UI component that displays user-defined shortcut buttons that open external URLs.
- **Local_Storage**: The browser's `localStorage` API used to persist all user data client-side.
- **Task**: A single to-do item consisting of a text description and a completion state.
- **Link**: A user-defined entry consisting of a label and a URL stored in Quick_Links.
- **Modern_Browser**: Chrome, Firefox, Edge, or Safari at their current stable release at time of deployment.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the Dashboard, so that I have an immediate sense of the time of day without checking another app.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format, updated every minute.
2. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g., "Monday, 14 July 2025").
3. WHEN the local time is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good morning".
4. WHEN the local time is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good afternoon".
5. WHEN the local time is between 18:00 and 21:59, THE Greeting_Widget SHALL display the greeting "Good evening".
6. WHEN the local time is between 22:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good night".
7. THE Greeting_Widget SHALL update the displayed time and greeting without requiring a page reload.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can use the Pomodoro technique to manage focused work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise with a countdown value of 25 minutes and 00 seconds (25:00).
2. WHEN the user activates the start control, THE Focus_Timer SHALL begin counting down in one-second intervals.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the user activates the stop control, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the reset control, THE Focus_Timer SHALL stop any active countdown and restore the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visual indication that the session has ended.
7. THE Focus_Timer SHALL display the remaining time in MM:SS format at all times.
8. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL disable the start control and enable the stop and reset controls.
9. WHILE the Focus_Timer is stopped or paused, THE Focus_Timer SHALL enable the start control.

---

### Requirement 3: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add tasks to a list and have them persist across browser sessions, so that I can track my work without losing data on page reload.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide an input field and a submit control for entering new tasks.
2. WHEN the user submits a non-empty task description, THE Task_Manager SHALL add the task to the list and display it immediately.
3. IF the user submits an empty or whitespace-only task description, THEN THE Task_Manager SHALL reject the submission and display an inline validation message.
4. THE Task_Manager SHALL save all tasks to Local_Storage after every add, edit, complete, or delete operation.
5. WHEN the Dashboard loads, THE Task_Manager SHALL read all tasks from Local_Storage and display them in the order they were saved.
6. IF Local_Storage contains no task data, THEN THE Task_Manager SHALL display an empty list with no error.

---

### Requirement 4: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit the text of an existing task, so that I can correct mistakes or update task descriptions without deleting and re-adding items.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide an edit control for each task in the list.
2. WHEN the user activates the edit control for a task, THE Task_Manager SHALL replace the task's display text with an editable input field pre-populated with the current task description.
3. WHEN the user confirms the edit with a non-empty value, THE Task_Manager SHALL update the task description, return to display mode, and save the updated task list to Local_Storage.
4. IF the user confirms the edit with an empty or whitespace-only value, THEN THE Task_Manager SHALL reject the update and retain the original task description.
5. WHEN the user cancels the edit, THE Task_Manager SHALL discard any changes and return the task to display mode.

---

### Requirement 5: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks I no longer need, so that I can maintain an accurate and uncluttered list.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a completion toggle control for each task.
2. WHEN the user activates the completion toggle for an incomplete task, THE Task_Manager SHALL mark the task as complete, apply a visual distinction (e.g., strikethrough text), and save the updated state to Local_Storage.
3. WHEN the user activates the completion toggle for a complete task, THE Task_Manager SHALL mark the task as incomplete, remove the visual distinction, and save the updated state to Local_Storage.
4. THE Task_Manager SHALL provide a delete control for each task.
5. WHEN the user activates the delete control for a task, THE Task_Manager SHALL remove the task from the list and save the updated task list to Local_Storage.

---

### Requirement 6: Quick Links — Display and Open Links

**User Story:** As a user, I want to see my saved favourite website links as clickable buttons, so that I can navigate to frequently visited sites with a single click.

#### Acceptance Criteria

1. THE Quick_Links SHALL display each saved Link as a labelled button.
2. WHEN the user activates a Link button, THE Quick_Links SHALL open the associated URL in a new browser tab.
3. WHEN the Dashboard loads, THE Quick_Links SHALL read all saved Links from Local_Storage and render them.
4. IF Local_Storage contains no Link data, THEN THE Quick_Links SHALL display an empty panel with no error.

---

### Requirement 7: Quick Links — Add and Delete Links

**User Story:** As a user, I want to add and remove quick-access links, so that I can customise the panel to reflect my current set of favourite websites.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide input fields for a link label and a URL, and a submit control for adding a new Link.
2. WHEN the user submits a Link with a non-empty label and a non-empty URL, THE Quick_Links SHALL add the Link to the panel, render it as a button, and save the updated Link list to Local_Storage.
3. IF the user submits a Link with an empty label or an empty URL, THEN THE Quick_Links SHALL reject the submission and display an inline validation message.
4. THE Quick_Links SHALL provide a delete control for each Link button.
5. WHEN the user activates the delete control for a Link, THE Quick_Links SHALL remove the Link from the panel and save the updated Link list to Local_Storage.

---

### Requirement 8: Data Persistence and Storage

**User Story:** As a user, I want all my tasks and links to be automatically saved and restored, so that my data is never lost between browser sessions.

#### Acceptance Criteria

1. THE Dashboard SHALL store all Task data and Link data exclusively in Local_Storage using the browser's `localStorage` API.
2. THE Dashboard SHALL use distinct Local_Storage keys for Task data and Link data to prevent data collisions.
3. IF Local_Storage is unavailable or throws an error during a read or write operation, THEN THE Dashboard SHALL display a user-visible error message indicating that data cannot be saved.
4. THE Dashboard SHALL NOT require any network request or backend server to read or write user data.

---

### Requirement 9: Layout and Visual Design

**User Story:** As a user, I want a clean, readable, and visually organised interface, so that I can use the Dashboard comfortably without visual clutter or confusion.

#### Acceptance Criteria

1. THE Dashboard SHALL present all four widgets (Greeting_Widget, Focus_Timer, Task_Manager, Quick_Links) within a single HTML page without requiring navigation between pages.
2. THE Dashboard SHALL apply a clear visual hierarchy that distinguishes widget titles, interactive controls, and content areas.
3. THE Dashboard SHALL use a single CSS file located at `css/styles.css` for all styling.
4. THE Dashboard SHALL use a single JavaScript file located at `js/app.js` for all behaviour.
5. THE Dashboard SHALL render correctly and remain fully functional in Chrome, Firefox, Edge, and Safari at their current stable releases.
6. THE Dashboard SHALL provide a responsive layout that remains usable at viewport widths from 320px to 1920px.

---

### Requirement 10: Performance

**User Story:** As a user, I want the Dashboard to load and respond quickly, so that it does not interrupt my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL complete initial render within 2 seconds on a standard desktop connection.
2. WHEN the user performs any interactive action (add, edit, delete, toggle, timer control), THE Dashboard SHALL reflect the change in the UI within 100 milliseconds.
3. THE Dashboard SHALL NOT introduce noticeable layout shifts or repaints during timer countdown updates.
