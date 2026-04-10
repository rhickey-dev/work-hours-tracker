// Work Hours Tracker
// -------------------
// This file contains all the logic for:
// - Reading values from the form
// - Calculating daily hours worked
// - Saving entries in localStorage
// - Rendering the entries table
// - Showing the total across all saved entries
// - Editing and deleting entries
// - Job site per entry and total hours by job site (grouped case-insensitively)

// We keep all entries in an array in memory while the page is open.
// Each entry is also saved to localStorage so it survives page reloads.
let entries = [];

// This is the key we use to store data in localStorage.
const STORAGE_KEY = "workHoursEntries";

// Single snapshot of the in-progress form (survives closing the tab or browser).
const UNFINISHED_DRAFT_KEY = "workHoursUnfinishedDraft";

// Legacy per-field draft keys (older versions); cleared when draft is cleared or migrated.
const DRAFT_KEY_PREFIX = "workHoursDraft_";
const LAST_DRAFT_DATE_KEY = "workHoursDraft_lastDate";
const LEGACY_DRAFT_FIELD_NAMES = ["date", "startTime", "breakStart", "breakEnd", "endTime"];

const I18N_STORAGE_KEY = "workHoursAppLang";

const translations = {
  en: {
    "meta.title": "Work Hours Tracker",
    "lang.switcherLabel": "Language",
    "lang.switcherHint": "Choose interface language",
    "lang.en": "English",
    "lang.es": "Español",
    "header.eyebrow": "Time tracker",
    "header.title": "Work Hours Tracker",
    "header.lede": "Track daily work time and your running total.",
    "entry.heading": "Daily time entry",
    "form.date": "Date",
    "form.dateHint": "Defaults to today.",
    "form.jobSite": "Job site",
    "form.jobSitePlaceholder": "Site name or address (optional)",
    "form.jobSiteHelp":
      "(Optional) Leave blank to include hours only in the combined total. Named sites are grouped below.",
    "workTime.title": "Work time",
    "form.start": "Start",
    "form.end": "End",
    "break.title": "Break",
    "break.optional": "(optional)",
    "break.start": "Break start",
    "break.end": "Break end",
    "form.totalPrompt": "Enter all times to see today’s total hours.",
    "form.totalInvalid": "Check your times above.",
    "form.totalForDay": "Total for this day: {time}",
    "form.saveEntry": "Save entry",
    "form.clearForm": "Clear form",
    "entries.heading": "Saved entries",
    "entries.subtitle": "Stored locally in your browser only.",
    "entries.export": "Export",
    "entries.deleteAll": "Delete all entries",
    "table.date": "Date",
    "table.jobSite": "Job site",
    "table.start": "Start",
    "table.breakStart": "Break start",
    "table.breakEnd": "Break end",
    "table.end": "End",
    "table.total": "Total",
    "table.actions": "Actions",
    "summary.weekHeading": "All saved entries",
    "summary.allSaved": "All saved entries",
    "summary.totalUnit": "total",
    "summary.noSiteAria": "Hours with no job site",
    "summary.noSiteLabel": "Hours (no job site listed)",
    "breakdown.title": "All entries by job site",
    "breakdown.subtitle":
      "Hours grouped by job site. Entries with no job site listed are included only in the total above.",
    "dialog.deleteTitle": "Delete entry",
    "dialog.deleteMessage": "Are you sure you want to delete this entry?",
    "dialog.deleteAllTitle": "Delete all entries?",
    "dialog.deleteAllMessage":
      "This removes every saved entry from this browser. This cannot be undone.",
    "dialog.no": "No",
    "dialog.yes": "Yes",
    "empty.noEntries": "No entries yet. Add your first one above.",
    "table.edit": "Edit",
    "table.delete": "Delete",
    "breakdown.emptyNone": "No entries yet.",
    "breakdown.emptyNoNamed":
      "No named job sites yet. Hours without a site are included in the total above.",
    "errors.needDateStartEnd": "Please enter at least a date, start time, and end time.",
    "errors.invalidTimeCombination":
      "The times you entered do not look valid. Please check them.",
    "time.am": "a.m.",
    "time.pm": "p.m.",
    "format.hoursMinutes": "{hours}h {minutes}m",
    "table.emptyCell": "—",
    "table.editAria": "Edit this entry",
    "table.deleteAria": "Delete this entry",
    "dialog.closeBackdrop": "Close dialog",
    "breakdown.listAria": "Hours totals grouped by job site",
    "entries.tableCaption": "Saved work time entries",
    "pdf.title": "Work Hours Timesheet",
    "pdf.dateRange": "Date range",
    "pdf.entriesSection": "Entries",
    "pdf.summarySection": "Summary",
    "pdf.summaryTotalHours": "Total hours",
    "pdf.summaryByJobSite": "Hours by job site",
    "pdf.noJobSite": "No job site listed",
  },
  es: {
    "meta.title": "Work Hours Tracker",
    "lang.switcherLabel": "Language",
    "lang.switcherHint": "Choose interface language",
    "lang.en": "English",
    "lang.es": "Español",
    "header.eyebrow": "Time tracker",
    "header.title": "Work Hours Tracker",
    "header.lede": "Track daily work time and your running total.",
    "entry.heading": "Daily time entry",
    "form.date": "Date",
    "form.dateHint": "Defaults to today.",
    "form.jobSite": "Job site",
    "form.jobSitePlaceholder": "Site name or address (optional)",
    "form.jobSiteHelp":
      "(Optional) Leave blank to include hours only in the combined total. Named sites are grouped below.",
    "workTime.title": "Work time",
    "form.start": "Start",
    "form.end": "End",
    "break.title": "Break",
    "break.optional": "(optional)",
    "break.start": "Break start",
    "break.end": "Break end",
    "form.totalPrompt": "Enter all times to see today’s total hours.",
    "form.totalInvalid": "Check your times above.",
    "form.totalForDay": "Total for this day: {time}",
    "form.saveEntry": "Save entry",
    "form.clearForm": "Clear form",
    "entries.heading": "Saved entries",
    "entries.subtitle": "Stored locally in your browser only.",
    "entries.export": "Export",
    "entries.deleteAll": "Delete all entries",
    "table.date": "Date",
    "table.jobSite": "Job site",
    "table.start": "Start",
    "table.breakStart": "Break start",
    "table.breakEnd": "Break end",
    "table.end": "End",
    "table.total": "Total",
    "table.actions": "Actions",
    "summary.weekHeading": "All saved entries",
    "summary.allSaved": "All saved entries",
    "summary.totalUnit": "total",
    "summary.noSiteAria": "Hours with no job site",
    "summary.noSiteLabel": "Hours (no job site listed)",
    "breakdown.title": "All entries by job site",
    "breakdown.subtitle":
      "Hours grouped by job site. Entries with no job site listed are included only in the total above.",
    "dialog.deleteTitle": "Delete entry",
    "dialog.deleteMessage": "Are you sure you want to delete this entry?",
    "dialog.deleteAllTitle": "Delete all entries?",
    "dialog.deleteAllMessage":
      "This removes every saved entry from this browser. This cannot be undone.",
    "dialog.no": "No",
    "dialog.yes": "Yes",
    "empty.noEntries": "No entries yet. Add your first one above.",
    "table.edit": "Edit",
    "table.delete": "Delete",
    "breakdown.emptyNone": "No entries yet.",
    "breakdown.emptyNoNamed":
      "No named job sites yet. Hours without a site are included in the total above.",
    "errors.needDateStartEnd":
      "Please enter at least a date, start time, and end time.",
    "errors.invalidTimeCombination":
      "The times you entered do not look valid. Please check them.",
    "time.am": "a.m.",
    "time.pm": "p.m.",
    "format.hoursMinutes": "{hours}h {minutes}m",
    "table.emptyCell": "—",
    "table.editAria": "Edit this entry",
    "table.deleteAria": "Delete this entry",
    "dialog.closeBackdrop": "Close dialog",
    "breakdown.listAria": "Hours totals grouped by job site",
    "entries.tableCaption": "Saved work time entries",
    "pdf.title": "Work Hours Timesheet",
    "pdf.dateRange": "Date range",
    "pdf.entriesSection": "Entries",
    "pdf.summarySection": "Summary",
    "pdf.summaryTotalHours": "Total hours",
    "pdf.summaryByJobSite": "Hours by job site",
    "pdf.noJobSite": "No job site listed",
  },
};

