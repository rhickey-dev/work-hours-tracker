// Work Hours Tracker
// -------------------
// This file contains all the logic for:
// - Reading values from the form
// - Calculating daily hours worked
// - Saving entries in localStorage
// - Rendering the entries table
// - Showing the total for the current week
// - Editing and deleting entries

// We keep all entries in an array in memory while the page is open.
// Each entry is also saved to localStorage so it survives page reloads.
let entries = [];

// This is the key we use to store data in localStorage.
const STORAGE_KEY = "workHoursEntries";

// We keep track of which entry is being edited (if any).
// When this is null, we are creating a new entry.
let editingEntryId = null;

// Helper: get today's date in "YYYY-MM-DD" format.
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper: convert a "HH:MM" time string into minutes from midnight.
// Example: "08:30" -> 8 * 60 + 30 = 510.
// If timeString is empty or invalid, we return null.
function parseTimeToMinutes(timeString) {
  if (!timeString) return null;

  const [hoursStr, minutesStr] = timeString.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

// Helper: format a "HH:MM" time string into 12‑hour time with a.m. / p.m.
// Example: "14:05" -> "2:05 p.m."
function formatTimeTo12Hour(timeString) {
  if (!timeString) return "";

  const parts = timeString.split(":");
  if (parts.length < 2) return timeString;

  let hours = Number(parts[0]);
  const minutes = parts[1];

  if (Number.isNaN(hours)) return timeString;

  const isPM = hours >= 12;
  let displayHours = hours % 12;
  if (displayHours === 0) {
    displayHours = 12;
  }

  const suffix = isPM ? "p.m." : "a.m.";
  return `${displayHours}:${minutes} ${suffix}`;
}

// Helper: calculate total worked minutes using the formula:
// total = (end - start) - (breakEnd - breakStart)
// Break is optional:
// - If both break start and break end are empty, we treat break as 0.
// - If only one is filled in, we treat the input as invalid.
// Returns:
// - a number of minutes if calculation is valid
// - null if something is wrong (e.g. end before start)
function calculateTotalMinutes(startStr, breakStartStr, breakEndStr, endStr) {
  const start = parseTimeToMinutes(startStr);
  const end = parseTimeToMinutes(endStr);
  const breakStart = parseTimeToMinutes(breakStartStr);
  const breakEnd = parseTimeToMinutes(breakEndStr);

  // start and end are required
  if (start === null || end === null) {
    return null;
  }

  if (end <= start) {
    // end must be after start
    return null;
  }

  let totalMinutesWorked = end - start;

  // Handle break: both values given -> subtract, both empty -> ignore.
  const hasBreakStart = breakStartStr && breakStart !== null;
  const hasBreakEnd = breakEndStr && breakEnd !== null;

  if (hasBreakStart && hasBreakEnd) {
    // Break must be inside the work window and end after start.
    if (breakEnd <= breakStart || breakStart < start || breakEnd > end) {
      return null;
    }
    const breakMinutes = breakEnd - breakStart;
    totalMinutesWorked -= breakMinutes;
  } else if (hasBreakStart || hasBreakEnd) {
    // One break field is filled, but the other is not -> invalid.
    return null;
  }

  // If someone enters a very strange combination that leads to <= 0 minutes,
  // we treat it as invalid.
  if (totalMinutesWorked <= 0) {
    return null;
  }

  return totalMinutesWorked;
}

// Helper: take a number of minutes and produce a human-friendly string.
// Example: 450 -> "7h 30m"
function formatMinutesAsHoursString(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

// Helper: load entries from localStorage into the `entries` array.
function loadEntriesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      entries = [];
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      entries = parsed;
    } else {
      entries = [];
    }
  } catch (error) {
    console.error("Failed to parse work hours from localStorage:", error);
    entries = [];
  }
}

// Helper: save the current `entries` array to localStorage.
function saveEntriesToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// Helper: compute the Monday and Sunday (inclusive) dates for the current week.
// Returns an object with:
// - weekStart: "YYYY-MM-DD" for Monday
// - weekEnd: "YYYY-MM-DD" for Sunday
function getCurrentWeekBounds() {
  const today = new Date();

  // JS getDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const jsDay = today.getDay();

  // We want Monday as 0, Tuesday as 1, ..., Sunday as 6.
  const mondayBasedIndex = (jsDay + 6) % 7;

  // Clone the date so we do not change the original `today`.
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayBasedIndex);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return {
    weekStart: format(monday),
    weekEnd: format(sunday),
  };
}

