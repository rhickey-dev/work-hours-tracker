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

// Persisted display name (separate from time-entry draft; never cleared with form or entries).
const USER_NAME_STORAGE_KEY = "workHoursUserName";

const translations = {
  en: {
    "meta.title": "Work Hours Tracker",
    "lang.switcherLabel": "Language",
    "lang.switcherHint": "Choose your language",
    "lang.en": "English",
    "lang.es": "Español",
    "header.eyebrow": "Time tracker",
    "header.title": "Work Hours Tracker",
    "header.lede": "Write down the hours you work each day and watch your totals add up.",
    "summary.title": "Your totals",
    "entry.heading": "Add a work day",
    "entry.subtitle": "Fill in the boxes below, then press Save.",
    "form.now": "Now",
    "form.nowAria": "Use the time right now",
    "form.userName": "Your name",
    "form.userNameHelp": "This appears at the top of your PDF.",
    "form.userNamePlaceholder": "Type your name",
    "toast.saved": "Saved!",
    "toast.updated": "Changes saved",
    "form.hourlyRate": "Hourly rate",
    "form.hourlyRatePlaceholder": "0.00",
    "form.hourlyRateHelp":
      "How much you get paid per hour. We use this to calculate your pay. (You can use a different hourly rate for each job site.)",
    "form.date": "Date",
    "form.dateHint": "Today is already filled in. Tap it to pick a different day.",
    "form.jobSite": "Job site",
    "form.jobSitePlaceholder": "Location name or address (optional)",
    "form.jobSiteHelp":
      "If you fill this in, your hours for each location are added up separately below.",
    "workTime.title": "Start and end time",
    "form.start": "Start time",
    "form.end": "End time",
    "break.title": "Break",
    "break.optional": "(only if you took one)",
    "break.start": "Break started",
    "break.end": "Break ended",
    "form.totalPrompt": "Fill in your start and end time to see your hours.",
    "form.totalInvalid": "Those times don’t add up. Please check them.",
    "form.totalForDay": "Hours worked this day: {time}",
    "form.saveEntry": "Save this day",
    "form.clearForm": "Start over",
    "entries.heading": "Your saved days",
    "entries.subtitle": "Saved on this device only. Nothing is sent anywhere.",
    "entries.export": "Download PDF",
    "entries.deleteAll": "Delete all",
    "table.date": "Date",
    "table.jobSite": "Job site",
    "table.hourlyRate": "Hourly rate",
    "table.start": "Start time",
    "table.breakStart": "Break started",
    "table.breakEnd": "Break ended",
    "table.end": "End time",
    "table.total": "Hours",
    "table.actions": "Edit or delete",
    "summary.weekHeading": "All saved days",
    "summary.allSaved": "All saved days",
    "summary.totalUnit": "total hours",
    "summary.totalPay": "total pay",
    "summary.noSitePay": "Pay for days with no job site",
    "summary.noSiteAria": "Hours for days with no job site",
    "summary.noSiteLabel": "Hours for days with no job site",
    "breakdown.hours": "Hours",
    "breakdown.pay": "Pay",
    "breakdown.title": "Totals for each job site",
    "breakdown.subtitle":
      "Your hours and pay added up for each job site. Days with no job site are only counted in the totals at the top.",
    "dialog.deleteTitle": "Delete this day?",
    "dialog.deleteMessage": "This removes this day for good. Are you sure?",
    "dialog.deleteAllTitle": "Delete everything?",
    "dialog.deleteAllMessage":
      "This deletes every day you’ve saved. You can’t undo this.",
    "dialog.no": "Cancel",
    "dialog.yes": "Delete",
    "empty.noEntries": "No days saved yet. Add your first one above.",
    "table.edit": "Edit",
    "table.delete": "Delete",
    "breakdown.emptyNone": "No days saved yet.",
    "breakdown.emptyNoNamed":
      "No job sites added yet. Days with no job site are counted in the total at the top.",
    "errors.needDateStartEnd": "Please fill in the date, start time, and end time.",
    "errors.invalidTimeCombination":
      "Those times don’t look right. Please check them and try again.",
    "time.am": "a.m.",
    "time.pm": "p.m.",
    "format.hoursMinutes": "{hours}h {minutes}m",
    "table.emptyCell": "—",
    "table.editAria": "Edit this day",
    "table.deleteAria": "Delete this day",
    "dialog.closeBackdrop": "Close",
    "breakdown.listAria": "Hours and pay for each job site",
    "entries.tableCaption": "Your saved work days",
    "pdf.title": "Work Hours Timesheet",
    "pdf.name": "Name",
    "pdf.dateRange": "Date range",
    "pdf.entriesSection": "Entries",
    "pdf.summarySection": "Summary",
    "pdf.summaryTotalHours": "Total hours",
    "pdf.summaryByJobSite": "Hours by job site",
    "pdf.payOwed": "Pay owed",
    "pdf.payColumn": "Pay",
    "pdf.brkStart": "Brk start",
    "pdf.brkEnd": "Brk end",
    "pdf.hourlyRate": "Hourly rate",
    "pdf.summaryTotalPay": "Total pay owed",
    "pdf.noJobSite": "No job site listed",
    "pdf.continued": "(cont.)",
    "pdf.eyebrow": "Work hours timesheet",
    "pdf.jobSites": "Job sites",
    "pdf.entriesCount": "Entries logged",
    "pdf.generated": "Generated {date}",
    "pdf.pageOf": "Page {current} of {total}",
  },
  es: {
    "meta.title": "Rastreador de horas de trabajo",
    "lang.switcherLabel": "Idioma",
    "lang.switcherHint": "Elige tu idioma",
    "lang.en": "English",
    "lang.es": "Español",
    "header.eyebrow": "Rastreador de tiempo",
    "header.title": "Rastreador de horas de trabajo",
    "header.lede": "Anota las horas que trabajas cada día y mira cómo suman tus totales.",
    "summary.title": "Tus totales",
    "entry.heading": "Agregar un día de trabajo",
    "entry.subtitle": "Completa las casillas de abajo y presiona Guardar.",
    "form.now": "Ahora",
    "form.nowAria": "Usar la hora actual",
    "form.userName": "Tu nombre",
    "form.userNameHelp": "Aparece en la parte superior de tu PDF.",
    "form.userNamePlaceholder": "Escribe tu nombre",
    "toast.saved": "¡Guardado!",
    "toast.updated": "Cambios guardados",
    "form.hourlyRate": "Pago por hora",
    "form.hourlyRatePlaceholder": "0.00",
    "form.hourlyRateHelp":
      "Cuánto te pagan por una hora. Lo usamos para calcular tu pago. Puedes usar una cantidad distinta para cada sitio de trabajo.",
    "form.date": "Fecha",
    "form.dateHint": "Hoy ya está puesto. Tócalo para elegir otro día.",
    "form.jobSite": "Sitio de trabajo",
    "form.jobSitePlaceholder": "Nombre del lugar o dirección (puedes dejarlo vacío)",
    "form.jobSiteHelp":
      "Si lo completas, tus horas de cada lugar se suman por separado abajo.",
    "workTime.title": "Hora de inicio y de fin",
    "form.start": "Hora de inicio",
    "form.end": "Hora de fin",
    "break.title": "Descanso",
    "break.optional": "(solo si tomaste uno)",
    "break.start": "Empezó el descanso",
    "break.end": "Terminó el descanso",
    "form.totalPrompt": "Pon tu hora de inicio y de fin para ver tus horas.",
    "form.totalInvalid": "Esas horas no cuadran. Por favor revísalas.",
    "form.totalForDay": "Horas trabajadas este día: {time}",
    "form.saveEntry": "Guardar este día",
    "form.clearForm": "Empezar de nuevo",
    "entries.heading": "Tus días guardados",
    "entries.subtitle": "Se guardan solo en este dispositivo. No se envía nada a ningún lado.",
    "entries.export": "Descargar PDF",
    "entries.deleteAll": "Eliminar todo",
    "table.date": "Fecha",
    "table.jobSite": "Sitio de trabajo",
    "table.hourlyRate": "Pago por hora",
    "table.start": "Hora de inicio",
    "table.breakStart": "Empezó el descanso",
    "table.breakEnd": "Terminó el descanso",
    "table.end": "Hora de fin",
    "table.total": "Horas",
    "table.actions": "Editar o eliminar",
    "summary.weekHeading": "Todos los días guardados",
    "summary.allSaved": "Todos los días guardados",
    "summary.totalUnit": "horas en total",
    "summary.totalPay": "pago total",
    "summary.noSitePay": "Pago de días sin sitio de trabajo",
    "summary.noSiteAria": "Horas de días sin sitio de trabajo",
    "summary.noSiteLabel": "Horas de días sin sitio de trabajo",
    "breakdown.hours": "Horas",
    "breakdown.pay": "Pago",
    "breakdown.title": "Totales por sitio de trabajo",
    "breakdown.subtitle":
      "Tus horas y pago sumados por cada sitio de trabajo. Los días sin sitio de trabajo solo se cuentan en los totales de arriba.",
    "dialog.deleteTitle": "¿Eliminar este día?",
    "dialog.deleteMessage": "Esto elimina este día para siempre. ¿Seguro?",
    "dialog.deleteAllTitle": "¿Eliminar todo?",
    "dialog.deleteAllMessage":
      "Esto elimina todos los días que guardaste. No se puede deshacer.",
    "dialog.no": "Cancelar",
    "dialog.yes": "Eliminar",
    "empty.noEntries": "Todavía no hay días guardados. Agrega el primero arriba.",
    "table.edit": "Editar",
    "table.delete": "Eliminar",
    "breakdown.emptyNone": "Todavía no hay días guardados.",
    "breakdown.emptyNoNamed":
      "Todavía no hay sitios de trabajo. Los días sin sitio de trabajo se cuentan en el total de arriba.",
    "errors.needDateStartEnd":
      "Por favor completa la fecha, la hora de inicio y la hora de fin.",
    "errors.invalidTimeCombination":
      "Esas horas no parecen correctas. Por favor revísalas e inténtalo de nuevo.",
    "time.am": "a. m.",
    "time.pm": "p. m.",
    "format.hoursMinutes": "{hours} h {minutes} min",
    "table.emptyCell": "—",
    "table.editAria": "Editar este día",
    "table.deleteAria": "Eliminar este día",
    "dialog.closeBackdrop": "Cerrar",
    "breakdown.listAria": "Horas y pago por cada sitio de trabajo",
    "entries.tableCaption": "Tus días de trabajo guardados",
    "pdf.title": "Hoja de horas de trabajo",
    "pdf.name": "Nombre",
    "pdf.dateRange": "Rango de fechas",
    "pdf.entriesSection": "Entradas",
    "pdf.summarySection": "Resumen",
    "pdf.summaryTotalHours": "Horas totales",
    "pdf.summaryByJobSite": "Horas por sitio de trabajo",
    "pdf.payOwed": "Pago adeudado",
    "pdf.payColumn": "Pago",
    "pdf.brkStart": "In. desc.",
    "pdf.brkEnd": "Fin desc.",
    "pdf.hourlyRate": "Tarifa por hora",
    "pdf.summaryTotalPay": "Pago total adeudado",
    "pdf.noJobSite": "Sin sitio de trabajo indicado",
    "pdf.continued": "(cont.)",
    "pdf.eyebrow": "Hoja de horas de trabajo",
    "pdf.jobSites": "Sitios de trabajo",
    "pdf.entriesCount": "Entradas registradas",
    "pdf.generated": "Generado {date}",
    "pdf.pageOf": "Página {current} de {total}",
  },
};