let currentLang = "en";

function loadSavedLanguage() {
  try {
    const raw = localStorage.getItem(I18N_STORAGE_KEY);
    if (raw === "en" || raw === "es") return raw;
  } catch (_) {
    /* ignore */
  }
  return "en";
}

function saveAppLanguage(lang) {
  try {
    localStorage.setItem(I18N_STORAGE_KEY, lang);
  } catch (_) {
    /* ignore */
  }
}

function t(key, vars = {}) {
  const table = translations[currentLang] || translations.en;
  let s = table[key] ?? translations.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

function applyStaticI18n() {
  document.documentElement.lang = currentLang === "es" ? "es" : "en";
  document.title = t("meta.title");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) el.placeholder = t(key);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (key) el.setAttribute("aria-label", t(key));
  });
}

function refreshAllTranslatedUI() {
  applyStaticI18n();
  updateFormTotalDisplay({ preserveFormError: true });
  refreshFormError();
  renderEntriesTable();
  updateWeeklyJobSiteBreakdown();
}

function setAppLanguage(lang) {
  if (lang !== "en" && lang !== "es") return;
  currentLang = lang;
  saveAppLanguage(lang);
  refreshAllTranslatedUI();
}

function getLegacyDraftKey(date, fieldName) {
  return DRAFT_KEY_PREFIX + date + "_" + fieldName;
}

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

  const suffix = isPM ? t("time.pm") : t("time.am");
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
  return t("format.hoursMinutes", { hours, minutes });
}

// Trimmed, lowercased key so "Main St" and "main st" count as one job site.
function normalizeJobSiteKey(raw) {
  const trimmed = (raw || "").trim();
  return trimmed ? trimmed.toLowerCase() : "__none__";
}

