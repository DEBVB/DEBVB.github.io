/* =============================================================================
   DEBVB Google Sheets automation  ·  /js/sheets.js
   =============================================================================

   SETUP (one time):
   1. Go to sheets.google.com and create a new spreadsheet.
   2. Add three tabs named exactly:  Schedule  |  Roster  |  News
   3. Click Share → change to "Anyone with the link" → Viewer → Done.
   4. Copy the Sheet ID from the URL:
        https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   5. Paste the Sheet ID below, replacing YOUR_GOOGLE_SHEET_ID_HERE.
   6. Save this file and push to GitHub.

   COLUMN HEADERS (copy exactly, including capitalisation):

   ── Schedule tab ────────────────────────────────────────────────────────────
   Date | Opponent | Location | Address | Time | Type | Result | Score

     Date      – YYYY-MM-DD, e.g. 2026-04-07
     Opponent  – name only, e.g. Avon Grove  (no "vs." or "@" prefix)
     Location  – Home  or  Away
     Address   – Google Maps destination, e.g. 10 Waltman Way, West Grove, PA
     Time      – e.g. 5:00 PM
     Type      – Scrim  |  Regular  |  Playoff  (blank = Regular)
     Result    – W  |  L  (leave blank for upcoming games)
     Score     – DE sets–Opp sets, e.g. 3-0  or  3-1  (blank until played)

   ── Roster tab ──────────────────────────────────────────────────────────────
   Team | Jersey | Name | Role | Height | Year | GP | SP | Kills | Errors |
   Attempts | Aces | SvcErr | SvcAtt | SrvRtg | SRRtg | SRAtt | Assists |
   SetAtt | SetPct | Blocks | Digs

     Team   – Varsity  or  JV
     Jersey – number only (leave blank → shows —)
     Height – e.g. 6'2"
     Year   – Fr | So | Jr | Sr
     GP     – games played (0 or blank = no stats card)
     All stat columns accept whole numbers or decimals; blank = 0 / null.

   ── News tab ────────────────────────────────────────────────────────────────
   Date | Title | Type | Opponent | SetsDE | SetsOpp | Kills | Assists |
   Aces | Blocks | Digs | HitEff | Body | ShowOnHome

     Type        – win | loss | info | new
     SetsDE      – DE sets won, e.g. 3
     SetsOpp     – Opponent sets won, e.g. 1
     HitEff      – e.g. +.312 or -.009
     Body        – plain-text body / caption (newlines become <br>)
     ShowOnHome  – yes  (leave blank to hide from homepage)

   Most recent row (by Date) is shown expanded on news.html; older posts
   are in collapsible accordions. Only ShowOnHome=yes rows appear on index.html.
   =========================================================================== */

var SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

// ── Internal CSV helpers ──────────────────────────────────────────────────────

function _sheetsURL(tab) {
  return 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
    '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(tab);
}

function _parseCSV(text) {
  var rows = [], row = [], f = '', q = false;
  for (var i = 0, n = text.length; i < n; i++) {
    var c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else {
      if      (c === '"')  { q = true; }
      else if (c === ',')  { row.push(f.trim()); f = ''; }
      else if (c === '\n') { row.push(f.trim()); rows.push(row); row = []; f = ''; }
      else if (c !== '\r') { f += c; }
    }
  }
  if (f !== '' || row.length) { row.push(f.trim()); rows.push(row); }
  return rows;
}

function _csvToObjects(rows) {
  if (!rows.length) return [];
  var hdrs = rows[0].map(function(h) { return h.replace(/^\uFEFF/, '').trim(); });
  return rows.slice(1).filter(function(r) {
    return r.some(function(c) { return c !== ''; });
  }).map(function(row) {
    var obj = {};
    hdrs.forEach(function(h, i) { obj[h] = (row[i] || '').trim(); });
    return obj;
  });
}

// ── Public fetch API ──────────────────────────────────────────────────────────

/**
 * Fetch a named tab from the Google Sheet and return parsed row objects.
 * callback(err, rows[])  —  rows is an array of {ColumnHeader: value} objects.
 */
function fetchSheet(tab, callback) {
  if (!SHEET_ID || SHEET_ID === 'YOUR_GOOGLE_SHEET_ID_HERE') {
    callback(new Error('SHEET_ID not configured in /js/sheets.js'), null);
    return;
  }
  var xhr = new XMLHttpRequest();
  xhr.open('GET', _sheetsURL(tab), true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      try { callback(null, _csvToObjects(_parseCSV(xhr.responseText))); }
      catch (e) { callback(e, null); }
    } else {
      callback(new Error('HTTP ' + xhr.status + ' fetching tab "' + tab + '"'), null);
    }
  };
  xhr.onerror = function() { callback(new Error('Network error'), null); };
  xhr.send();
}

