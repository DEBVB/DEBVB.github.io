# RSVP setup (replaces TeamSnap availability)

Players tap **Going / Maybe / Can't go** on events on
[events.html](https://debvb.github.io/events.html). Coaches open
[attendance.html](https://debvb.github.io/attendance.html) to see who's coming
to each event.

**Only your players can RSVP.** Each player has a personal code. The buttons
only appear on a phone that has signed in with one. Anyone else, like someone
who finds the site through Instagram, sees the normal events page with no
buttons and no counts. A personal code also stops one player answering for
another.

It's free. Answers are saved by a small Google Apps Script into a **private**
Google Sheet that only you can open.

> **Why a second sheet?** The website sheet is shared "Anyone with the link",
> so anything in it can be read by anyone. Player codes and answers shouldn't
> be, so they go in a separate sheet you never share.

## One-time setup (about 10 minutes)

1. **Make the private sheet.** Go to [sheets.new](https://sheets.new) and name it
   `DEBVB RSVPs`. Do **not** share it.
2. **Add the script.** In that sheet: **Extensions → Apps Script**. Delete
   what's in `Code.gs`, paste the whole of
   [`apps-script/attendance.gs`](apps-script/attendance.gs), and click **Save**.
3. **Set the coach code.** In the Apps Script editor: **Project Settings**
   (gear icon) → **Script properties** → **Add script property**:
   `COACH_CODE` = a long private password for coaches.
4. **Deploy it.** **Deploy → New deployment** → gear → **Web app**:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**

   (Google's "Anyone" only means the website is allowed to talk to the script.
   Every request still needs a valid player or coach code.)

   Click **Deploy** and approve the permissions prompt. Google warns because
   it's your own unpublished script: choose **Advanced → Go to … (unsafe) →
   Allow**. Copy the **Web app URL** (it ends in `/exec`).
5. **Connect the website.** In [`js/attendance.js`](js/attendance.js), paste
   the URL between the quotes:
   ```js
   var ATTENDANCE_URL = 'https://script.google.com/macros/s/AKfy…/exec';
   ```
   Commit and push.
6. **Add your players.** Reload the private sheet. A **Players** tab and an
   **RSVP** menu appear. Fill in `Name` (and `Team`, e.g. Varsity / JV, if
   you want a filter), leave `Code` blank, then click **RSVP → Fill in missing
   player codes**.
7. **Send each player their code.** Easiest is a personal link that signs
   them in with one tap:
   ```
   https://debvb.github.io/events.html?rsvp=THEIRCODE
   ```
   They can also tap **"sign in to RSVP"** on the Events page and type the
   code. Their phone remembers it after that. Parents can use the same link to
   answer for their player.

## Day to day

| Task | How |
|---|---|
| See who's coming | attendance.html → pick the event (grouped into Going / Maybe / Can't go / No reply yet) |
| New player | Add a row to **Players**, then **RSVP → Fill in missing player codes** |
| Player leaves, or a code got shared around | Delete their row, or clear their code and generate a new one. The old code stops working right away. |
| Turn RSVP off for one event (e.g. a fundraiser) | Type `no` in that row's `RSVP` column on the website sheet's `Events` tab |
| Raw data / export | The **RSVPs** tab of the private sheet |
| Change the coach code | Edit the `COACH_CODE` script property (no redeploy needed) |

**Don't rename an event after people have answered.** Each event is identified
by its date + title, so changing the title (or date) starts a fresh, empty
RSVP list for it. Changing the time, location or notes is fine.

## If you change the script later

Edit the code, then **Deploy → Manage deployments → ✏️ → Version: New
version → Deploy**. That keeps the same URL, so the website doesn't need to
change. (A *New deployment* would make a new URL.)