function displayJobSiteCell(entry) {
  const site = (entry.jobSite || "").trim();
  return site ? site : t("table.emptyCell");
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

// Current form values + optional edit id, written on every input so reopening
// the app restores the last unfinished work.
function persistFormDraftToStorage() {
  if (!dateInput) return;

  const payload = {
    date: dateInput.value || getTodayDateString(),
    jobSite: jobSiteInput ? jobSiteInput.value || "" : "",
    startTime: startInput ? startInput.value || "" : "",
    breakStart: breakStartInput ? breakStartInput.value || "" : "",
    breakEnd: breakEndInput ? breakEndInput.value || "" : "",
    endTime: endInput ? endInput.value || "" : "",
    editingId: editingEntryId,
  };

  try {
    localStorage.setItem(UNFINISHED_DRAFT_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to save unfinished draft:", error);
  }
}

function clearLegacyDraftKeysForDate(date) {
  for (const fieldName of LEGACY_DRAFT_FIELD_NAMES) {
    localStorage.removeItem(getLegacyDraftKey(date, fieldName));
  }
}

// If the new draft format is empty but old per-field keys exist, merge once
// into UNFINISHED_DRAFT_KEY and remove the legacy keys.
function migrateLegacyDraftIfNeeded() {
  if (localStorage.getItem(UNFINISHED_DRAFT_KEY)) return;

  const lastDate = localStorage.getItem(LAST_DRAFT_DATE_KEY);
  if (!lastDate) return;

  const legacyDate = localStorage.getItem(getLegacyDraftKey(lastDate, "date"));
  const legacyStart = localStorage.getItem(getLegacyDraftKey(lastDate, "startTime"));
  const legacyBreakS = localStorage.getItem(
    getLegacyDraftKey(lastDate, "breakStart")
  );
  const legacyBreakE = localStorage.getItem(
    getLegacyDraftKey(lastDate, "breakEnd")
  );
  const legacyEnd = localStorage.getItem(getLegacyDraftKey(lastDate, "endTime"));

  if (!legacyDate && !legacyStart && !legacyBreakS && !legacyBreakE && !legacyEnd) {
    return;
  }

  const savedDate = legacyDate || lastDate;
  const startTime = legacyStart || "";
  const breakStart = legacyBreakS || "";
  const breakEnd = legacyBreakE || "";
  const endTime = legacyEnd || "";

  try {
    localStorage.setItem(
      UNFINISHED_DRAFT_KEY,
      JSON.stringify({
        date: savedDate || lastDate,
        startTime,
        breakStart,
        breakEnd,
        endTime,
        editingId: null,
      })
    );
  } catch (error) {
    console.error("Failed to migrate legacy draft:", error);
    return;
  }

  localStorage.removeItem(LAST_DRAFT_DATE_KEY);
  clearLegacyDraftKeysForDate(lastDate);
}

// Load unfinished draft into the form (after clearForm defaults). Works across
// days until the user saves the entry or clears the form.
function loadFormDraftFromStorage() {
  try {
    migrateLegacyDraftIfNeeded();

    const raw = localStorage.getItem(UNFINISHED_DRAFT_KEY);
    if (!raw) return;

    const d = JSON.parse(raw);
    if (!d || typeof d !== "object") return;

    if (dateInput && typeof d.date === "string" && d.date) {
      dateInput.value = d.date;
    }
    if (startInput && typeof d.startTime === "string") {
      startInput.value = d.startTime;
    }
    if (breakStartInput && typeof d.breakStart === "string") {
      breakStartInput.value = d.breakStart;
    }
    if (breakEndInput && typeof d.breakEnd === "string") {
      breakEndInput.value = d.breakEnd;
    }
    if (endInput && typeof d.endTime === "string") {
      endInput.value = d.endTime;
    }
    if (jobSiteInput && typeof d.jobSite === "string") {
      jobSiteInput.value = d.jobSite;
    }

    if (d.editingId && typeof d.editingId === "string") {
      const exists = entries.some((e) => e.id === d.editingId);
      if (exists) {
        editingEntryId = d.editingId;
        if (editingIdInput) editingIdInput.value = d.editingId;
      }
    }
  } catch (error) {
    console.error("Failed to load unfinished draft:", error);
  }
}

// Called after "Save entry" or "Clear form" so the draft does not reappear.
function clearFormDraftFromStorage() {
  localStorage.removeItem(UNFINISHED_DRAFT_KEY);
  localStorage.removeItem(LAST_DRAFT_DATE_KEY);

  const date = dateInput
    ? dateInput.value || getTodayDateString()
    : getTodayDateString();
  clearLegacyDraftKeysForDate(date);
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
    const siteCmp = (a.jobSite || "").localeCompare(b.jobSite || "", undefined, {
      sensitivity: "base",
    });
    if (siteCmp !== 0) return siteCmp;
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
let jobSiteInput;
let formTotalDisplay;
let formErrorElement;
let clearFormButton;
let editingIdInput;
let entriesTableBody;
let weeklyTotalElement;
let weeklyNoSiteTotalElement;
let weeklyJobSiteListElement;

let deleteConfirmDialog;
let deleteConfirmTitleElement;
let deleteConfirmMessageElement;
let deleteConfirmYesButton;
let deleteConfirmNoButton;
let deletePendingEntry = null;
let deleteAllPending = false;
let focusElementBeforeDeleteDialog = null;
let deleteAllEntriesButton;
let exportEntriesButton;

let formErrorKey = null;

function setFormError(key) {
  formErrorKey = key;
  if (formErrorElement) {
    formErrorElement.textContent = key ? t(key) : "";
  }
}

function refreshFormError() {
  if (formErrorElement) {
    formErrorElement.textContent = formErrorKey ? t(formErrorKey) : "";
  }
}

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
  if (jobSiteInput) jobSiteInput.value = "";
  editingEntryId = null;
  editingIdInput.value = "";
  setFormError(null);
  updateFormTotalDisplay();
}

// Put an existing entry back into the form so it can be edited.
function populateFormFromEntry(entry) {
  dateInput.value = entry.date;
  if (jobSiteInput) jobSiteInput.value = (entry.jobSite || "").trim();
  startInput.value = entry.startTime;
  breakStartInput.value = entry.breakStart || "";
  breakEndInput.value = entry.breakEnd || "";
  endInput.value = entry.endTime;
  editingEntryId = entry.id;
  editingIdInput.value = entry.id;
  setFormError(null);

  // Recalculate and display this entry's total.
  const minutes = calculateTotalMinutes(
    entry.startTime,
    entry.breakStart,
    entry.breakEnd,
    entry.endTime
  );
  if (minutes !== null) {
    formTotalDisplay.textContent = t("form.totalForDay", {
      time: formatMinutesAsHoursString(minutes),
    });
  }

  // On small screens it is helpful to scroll the form into view.
  formElement.scrollIntoView({ behavior: "smooth", block: "start" });

  persistFormDraftToStorage();
}

// Update the small display under the form with the current calculated total.
// This runs whenever the user changes one of the time fields.
function updateFormTotalDisplay(options = {}) {
  if (!options.preserveFormError) {
    setFormError(null);
  }

  const start = startInput.value;
  const brkStart = breakStartInput.value;
  const brkEnd = breakEndInput.value;
  const end = endInput.value;

  // Only show a calculation when at least start and end are filled.
  if (!start || !end) {
    formTotalDisplay.textContent = t("form.totalPrompt");
    return;
  }

  const minutes = calculateTotalMinutes(start, brkStart, brkEnd, end);

  if (minutes === null) {
    formTotalDisplay.textContent = t("form.totalInvalid");
    return;
  }

  formTotalDisplay.textContent = t("form.totalForDay", {
    time: formatMinutesAsHoursString(minutes),
  });
}

function performEntryDelete(entry) {
  entries = entries.filter((e) => e.id !== entry.id);
  saveEntriesToStorage();
  renderEntriesTable();
  updateWeeklyTotal();
  updateWeeklyJobSiteBreakdown();

  if (editingEntryId === entry.id) {
    clearForm();
    clearFormDraftFromStorage();
  }
}

function performDeleteAllEntries() {
  entries = [];
  saveEntriesToStorage();
  editingEntryId = null;
  if (editingIdInput) editingIdInput.value = "";
  clearForm();
  clearFormDraftFromStorage();
  renderEntriesTable();
  updateWeeklyTotal();
  updateWeeklyJobSiteBreakdown();
  updateFormTotalDisplay();
  if (formElement && dateInput) {
    formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => {
      dateInput.focus();
    });
  }
}

function closeDeleteConfirmDialog(options = {}) {
  const restoreFocus = options.restoreFocus !== false;
  deletePendingEntry = null;
  deleteAllPending = false;
  if (deleteConfirmDialog) {
    deleteConfirmDialog.hidden = true;
  }
  document.body.classList.remove("delete-dialog-open");
  if (
    restoreFocus &&
    focusElementBeforeDeleteDialog &&
    typeof focusElementBeforeDeleteDialog.focus === "function"
  ) {
    focusElementBeforeDeleteDialog.focus();
  }
  focusElementBeforeDeleteDialog = null;
}

function openDeleteConfirmDialog(entry) {
  deleteAllPending = false;
  deletePendingEntry = entry;
  if (deleteConfirmTitleElement) {
    deleteConfirmTitleElement.textContent = t("dialog.deleteTitle");
  }
  if (deleteConfirmMessageElement) {
    deleteConfirmMessageElement.textContent = t("dialog.deleteMessage");
  }
  focusElementBeforeDeleteDialog = document.activeElement;
  if (deleteConfirmDialog) {
    deleteConfirmDialog.hidden = false;
  }
  document.body.classList.add("delete-dialog-open");
  if (deleteConfirmNoButton) {
    deleteConfirmNoButton.focus();
  }
}

function openDeleteAllConfirmDialog() {
  if (entries.length === 0) return;
  deleteAllPending = true;
  deletePendingEntry = null;
  if (deleteConfirmTitleElement) {
    deleteConfirmTitleElement.textContent = t("dialog.deleteAllTitle");
  }
  if (deleteConfirmMessageElement) {
    deleteConfirmMessageElement.textContent = t("dialog.deleteAllMessage");
  }
  focusElementBeforeDeleteDialog = document.activeElement;
  if (deleteConfirmDialog) {
    deleteConfirmDialog.hidden = false;
  }
  document.body.classList.add("delete-dialog-open");
  if (deleteConfirmNoButton) {
    deleteConfirmNoButton.focus();
  }
}

function syncDeleteAllButtonState() {
  if (!deleteAllEntriesButton) return;
  deleteAllEntriesButton.disabled = entries.length === 0;
}

function syncExportButtonState() {
  const disabled = entries.length === 0;
  if (exportEntriesButton) exportEntriesButton.disabled = disabled;
}

function getDateRangeLabel(sortedEntries) {
  if (sortedEntries.length === 0) return t("table.emptyCell");
  const firstDate = sortedEntries[0].date;
  const lastDate = sortedEntries[sortedEntries.length - 1].date;
  return firstDate === lastDate ? firstDate : `${firstDate} - ${lastDate}`;
}

function getJobSiteSummaryRows(sortedEntries) {
  /** @type {Map<string, { label: string; minutes: number }>} */
  const byKey = new Map();

  for (const entry of sortedEntries) {
    const trimmed = (entry.jobSite || "").trim();
    const key = normalizeJobSiteKey(trimmed);
    const label = trimmed || t("pdf.noJobSite");
    const existing = byKey.get(key);

    if (existing) {
      existing.minutes += entry.totalMinutes;
    } else {
      byKey.set(key, { label, minutes: entry.totalMinutes });
    }
  }

  return Array.from(byKey.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );
}

function encodePdfText(value) {
  const text = String(value);
  let hex = "FEFF";

  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (codePoint == null) continue;

    if (codePoint <= 0xffff) {
      hex += codePoint.toString(16).toUpperCase().padStart(4, "0");
      continue;
    }

    const adjusted = codePoint - 0x10000;
    const high = 0xd800 + (adjusted >> 10);
    const low = 0xdc00 + (adjusted & 0x3ff);
    hex += high.toString(16).toUpperCase().padStart(4, "0");
    hex += low.toString(16).toUpperCase().padStart(4, "0");
  }

  return `<${hex}>`;
}

