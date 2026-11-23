/* =============================================================================
   DEBVB attendance / RSVP  ·  /js/attendance.js
   =============================================================================
   Talks to the Google Apps Script web app in /apps-script/attendance.gs.
   Setup steps: ATTENDANCE-SETUP.md. Until ATTENDANCE_URL is filled in, the
   RSVP buttons simply don't appear and nothing else on the site changes.
   =========================================================================== */

var ATTENDANCE_URL = '';   // e.g. https://script.google.com/macros/s/AKfy…/exec

var Attendance = (function() {
  var LS_CODE = 'debvb:att:code', LS_PLAYER = 'debvb:att:player', LS_COACH = 'debvb:att:coach';

  function enabled() { return /^https:\/\/script\.google(usercontent)?\.com\//.test(ATTENDANCE_URL); }

  function get(k)    { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function set(k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  /** Stable ID for an event: date + title, e.g. 2027-01-12-open-gym. */
  function eventId(e) {
    return isoDate(e.d) + '-' + String(e.title || 'event').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  }

  /** Reads go as GET, writes as a text/plain POST (no CORS preflight for Apps Script). */
  function call(action, params, cb) {
    if (!enabled()) { cb(new Error('Attendance is not set up yet')); return; }
    params = params || {};
    params.action = action;
    var write = action === 'rsvp' || action === 'checkin';
    var opts, url = ATTENDANCE_URL;
    if (write) {
      opts = { method: 'POST', body: JSON.stringify(params), headers: { 'Content-Type': 'text/plain;charset=utf-8' } };
    } else {
      url += '?' + Object.keys(params).map(function(k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }).join('&');
      opts = { method: 'GET' };
    }
    fetch(url, opts)
      .then(function(r) { return r.json(); })
      .then(function(j) { j && j.ok ? cb(null, j) : cb(new Error((j && j.error) || 'Something went wrong')); })
      .catch(function() { cb(new Error('Could not reach the attendance service. Check your connection and try again.')); });
  }

  // ── Events-page RSVP widget ──────────────────────────────────────────────
  var counts = {}, mine = {}, asked = {}, byId = {}, roster = [], dialog = null;

  var LABELS = { going: 'Going', maybe: 'Maybe', out: "Can't go" };

  function countText(c) {
    if (!c) return '';
    var bits = [];
    if (c.going) bits.push(c.going + ' going');
    if (c.maybe) bits.push(c.maybe + ' maybe');
    if (c.out)   bits.push(c.out + " can't");
    return bits.join(' · ');
  }

  /** HTML for one card's RSVP row (empty string when RSVPs are off). */
  function rsvpHTML(e) {
    if (!enabled() || e.rsvp === false || /cancel/i.test(e.title)) return '';
    var id = eventId(e);
    byId[id] = e;
    var cur = mine[id] || '';
    var btns = ['going', 'maybe', 'out'].map(function(s) {
      var on = cur === s;
      return '<button type="button" class="ev-rsvp-btn ev-rsvp-' + s + (on ? ' is-on' : '') +
        '" data-rsvp="' + s + '" aria-pressed="' + on + '">' + LABELS[s] + '</button>';
    }).join('');
    return '<div class="ev-rsvp" data-event="' + esc(id) + '">' +
      '<span class="ev-add-label">Attendance</span>' +
      '<span class="ev-rsvp-btns" role="group" aria-label="Will you be there?">' + btns + '</span>' +
      '<span class="ev-rsvp-count" aria-live="polite">' + esc(countText(counts[id])) + '</span>' +
      '</div>';
  }

  function paint(id) {
    var nodes = document.querySelectorAll('.ev-rsvp[data-event="' + id + '"]');
    for (var i = 0; i < nodes.length; i++) {
      var box = nodes[i], cur = mine[id] || '';
      var btns = box.querySelectorAll('.ev-rsvp-btn');
      for (var j = 0; j < btns.length; j++) {
        var on = btns[j].getAttribute('data-rsvp') === cur;
        btns[j].classList.toggle('is-on', on);
        btns[j].setAttribute('aria-pressed', on);
      }
      box.querySelector('.ev-rsvp-count').textContent = countText(counts[id]);
    }
  }

  /** After the cards are drawn: load counts (+ this player's answers) for any we haven't asked about. */
  function hydrate() {
    if (!enabled()) return;
    var ids = [], nodes = document.querySelectorAll('.ev-rsvp[data-event]');
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].getAttribute('data-event');
      if (!asked[id]) { asked[id] = true; ids.push(id); }
    }
    if (!ids.length) return;
    // Keep URLs short: ask in batches
    for (var b = 0; b < ids.length; b += 25) (function(batch) {
      call('counts', { ids: batch.join(',') }, function(err, j) {
        if (err) return;
        for (var k in j.counts) { counts[k] = j.counts[k]; paint(k); }
      });
      var player = get(LS_PLAYER), code = get(LS_CODE);
      if (player && code) call('mine', { ids: batch.join(','), player: player, code: code }, function(err, j) {
        if (err) return;
        for (var k in j.mine) { mine[k] = j.mine[k]; paint(k); }
      });
    })(ids.slice(b, b + 25));
  }

  function refreshMine() {
    mine = {};
    var ids = Object.keys(asked), player = get(LS_PLAYER), code = get(LS_CODE);
    ids.forEach(paint);
    if (!player || !code || !ids.length) return;
    for (var b = 0; b < ids.length; b += 25) {
      call('mine', { ids: ids.slice(b, b + 25).join(','), player: player, code: code }, function(err, j) {
        if (err) return;
        for (var k in j.mine) { mine[k] = j.mine[k]; paint(k); }
      });
    }
  }

  function send(id, status, box) {
    var e = byId[id];
    if (!e) return;
    var prev = mine[id] || '';
    var next = prev === status ? 'clear' : status;   // tap the lit button again to undo
    mine[id] = next === 'clear' ? '' : next;
    paint(id);
    if (box) box.classList.add('is-busy');
    call('rsvp', {
      code: get(LS_CODE), player: get(LS_PLAYER), status: next,
      eventId: id, event: (e.key === 'match' ? 'Match ' : '') + e.title, date: isoDate(e.d)
    }, function(err, j) {
      if (box) box.classList.remove('is-busy');
      if (err) {
        mine[id] = prev; paint(id);
        if (/team code/i.test(err.message)) { set(LS_CODE, ''); openDialog(id, status, 'That team code didn’t work — check with your coach.'); }
        else alert(err.message);
        return;
      }
      if (j.counts && j.counts[id]) counts[id] = j.counts[id];
      paint(id);
    });
  }

  // ── "Who's answering?" dialog ────────────────────────────────────────────
  function buildDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'att-dialog';
    dialog.innerHTML =
      '<form method="dialog" class="att-form">' +
      '<h2 class="att-h">Who’s answering?</h2>' +
      '<p class="att-p">Pick the player’s name. This phone or computer will remember it, so next time it’s one tap.</p>' +
      '<label class="att-label" for="att-player">Player name</label>' +
      '<input class="att-input" id="att-player" list="att-roster" autocomplete="off" required maxlength="60" placeholder="First and last name">' +
      '<datalist id="att-roster"></datalist>' +
      '<label class="att-label" for="att-code">Team code</label>' +
      '<input class="att-input" id="att-code" autocomplete="off" autocapitalize="off" spellcheck="false" required maxlength="60" placeholder="From the team group chat">' +
      '<p class="att-err" id="att-err" role="alert"></p>' +
      '<div class="att-row"><button type="button" class="ev-btn" value="cancel" id="att-cancel">Cancel</button>' +
      '<button type="submit" class="ev-btn att-primary" id="att-save">Save</button></div>' +
      '</form>';
    document.body.appendChild(dialog);
    dialog.querySelector('#att-cancel').addEventListener('click', function() { dialog.close(); });
    dialog.querySelector('form').addEventListener('submit', function(ev) {
      ev.preventDefault();
      var name = dialog.querySelector('#att-player').value.replace(/\s+/g, ' ').trim();
      var code = dialog.querySelector('#att-code').value.trim();
      var err = dialog.querySelector('#att-err');
      if (!name || !code) { err.textContent = 'Fill in both boxes.'; return; }
      // Match roster spelling when the name is typed slightly differently
      for (var i = 0; i < roster.length; i++) if (roster[i].toLowerCase() === name.toLowerCase()) name = roster[i];
      var btn = dialog.querySelector('#att-save');
      btn.disabled = true; err.textContent = '';
      call('verify', { code: code }, function(e2, j) {
        btn.disabled = false;
        if (e2) { err.textContent = e2.message; return; }
        if (!j.team) { err.textContent = 'That team code didn’t work — check with your coach.'; return; }
        var changed = name !== get(LS_PLAYER);
        set(LS_PLAYER, name); set(LS_CODE, code);
        dialog.close();
        paintWho();
        if (changed) refreshMine();
        if (dialog._then) { var t = dialog._then; dialog._then = null; t(); }
      });
    });
    return dialog;
  }

  function openDialog(id, status, msg) {
    var d = buildDialog();
    d.querySelector('#att-roster').innerHTML = roster.map(function(n) { return '<option value="' + esc(n) + '">'; }).join('');
    d.querySelector('#att-player').value = get(LS_PLAYER);
    d.querySelector('#att-code').value = get(LS_CODE);
    d.querySelector('#att-err').textContent = msg || '';
    d._then = id ? function() { send(id, status, null); } : null;
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    d.querySelector(get(LS_PLAYER) ? '#att-code' : '#att-player').focus();
  }

  /** "Answering as Sam Lee · Change" line above the list. */
  function paintWho() {
    var el = document.getElementById('att-who');
    if (!el) return;
    if (!enabled()) { el.hidden = true; return; }
    var p = get(LS_PLAYER);
    el.hidden = false;
    el.innerHTML = p
      ? 'Answering as <strong>' + esc(p) + '</strong> · <button type="button" class="att-link" id="att-change">Change</button>'
      : 'Players: tap <strong>Going</strong>, <strong>Maybe</strong> or <strong>Can’t go</strong> on any event so the coaches know who to expect.';
    var c = document.getElementById('att-change');
    if (c) c.addEventListener('click', function() { openDialog(null); });
  }

  function initEventsPage() {
    if (!enabled()) return;
    paintWho();
    fetchSheet('Roster', function(err, rows) {
      if (err || !rows) return;
      roster = rows.map(function(r) { return (r.Name || '').trim(); }).filter(Boolean)
        .filter(function(n, i, a) { return a.indexOf(n) === i; }).sort();
    });
    document.addEventListener('click', function(ev) {
      var b = ev.target.closest('.ev-rsvp-btn');
      if (!b) return;
      var box = b.closest('.ev-rsvp'), id = box.getAttribute('data-event'), s = b.getAttribute('data-rsvp');
      if (!get(LS_PLAYER) || !get(LS_CODE)) openDialog(id, s);
      else send(id, s, box);
    });
  }

  return {
    enabled: enabled, eventId: eventId, isoDate: isoDate, call: call,
    rsvpHTML: rsvpHTML, hydrate: hydrate, initEventsPage: initEventsPage,
    coachCode: function(v) { if (arguments.length) set(LS_COACH, v); return get(LS_COACH); },
    LABELS: LABELS
  };
})();