// Helper: sort entries by date (and by start time within the same date)
function getSortedEntries() {
  // We do not want to mutate the original `entries` array in place here,
  // so we copy it with slice().
  return entries.slice().sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    // Same date, compare start times
    if (a.startTime < b.startTime) return -1;
    if (a.startTime > b.startTime) return 1;
    return 0;
  });
}

// DOM references (filled on DOMContentLoaded)
let formElement;
let dateInput;
let startInput;
let breakStartInput;
let breakEndInput;
let endInput;
let formTotalDisplay;
let formErrorElement;
let clearFormButton;
let editingIdInput;
let entriesTableBody;
let weeklyTotalElement;

// Clear all form fields and reset messages.
// We also:
// - reset the date to today
// - leave optional break fields empty
// - exit edit mode
function clearForm() {
  dateInput.value = getTodayDateString();
  // Default start and end times assume a typical 9–5 schedule.
  // You can still change these values before saving.
  startInput.value = "09:00";
  breakStartInput.value = "";
  breakEndInput.value = "";
  endInput.value = "17:00";
  editingEntryId = null;
  editingIdInput.value = "";
  formErrorElement.textContent = "";
  updateFormTotalDisplay();
}

// Put an existing entry back into the form so it can be edited.
function populateFormFromEntry(entry) {
  dateInput.value = entry.date;
  startInput.value = entry.startTime;
  breakStartInput.value = entry.breakStart || "";
  breakEndInput.value = entry.breakEnd || "";
  endInput.value = entry.endTime;
  editingEntryId = entry.id;
  editingIdInput.value = entry.id;
  formErrorElement.textContent = "";

  // Recalculate and display this entry's total.
  const minutes = calculateTotalMinutes(
    entry.startTime,
    entry.breakStart,
    entry.breakEnd,
    entry.endTime
  );
  if (minutes !== null) {
    formTotalDisplay.textContent = `Total for this day: ${formatMinutesAsHoursString(
      minutes
    )}`;
  }

  // On small screens it is helpful to scroll the form into view.
  formElement.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Update the small display under the form with the current calculated total.
// This runs whenever the user changes one of the time fields.
function updateFormTotalDisplay() {
  formErrorElement.textContent = "";

  const start = startInput.value;
  const brkStart = breakStartInput.value;
  const brkEnd = breakEndInput.value;
  const end = endInput.value;

  // Only show a calculation when at least start and end are filled.
  if (!start || !end) {
    formTotalDisplay.textContent =
      "Enter all times to see today’s total hours.";
    return;
  }

  const minutes = calculateTotalMinutes(start, brkStart, brkEnd, end);

  if (minutes === null) {
    formTotalDisplay.textContent = "Check your times above.";
    return;
  }

  formTotalDisplay.textContent = `Total for this day: ${formatMinutesAsHoursString(
    minutes
  )}`;
}

// Render the entries table from the `entries` array.
function renderEntriesTable() {
  const sorted = getSortedEntries();

  // Remove all existing rows.
  entriesTableBody.innerHTML = "";

  if (sorted.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = "No entries yet. Add your first one above.";
    row.appendChild(cell);
    entriesTableBody.appendChild(row);
    return;
  }

  for (const entry of sorted) {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = entry.date;

    const startCell = document.createElement("td");
    startCell.textContent = formatTimeTo12Hour(entry.startTime);

    const breakStartCell = document.createElement("td");
    breakStartCell.textContent = entry.breakStart
      ? formatTimeTo12Hour(entry.breakStart)
      : "-";

    const breakEndCell = document.createElement("td");
    breakEndCell.textContent = entry.breakEnd
      ? formatTimeTo12Hour(entry.breakEnd)
      : "-";

    const endCell = document.createElement("td");
    endCell.textContent = formatTimeTo12Hour(entry.endTime);

    const totalCell = document.createElement("td");
    totalCell.textContent = formatMinutesAsHoursString(entry.totalMinutes);

    const actionsCell = document.createElement("td");

    // Edit button
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "btn btn-ghost";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      populateFormFromEntry(entry);
    });

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-ghost btn-danger";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      const confirmed = window.confirm(
        "Delete this entry? This cannot be undone."
      );
      if (!confirmed) return;

      entries = entries.filter((e) => e.id !== entry.id);
      saveEntriesToStorage();
      renderEntriesTable();
      updateWeeklyTotal();

      // If we were editing this entry in the form, clear the form.
      if (editingEntryId === entry.id) {
        clearForm();
      }
    });

    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);

    row.appendChild(dateCell);
    row.appendChild(startCell);
    row.appendChild(breakStartCell);
    row.appendChild(breakEndCell);
    row.appendChild(endCell);
    row.appendChild(totalCell);
    row.appendChild(actionsCell);

    entriesTableBody.appendChild(row);
  }
}