function estimatePdfTextWidth(text, size) {
  return String(text).length * size * 0.52;
}

function truncatePdfText(text, maxWidth, size) {
  const raw = String(text ?? "");
  if (estimatePdfTextWidth(raw, size) <= maxWidth) return raw;

  let trimmed = raw;
  while (trimmed.length > 1 && estimatePdfTextWidth(`${trimmed}...`, size) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}...`;
}

function wrapPdfText(text, maxWidth, size) {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (estimatePdfTextWidth(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
      continue;
    }

    lines.push(truncatePdfText(word, maxWidth, size));
  }

  if (current) lines.push(current);
  return lines;
}

function pdfColorOps(color, stroke = false) {
  const [r, g, b] = color;
  const command = stroke ? "RG" : "rg";
  return `${r} ${g} ${b} ${command}`;
}

function buildPdfContentStream(ops, pageHeight) {
  const commands = [];
  let inTextBlock = false;

  const closeTextBlock = () => {
    if (!inTextBlock) return;
    commands.push("ET");
    inTextBlock = false;
  };

  const openTextBlock = () => {
    if (inTextBlock) return;
    commands.push("BT");
    inTextBlock = true;
  };

  for (const op of ops) {
    if (op.type === "text") {
      openTextBlock();
      const fontSize = Number((op.size || 10).toFixed(2));
      const x = Number(op.x.toFixed(2));
      const y = Number((pageHeight - op.y).toFixed(2));
      const fontRef = op.font === "bold" ? "/F2" : "/F1";
      const text = encodePdfText(op.text);

      if (op.color) {
        commands.push(pdfColorOps(op.color));
      }

      commands.push(`${fontRef} ${fontSize} Tf`);
      commands.push(`1 0 0 1 ${x} ${y} Tm`);
      commands.push(`${text} Tj`);
      continue;
    }

    closeTextBlock();

    if (op.type === "rect") {
      if (op.fillColor) {
        commands.push(pdfColorOps(op.fillColor));
      }
      const x = Number(op.x.toFixed(2));
      const y = Number((pageHeight - op.y - op.h).toFixed(2));
      const w = Number(op.w.toFixed(2));
      const h = Number(op.h.toFixed(2));
      commands.push(`${x} ${y} ${w} ${h} re ${op.mode || "f"}`);
      continue;
    }

    if (op.type === "line") {
      if (op.color) {
        commands.push(pdfColorOps(op.color, true));
      }
      const width = Number((op.width || 1).toFixed(2));
      const x1 = Number(op.x1.toFixed(2));
      const y1 = Number((pageHeight - op.y1).toFixed(2));
      const x2 = Number(op.x2.toFixed(2));
      const y2 = Number((pageHeight - op.y2).toFixed(2));
      commands.push(`${width} w`);
      commands.push(`${x1} ${y1} m ${x2} ${y2} l S`);
    }
  }

  closeTextBlock();
  return commands.join("\n");
}

function createSimplePdf(pages, options = {}) {
  const pageWidth = options.pageWidth || 612;
  const pageHeight = options.pageHeight || 792;
  const pageOps = Array.isArray(pages[0]) ? pages : [pages];
  const pageCount = pageOps.length;
  const pageObjectStart = 5;
  const contentObjectStart = pageObjectStart + pageCount;
  const kidsRefs = pageOps
    .map((_, index) => `${pageObjectStart + index} 0 R`)
    .join(" ");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${kidsRefs}] /Count ${pageCount} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  for (let i = 0; i < pageCount; i += 1) {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectStart + i} 0 R >>`
    );
  }

  for (const ops of pageOps) {
    const content = buildPdfContentStream(ops, pageHeight);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  }

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function buildPdfTimesheetBlob() {
  const sorted = getSortedEntries();
  const pageWidth = 612;
  const pageHeight = 792;
  const marginLeft = 42;
  const marginRight = 42;
  const topMargin = 44;
  const bottomMargin = 54;
  const usableWidth = pageWidth - marginLeft - marginRight;
  const colors = {
    ink: [0.12, 0.15, 0.19],
    muted: [0.38, 0.42, 0.47],
    border: [0.84, 0.86, 0.89],
    panel: [0.96, 0.97, 0.98],
    panelAlt: [0.985, 0.987, 0.99],
    accent: [0.18, 0.38, 0.63],
  };
  const cols = {
    date: 42,
    jobSite: 132,
    start: 306,
    break: 372,
    end: 462,
    total: 528,
  };
  const pages = [];
  const summaryRows = getJobSiteSummaryRows(sorted);
  const dateRange = getDateRangeLabel(sorted);
  const totalMinutes = sorted.reduce((sum, entry) => sum + entry.totalMinutes, 0);
  let y = topMargin;
  let ops = [];

  const createPage = () => {
    ops = [];
    pages.push(ops);
    y = topMargin;
  };

  const addText = (text, x, textY, size = 10, options = {}) => {
    ops.push({
      type: "text",
      text,
      x,
      y: textY,
      size,
      font: options.font === "bold" ? "bold" : "regular",
      color: options.color || colors.ink,
    });
  };

  const addTextRight = (text, rightX, textY, size = 10, options = {}) => {
    const display = truncatePdfText(text, options.maxWidth || 160, size);
    const width = estimatePdfTextWidth(display, size);
    addText(display, rightX - width, textY, size, options);
  };

  const addRect = (x, rectY, w, h, fillColor) => {
    ops.push({ type: "rect", x, y: rectY, w, h, fillColor, mode: "f" });
  };

  const addLine = (x1, lineY, x2, color = colors.border, width = 1) => {
    ops.push({ type: "line", x1, y1: lineY, x2, y2: lineY, color, width });
  };

  const ensureSpace = (height, options = {}) => {
    if (y + height <= pageHeight - bottomMargin) return;
    createPage();
    drawPageHeader(options.continued === true);
    if (options.repeatTableHeader) {
      y += 12;
      drawTableHeader();
    }
  };

  const drawPageHeader = (continued = false) => {
    addRect(marginLeft, y, usableWidth, 4, colors.accent);
    y += 18;
    addText(continued ? `${t("pdf.title")} (cont.)` : t("pdf.title"), marginLeft, y, 20, {
      font: "bold",
    });
    addTextRight(
      `${t("pdf.dateRange")}: ${dateRange}`,
      pageWidth - marginRight,
      y + 1,
      10,
      { color: colors.muted, maxWidth: 220 }
    );
    y += 22;
    addText(
      `${t("summary.allSaved")}: ${sorted.length}   ${t("pdf.summaryTotalHours")}: ${formatMinutesAsHoursString(totalMinutes)}`,
      marginLeft,
      y,
      10,
      { color: colors.muted }
    );
    y += 18;
    addLine(marginLeft, y, pageWidth - marginRight, colors.border, 1);
    y += 18;
  };

  const drawSectionTitle = (title) => {
    ensureSpace(26);
    addText(title, marginLeft, y, 13, { font: "bold" });
    y += 14;
  };

  const drawSummaryCard = (label, value, x, cardY, w) => {
    addRect(x, cardY, w, 54, colors.panel);
    addText(label, x + 12, cardY + 17, 9, { color: colors.muted });
    addText(value, x + 12, cardY + 39, 15, { font: "bold" });
  };

  const drawTableHeader = () => {
    addRect(marginLeft, y, usableWidth, 24, colors.panel);
    addText(t("table.date"), cols.date, y + 15, 9, { font: "bold", color: colors.muted });
    addText(t("table.jobSite"), cols.jobSite, y + 15, 9, {
      font: "bold",
      color: colors.muted,
    });
    addText(t("table.start"), cols.start, y + 15, 9, { font: "bold", color: colors.muted });
    addText(t("break.title"), cols.break, y + 15, 9, { font: "bold", color: colors.muted });
    addText(t("table.end"), cols.end, y + 15, 9, { font: "bold", color: colors.muted });
    addTextRight(t("table.total"), pageWidth - marginRight - 10, y + 15, 9, {
      font: "bold",
      color: colors.muted,
      maxWidth: 56,
    });
    y += 24;
  };

  const formatBreakWindow = (entry) => {
    if (!entry.breakStart || !entry.breakEnd) return t("table.emptyCell");
    return `${formatTimeTo12Hour(entry.breakStart)} - ${formatTimeTo12Hour(entry.breakEnd)}`;
  };

  createPage();
  drawPageHeader(false);

  ensureSpace(76);
  const summaryTop = y;
  const cardGap = 12;
  const cardWidth = (usableWidth - cardGap * 2) / 3;
  drawSummaryCard(t("pdf.summaryTotalHours"), formatMinutesAsHoursString(totalMinutes), marginLeft, summaryTop, cardWidth);
  drawSummaryCard(t("summary.allSaved"), String(sorted.length), marginLeft + cardWidth + cardGap, summaryTop, cardWidth);
  drawSummaryCard(
    t("breakdown.title"),
    String(summaryRows.length),
    marginLeft + (cardWidth + cardGap) * 2,
    summaryTop,
    cardWidth
  );
  y += 72;

  drawSectionTitle(t("pdf.entriesSection"));
  drawTableHeader();

  sorted.forEach((entry, index) => {
    const rowHeight = 22;
    ensureSpace(rowHeight + 8, { repeatTableHeader: true, continued: true });

    if (index % 2 === 0) {
      addRect(marginLeft, y, usableWidth, rowHeight, colors.panelAlt);
    }

    addText(entry.date, cols.date, y + 14, 9);
    addText(
      truncatePdfText(displayJobSiteCell(entry), cols.start - cols.jobSite - 12, 9),
      cols.jobSite,
      y + 14,
      9
    );
    addText(formatTimeTo12Hour(entry.startTime), cols.start, y + 14, 9);
    addText(
      truncatePdfText(formatBreakWindow(entry), cols.end - cols.break - 10, 9),
      cols.break,
      y + 14,
      9
    );
    addText(formatTimeTo12Hour(entry.endTime), cols.end, y + 14, 9);
    addTextRight(
      formatMinutesAsHoursString(entry.totalMinutes),
      pageWidth - marginRight - 10,
      y + 14,
      9,
      { maxWidth: 56 }
    );
    addLine(marginLeft, y + rowHeight, pageWidth - marginRight, colors.border, 0.6);
    y += rowHeight;
  });

  y += 18;
  drawSectionTitle(t("pdf.summarySection"));
  ensureSpace(28);
  addText(`${t("pdf.summaryTotalHours")}:`, marginLeft, y + 2, 10, { color: colors.muted });
  addText(formatMinutesAsHoursString(totalMinutes), marginLeft + 110, y + 2, 12, { font: "bold" });
  y += 22;
  addLine(marginLeft, y, pageWidth - marginRight, colors.border, 1);
  y += 18;
  addText(t("pdf.summaryByJobSite"), marginLeft, y, 11, { font: "bold" });
  y += 14;

  summaryRows.forEach((row, index) => {
    const wrappedName = wrapPdfText(row.label, usableWidth - 130, 10);
    const rowHeight = Math.max(24, wrappedName.length * 12 + 8);
    ensureSpace(rowHeight + 4, { continued: true });

    if (index % 2 === 0) {
      addRect(marginLeft, y, usableWidth, rowHeight, colors.panelAlt);
    }

    wrappedName.forEach((line, lineIndex) => {
      addText(line, marginLeft + 10, y + 16 + lineIndex * 12, 10);
    });
    addTextRight(
      formatMinutesAsHoursString(row.minutes),
      pageWidth - marginRight - 10,
      y + 16,
      10,
      { font: "bold", maxWidth: 90 }
    );
    addLine(marginLeft, y + rowHeight, pageWidth - marginRight, colors.border, 0.6);
    y += rowHeight;
  });

  pages.forEach((pageOps, index) => {
    pageOps.push({
      type: "text",
      text: `${index + 1}`,
      x: pageWidth - marginRight,
      y: pageHeight - 18,
      size: 9,
      color: colors.muted,
    });
  });

  return createSimplePdf(pages, { pageWidth, pageHeight });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

async function shareOrDownloadBlob(blob, filename, mimeType) {
  const canUseFileShare =
    typeof File !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function";

  if (canUseFileShare) {
    const shareFile = new File([blob], filename, { type: mimeType });

    if (navigator.canShare({ files: [shareFile] })) {
      try {
        await navigator.share({ files: [shareFile] });
        return;
      } catch (error) {
        console.warn("Share failed:", error);
        return;
      }
    }
  }

  downloadBlob(blob, filename);
}

async function exportEntriesAsPdf() {
  if (entries.length === 0) return;
  const today = getTodayDateString();
  const pdfBlob = buildPdfTimesheetBlob();
  await shareOrDownloadBlob(pdfBlob, `work-hours-timesheet-${today}.pdf`, "application/pdf");
}

// Render the entries table from the `entries` array.
function renderEntriesTable() {
  const sorted = getSortedEntries();

  // Remove all existing rows.
  entriesTableBody.innerHTML = "";

  if (sorted.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 8;
    cell.textContent = t("empty.noEntries");
    row.appendChild(cell);
    entriesTableBody.appendChild(row);
    syncDeleteAllButtonState();
    syncExportButtonState();
    return;
  }

  for (const entry of sorted) {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = entry.date;

    const jobSiteCell = document.createElement("td");
    jobSiteCell.textContent = displayJobSiteCell(entry);
    jobSiteCell.className = "data-table__jobsite";

    const startCell = document.createElement("td");
    startCell.textContent = formatTimeTo12Hour(entry.startTime);

    const breakStartCell = document.createElement("td");
    breakStartCell.textContent = entry.breakStart
      ? formatTimeTo12Hour(entry.breakStart)
      : t("table.emptyCell");

    const breakEndCell = document.createElement("td");
    breakEndCell.textContent = entry.breakEnd
      ? formatTimeTo12Hour(entry.breakEnd)
      : t("table.emptyCell");

    const endCell = document.createElement("td");
    endCell.textContent = formatTimeTo12Hour(entry.endTime);

    const totalCell = document.createElement("td");
    totalCell.textContent = formatMinutesAsHoursString(entry.totalMinutes);

    const actionsCell = document.createElement("td");

    // Edit button
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "btn btn-ghost";
    editButton.textContent = t("table.edit");
    editButton.setAttribute("aria-label", t("table.editAria"));
    editButton.addEventListener("click", () => {
      populateFormFromEntry(entry);
    });

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-ghost btn-danger";
    deleteButton.textContent = t("table.delete");
    deleteButton.setAttribute("aria-label", t("table.deleteAria"));
    deleteButton.addEventListener("click", () => {
      openDeleteConfirmDialog(entry);
    });

    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);

    row.appendChild(dateCell);
    row.appendChild(jobSiteCell);
    row.appendChild(startCell);
    row.appendChild(breakStartCell);
    row.appendChild(breakEndCell);
    row.appendChild(endCell);
    row.appendChild(totalCell);
    row.appendChild(actionsCell);

    entriesTableBody.appendChild(row);
  }
  syncDeleteAllButtonState();
  syncExportButtonState();
}

