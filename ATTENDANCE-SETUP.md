# Attendance & RSVP setup (replaces TeamSnap availability)

Players and parents tap **Going / Maybe / Can't go** on any event on
[events.html](https://debvb.github.io/events.html). Coaches open
[attendance.html](https://debvb.github.io/attendance.html) to see who's coming,
check players in at the gym (Present / Late / Absent) and see season totals.

It's free: answers are saved by a small Google Apps Script into a **private**
Google Sheet that only you can open. The public website only ever shows
**counts** ("12 going · 2 maybe"); names are shown only to someone with the
coach code.

> **Why a second sheet?** The website sheet is shared "Anyone with the link",
> so anything in it can be read by anyone. Players' names and attendance
> shouldn't be, so they go in a separate sheet you never share.

## One-time setup (about 10 minutes)

1. **Make the private sheet.** Go to [sheets.new](https://sheets.new) and name it
   `DEBVB Attendance`. Do **not** share it.
2. **Add the script.** In that sheet: **Extensions → Apps Script**. Delete
   what's in `Code.gs`, paste the whole of
   [`apps-script/attendance.gs`](apps-script/attendance.gs), and click **Save**.
3. **Set the two codes.** In the Apps Script editor: **Project Settings** (gear
   icon) → **Script properties** → **Add script property**:
   - `TEAM_CODE` — short and easy, shared with players and parents
     (e.g. `cougars27`). It just keeps strangers from filling in fake answers.
   - `COACH_CODE` — long and private, only for coaches. Anyone with it can see
     every player's answers.
4. **Deploy it.** **Deploy → New deployment** → gear → **Web app**:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**

   Click **Deploy**, approve the permissions prompt (Google warns because it's
   your own unpublished script: **Advanced → Go to … (unsafe)** → **Allow**),
   and copy the **Web app URL** (ends in `/exec`).
5. **Connect the website.** In [`js/attendance.js`](js/attendance.js), paste
   the URL between the quotes:
   ```js
   var ATTENDANCE_URL = 'https://script.google.com/macros/s/AKfy…/exec';
   ```
   Commit and push. The RSVP buttons appear on every upcoming event.
6. **Tell the team.** Post the team code in the group chat with the link to
   the Events page. Each phone asks for the player's name and the code once,
   then remembers them.

## Day to day

| Task | How |
|---|---|
| See who's coming | attendance.html → pick the event |
| Take attendance | Tap **Present / Late / Absent** next to each name (tap again to clear). "Mark everyone Going as present" does it in one tap. |
| Someone not on the roster shows up (open gym, tryouts) | "Add a walk-in" at the bottom of the event |
| Season attendance % | attendance.html → **Season** |
| Export / edit the raw data | Open the private sheet's `Attendance` tab |
| Turn RSVP off for one event (e.g. a fundraiser) | Type `no` in that row's `RSVP` column on the website sheet's `Events` tab |
| Change a code | Edit the script property — no redeploy needed. Changing `TEAM_CODE` makes every phone ask again. |

**Names come from the `Roster` tab** of the website sheet, so the dropdown and
the coach list stay current with the roster you already maintain.

**Don't rename an event after people have answered.** Each event is identified
by its date + title, so changing the title (or date) starts a fresh, empty
RSVP list for it. Changing the time, location or notes is fine.

## If you change the script later

Edit the code, then **Deploy → Manage deployments → ✏️ → Version: New
version → Deploy**. That keeps the same URL, so the website doesn't need to
change. (A *New deployment* would make a new URL.)

## What this doesn't do (yet)

TeamSnap extras that aren't included: automatic reminder emails/texts, team
chat, and payments. Reminders can be added later with an Apps Script
time-driven trigger that emails parents whose players haven't answered —
it would need a `Parent Email` column on the Roster (kept in the private
sheet, not the public one).
