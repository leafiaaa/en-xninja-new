# Book a demo → automatic emails

When someone presses **Book Now** on `/apply/` or `/tw/apply/`:

1. the answers are emailed to you (until the eForm connection is ready), and
2. the applicant receives the thank-you email designed in Figma (`/en/email-thankyou`), in English or Chinese.

| File | What it is |
|---|---|
| `demo-thankyou-en.html` / `demo-thankyou-tw.html` | The email design. Words in curly brackets (`{first_name}`, `{company}`, `{interests}`, `{demo_date}`, `{demo_time}`, `{site_url}`) are filled in per applicant. The `<title>` is the email subject. |
| `apps-script/Code.gs` | The Google Apps Script that sends both emails. |
| `../assets/js/apply.js` | The form. Its `ENDPOINT` line holds the Apps Script web-app URL. |
| Logos | Light mode: `https://www.101form.net/en/wp-content/uploads/2026/11/xninja-logo.png`. Dark mode (white): `https://www.101form.net/en/wp-content/uploads/2026/11/Group-5.png`. |

**Light & dark mode:** both emails follow the reader's mail app setting. The dark colours match the Figma frame `/en/email-thankyou – dark mode` (Apple Mail, iOS Mail, Outlook for Mac/Outlook.com, Samsung Mail). Gmail picks its own dark colours and can't be controlled.

## One-time setup (about 10 minutes)

1. **Pick the sending account.** Sign in to the Google account the emails should come from. For testing, a new Gmail account (e.g. `xninja.demo@gmail.com`) works well.
2. Go to **script.google.com → New project**. Name it "xNinja demo form".
3. Delete the sample code, paste in everything from `apps-script/Code.gs`, and change `NOTIFY_EMAIL` to the address that should receive new requests. Save.
4. **Test it:** choose `testSend` in the function menu at the top and press **Run**. Google asks for permission (send email, connect to external service) – allow it. You get two sample confirmation emails (EN + TW) and two request summaries.
5. **Publish it:** **Deploy → New deployment → ⚙ → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Press **Deploy** and copy the **Web app URL** (ends with `/exec`).
6. Open `assets/js/apply.js`, paste the URL into `var ENDPOINT = "";`, commit and push.
7. Fill in the form on the live site with your own email to check.

## Changing things later

- **Email text or design:** edit `demo-thankyou-en.html` / `-tw.html` and push. The script picks up the new version within 10 minutes; no redeploy needed.
- **Script settings** (`NOTIFY_EMAIL`, sender name, reply-to): edit in script.google.com, then **Deploy → Manage deployments → ✏ → Version: New version → Deploy**. The URL stays the same.
- **Connecting the eForm:** add the eForm API call inside `doPost` in `Code.gs`, before the emails are sent.

## Good to know

- A free Gmail account can send about 100 emails a day through Apps Script; a Google Workspace account more. Plenty for demo requests.
- Emails come from the Google account that owns the script. To send as `@hundredplus.com`, run the script in a Workspace account on that domain (or add the address as a "Send mail as" alias).
- Spam protection: a hidden "honeypot" field blocks simple bots, and the same email address can only send once per minute.
