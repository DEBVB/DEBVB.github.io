/* =============================================================================
   DEBVB Attendance backend  ·  Google Apps Script
   =============================================================================

   Paste this whole file into the Apps Script editor of a NEW, PRIVATE Google
   Sheet (not the public website sheet — that one is readable by anyone).
   Full step-by-step setup: ATTENDANCE-SETUP.md in the website repo.

   Script properties (Project Settings → Script properties):
     TEAM_CODE   – what players/parents type once to RSVP, e.g. cougars27
     COACH_CODE  – what coaches type to see names and take attendance.
                   Make it long and keep it private.

   Data lives in the "Attendance" tab of this sheet, one row per event+player:
     EventID | Event | Date | Player | Status | Note | CheckIn | Updated

     Status  – going | maybe | out      (the player's RSVP)
     CheckIn – present | late | absent  (what the coach marked at the gym)

   The public website only ever receives COUNTS. Names are returned only
   when the request carries COACH_CODE.
   =========================================================================== */

var TAB = 'Attendance';
var HEADERS = ['EventID', 'Event', 'Date', 'Player', 'Status', 'Note', 'CheckIn', 'Updated'];
var STATUSES = ['going', 'maybe', 'out'];
var CHECKINS = ['present', 'late', 'absent', ''];

function doGet(e)  { return handle_(e.parameter || {}); }
function doPost(e) {
  var p = {};
  try { p = JSON.parse(e.postData.contents); } catch (err) { p = e.parameter || {}; }
  return handle_(p);
}

function handle_(p) {
  try {
    var out;
    switch (p.action) {
      case 'counts':  out = counts_(p);  break;   // public
      case 'mine':    out = mine_(p);    break;   // team code
      case 'rsvp':    out = rsvp_(p);    break;   // team code
      case 'event':   out = eventList_(p); break; // coach code
      case 'checkin': out = checkin_(p); break;   // coach code
      case 'report':  out = report_(p);  break;   // coach code
      case 'verify':  out = verify_(p);  break;
      default: throw new Error('Unknown action');
    }
    out.ok = true;
    return json_(out);
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

function prop_(k) { return (PropertiesService.getScriptProperties().getProperty(k) || '').trim(); }
function same_(a, b) { return !!b && String(a || '').trim().toLowerCase() === b.toLowerCase(); }
function isCoach_(p) { return same_(p.code, prop_('COACH_CODE')); }
function isTeam_(p)  { return isCoach_(p) || same_(p.code, prop_('TEAM_CODE')); }
function needTeam_(p)  { if (!isTeam_(p))  throw new Error('Wrong team code'); }
function needCoach_(p) { if (!isCoach_(p)) throw new Error('Wrong coach code'); }

function verify_(p) { return { team: isTeam_(p), coach: isCoach_(p) }; }

// ── Sheet helpers ────────────────────────────────────────────────────────────

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TAB);
  if (!sh) {
    sh = ss.insertSheet(TAB);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows_() {
  var sh = sheet_(), n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, HEADERS.length).getValues().map(function(r, i) {
    return { row: i + 2, eventId: String(r[0]), event: String(r[1]), date: fmtDate_(r[2]),
             player: String(r[3]), status: String(r[4]), note: String(r[5]),
             checkin: String(r[6]), updated: r[7] ? new Date(r[7]).toISOString() : '' };
  });
}

function fmtDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v || '');
}

function clean_(s, max) { return String(s == null ? '' : s).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max || 80); }
function key_(s) { return clean_(s).toLowerCase().replace(/\s+/g, ' '); }
// A leading = + - @ would make Sheets treat typed text as a formula.
function safe_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }

function find_(all, eventId, player) {
  var k = key_(player);
  for (var i = 0; i < all.length; i++) {
    if (all[i].eventId === eventId && key_(all[i].player) === k) return all[i];
  }
  return null;
}

function ids_(p) {
  return String(p.ids || '').split(',').map(function(s) { return clean_(s, 120); }).filter(Boolean);
}

// ── Public: counts only, never names ─────────────────────────────────────────

function counts_(p) {
  var want = ids_(p), set = {}, out = {};
  want.forEach(function(id) { set[id] = true; out[id] = { going: 0, maybe: 0, out: 0 }; });
  rows_().forEach(function(r) {
    if (set[r.eventId] && out[r.eventId][r.status] != null) out[r.eventId][r.status]++;
  });
  return { counts: out };
}

// ── Team: one player's own answers, and RSVP ─────────────────────────────────

function mine_(p) {
  needTeam_(p);
  var k = key_(p.player), set = {}, out = {};
  ids_(p).forEach(function(id) { set[id] = true; });
  rows_().forEach(function(r) {
    if (set[r.eventId] && key_(r.player) === k) out[r.eventId] = r.status;
  });
  return { mine: out };
}

function rsvp_(p) {
  needTeam_(p);
  var eventId = clean_(p.eventId, 120), player = clean_(p.player, 60);
  var status = String(p.status || '').toLowerCase();
  if (!eventId || !player) throw new Error('Missing event or name');
  if (STATUSES.indexOf(status) === -1 && status !== 'clear') throw new Error('Bad status');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = sheet_(), hit = find_(rows_(), eventId, player);
    if (status === 'clear') {
      if (hit) sh.deleteRow(hit.row);
    } else {
      var vals = [safe_(eventId), safe_(clean_(p.event, 120)), clean_(p.date, 10), safe_(player),
                  status, safe_(clean_(p.note, 200)), hit ? hit.checkin : '', new Date()];
      if (hit) sh.getRange(hit.row, 1, 1, HEADERS.length).setValues([vals]);
      else sh.appendRow(vals);
    }
  } finally { lock.releaseLock(); }
  return counts_({ ids: eventId });
}

// ── Coach: names, check-in, season report ────────────────────────────────────

function eventList_(p) {
  needCoach_(p);
  var id = clean_(p.eventId, 120);
  return { players: rows_().filter(function(r) { return r.eventId === id; }).map(function(r) {
    return { player: r.player, status: r.status, note: r.note, checkin: r.checkin, updated: r.updated };
  }) };
}

function checkin_(p) {
  needCoach_(p);
  var eventId = clean_(p.eventId, 120), player = clean_(p.player, 60);
  var checkin = String(p.checkin || '').toLowerCase();
  if (!eventId || !player) throw new Error('Missing event or name');
  if (CHECKINS.indexOf(checkin) === -1) throw new Error('Bad check-in value');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = sheet_(), hit = find_(rows_(), eventId, player);
    if (hit) {
      sh.getRange(hit.row, 7, 1, 2).setValues([[checkin, new Date()]]);
    } else {
      // Coach marking someone who never RSVP'd
      sh.appendRow([safe_(eventId), safe_(clean_(p.event, 120)), clean_(p.date, 10), safe_(player),
                    '', '', checkin, new Date()]);
    }
  } finally { lock.releaseLock(); }
  return {};
}

function report_(p) {
  needCoach_(p);
  return { rows: rows_().map(function(r) {
    return { eventId: r.eventId, event: r.event, date: r.date, player: r.player,
             status: r.status, checkin: r.checkin };
  }) };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