// Calculate and display the total hours across all saved entries, and hours
// from entries with no job site (still included in the overall total).
function updateWeeklyTotal() {
  let totalMinutes = 0;
  let noSiteMinutes = 0;

  for (const entry of entries) {
    totalMinutes += entry.totalMinutes;
    if (!(entry.jobSite || "").trim()) {
      noSiteMinutes += entry.totalMinutes;
    }
  }

  weeklyTotalElement.textContent = formatMinutesAsHoursString(totalMinutes);

  if (weeklyNoSiteTotalElement) {
    weeklyNoSiteTotalElement.textContent =
      formatMinutesAsHoursString(noSiteMinutes);
  }
}

// Total hours per job site across all saved entries, grouped case-insensitively.
function updateWeeklyJobSiteBreakdown() {
  if (!weeklyJobSiteListElement) return;
  const allEntries = getSortedEntries();

  /** @type {Map<string, { label: string; minutes: number }>} */
  const byKey = new Map();

  for (const entry of allEntries) {
    const trimmed = (entry.jobSite || "").trim();
    if (!trimmed) continue;

    const key = normalizeJobSiteKey(trimmed);
    const prev = byKey.get(key);
    if (prev) {
      prev.minutes += entry.totalMinutes;
    } else {
      byKey.set(key, { label: trimmed, minutes: entry.totalMinutes });
    }
  }

  weeklyJobSiteListElement.innerHTML = "";

  if (byKey.size === 0) {
    const li = document.createElement("li");
    li.className = "job-site-breakdown__empty";
    li.textContent =
      allEntries.length === 0
        ? t("breakdown.emptyNone")
        : t("breakdown.emptyNoNamed");
    weeklyJobSiteListElement.appendChild(li);
    return;
  }

  const rows = Array.from(byKey.entries()).map(([key, data]) => ({
    key,
    label: data.label,
    minutes: data.minutes,
  }));

  rows.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );

  for (const row of rows) {
    const li = document.createElement("li");
    li.className = "job-site-breakdown__row";

    const name = document.createElement("span");
    name.className = "job-site-breakdown__name";
    name.textContent = row.label;

    const time = document.createElement("span");
    time.className = "job-site-breakdown__time";
    time.textContent = formatMinutesAsHoursString(row.minutes);

    li.appendChild(name);
    li.appendChild(time);
    weeklyJobSiteListElement.appendChild(li);
  }
}

