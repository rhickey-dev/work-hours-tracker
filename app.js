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
    "entries.export": "Export entries",
    "entries.deleteAll": "Delete all entries",
    "table.date": "Date",
    "table.jobSite": "Job site",
    "table.start": "Start",
    "table.breakStart": "Break start",
    "table.breakEnd": "Break end",
    "table.end": "End",
    "table.total": "Total",
    "table.actions": "Actions",
    "csv.headerDate": "Date",
    "csv.headerJobSite": "Job Site",
    "csv.headerStart": "Start",
    "csv.headerBreakStart": "Break Start",
    "csv.headerBreakEnd": "Break End",
    "csv.headerEnd": "End",
    "csv.headerTotal": "Total",
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
  },
  es: {
    "meta.title": "Registro de horas de trabajo",
    "lang.switcherLabel": "Idioma",
    "lang.switcherHint": "Elegir idioma de la interfaz",
    "lang.en": "English",
    "lang.es": "Español",
    "header.eyebrow": "Control de tiempo",
    "header.title": "Registro de horas de trabajo",
    "header.lede": "Lleva un registro del tiempo diario de trabajo y tu total acumulado.",
    "entry.heading": "Entrada de tiempo diaria",
    "form.date": "Fecha",
    "form.dateHint": "Por defecto es hoy.",
    "form.jobSite": "Obra / sitio",
    "form.jobSitePlaceholder": "Nombre del sitio o dirección (opcional)",
    "form.jobSiteHelp":
      "(Opcional) Déjalo en blanco para incluir las horas solo en el total combinado. Los sitios con nombre se agrupan abajo.",
    "workTime.title": "Tiempo de trabajo",
    "form.start": "Inicio",
    "form.end": "Fin",
    "break.title": "Descanso",
    "break.optional": "(opcional)",
    "break.start": "Inicio del descanso",
    "break.end": "Fin del descanso",
    "form.totalPrompt": "Introduce todas las horas para ver el total del día.",
    "form.totalInvalid": "Revisa las horas de arriba.",
    "form.totalForDay": "Total de este día: {time}",
    "form.saveEntry": "Guardar entrada",
    "form.clearForm": "Limpiar formulario",
    "entries.heading": "Entradas guardadas",
    "entries.subtitle": "Guardado solo en tu navegador.",
    "entries.export": "Exportar entradas",
    "entries.deleteAll": "Eliminar todas las entradas",
    "table.date": "Fecha",
    "table.jobSite": "Obra / sitio",
    "table.start": "Inicio",
    "table.breakStart": "Inicio desc.",
    "table.breakEnd": "Fin desc.",
    "table.end": "Fin",
    "table.total": "Total",
    "table.actions": "Acciones",
    "csv.headerDate": "Fecha",
    "csv.headerJobSite": "Obra / sitio",
    "csv.headerStart": "Inicio",
    "csv.headerBreakStart": "Inicio desc.",
    "csv.headerBreakEnd": "Fin desc.",
    "csv.headerEnd": "Fin",
    "csv.headerTotal": "Total",
    "summary.weekHeading": "Todas las entradas guardadas",
    "summary.allSaved": "Todas las entradas guardadas",
    "summary.totalUnit": "total",
    "summary.noSiteAria": "Horas sin obra indicada",
    "summary.noSiteLabel": "Horas (sin obra indicada)",
    "breakdown.title": "Todas las entradas por obra",
    "breakdown.subtitle":
      "Horas agrupadas por obra. Las entradas sin obra solo cuentan en el total de arriba.",
    "dialog.deleteTitle": "Eliminar entrada",
    "dialog.deleteMessage": "¿Seguro que quieres eliminar esta entrada?",
    "dialog.deleteAllTitle": "¿Eliminar todas las entradas?",
    "dialog.deleteAllMessage":
      "Se borrarán todas las entradas guardadas en este navegador. No se puede deshacer.",
    "dialog.no": "No",
    "dialog.yes": "Sí",
    "empty.noEntries": "Aún no hay entradas. Añade la primera arriba.",
    "table.edit": "Editar",
    "table.delete": "Eliminar",
    "breakdown.emptyNone": "Aún no hay entradas.",
    "breakdown.emptyNoNamed":
      "Aún no hay obras con nombre. Las horas sin obra están en el total de arriba.",
    "errors.needDateStartEnd":
      "Introduce al menos la fecha, la hora de inicio y la de fin.",
    "errors.invalidTimeCombination": "Las horas no parecen válidas. Revísalas.",
    "time.am": "a. m.",
    "time.pm": "p. m.",
    "format.hoursMinutes": "{hours} h {minutes} min",
    "table.emptyCell": "—",
    "table.editAria": "Editar esta entrada",
    "table.deleteAria": "Eliminar esta entrada",
    "dialog.closeBackdrop": "Cerrar diálogo",
    "breakdown.listAria": "Totales de horas agrupados por obra",
    "entries.tableCaption": "Entradas de tiempo de trabajo guardadas",
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
  if (!exportEntriesButton) return;
  exportEntriesButton.disabled = entries.length === 0;
}

function escapeCsvCell(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function buildExportCsv() {
  const sorted = getSortedEntries();
  const header = [
    t("csv.headerDate"),
    t("csv.headerJobSite"),
    t("csv.headerStart"),
    t("csv.headerBreakStart"),
    t("csv.headerBreakEnd"),
    t("csv.headerEnd"),
    t("csv.headerTotal"),
  ];

  const rows = sorted.map((entry) => [
    entry.date,
    displayJobSiteCell(entry),
    formatTimeTo12Hour(entry.startTime),
    entry.breakStart ? formatTimeTo12Hour(entry.breakStart) : t("table.emptyCell"),
    entry.breakEnd ? formatTimeTo12Hour(entry.breakEnd) : t("table.emptyCell"),
    formatTimeTo12Hour(entry.endTime),
    formatMinutesAsHoursString(entry.totalMinutes),
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
}

function exportEntriesAsCsv() {
  if (entries.length === 0) return;

  const csv = buildExportCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = getTodayDateString();

  link.href = url;
  link.download = `work-hours-export-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
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
      exportEntriesAsCsv();
    });
  }
});