let currentLang = "en";
/** When true, PDF export uses English labels and en-US formatting regardless of UI language. */
let exportPdfInEnglish = false;

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

function loadUserNameFromStorage() {
  try {
    return localStorage.getItem(USER_NAME_STORAGE_KEY) ?? "";
  } catch (_) {
    return "";
  }
}

function saveUserNameToStorage(value) {
  try {
    localStorage.setItem(USER_NAME_STORAGE_KEY, value);
  } catch (_) {
    /* ignore */
  }
}

function parseHourlyRate(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
}

function getEntryHourlyRate(entry) {
  return parseHourlyRate(entry?.hourlyRate);
}

function getHourlyRateFromForm() {
  if (!hourlyRateInput) return null;
  return parseHourlyRate(hourlyRateInput.value);
}

function calculatePayFromMinutes(totalMinutes, hourlyRate) {
  return (totalMinutes / 60) * hourlyRate;
}

function formatPayAmount(amount) {
  const lang = exportPdfInEnglish ? "en" : currentLang;
  const locale = lang === "es" ? "es-US" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatHourlyRateDisplay(rate) {
  const parsed = parseHourlyRate(rate);
  if (parsed === null) return t("table.emptyCell");
  return formatPayAmount(parsed);
}

function formatEntryPayDisplay(entry) {
  const rate = getEntryHourlyRate(entry);
  if (rate === null) return t("table.emptyCell");
  return formatPayAmount(calculatePayFromMinutes(entry.totalMinutes, rate));
}

function entriesIncludePayData(sortedEntries) {
  return sortedEntries.some((entry) => getEntryHourlyRate(entry) !== null);
}

function getTotalPayFromEntries(sortedEntries) {
  let total = 0;
  let hasPay = false;

  for (const entry of sortedEntries) {
    const rate = getEntryHourlyRate(entry);
    if (rate !== null) {
      total += calculatePayFromMinutes(entry.totalMinutes, rate);
      hasPay = true;
    }
  }

  return hasPay ? total : null;
}

/** Trimmed name for PDF header; uses the field if present, else storage. */
function getUserNameForPdf() {
  if (userNameInput) {
    const fromField = (userNameInput.value || "").trim();
    if (fromField) return fromField;
  }
  return loadUserNameFromStorage().trim();
}

function t(key, vars = {}) {
  const lang = exportPdfInEnglish ? "en" : currentLang;
  const table = translations[lang] || translations.en;
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
  updateWeeklyTotal();
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
    hourlyRate: hourlyRateInput ? hourlyRateInput.value || "" : "",
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
    if (hourlyRateInput && typeof d.hourlyRate === "string") {
      hourlyRateInput.value = d.hourlyRate;
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
let userNameInput;
let hourlyRateInput;
let formTotalDisplay;
let formErrorElement;
let clearFormButton;
let editingIdInput;
let entriesTableBody;
let weeklyTotalElement;
let weeklyTotalPayElement;
let weeklyNoSiteTotalElement;
let weeklyNoSitePayElement;
let weeklyNoSitePayRowElement;
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
function clearForm(options = {}) {
  dateInput.value = getTodayDateString();
  // Default start and end times assume a typical 9–5 schedule.
  // You can still change these values before saving.
  startInput.value = "09:00";
  breakStartInput.value = "";
  breakEndInput.value = "";
  endInput.value = "17:00";
  if (jobSiteInput) jobSiteInput.value = "";
  if (!options.preserveHourlyRate && hourlyRateInput) hourlyRateInput.value = "";
  editingEntryId = null;
  editingIdInput.value = "";
  setFormError(null);
  updateFormTotalDisplay();
}

// Put an existing entry back into the form so it can be edited.
function populateFormFromEntry(entry) {
  dateInput.value = entry.date;
  if (jobSiteInput) jobSiteInput.value = (entry.jobSite || "").trim();
  if (hourlyRateInput) {
    const rate = getEntryHourlyRate(entry);
    hourlyRateInput.value = rate !== null ? String(rate) : "";
  }
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

/** Oldest → newest dates for safe download filenames (hyphens, no spaces). */
function getDateRangeForFilename(sortedEntries) {
  if (sortedEntries.length === 0) return "";
  const firstDate = sortedEntries[0].date;
  const lastDate = sortedEntries[sortedEntries.length - 1].date;
  return firstDate === lastDate ? firstDate : `${firstDate}-to-${lastDate}`;
}

/** Strip characters unsafe in file names; collapse whitespace to single hyphens. */
function sanitizeForDownloadFilename(raw) {
  const cleaned = String(raw ?? "")
    .trim()
    .replace(/[\/\\?%*:|"<>]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned.slice(0, 120);
}

function buildExportPdfBasename(sortedEntries) {
  const datePart = getDateRangeForFilename(sortedEntries);
  const worker = getUserNameForPdf().trim();
  const namePart = sanitizeForDownloadFilename(worker) || "Work-Hours-Timesheet";
  let base = datePart ? `${namePart}-${datePart}` : namePart;
  base = base.replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (base.length > 180) base = base.slice(0, 180).replace(/-+$/g, "");
  return base || "timesheet-export";
}

function getJobSiteSummaryRows(sortedEntries) {
  /** @type {Map<string, { label: string; minutes: number; pay: number; hasPay: boolean }>} */
  const byKey = new Map();

  for (const entry of sortedEntries) {
    const trimmed = (entry.jobSite || "").trim();
    const key = normalizeJobSiteKey(trimmed);
    const label = trimmed || t("pdf.noJobSite");
    const rate = getEntryHourlyRate(entry);
    const entryPay = rate !== null ? calculatePayFromMinutes(entry.totalMinutes, rate) : 0;
    const existing = byKey.get(key);

    if (existing) {
      existing.minutes += entry.totalMinutes;
      if (rate !== null) {
        existing.pay += entryPay;
        existing.hasPay = true;
      }
    } else {
      byKey.set(key, {
        label,
        minutes: entry.totalMinutes,
        pay: entryPay,
        hasPay: rate !== null,
      });
    }
  }

  return Array.from(byKey.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );
}

function getNamedJobSiteSummaryRows(sortedEntries) {
  return getJobSiteSummaryRows(sortedEntries).filter(
    (row) => normalizeJobSiteKey(row.label === t("pdf.noJobSite") ? "" : row.label) !== "__none__"
  );
}

// Windows-1252 (WinAnsi) code points that live outside Latin-1 (0x80–0x9F),
// so we can render em dashes, curly quotes, etc. instead of "?".
const PDF_CP1252_SPECIALS = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

// Encode as a PDF string literal using WinAnsiEncoding. Output stays ASCII
// (printable chars plus \ddd octal escapes) so byte length == string length,
// which keeps /Length and xref offsets correct.
function encodePdfText(value) {
  let out = "";
  for (const ch of String(value)) {
    if (ch === "\\") {
      out += "\\\\";
      continue;
    }
    if (ch === "(") {
      out += "\\(";
      continue;
    }
    if (ch === ")") {
      out += "\\)";
      continue;
    }
    const code = ch.codePointAt(0);
    if (code >= 0x20 && code <= 0x7e) {
      out += ch;
      continue;
    }
    let byte = null;
    if (code >= 0xa0 && code <= 0xff) {
      byte = code;
    } else if (PDF_CP1252_SPECIALS[code] !== undefined) {
      byte = PDF_CP1252_SPECIALS[code];
    }
    out += byte === null ? "?" : `\\${byte.toString(8).padStart(3, "0")}`;
  }
  return `(${out})`;
}

function estimatePdfTextWidth(text, size, options = {}) {
  const factor = options.bold ? 0.62 : 0.56;
  return String(text).length * size * factor;
}

function pdfTextWidth(text, size, bold = false) {
  return estimatePdfTextWidth(String(text ?? ""), size, { bold }) + 6;
}

function columnWidth(header, sampleValues, fontSize) {
  let max = pdfTextWidth(header, fontSize, true);
  for (const value of sampleValues) {
    max = Math.max(max, pdfTextWidth(value, fontSize, false));
  }
  return max;
}

function buildEntriesPdfLayout(sorted, pageWidth, marginLeft, marginRight) {
  const GAP = 12;
  const INSET = 12;

  function layoutForFontSize(fontSize) {
    const usable = pageWidth - marginLeft - marginRight;
    const tableLeft = marginLeft + INSET;
    const tableRight = marginLeft + usable - INSET;
    const timeCell = formatTimeTo12Hour("12:59");
    const empty = t("table.emptyCell");

    const rightSpecs = [
      { key: "pay", header: t("pdf.payOwed"), samples: ["$9,999.99", empty] },
      { key: "total", header: t("table.total"), samples: [formatMinutesAsHoursString(5999)] },
      { key: "end", header: t("table.end"), samples: [timeCell] },
      { key: "breakEnd", header: t("table.breakEnd"), samples: [timeCell, empty] },
      { key: "breakStart", header: t("table.breakStart"), samples: [timeCell, empty] },
      { key: "start", header: t("table.start"), samples: [timeCell] },
      {
        key: "hourlyRate",
        header: t("table.hourlyRate"),
        samples: ["$9,999.99", empty],
        align: "right",
      },
    ];

    let cursor = tableRight;
    const columns = {};

    for (const spec of rightSpecs) {
      const width = columnWidth(spec.header, spec.samples, fontSize);
      cursor -= width;
      columns[spec.key] = {
        x: cursor,
        width,
        right: cursor + width,
        align: spec.align || "right",
        header: spec.header,
      };
      cursor -= GAP;
    }

    const dateWidth = columnWidth(t("table.date"), ["2026-05-28"], fontSize);
    let left = tableLeft;
    columns.date = {
      x: left,
      width: dateWidth,
      align: "left",
      header: t("table.date"),
    };
    left += dateWidth + GAP;

    const jobSiteMin = pdfTextWidth(t("table.jobSite"), fontSize, true);
    const jobSiteWidth = Math.max(jobSiteMin, cursor - left);
    columns.jobSite = {
      x: left,
      width: jobSiteWidth,
      align: "left",
      header: t("table.jobSite"),
    };

    const fits = left + jobSiteWidth <= cursor;
    return {
      fontSize,
      tableLeft,
      tableRight,
      columns,
      headerRowHeight: 26,
      rowHeight: 22,
      fits,
    };
  }

  // Landscape gives plenty of room: prefer a comfortable, readable size and
  // only step down if labels (e.g. longer Spanish headers) would not fit.
  let layout = layoutForFontSize(9);
  if (!layout.fits) layout = layoutForFontSize(8);
  if (!layout.fits) layout = layoutForFontSize(7);
  return layout;
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
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
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
  exportPdfInEnglish = true;
  try {
    return buildPdfTimesheetBlobInner();
  } finally {
    exportPdfInEnglish = false;
  }
}

function buildPdfTimesheetBlobInner() {
  const sorted = getSortedEntries();
  // Landscape Letter: 9 full-header columns plus long job-site names need the
  // extra horizontal room to stay readable and never overlap.
  const pageWidth = 792;
  const pageHeight = 612;
  const marginLeft = 48;
  const marginRight = 48;
  const topMargin = 44;
  const bottomMargin = 56;
  const usableWidth = pageWidth - marginLeft - marginRight;
  const contentRight = marginLeft + usableWidth;
  const colors = {
    ink: [0.12, 0.15, 0.2],
    muted: [0.42, 0.46, 0.52],
    faint: [0.58, 0.62, 0.68],
    headInk: [0.22, 0.27, 0.34],
    border: [0.85, 0.87, 0.9],
    hair: [0.9, 0.92, 0.94],
    rowAlt: [0.965, 0.972, 0.982],
    headFill: [0.93, 0.945, 0.965],
    cardFill: [0.962, 0.972, 0.985],
    accent: [0.16, 0.36, 0.62],
    accentSoft: [0.62, 0.71, 0.84],
    onAccent: [1, 1, 1],
    onAccentSoft: [0.8, 0.87, 0.96],
  };
  const entryLayout = buildEntriesPdfLayout(sorted, pageWidth, marginLeft, marginRight);
  const ec = entryLayout.columns;
  const entryFontSize = entryLayout.fontSize;
  const pages = [];
  const summaryRows = getJobSiteSummaryRows(sorted);
  const namedSiteRows = getNamedJobSiteSummaryRows(sorted);
  const dateRange = getDateRangeLabel(sorted);
  const workerName = getUserNameForPdf().trim();
  const hasPayData = entriesIncludePayData(sorted);
  const titleText = workerName || t("pdf.title");
  const totalMinutes = sorted.reduce((sum, entry) => sum + entry.totalMinutes, 0);
  const totalPay = getTotalPayFromEntries(sorted);
  const totalHoursStr = formatMinutesAsHoursString(totalMinutes);
  const totalPayStr = totalPay !== null ? formatPayAmount(totalPay) : null;
  const now = new Date();
  const generatedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
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
    const rightInset = options.rightInset ?? 8;
    const maxWidth = options.maxWidth || 160;
    const display = truncatePdfText(text, maxWidth, size);
    const width = estimatePdfTextWidth(display, size, {
      bold: options.font === "bold",
    });
    addText(display, rightX - width - rightInset, textY, size, options);
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
    drawHeaderBand(true);
    if (options.repeatTableHeader) {
      drawTableHeader();
    }
  };

  // Branded header band. Full size on the first page; compact on continuations.
  const drawHeaderBand = (continued = false) => {
    const bandH = continued ? 36 : 74;
    addRect(marginLeft, y, usableWidth, bandH, colors.accent);

    if (continued) {
      addText(`${titleText} ${t("pdf.continued")}`, marginLeft + 18, y + 23, 13, {
        font: "bold",
        color: colors.onAccent,
      });
      addTextRight(dateRange, contentRight - 18, y + 23, 10, {
        color: colors.onAccentSoft,
        maxWidth: usableWidth * 0.4,
        rightInset: 0,
      });
      y += bandH + 16;
      return;
    }

    addText(t("pdf.eyebrow").toUpperCase(), marginLeft + 20, y + 25, 8.5, {
      font: "bold",
      color: colors.onAccentSoft,
    });
    addText(truncatePdfText(titleText, usableWidth * 0.6, 22), marginLeft + 20, y + 52, 22, {
      font: "bold",
      color: colors.onAccent,
    });

    addTextRight(t("pdf.dateRange").toUpperCase(), contentRight - 20, y + 25, 8.5, {
      font: "bold",
      color: colors.onAccentSoft,
      maxWidth: usableWidth * 0.5,
      rightInset: 0,
    });
    addTextRight(dateRange, contentRight - 20, y + 48, 13, {
      font: "bold",
      color: colors.onAccent,
      maxWidth: usableWidth * 0.5,
      rightInset: 0,
    });
    y += bandH + 22;
  };

  const drawSectionTitle = (title) => {
    ensureSpace(34);
    addRect(marginLeft, y - 10, 4, 14, colors.accent);
    addText(title, marginLeft + 13, y, 14, { font: "bold" });
    y += 16;
  };

  const drawSummaryCards = () => {
    const cards = [{ label: t("pdf.summaryTotalHours"), value: totalHoursStr }];
    if (totalPayStr) {
      cards.push({ label: t("pdf.summaryTotalPay"), value: totalPayStr, highlight: true });
    }
    cards.push({ label: t("pdf.entriesCount"), value: String(sorted.length) });
    cards.push({ label: t("pdf.jobSites"), value: String(namedSiteRows.length) });

    const cardH = 58;
    const cardGap = 14;
    const cardWidth = (usableWidth - cardGap * (cards.length - 1)) / cards.length;
    ensureSpace(cardH + 6);
    const top = y;

    cards.forEach((card, index) => {
      const x = marginLeft + index * (cardWidth + cardGap);
      addRect(x, top, cardWidth, cardH, colors.cardFill);
      addRect(x, top, 3.5, cardH, card.highlight ? colors.accent : colors.accentSoft);
      addText(truncatePdfText(card.label, cardWidth - 22, 8.5), x + 14, top + 22, 8.5, {
        color: colors.muted,
      });
      addText(truncatePdfText(card.value, cardWidth - 22, 16), x + 14, top + 45, 16, {
        font: "bold",
        color: card.highlight ? colors.accent : colors.ink,
      });
    });

    y = top + cardH + 26;
  };

  const drawTableHeader = () => {
    const headerH = entryLayout.headerRowHeight;
    addRect(marginLeft, y, usableWidth, headerH, colors.headFill);
    const hy = y + headerH - 8;
    const headerStyle = { font: "bold", color: colors.headInk };

    addText(ec.date.header, ec.date.x, hy, entryFontSize, headerStyle);
    addText(ec.jobSite.header, ec.jobSite.x, hy, entryFontSize, headerStyle);
    addTextRight(ec.hourlyRate.header, ec.hourlyRate.right, hy, entryFontSize, {
      ...headerStyle,
      maxWidth: ec.hourlyRate.width,
      rightInset: 2,
    });
    addText(ec.start.header, ec.start.x, hy, entryFontSize, headerStyle);
    addText(ec.breakStart.header, ec.breakStart.x, hy, entryFontSize, headerStyle);
    addText(ec.breakEnd.header, ec.breakEnd.x, hy, entryFontSize, headerStyle);
    addText(ec.end.header, ec.end.x, hy, entryFontSize, headerStyle);
    addTextRight(ec.total.header, ec.total.right, hy, entryFontSize, {
      ...headerStyle,
      maxWidth: ec.total.width,
      rightInset: 2,
    });
    addTextRight(ec.pay.header, ec.pay.right, hy, entryFontSize, {
      ...headerStyle,
      maxWidth: ec.pay.width,
      rightInset: 2,
    });
    addLine(marginLeft, y + headerH, contentRight, colors.accent, 1.2);
    y += headerH;
  };

  createPage();
  drawHeaderBand(false);
  drawSummaryCards();

  drawSectionTitle(t("pdf.entriesSection"));
  drawTableHeader();

  const emptyCell = t("table.emptyCell");
  sorted.forEach((entry, index) => {
    const rowHeight = entryLayout.rowHeight;
    ensureSpace(rowHeight + 8, { repeatTableHeader: true });

    if (index % 2 === 1) {
      addRect(marginLeft, y, usableWidth, rowHeight, colors.rowAlt);
    }

    const ry = y + rowHeight - 7;

    addText(entry.date, ec.date.x, ry, entryFontSize);
    addText(
      truncatePdfText(displayJobSiteCell(entry), ec.jobSite.width - 4, entryFontSize),
      ec.jobSite.x,
      ry,
      entryFontSize
    );
    addTextRight(formatHourlyRateDisplay(entry.hourlyRate), ec.hourlyRate.right, ry, entryFontSize, {
      maxWidth: ec.hourlyRate.width,
      rightInset: 2,
    });
    addText(formatTimeTo12Hour(entry.startTime), ec.start.x, ry, entryFontSize);
    addText(
      entry.breakStart ? formatTimeTo12Hour(entry.breakStart) : emptyCell,
      ec.breakStart.x,
      ry,
      entryFontSize
    );
    addText(
      entry.breakEnd ? formatTimeTo12Hour(entry.breakEnd) : emptyCell,
      ec.breakEnd.x,
      ry,
      entryFontSize
    );
    addText(formatTimeTo12Hour(entry.endTime), ec.end.x, ry, entryFontSize);
    addTextRight(
      formatMinutesAsHoursString(entry.totalMinutes),
      ec.total.right,
      ry,
      entryFontSize,
      { font: "bold", maxWidth: ec.total.width, rightInset: 2 }
    );
    const entryPayText = formatEntryPayDisplay(entry);
    addTextRight(entryPayText, ec.pay.right, ry, entryFontSize, {
      font: entryPayText !== emptyCell ? "bold" : "regular",
      maxWidth: ec.pay.width,
      rightInset: 2,
    });
    addLine(marginLeft, y + rowHeight, contentRight, colors.hair, 0.6);
    y += rowHeight;
  });

  y += 26;
  drawSectionTitle(t("pdf.summarySection"));

  ensureSpace(30);
  const labelGap = Math.max(
    120,
    pdfTextWidth(`${t("pdf.summaryTotalHours")}:`, 10, false),
    pdfTextWidth(`${t("pdf.summaryTotalPay")}:`, 10, false)
  );
  addText(`${t("pdf.summaryTotalHours")}:`, marginLeft, y + 2, 10, { color: colors.muted });
  addText(totalHoursStr, marginLeft + labelGap, y + 2, 13, { font: "bold" });
  if (totalPayStr) {
    y += 24;
    addText(`${t("pdf.summaryTotalPay")}:`, marginLeft, y + 2, 10, { color: colors.muted });
    addText(totalPayStr, marginLeft + labelGap, y + 2, 13, { font: "bold", color: colors.accent });
  }
  y += 24;
  addLine(marginLeft, y, contentRight, colors.border, 1);
  y += 22;

  addText(t("pdf.summaryByJobSite"), marginLeft, y, 12, { font: "bold" });
  y += 16;

  const summaryHoursRight = hasPayData
    ? entryLayout.tableRight - ec.pay.width - ec.total.width - 24
    : entryLayout.tableRight;

  const drawJobSiteHeader = () => {
    addRect(marginLeft, y, usableWidth, 22, colors.headFill);
    const hy = y + 15;
    addText(t("table.jobSite"), marginLeft + 12, hy, 9, {
      font: "bold",
      color: colors.headInk,
    });
    addTextRight(t("breakdown.hours"), summaryHoursRight, hy, 9, {
      font: "bold",
      color: colors.headInk,
      maxWidth: ec.total.width + 20,
      rightInset: 2,
    });
    if (hasPayData) {
      addTextRight(t("pdf.payOwed"), entryLayout.tableRight, hy, 9, {
        font: "bold",
        color: colors.headInk,
        maxWidth: ec.pay.width,
        rightInset: 2,
      });
    }
    addLine(marginLeft, y + 22, contentRight, colors.accent, 1.2);
    y += 22;
  };

  ensureSpace(40);
  drawJobSiteHeader();

  summaryRows.forEach((row, index) => {
    const nameMaxWidth = hasPayData
      ? summaryHoursRight - marginLeft - ec.total.width - 28
      : entryLayout.tableRight - marginLeft - 24;
    const wrappedName = wrapPdfText(row.label, nameMaxWidth, 10);
    const rowHeight = Math.max(24, wrappedName.length * 13 + 8);
    ensureSpace(rowHeight + 4);

    if (index % 2 === 1) {
      addRect(marginLeft, y, usableWidth, rowHeight, colors.rowAlt);
    }

    wrappedName.forEach((line, lineIndex) => {
      addText(line, marginLeft + 12, y + 16 + lineIndex * 13, 10);
    });
    addTextRight(formatMinutesAsHoursString(row.minutes), summaryHoursRight, y + 16, 10, {
      font: "bold",
      maxWidth: ec.total.width + 20,
      rightInset: 2,
    });
    if (hasPayData) {
      addTextRight(
        row.hasPay ? formatPayAmount(row.pay) : emptyCell,
        entryLayout.tableRight,
        y + 16,
        10,
        { font: row.hasPay ? "bold" : "regular", maxWidth: ec.pay.width, rightInset: 2 }
      );
    }
    addLine(marginLeft, y + rowHeight, contentRight, colors.hair, 0.6);
    y += rowHeight;
  });

  const totalPages = pages.length;
  pages.forEach((pageOps, index) => {
    const footY = pageHeight - 24;
    pageOps.push({
      type: "line",
      x1: marginLeft,
      y1: pageHeight - 38,
      x2: contentRight,
      y2: pageHeight - 38,
      color: colors.hair,
      width: 0.8,
    });
    pageOps.push({
      type: "text",
      text: t("pdf.generated", { date: generatedDate }),
      x: marginLeft,
      y: footY,
      size: 8.5,
      color: colors.faint,
      font: "regular",
    });
    const pageLabel = t("pdf.pageOf", { current: index + 1, total: totalPages });
    const labelWidth = estimatePdfTextWidth(pageLabel, 8.5);
    pageOps.push({
      type: "text",
      text: pageLabel,
      x: contentRight - labelWidth,
      y: footY,
      size: 8.5,
      color: colors.faint,
      font: "regular",
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
  const sorted = getSortedEntries();
  const pdfBlob = buildPdfTimesheetBlob();
  const filename = `${buildExportPdfBasename(sorted)}.pdf`;
  await shareOrDownloadBlob(pdfBlob, filename, "application/pdf");
}

// Render the entries table from the `entries` array.
function renderEntriesTable() {
  const sorted = getSortedEntries();

  // Remove all existing rows.
  entriesTableBody.innerHTML = "";

  if (sorted.length === 0) {
    const row = document.createElement("tr");
    row.className = "data-table__empty";
    const cell = document.createElement("td");
    cell.colSpan = 9;
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
    dateCell.dataset.label = t("table.date");

    const jobSiteCell = document.createElement("td");
    jobSiteCell.textContent = displayJobSiteCell(entry);
    jobSiteCell.className = "data-table__jobsite";
    jobSiteCell.dataset.label = t("table.jobSite");

    const hourlyRateCell = document.createElement("td");
    hourlyRateCell.textContent = formatHourlyRateDisplay(entry.hourlyRate);
    hourlyRateCell.className = "data-table__rate";
    hourlyRateCell.dataset.label = t("table.hourlyRate");

    const startCell = document.createElement("td");
    startCell.textContent = formatTimeTo12Hour(entry.startTime);
    startCell.dataset.label = t("table.start");

    const breakStartCell = document.createElement("td");
    breakStartCell.textContent = entry.breakStart
      ? formatTimeTo12Hour(entry.breakStart)
      : t("table.emptyCell");
    breakStartCell.dataset.label = t("table.breakStart");

    const breakEndCell = document.createElement("td");
    breakEndCell.textContent = entry.breakEnd
      ? formatTimeTo12Hour(entry.breakEnd)
      : t("table.emptyCell");
    breakEndCell.dataset.label = t("table.breakEnd");

    const endCell = document.createElement("td");
    endCell.textContent = formatTimeTo12Hour(entry.endTime);
    endCell.dataset.label = t("table.end");

    const totalCell = document.createElement("td");
    totalCell.textContent = formatMinutesAsHoursString(entry.totalMinutes);
    totalCell.dataset.label = t("table.total");
    totalCell.dataset.col = "total";

    const actionsCell = document.createElement("td");
    actionsCell.dataset.label = t("table.actions");
    actionsCell.dataset.col = "actions";

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
    row.appendChild(hourlyRateCell);
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
  let noSitePay = 0;
  let noSiteHasPay = false;

  for (const entry of entries) {
    totalMinutes += entry.totalMinutes;
    const rate = getEntryHourlyRate(entry);
    const entryPay = rate !== null ? calculatePayFromMinutes(entry.totalMinutes, rate) : 0;

    if (!(entry.jobSite || "").trim()) {
      noSiteMinutes += entry.totalMinutes;
      if (rate !== null) {
        noSitePay += entryPay;
        noSiteHasPay = true;
      }
    }
  }

  weeklyTotalElement.textContent = formatMinutesAsHoursString(totalMinutes);

  if (weeklyTotalPayElement) {
    const totalPay = getTotalPayFromEntries(entries);
    weeklyTotalPayElement.textContent =
      totalPay !== null ? formatPayAmount(totalPay) : t("table.emptyCell");
  }

  if (weeklyNoSiteTotalElement) {
    weeklyNoSiteTotalElement.textContent =
      formatMinutesAsHoursString(noSiteMinutes);
  }

  if (weeklyNoSitePayElement) {
    weeklyNoSitePayElement.textContent = noSiteHasPay
      ? formatPayAmount(noSitePay)
      : t("table.emptyCell");
  }

  if (weeklyNoSitePayRowElement) {
    weeklyNoSitePayRowElement.hidden = !noSiteHasPay && noSiteMinutes === 0;
  }
}

// Total hours per job site across all saved entries, grouped case-insensitively.
function updateWeeklyJobSiteBreakdown() {
  if (!weeklyJobSiteListElement) return;
  const allEntries = getSortedEntries();
  const rows = getNamedJobSiteSummaryRows(allEntries);
  const showPay = entriesIncludePayData(allEntries);

  weeklyJobSiteListElement.innerHTML = "";

  if (rows.length === 0) {
    const li = document.createElement("li");
    li.className = "job-site-breakdown__empty";
    li.textContent =
      allEntries.length === 0
        ? t("breakdown.emptyNone")
        : t("breakdown.emptyNoNamed");
    weeklyJobSiteListElement.appendChild(li);
    return;
  }

  if (showPay) {
    const header = document.createElement("li");
    header.className = "job-site-breakdown__header";

    const headerName = document.createElement("span");
    headerName.className = "job-site-breakdown__name";
    headerName.textContent = t("table.jobSite");

    const headerMetrics = document.createElement("div");
    headerMetrics.className = "job-site-breakdown__metrics";

    const headerHours = document.createElement("span");
    headerHours.className = "job-site-breakdown__metric-label";
    headerHours.textContent = t("breakdown.hours");

    const headerPay = document.createElement("span");
    headerPay.className = "job-site-breakdown__metric-label";
    headerPay.textContent = t("breakdown.pay");

    headerMetrics.appendChild(headerHours);
    headerMetrics.appendChild(headerPay);
    header.appendChild(headerName);
    header.appendChild(headerMetrics);
    weeklyJobSiteListElement.appendChild(header);
  }

  for (const row of rows) {
    const li = document.createElement("li");
    li.className = "job-site-breakdown__row";

    const name = document.createElement("span");
    name.className = "job-site-breakdown__name";
    name.textContent = row.label;

    const time = document.createElement("span");
    time.className = "job-site-breakdown__time";
    time.textContent = formatMinutesAsHoursString(row.minutes);

    if (showPay) {
      const metrics = document.createElement("div");
      metrics.className = "job-site-breakdown__metrics";

      const pay = document.createElement("span");
      pay.className = "job-site-breakdown__pay";
      pay.textContent = row.hasPay ? formatPayAmount(row.pay) : t("table.emptyCell");

      metrics.appendChild(time);
      metrics.appendChild(pay);
      li.appendChild(name);
      li.appendChild(metrics);
    } else {
      li.appendChild(name);
      li.appendChild(time);
    }

    weeklyJobSiteListElement.appendChild(li);
  }
}

// Brief, friendly confirmation after saving so users know it worked.
let saveToastTimer = null;
function showSaveToast(messageKey) {
  const toast = document.getElementById("save-toast");
  const text = document.getElementById("save-toast-text");
  if (!toast || !text) return;

  text.textContent = t(messageKey);
  toast.hidden = false;
  // Force a reflow so the entry transition runs even on rapid repeats.
  void toast.offsetWidth;
  toast.classList.add("is-visible");

  if (saveToastTimer) clearTimeout(saveToastTimer);
  saveToastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => {
      toast.hidden = true;
    }, 250);
  }, 2200);
}

// Pad a number to two digits for "HH:MM" time-input values.
function pad2(n) {
  return String(n).padStart(2, "0");
}

// Fill a time field with the current clock time and refresh the live total.
function setTimeFieldToNow(input) {
  if (!input) return;
  const now = new Date();
  input.value = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

// Handle form submission: validate input, update or create an entry,
// save to localStorage, and re-render everything.
function handleFormSubmit(event) {
  event.preventDefault();
  setFormError(null);

  const date = dateInput.value || getTodayDateString();
  const jobSite = jobSiteInput ? jobSiteInput.value.trim() : "";
  const hourlyRate = getHourlyRateFromForm();
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

  const wasEditing = Boolean(editingEntryId);

  if (editingEntryId) {
    // Update an existing entry.
    const index = entries.findIndex((entry) => entry.id === editingEntryId);
    if (index !== -1) {
      entries[index] = {
        ...entries[index],
        date,
        jobSite,
        hourlyRate,
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
      hourlyRate,
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

  // Reset edit mode; keep the hourly rate for the next entry at this job site.
  const savedHourlyRate = hourlyRateInput ? hourlyRateInput.value : "";
  clearForm({ preserveHourlyRate: true });
  if (hourlyRateInput && savedHourlyRate.trim()) {
    hourlyRateInput.value = savedHourlyRate;
  }
  persistFormDraftToStorage();

  showSaveToast(wasEditing ? "toast.updated" : "toast.saved");
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
  userNameInput = document.getElementById("user-name");
  hourlyRateInput = document.getElementById("hourly-rate");
  formTotalDisplay = document.getElementById("form-total-display");
  formErrorElement = document.getElementById("form-error");
  clearFormButton = document.getElementById("clear-form");
  editingIdInput = document.getElementById("editing-id");
  entriesTableBody = document.querySelector("#entries-table tbody");
  weeklyTotalElement = document.getElementById("weekly-total");
  weeklyTotalPayElement = document.getElementById("weekly-total-pay");
  weeklyNoSiteTotalElement = document.getElementById("weekly-no-site-total");
  weeklyNoSitePayElement = document.getElementById("weekly-no-site-pay");
  weeklyNoSitePayRowElement = document.getElementById("weekly-no-site-pay-row");
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

  if (userNameInput) {
    userNameInput.value = loadUserNameFromStorage();
    const persistUserName = () => {
      saveUserNameToStorage(userNameInput.value);
    };
    userNameInput.addEventListener("input", persistUserName);
    userNameInput.addEventListener("change", persistUserName);
  }

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
  if (hourlyRateInput) {
    hourlyRateInput.addEventListener("input", onFormFieldChange);
    hourlyRateInput.addEventListener("change", onFormFieldChange);
  }

  // Handle "Save entry" button click (no form submission, no network requests).
  const saveEntryBtn = document.getElementById("save-entry-btn");
  if (saveEntryBtn) {
    saveEntryBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleFormSubmit(e);
    });
  }

  // "Now" quick-fill buttons set a time field to the current clock time.
  document.querySelectorAll(".now-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-now-target");
      if (targetId) setTimeFieldToNow(document.getElementById(targetId));
    });
  });

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