// ── Date utilities ────────────────────────────────────────────────────────────

var _MONS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var _MONL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function parseISODate(iso) {
  var p = (iso || '').split('-');
  return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null;
}

function fmtDateShort(iso) {   // "2026-03-10" → "Mar 10, 2026"
  var p = (iso || '').split('-');
  return p.length === 3 ? _MONS[+p[1] - 1] + ' ' + +p[2] + ', ' + p[0] : iso || '';
}

function fmtDateLong(iso) {    // "2026-03-10" → "March 10, 2026"
  var p = (iso || '').split('-');
  return p.length === 3 ? _MONL[+p[1] - 1] + ' ' + +p[2] + ', ' + p[0] : iso || '';
}

function fmtDateLabel(iso) {   // "2026-03-10" → "MAR 10"
  var p = (iso || '').split('-');
  return p.length === 3 ? _MONS[+p[1] - 1].toUpperCase() + ' ' + +p[2] : iso || '';
}

// ── Schedule helpers ──────────────────────────────────────────────────────────

function schedRecord(rows) {
  var w = 0, l = 0;
  rows.forEach(function(r) {
    if ((r.Type || '').toLowerCase() === 'scrim') return;
    var res = (r.Result || '').toUpperCase();
    if (res === 'W') w++;
    else if (res === 'L') l++;
  });
  return { w: w, l: l };
}

function schedNextGame(rows) {
  var today = new Date(); today.setHours(0, 0, 0, 0);
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r.Result) {
      var d = parseISODate(r.Date);
      if (d && d >= today) return r;
    }
  }
  return null;
}

function schedLastResult(rows) {
  var last = null;
  rows.forEach(function(r) {
    var res = (r.Result || '').toUpperCase();
    if (res === 'W' || res === 'L') last = r;
  });
  return last;
}

var _dirSVG = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
  '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>' +
  '<circle cx="12" cy="9" r="2.5"/></svg>';

function resultBadge(row) {
  var type = (row.Type || '').toLowerCase();
  var res  = (row.Result || '').toUpperCase();
  var sc   = (row.Score || '').replace('-', '&ndash;');
  if (type === 'scrim') return '<span class="badge badge-scrim">Scrim</span>';
  if (res === 'W') return '<span class="badge badge-win">W ' + sc + '</span>';
  if (res === 'L') return '<span class="badge badge-loss">L ' + sc + '</span>';
  return '<span class="badge-upcoming">Upcoming</span>';
}

function renderScheduleRow(row) {
  var isHome  = (row.Location || '').toLowerCase() === 'home';
  var oppText = isHome ? 'vs. ' + row.Opponent : '@ ' + row.Opponent;
  var oppCls  = 'td-opponent' + (isHome ? ' home-game' : '');
  var addr    = row.Address || '';
  var mapsURL = addr
    ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(addr)
    : '#';
  var dirCell = addr
    ? '<a class="dir-btn" href="' + mapsURL + '" target="_blank" rel="noopener noreferrer">' + _dirSVG + 'Directions</a>'
    : '&mdash;';
  return '<tr class="' + (isHome ? 'row-home' : 'row-away') + '">' +
    '<td class="td-date">'        + fmtDateShort(row.Date) + '</td>' +
    '<td class="' + oppCls + '">' + oppText + '</td>' +
    '<td class="td-location">'    + dirCell + '</td>' +
    '<td class="td-time">'        + (row.Time || '&mdash;') + '</td>' +
    '<td class="td-result">'      + resultBadge(row) + '</td>' +
    '</tr>';
}

// ── Roster helper ─────────────────────────────────────────────────────────────

function csvRowToPlayer(r) {
  var gp = parseInt(r.GP, 10) || 0;
  var stats = null;
  if (gp > 0) {
    stats = {
      gp:      gp,
      sp:      parseInt(r.SP,       10) || 0,
      kills:   parseInt(r.Kills,    10) || 0,
      errors:  parseInt(r.Errors,   10) || 0,
      attempts:parseInt(r.Attempts, 10) || 0,
      aces:    parseInt(r.Aces,     10) || 0,
      svcErr:  parseInt(r.SvcErr,   10) || 0,
      svcAtt:  parseInt(r.SvcAtt,   10) || 0,
      sRtg:    r.SrvRtg ? parseFloat(r.SrvRtg) : null,
      srRtg:   r.SRRtg  ? parseFloat(r.SRRtg)  : null,
      srAtt:   parseInt(r.SRAtt,    10) || 0,
      assists: parseInt(r.Assists,  10) || 0,
      setAtt:  parseInt(r.SetAtt,   10) || 0,
      setPct:  r.SetPct ? parseFloat(r.SetPct) : null,
      blocks:  parseInt(r.Blocks,   10) || 0,
      digs:    parseInt(r.Digs,     10) || 0
    };
  }
  return {
    jersey: r.Jersey || '—',
    name:   r.Name   || '',
    role:   r.Role   || '',
    height: r.Height || '',
    year:   r.Year   || '',
    stats:  stats
  };
}

