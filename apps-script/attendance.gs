/* =============================================================================
   DEBVB RSVP backend  ·  Google Apps Script
   =============================================================================

   Paste this whole file into the Apps Script editor of a NEW, PRIVATE Google
   Sheet (not the public website sheet — that one is readable by anyone).
   Full step-by-step setup: ATTENDANCE-SETUP.md in the website repo.

   Script property (Project Settings → Script properties):
     COACH_CODE  – what coaches type to see who's coming. Long and private.

   Tabs in this sheet (created automatically the first time they're needed):

   ── Players ── one row per player; only these people can RSVP
     Name | Team | Code
       Name – as you want it shown, e.g. Sam Lee
       Team – optional, e.g. Varsity or JV (adds a filter on the coach page)
       Code – the player's personal sign-in code. Leave blank and use the
              sheet menu  RSVP → Fill in missing player codes  to generate.
              Delete or change a code to lock that person out.

   ── RSVPs ── written by the website, one row per event + player
     EventID | Event | Date | Player | Status | Note | Updated
       Status – going | maybe | out

   Nothing here is public: every request needs a player code or the coach code.
   =========================================================================== */

var PLAYERS = 'Players', PLAYER_HEADERS = ['Name', 'Team', 'Code'];
var RSVPS = 'RSVPs', RSVP_HEADERS = ['EventID', 'Event', 'Date', 'Player', 'Status', 'Note', 'Updated'];
var STATUSES = ['going', 'maybe', 'out'];

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
      case 'verify': out = verify_(p); break;   // any code → who it belongs to
      case 'mine':   out = mine_(p);   break;   // player code
      case 'rsvp':   out = rsvp_(p);   break;   // player code
      case 'counts': out = counts_(p); break;   // player or coach code
      case 'event':  out = event_(p);  break;   // coach code
      default: throw new Error('Unknown action');
    }
    out.ok = true;
    return json_(out);
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

// ── Sheet menu: generate player codes ────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi().createMenu('RSVP')
    .addItem('Fill in missing player codes', 'fillCodes')
    .addToUi();
  tab_(PLAYERS, PLAYER_HEADERS);
  tab_(RSVPS, RSVP_HEADERS);
}

function fillCodes() {
  var sh = tab_(PLAYERS, PLAYER_HEADERS), n = sh.getLastRow();
  if (n < 2) return;
  var vals = sh.getRange(2, 1, n - 1, 3).getValues(), used = {};
  vals.forEach(function(r) { if (r[2]) used[String(r[2]).toLowerCase()] = true; });
  // No 0/O/1/I/L so codes are easy to read out loud
  var abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  vals.forEach(function(r) {
    if (!String(r[0]).trim() || String(r[2]).trim()) return;
    var c;
    do { c = ''; for (var i = 0; i < 6; i++) c += abc.charAt(Math.floor(Math.random() * abc.length)); }
    while (used[c.toLowerCase()]);
    used[c.toLowerCase()] = true;
    r[2] = c;
  });
  sh.getRange(2, 1, n - 1, 3).setValues(vals);
}

// ── Auth ─────────────────────────────────────────────────────────────────────

function norm_(s) { return String(s == null ? '' : s).trim().toLowerCase(); }

function isCoach_(p) {
  var c = norm_(PropertiesService.getScriptProperties().getProperty('COACH_CODE'));
  return !!c && norm_(p.code) === c;
}

function players_() {
  var sh = tab_(PLAYERS, PLAYER_HEADERS), n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, 3).getValues()
    .map(function(r) { return { name: clean_(r[0], 60), team: clean_(r[1], 30), code: norm_(r[2]) }; })
    .filter(function(r) { return r.name; });
}

function playerFor_(code) {
  var c = norm_(code);
  if (!c) return null;
  var all = players_();
  for (var i = 0; i < all.length; i++) if (all[i].code && all[i].code === c) return all[i];
  return null;
}

function needPlayer_(p) {
  var who = playerFor_(p.code);
  if (!who) throw new Error('That code didn’t work');
  return who;
}

function verify_(p) {
  var who = playerFor_(p.code);
  return { coach: isCoach_(p), player: who ? who.name : '' };
}

// ── Sheet helpers ────────────────────────────────────────────────────────────

function tab_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function rsvps_() {
  var sh = tab_(RSVPS, RSVP_HEADERS), n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, RSVP_HEADERS.length).getValues().map(function(r, i) {
    return { row: i + 2, eventId: String(r[0]), player: String(r[3]), status: String(r[4]), note: String(r[5]) };
  });
}

function clean_(s, max) { return String(s == null ? '' : s).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max || 80); }
// A leading = + - @ would make Sheets treat typed text as a formula.
function safe_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }

function ids_(p) {
  return String(p.ids || '').split(',').map(function(s) { return clean_(s, 120); }).filter(Boolean);
}

// ── Player actions ───────────────────────────────────────────────────────────

function mine_(p) {
  var who = needPlayer_(p), set = {}, out = {};
  ids_(p).forEach(function(id) { set[id] = true; });
  rsvps_().forEach(function(r) {
    if (set[r.eventId] && norm_(r.player) === norm_(who.name)) out[r.eventId] = r.status;
  });
  return { mine: out };
}

function counts_(p) {
  if (!isCoach_(p)) needPlayer_(p);
  var set = {}, out = {};
  ids_(p).forEach(function(id) { set[id] = true; out[id] = { going: 0, maybe: 0, out: 0 }; });
  rsvps_().forEach(function(r) {
    if (set[r.eventId] && out[r.eventId][r.status] != null) out[r.eventId][r.status]++;
  });
  return { counts: out };
}

function rsvp_(p) {
  var who = needPlayer_(p);
  var eventId = clean_(p.eventId, 120), status = norm_(p.status);
  if (!eventId) throw new Error('Missing event');
  if (STATUSES.indexOf(status) === -1 && status !== 'clear') throw new Error('Bad status');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = tab_(RSVPS, RSVP_HEADERS), hit = null, all = rsvps_();
    for (var i = 0; i < all.length; i++) {
      if (all[i].eventId === eventId && norm_(all[i].player) === norm_(who.name)) { hit = all[i]; break; }
    }
    if (status === 'clear') {
      if (hit) sh.deleteRow(hit.row);
    } else {
      var vals = [safe_(eventId), safe_(clean_(p.event, 120)), clean_(p.date, 10), safe_(who.name),
                  status, safe_(clean_(p.note, 200)), new Date()];
      if (hit) sh.getRange(hit.row, 1, 1, RSVP_HEADERS.length).setValues([vals]);
      else sh.appendRow(vals);
    }
  } finally { lock.releaseLock(); }
  return counts_({ code: p.code, ids: eventId });
}

// ── Coach: everyone's answer for one event ───────────────────────────────────

function event_(p) {
  if (!isCoach_(p)) throw new Error('Wrong coach code');
  var id = clean_(p.eventId, 120), ans = {};
  rsvps_().forEach(function(r) { if (r.eventId === id) ans[norm_(r.player)] = r; });
  var list = players_().map(function(pl) {
    var a = ans[norm_(pl.name)] || {};
    delete ans[norm_(pl.name)];
    return { player: pl.name, team: pl.team, status: a.status || '', note: a.note || '' };
  });
  // Answers from players who have since been removed from the Players tab
  for (var k in ans) list.push({ player: ans[k].player, team: '', status: ans[k].status, note: ans[k].note });
  return { players: list };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