// Calculate and display the total hours for the current week.
function updateWeeklyTotal() {
  const { weekStart, weekEnd } = getCurrentWeekBounds();

  let totalMinutesThisWeek = 0;

  for (const entry of entries) {
    if (entry.date >= weekStart && entry.date <= weekEnd) {
      totalMinutesThisWeek += entry.totalMinutes;
    }
  }

  weeklyTotalElement.textContent = formatMinutesAsHoursString(
    totalMinutesThisWeek
  );
}

// Handle form submission: validate input, update or create an entry,
// save to localStorage, and re-render everything.
function handleFormSubmit(event) {
  event.preventDefault();
  formErrorElement.textContent = "";

  const date = dateInput.value || getTodayDateString();
  const start = startInput.value;
  const brkStart = breakStartInput.value;
  const brkEnd = breakEndInput.value;
  const end = endInput.value;

  // Basic validation: date, start, and end are required.
  if (!date || !start || !end) {
    formErrorElement.textContent =
      "Please enter at least a date, start time, and end time.";
    return;
  }

  const totalMinutes = calculateTotalMinutes(start, brkStart, brkEnd, end);

  if (totalMinutes === null) {
    formErrorElement.textContent =
      "The times you entered do not look valid. Please check them.";
    return;
  }

  if (editingEntryId) {
    // Update an existing entry.
    const index = entries.findIndex((entry) => entry.id === editingEntryId);
    if (index !== -1) {
      entries[index] = {
        ...entries[index],
        date,
        startTime: start,
        breakStart: brkStart || null,
        breakEnd: brkEnd || null,
        endTime: end,
        totalMinutes,
      };
    }
  } else {
    // Create a new entry.
    const newEntry = {
      // Use timestamp + random number as a simple unique id.
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date,
      startTime: start,
      breakStart: brkStart || null,
      breakEnd: brkEnd || null,
      endTime: end,
      totalMinutes,
    };

    entries.push(newEntry);
  }

  // Save and refresh the UI.
  saveEntriesToStorage();
  renderEntriesTable();
  updateWeeklyTotal();

  // Reset edit mode and optionally keep the date filled with today's date.
  clearForm();
}

// Initialize the app once the HTML document has loaded.
document.addEventListener("DOMContentLoaded", () => {
  // Grab all DOM elements we will interact with.
  formElement = document.getElementById("entry-form");
  dateInput = document.getElementById("work-date");
  startInput = document.getElementById("start-time");
  breakStartInput = document.getElementById("break-start");
  breakEndInput = document.getElementById("break-end");
  endInput = document.getElementById("end-time");
  formTotalDisplay = document.getElementById("form-total-display");
  formErrorElement = document.getElementById("form-error");
  clearFormButton = document.getElementById("clear-form");
  editingIdInput = document.getElementById("editing-id");
  entriesTableBody = document.querySelector("#entries-table tbody");
  weeklyTotalElement = document.getElementById("weekly-total");

  // Initialize the form with today's date and default start/end times.
  clearForm();

  // Load any existing entries from localStorage and render them.
  loadEntriesFromStorage();
  renderEntriesTable();
  updateWeeklyTotal();

  // Whenever a time field changes, update the mini total display.
  startInput.addEventListener("input", updateFormTotalDisplay);
  breakStartInput.addEventListener("input", updateFormTotalDisplay);
  breakEndInput.addEventListener("input", updateFormTotalDisplay);
  endInput.addEventListener("input", updateFormTotalDisplay);

  // Handle form submission.
  formElement.addEventListener("submit", handleFormSubmit);

  // Handle the clear button.
  clearFormButton.addEventListener("click", clearForm);
});


