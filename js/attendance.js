/* =============================================================================
   DEBVB RSVP  ·  /js/attendance.js
   =============================================================================
   Talks to the Google Apps Script web app in /apps-script/attendance.gs.
   Setup steps: ATTENDANCE-SETUP.md. Until ATTENDANCE_URL is filled in, nothing
   on the site changes.

   Only players with a personal code (Players tab of the private sheet) see
   the Going / Maybe / Can't go buttons. Everyone else sees the plain page.
   Personal sign-in link for a player:  /events.html?rsvp=THEIRCODE
   =========================================================================== */

var ATTENDANCE_URL = '';   // e.g. https://script.google.com/macros/s/AKfy…/exec

var Attendance = (function() {
  var LS_CODE = 'debvb:rsvp:code', LS_PLAYER = 'debvb:rsvp:player', LS_COACH = 'debvb:rsvp:coach';

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
    if (!enabled()) { cb(new Error('RSVP is not set up yet')); return; }
    params = params || {};
    params.action = action;
    var opts, url = ATTENDANCE_URL;
    if (action === 'rsvp') {
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
      .catch(function() { cb(new Error('Could not reach the RSVP service. Check your connection and try again.')); });
  }

  // ── Events-page RSVP widget ──────────────────────────────────────────────
  var counts = {}, mine = {}, asked = {}, byId = {}, dialog = null, rerender = function() {};

  var LABELS = { going: 'Going', maybe: 'Maybe', out: "Can't go" };

  function signedIn() { return enabled() && !!get(LS_CODE) && !!get(LS_PLAYER); }

  function countText(c) {
    if (!c) return '';
    var bits = [];
    if (c.going) bits.push(c.going + ' going');
    if (c.maybe) bits.push(c.maybe + ' maybe');
    if (c.out)   bits.push(c.out + " can't");
    return bits.join(' · ');
  }

  /** HTML for one card's RSVP row — empty unless a player is signed in on this device. */
  function rsvpHTML(e) {
    if (!signedIn() || e.rsvp === false || /cancel/i.test(e.title)) return '';
    var id = eventId(e);
    byId[id] = e;
    var cur = mine[id] || '';
    var btns = ['going', 'maybe', 'out'].map(function(s) {
      var on = cur === s;
      return '<button type="button" class="ev-rsvp-btn ev-rsvp-' + s + (on ? ' is-on' : '') +
        '" data-rsvp="' + s + '" aria-pressed="' + on + '">' + LABELS[s] + '</button>';
    }).join('');
    return '<div class="ev-rsvp" data-event="' + esc(id) + '">' +
      '<span class="ev-add-label">Will you be there?</span>' +
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

  function signOut(msg) {
    set(LS_CODE, ''); set(LS_PLAYER, '');
    counts = {}; mine = {}; asked = {};
    paintWho(msg); rerender();
  }

  /** After the cards are drawn: load counts + this player's answers for any we haven't asked about. */
  function hydrate() {
    if (!signedIn()) return;
    var ids = [], nodes = document.querySelectorAll('.ev-rsvp[data-event]');
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].getAttribute('data-event');
      if (!asked[id]) { asked[id] = true; ids.push(id); }
    }
    var code = get(LS_CODE);
    for (var b = 0; b < ids.length; b += 25) (function(batch) {   // keep URLs short
      call('counts', { ids: batch, code: code }, function(err, j) {
        if (err) { if (/code/i.test(err.message)) signOut('Your RSVP code no longer works — ask a coach for a new one.'); return; }
        for (var k in j.counts) { counts[k] = j.counts[k]; paint(k); }
      });
      call('mine', { ids: batch, code: code }, function(err, j) {
        if (err) return;
        for (var k in j.mine) { mine[k] = j.mine[k]; paint(k); }
      });
    })(ids.slice(b, b + 25).join(','));
  }

  function send(id, status, box) {
    var e = byId[id];
    if (!e) return;
    var prev = mine[id] || '';
    var next = prev === status ? 'clear' : status;   // tap the lit button again to undo
    mine[id] = next === 'clear' ? '' : next;
    paint(id);
    box.classList.add('is-busy');
    call('rsvp', {
      code: get(LS_CODE), status: next, eventId: id,
      event: (e.key === 'match' ? 'Match ' : '') + e.title, date: isoDate(e.d)
    }, function(err, j) {
      box.classList.remove('is-busy');
      if (err) {
        mine[id] = prev; paint(id);
        if (/code/i.test(err.message)) signOut('Your RSVP code no longer works — ask a coach for a new one.');
        else alert(err.message);
        return;
      }
      if (j.counts && j.counts[id]) counts[id] = j.counts[id];
      paint(id);
    });
  }

  // ── Sign-in ──────────────────────────────────────────────────────────────
  function signIn(code, done) {
    call('verify', { code: code }, function(err, j) {
      if (err) return done(err.message);
      if (!j.player) return done('That code didn’t work. Check with a coach.');
      set(LS_CODE, code); set(LS_PLAYER, j.player);
      counts = {}; mine = {}; asked = {};
      paintWho(); rerender();
      done(null);
    });
  }

  function buildDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'att-dialog';
    dialog.innerHTML =
      '<form method="dialog" class="att-form">' +
      '<h2 class="att-h">Player sign-in</h2>' +
      '<p class="att-p">Enter the personal RSVP code your coach gave you. This phone will remember it.</p>' +
      '<label class="att-label" for="att-code">Your code</label>' +
      '<input class="att-input" id="att-code" autocomplete="off" autocapitalize="characters" spellcheck="false" required maxlength="40">' +
      '<p class="att-err" id="att-err" role="alert"></p>' +
      '<div class="att-row"><button type="button" class="ev-btn" id="att-cancel">Cancel</button>' +
      '<button type="submit" class="ev-btn att-primary" id="att-save">Sign in</button></div>' +
      '</form>';
    document.body.appendChild(dialog);
    dialog.querySelector('#att-cancel').addEventListener('click', function() { dialog.close(); });
    dialog.querySelector('form').addEventListener('submit', function(ev) {
      ev.preventDefault();
      var code = dialog.querySelector('#att-code').value.trim(), btn = dialog.querySelector('#att-save');
      if (!code) return;
      btn.disabled = true; dialog.querySelector('#att-err').textContent = '';
      signIn(code, function(msg) {
        btn.disabled = false;
        if (msg) dialog.querySelector('#att-err').textContent = msg;
        else dialog.close();
      });
    });
    return dialog;
  }

  function openDialog() {
    var d = buildDialog();
    d.querySelector('#att-code').value = '';
    d.querySelector('#att-err').textContent = '';
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    d.querySelector('#att-code').focus();
  }

  /** The line above the list: "Players: sign in to RSVP" or "Signed in as Sam Lee · Sign out". */
  function paintWho(msg) {
    var el = document.getElementById('att-who');
    if (!el) return;
    if (!enabled()) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = signedIn()
      ? 'RSVPing as <strong>' + esc(get(LS_PLAYER)) + '</strong> · <button type="button" class="att-link" data-att="out">Sign out</button>'
      : (msg ? '<span class="att-warn">' + esc(msg) + '</span> ' : '') +
        'Players: <button type="button" class="att-link" data-att="in">sign in to RSVP</button>';
  }

  function initEventsPage(onChange) {
    if (!enabled()) return;
    rerender = onChange || rerender;

    // Personal link: /events.html?rsvp=CODE — sign in, then drop the code from the address bar
    var m = /[?&]rsvp=([^&#]+)/.exec(location.search);
    if (m) {
      var code = decodeURIComponent(m[1]).trim();
      try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
      if (code && code.toLowerCase() !== get(LS_CODE).toLowerCase()) {
        signIn(code, function(msg) { if (msg) paintWho(msg); });
      }
    }
    paintWho();

    document.addEventListener('click', function(ev) {
      var a = ev.target.closest('[data-att]');
      if (a) { a.getAttribute('data-att') === 'in' ? openDialog() : signOut(); return; }
      var b = ev.target.closest('.ev-rsvp-btn');
      if (!b) return;
      var box = b.closest('.ev-rsvp');
      send(box.getAttribute('data-event'), b.getAttribute('data-rsvp'), box);
    });
  }

  return {
    enabled: enabled, eventId: eventId, call: call,
    rsvpHTML: rsvpHTML, hydrate: hydrate, initEventsPage: initEventsPage,
    coachCode: function(v) { if (arguments.length) set(LS_COACH, v); return get(LS_COACH); }
  };
})();
