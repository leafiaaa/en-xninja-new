/**
 * xNinja "Book a demo" form handler – Google Apps Script web app.
 *
 * When someone presses "Book Now" on /apply/ or /tw/apply/, the website sends the answers here. This script:
 *   1. emails the answers to you (NOTIFY_EMAIL)            – until the eForm connection is ready
 *   2. emails the applicant the designed thank-you email   – English or Chinese, from emails/demo-thankyou-*.html
 *
 * The email design is read from the website (GitHub Pages), so editing emails/demo-thankyou-en.html or -tw.html
 * in the repo updates the email automatically (cached for 10 minutes).
 *
 * Setup: see emails/README.md
 */

const CONFIG = {
  NOTIFY_EMAIL: 'you@example.com',          // ← where new demo requests are sent (your email)
  SENDER_NAME: 'xNinja AI Workhub',         // name shown as the sender
  REPLY_TO: 'service@hundredplus.com',      // where applicants' replies go
  TEMPLATE_URL: 'https://leafiaaa.github.io/en-xninja-new/emails/demo-thankyou-{lang}.html',
  SITE_URL: {
    en: 'https://leafiaaa.github.io/en-xninja-new/',
    tw: 'https://leafiaaa.github.io/en-xninja-new/tw/'
  },
  TBC: { en: 'To be confirmed', tw: '待確認' },
  // One logo (with its own background) for light AND dark mode. It is attached to the email itself (inline),
  // so it shows even when the mail app blocks outside images. To change the logo, just change this URL.
  LOGO_URL: 'https://www.101form.net/en/wp-content/uploads/2026/11/xNinjaAiWorkhub_WithBG.png',
  // logo links in the email design that get replaced by the logo above
  LOGO_SLOTS: [
    'https://www.101form.net/en/wp-content/uploads/2026/11/xNinjaAiWorkhub_WithBG.png',
    'https://leafiaaa.github.io/en-xninja-new/assets/img/email/xninja-logo@2x.png',
    'https://leafiaaa.github.io/en-xninja-new/assets/img/email/xninja-logo-white@2x.png'
  ]
};

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.website) return reply_({ ok: true });                        // honeypot filled in → a bot, ignore quietly

    const email = String(d.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !d['first-name']) {
      return reply_({ ok: false, error: 'invalid' });
    }

    // simple flood protection: one request per email address per minute
    const cache = CacheService.getScriptCache();
    const key = 'sent:' + email.toLowerCase();
    if (cache.get(key)) return reply_({ ok: true, duplicate: true });
    cache.put(key, '1', 60);

    const lang = d.lang === 'tw' ? 'tw' : 'en';
    const tbc = CONFIG.TBC[lang];
    const values = {
      first_name: d['first-name'], last_name: d['last-name'], company: d.company,
      interests: list_(d.interests, lang) || tbc,
      demo_date: d['demo-date'] || tbc, demo_time: d['demo-time'] || tbc,
      site_url: CONFIG.SITE_URL[lang]
    };

    // 1) the applicant's thank-you email
    const tpl = template_(lang);
    const subject = (tpl.match(/<title>([\s\S]*?)<\/title>/) || [, 'xNinja AI Workhub'])[1];
    const body = inlineImages_(fill_(tpl, values, true));
    MailApp.sendEmail({
      to: email,
      subject: unescape_(fill_(subject, values, false)),
      htmlBody: body.html,
      inlineImages: body.images,
      name: CONFIG.SENDER_NAME,
      replyTo: CONFIG.REPLY_TO
    });

    // 2) the answers, to you
    MailApp.sendEmail({
      to: CONFIG.NOTIFY_EMAIL,
      subject: 'New demo request – ' + (d.company || '') + ' (' + d['first-name'] + ' ' + (d['last-name'] || '') + ')',
      htmlBody: summary_(d),
      name: 'xNinja website',
      replyTo: email
    });

    return reply_({ ok: true });
  } catch (err) {
    console.error(err);
    return reply_({ ok: false, error: 'server' });
  }
}