// Handle form submission: validate input, update or create an entry,
// save to localStorage, and re-render everything.
function handleFormSubmit(event) {
  event.preventDefault();
  setFormError(null);

  const date = dateInput.value || getTodayDateString();
  const jobSite = jobSiteInput ? jobSiteInput.value.trim() : "";
  const start = startInput.value;
  const brkStart = breakStartInput.value;
  const brkEnd = breakEndInput.value;
  const end = endInput.value;

  // Basic validation: date, start, and end are required; job site is optional.
  if (!date || !start || !end) {
    setFormError("errors.needDateStartEnd");
    return;
  }

  const totalMinutes = calculateTotalMinutes(start, brkStart, brkEnd, end);

  if (totalMinutes === null) {
    setFormError("errors.invalidTimeCombination");
    return;
  }

  if (editingEntryId) {
    // Update an existing entry.
    const index = entries.findIndex((entry) => entry.id === editingEntryId);
    if (index !== -1) {
      entries[index] = {
        ...entries[index],
        date,
        jobSite,
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
      jobSite,
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
  updateWeeklyJobSiteBreakdown();

  // Reset edit mode and optionally keep the date filled with today's date.
  clearForm();
  clearFormDraftFromStorage();
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
  jobSiteInput = document.getElementById("job-site");
  formTotalDisplay = document.getElementById("form-total-display");
  formErrorElement = document.getElementById("form-error");
  clearFormButton = document.getElementById("clear-form");
  editingIdInput = document.getElementById("editing-id");
  entriesTableBody = document.querySelector("#entries-table tbody");
  weeklyTotalElement = document.getElementById("weekly-total");
  weeklyNoSiteTotalElement = document.getElementById("weekly-no-site-total");
  weeklyJobSiteListElement = document.getElementById("weekly-job-site-list");

  deleteConfirmDialog = document.getElementById("delete-confirm-dialog");
  deleteConfirmTitleElement = document.getElementById("delete-confirm-title");
  deleteConfirmMessageElement = document.getElementById("delete-confirm-message");
  deleteConfirmYesButton = document.getElementById("delete-confirm-yes");
  deleteConfirmNoButton = document.getElementById("delete-confirm-no");
  deleteAllEntriesButton = document.getElementById("delete-all-entries-btn");
  exportEntriesButton = document.getElementById("export-entries-btn");

  currentLang = loadSavedLanguage();
  const langSelect = document.getElementById("lang-select");
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener("change", () => {
      setAppLanguage(langSelect.value);
    });
  }
  applyStaticI18n();

  if (deleteConfirmYesButton) {
    deleteConfirmYesButton.addEventListener("click", () => {
      if (deleteAllPending) {
        closeDeleteConfirmDialog({ restoreFocus: false });
        performDeleteAllEntries();
        return;
      }
      const entry = deletePendingEntry;
      if (!entry) return;
      closeDeleteConfirmDialog({ restoreFocus: false });
      performEntryDelete(entry);
    });
  }
  if (deleteConfirmNoButton) {
    deleteConfirmNoButton.addEventListener("click", () => {
      closeDeleteConfirmDialog();
    });
  }
  const deleteBackdrop = deleteConfirmDialog?.querySelector(
    "[data-delete-dialog-dismiss]"
  );
  if (deleteBackdrop) {
    deleteBackdrop.addEventListener("click", () => {
      closeDeleteConfirmDialog();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!deleteConfirmDialog || deleteConfirmDialog.hidden) return;
    closeDeleteConfirmDialog();
  });

  // Load saved entries first so restoring an unfinished edit can set editingId.
  loadEntriesFromStorage();

  // Default the form, then overlay the last unfinished draft (any day).
  clearForm();
  loadFormDraftFromStorage();
  updateFormTotalDisplay();

  renderEntriesTable();
  updateWeeklyTotal();
  updateWeeklyJobSiteBreakdown();

  const onFormFieldChange = () => {
    updateFormTotalDisplay();
    persistFormDraftToStorage();
  };

  dateInput.addEventListener("change", onFormFieldChange);
  dateInput.addEventListener("input", onFormFieldChange);
  startInput.addEventListener("input", onFormFieldChange);
  breakStartInput.addEventListener("input", onFormFieldChange);
  breakEndInput.addEventListener("input", onFormFieldChange);
  endInput.addEventListener("input", onFormFieldChange);
  if (jobSiteInput) {
    jobSiteInput.addEventListener("input", onFormFieldChange);
  }

  // Handle "Save entry" button click (no form submission, no network requests).
  const saveEntryBtn = document.getElementById("save-entry-btn");
  if (saveEntryBtn) {
    saveEntryBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleFormSubmit(e);
    });
  }

  // Handle the clear button.
  clearFormButton.addEventListener("click", () => {
    clearForm();
    clearFormDraftFromStorage();
  });

  if (deleteAllEntriesButton) {
    deleteAllEntriesButton.addEventListener("click", () => {
      openDeleteAllConfirmDialog();
    });
  }

  if (exportEntriesButton) {
    exportEntriesButton.addEventListener("click", () => {
      void exportEntriesAsPdf();
    });
  }
});