// ── News helpers ──────────────────────────────────────────────────────────────

function _newsTag(type) {
  var t = (type || 'info').toLowerCase();
  var cls   = { win:'tag-win', loss:'tag-loss', info:'tag-info', new:'tag-new' };
  var label = { win:'Match Result', loss:'Match Result', info:'Info', new:'New' };
  return '<span class="tag ' + (cls[t] || 'tag-info') + '">' + (label[t] || 'Info') + '</span>';
}

function _newsStats(row) {
  var fields = [
    { val: row.Kills,   key: 'Kills'   },
    { val: row.Assists, key: 'Assists' },
    { val: row.Aces,    key: 'Aces'    },
    { val: row.Blocks,  key: 'Blocks'  },
    { val: row.Digs,    key: 'Digs'    }
  ];
  if (!fields.some(function(s) { return s.val && s.val !== ''; })) return '';
  var html = '<div class="stat-strip">' +
    fields.map(function(s) {
      return '<div class="stat-item"><div class="stat-num">' + (s.val || '&mdash;') +
        '</div><div class="stat-label">' + s.key + '</div></div>';
    }).join('') + '</div>';
  if (row.HitEff) {
    html += '<div class="stat-pills" style="margin:8px 0"><span class="pill">Hit Eff. <b>' + row.HitEff + '</b></span></div>';
  }
  return html;
}

/** Render as expanded top post */
function renderNewsExpanded(row) {
  var type = (row.Type || 'info').toLowerCase();
  var meta = [fmtDateLong(row.Date)];
  if (row.Opponent) meta.push(row.Opponent);
  if (row.SetsDE && row.SetsOpp) meta.push((type === 'win' ? 'W ' : 'L ') + row.SetsDE + '&ndash;' + row.SetsOpp);
  var body = (row.Body || '').replace(/\n/g, '<br>');
  return '<div class="post">' +
    '<div class="post-top">' + _newsTag(type) + '<div class="post-title">' + (row.Title || '') + '</div></div>' +
    '<div class="post-date">' + meta.join(' &middot; ') + '</div>' +
    '<div class="post-body">' + _newsStats(row) + (body ? '<p>' + body + '</p>' : '') + '</div>' +
    '</div>';
}

/** Render as collapsed accordion */
function renderNewsAccordion(row) {
  var type = (row.Type || 'info').toLowerCase();
  var metaShort = fmtDateShort(row.Date) +
    (row.SetsDE && row.SetsOpp ? ' &middot; ' + row.SetsDE + '&ndash;' + row.SetsOpp : '');
  var body = (row.Body || '').replace(/\n/g, '<br>');
  var chevron = '<svg class="acc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';
  return '<div class="post-accordion">' +
    '<button class="acc-trigger" aria-expanded="false">' +
    '<div class="acc-tags">' + _newsTag(type) + '</div>' +
    '<div class="acc-title">' + (row.Title || '') + '</div>' +
    '<div class="acc-meta">' + metaShort + '</div>' +
    chevron + '</button>' +
    '<div class="acc-body">' +
    '<div class="acc-recap-meta">' + fmtDateLong(row.Date) + (row.Opponent ? ' &middot; ' + row.Opponent : '') + '</div>' +
    _newsStats(row) +
    (body ? '<div class="acc-body-text"><p>' + body + '</p></div>' : '') +
    '</div></div>';
}

/** Render a compact announcement card for the homepage */
function renderHomeAnnouncement(row) {
  var type = (row.Type || 'info').toLowerCase();
  var sc = (row.SetsDE && row.SetsOpp)
    ? (type === 'win' ? 'W ' : 'L ') + row.SetsDE + '&ndash;' + row.SetsOpp : '';
  var tagCls   = type === 'win' ? 'tag-win' : type === 'loss' ? 'tag-loss' : type === 'new' ? 'tag-new' : 'tag-info';
  var tagLabel = sc || (type === 'new' ? 'New' : 'Info');
  var body = (row.Body || '').replace(/\n/g, '<br>');
  return '<div class="post' + (sc ? ' post-result' : '') + '">' +
    '<div class="post-top"><span class="tag ' + tagCls + '">' + tagLabel + '</span>' +
    '<div class="post-title">' + (row.Title || '') + '</div></div>' +
    '<div class="post-date">' + fmtDateLong(row.Date) + (row.Opponent ? ' &middot; ' + row.Opponent : '') + '</div>' +
    '<div class="post-body">' + (body || '&nbsp;') + '</div>' +
    '</div>';
}