// Visiting the web app URL in a browser shows this – handy to check the deployment works.
function doGet() {
  return ContentService.createTextOutput('xNinja demo form endpoint is running.');
}

// Run this once from the editor (select "testSend" → Run) to send yourself a sample of both emails.
function testSend() {
  ['en', 'tw'].forEach(function (lang) {
    doPost({ postData: { contents: JSON.stringify({
      lang: lang, email: CONFIG.NOTIFY_EMAIL, 'first-name': lang === 'tw' ? '小明' : 'Test', 'last-name': lang === 'tw' ? '王' : 'User',
      company: 'Hundred Plus', 'job-title': 'Designer', 'company-size': '51–200',
      interests: ['xNinja.Business Process Management'], 'demo-date': '2026-12-01', 'demo-time': 'Morning (10:00–12:00)'
    }) } });
    CacheService.getScriptCache().remove('sent:' + CONFIG.NOTIFY_EMAIL.toLowerCase());
  });
}

/* ---------- helpers ---------- */

// Attach the logo to the email ("cid:logo") and use it in every logo spot of the design
function inlineImages_(html) {
  const used = CONFIG.LOGO_SLOTS.filter(function (url) { return html.indexOf(url) >= 0; });
  if (!used.length) return { html: html, images: {} };
  try {
    const blob = UrlFetchApp.fetch(CONFIG.LOGO_URL).getBlob().setName('xninja-logo.png');
    used.forEach(function (url) { html = html.split(url).join('cid:logo'); });
    return { html: html, images: { logo: blob } };
  } catch (err) {
    return { html: html, images: {} };   // download failed: keep the normal links
  }
}

function template_(lang) {
  const cache = CacheService.getScriptCache();
  const key = 'tpl:' + lang;
  const hit = cache.get(key);
  if (hit) return hit;
  const html = UrlFetchApp.fetch(CONFIG.TEMPLATE_URL.replace('{lang}', lang)).getContentText('UTF-8');
  cache.put(key, html, 600);
  return html;
}

function fill_(tpl, values, escape) {
  return tpl.replace(/\{(\w+)\}/g, function (m, k) {
    if (!(k in values)) return m;
    const v = String(values[k] == null ? '' : values[k]);
    return escape ? esc_(v) : v;
  });
}

function list_(v, lang) {
  if (!v) return '';
  return (Array.isArray(v) ? v : [v]).join(lang === 'tw' ? '、' : ', ');
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function unescape_(s) {
  return String(s).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function summary_(d) {
  const labels = [
    ['first-name', 'First name'], ['last-name', 'Last name'], ['email', 'Work email'], ['mobile', 'Mobile'],
    ['company', 'Company'], ['job-title', 'Job title'], ['company-size', 'Company size'],
    ['interests', 'Interested in'], ['challenges', 'Challenges'],
    ['demo-date', 'Preferred date'], ['demo-time', 'Preferred time'], ['message', 'Message'], ['page', 'Form page'], ['lang', 'Email language']
  ];
  const rows = labels.map(function (l) {
    const v = Array.isArray(d[l[0]]) ? d[l[0]].join(', ') : (d[l[0]] || '—');
    return '<tr><td style="padding:6px 16px 6px 0;color:#6E7781;vertical-align:top;white-space:nowrap">' + l[1] +
           '</td><td style="padding:6px 0;color:#1F2328;font-weight:600">' + esc_(v).replace(/\n/g, '<br>') + '</td></tr>';
  }).join('');
  return '<div style="font-family:Arial,sans-serif;font-size:14px"><p>New demo request from the website:</p>' +
         '<table cellpadding="0" cellspacing="0">' + rows + '</table>' +
         '<p style="color:#6E7781;font-size:12px">Reply to this email to answer the applicant directly.</p></div>';
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
