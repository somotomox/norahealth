// Builds the seven redesigned Nora Health patient emails from shared parts.
// Usage: node build.js
//
// Writes:
//   templates/<key>.html  the real emails, with {{tokens}} and hosted image URLs
//   previews/<key>.html   the same emails filled with sample data, using ./images
//   index.html            one self-contained page: current email next to the new one,
//                         with a desktop / phone switch (the layout of the approved artifact)
const fs = require('fs');
const path = require('path');

const IMAGE_BASE = 'https://www.norahealth.co.uk/images/email/';
const WHATSAPP = 'https://wa.me/447440126154';
const WEBSITE = 'https://www.norahealth.co.uk/';
const EMAIL = 'pharmacy.fap80@nhs.net';

// Colours measured from the approved design.
const C = {
  page: '#F4E7E1', card: '#FFFFFF', line: '#EEE0CF', gold: '#CE8936',
  ink: '#0D060C', body: '#3A3D42', muted: '#6B6660', soft: '#FAF9F8',
  plum: '#3F1836', footText: '#E9DCE5', footSep: '#AB9A93', footCopy: '#B69AAE',
};
const FONT = "'DM Sans', Arial, Helvetica, sans-serif";
const MSO = 'mso-line-height-rule:exactly;';

// ---------- building blocks ----------

const text = (size, lh, color, extra = '') =>
  `font-family:${FONT}; font-size:${size}px; line-height:${lh}px; color:${color}; ${extra}${MSO}`;

const p = (html, mt = 16) =>
  `<p style="margin:${mt}px 0 0; ${text(15, 25, C.body)}">${html}</p>`;

const small = (html, mt = 20) =>
  `<p style="margin:${mt}px 0 0; ${text(13, 21, C.muted)}">${html}</p>`;

const h3 = (html, mt = 28) =>
  `<h3 style="margin:${mt}px 0 0; ${text(16, 24, C.ink, 'font-weight:700; ')}">${html}</h3>`;

const b = (html) => `<strong style="font-weight:700;">${html}</strong>`;

const link = (label, href) =>
  `<a href="${href}" target="_blank" style="color:${C.gold}; font-weight:700; text-decoration:underline;">${label}</a>`;

function button(label, href, { outline = false, mt = 16 } = {}) {
  const cell = outline
    ? `background-color:${C.card}; border:1px solid ${C.gold};`
    : `background-color:${C.gold}; border:1px solid ${C.gold};`;
  const color = outline ? C.gold : '#FFFFFF';
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:${mt}px;">
                <tr>
                  <td align="center" style="${cell} border-radius:999px; mso-padding-alt:12px 26px;">
                    <a href="${href}" target="_blank" style="display:inline-block; padding:12px 26px; mso-padding-alt:0; ${text(16, 20, color, 'font-weight:700; text-decoration:none; ')}border-radius:999px;">${label}</a>
                  </td>
                </tr>
              </table>`;
}

function details(rows, mt = 20) {
  const tr = rows.map(([label, value], i) => {
    const top = i ? `border-top:1px solid ${C.line}; ` : '';
    return `
                <tr>
                  <td width="45%" valign="top" class="dl" style="width:45%; ${top}padding:12px 12px 12px 18px; ${text(13, 20, C.muted)}">${label}</td>
                  <td valign="top" class="dv" style="${top}padding:11px 18px 11px 0; ${text(15, 22, C.ink, 'font-weight:700; ')}">${value}</td>
                </tr>`;
  }).join('');
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:${mt}px; background-color:${C.soft}; border:1px solid ${C.line}; border-radius:12px; border-collapse:separate;">${tr}
              </table>`;
}

const PILLS = {
  amber: { bg: '#FBF0E2', fg: '#8A5A12' },
  green: { bg: '#E7F4EC', fg: '#1E6B3A' },
};
function pill(label, tone, mt = 16) {
  const t = PILLS[tone];
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:${mt}px;">
                <tr>
                  <td style="background-color:${t.bg}; border-radius:999px; padding:6px 12px; ${text(13, 18, t.fg, 'font-weight:700; ')}">${label}</td>
                </tr>
              </table>`;
}

function bullets(items, mt = 12) {
  const tr = items.map(([lead, rest], i) => `
                <tr>
                  <td width="22" valign="top" style="width:22px; padding-top:${i ? 20 : 9}px;">
                    <div style="width:7px; height:7px; border-radius:50%; background-color:${C.gold}; font-size:0; line-height:0;">&nbsp;</div>
                  </td>
                  <td valign="top" style="padding-top:${i ? 11 : 0}px; ${text(15, 25, C.body)}">${b(lead)} ${rest}</td>
                </tr>`).join('');
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:${mt}px;">${tr}
              </table>`;
}

function calButton(label, icon, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="background-color:${C.card}; border:1px solid ${C.gold}; border-radius:999px; mso-padding-alt:10px 18px;">
                            <a href="${href}" target="_blank" style="display:inline-block; padding:10px 18px; mso-padding-alt:0; ${text(14, 20, C.gold, 'font-weight:700; text-decoration:none; ')}border-radius:999px;"><img src="${IMAGE_BASE}${icon}" width="16" height="16" alt="" style="display:inline-block; width:16px; height:16px; border:0; vertical-align:-2px; margin-right:8px;">${label}</a>
                          </td>
                        </tr>
                      </table>`;
}

function calendar(mt = 20) {
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:${mt}px; background-color:${C.soft}; border:1px solid ${C.line}; border-radius:12px; border-collapse:separate;">
                <tr>
                  <td style="padding:18px 18px 18px;">
                    <p style="margin:0; ${text(14, 21, C.ink, 'font-weight:700; ')}">You can add this appointment to your calendar</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
                      <tr>
                        <td valign="top" style="padding-right:8px;">
                      ${calButton('Apple / Other', 'icon-apple.png', '{{ics_url}}')}
                        </td>
                        <td valign="top">
                      ${calButton('Google Calendar', 'icon-google-calendar.png', '{{google_calendar_url}}')}
                        </td>
                      </tr>
                    </table>
                    <p style="margin:12px 0 0; ${text(12, 19, C.muted)}">&ldquo;Apple / Other&rdquo; opens a calendar file that works with Apple Calendar, Outlook and most apps.</p>
                  </td>
                </tr>
              </table>`;
}

function layout({ subject, preheader, eyebrow, title, body }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style>table, td, div, h1, h3, p, a, span, strong { font-family: Arial, Helvetica, sans-serif !important; }</style>
  <![endif]-->
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <!--<![endif]-->
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }

    @media screen and (max-width: 600px) {
      .outer { padding: 28px 12px 32px !important; }
      .card { padding: 30px 22px 40px !important; }
      .h1 { font-size: 24px !important; line-height: 30px !important; }
      .foot { padding: 26px 18px 26px !important; }
      .dl { width: 46% !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${C.page};">

  <!-- Inbox preview text. Kept discreet on purpose: it shows on lock screens. -->
  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">
    ${preheader}
    &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847;
  </div>

  <div role="article" aria-roledescription="email" aria-label="${subject}" lang="en">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.page};">
    <tr>
      <td align="center" class="outer" style="padding:30px 16px 40px;">

        <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">

          <!-- ============ LOGO ============ -->
          <tr>
            <td align="center" style="padding:0 0 22px;">
              <a href="${WEBSITE}" target="_blank" style="display:inline-block; text-decoration:none;">
                <img src="${IMAGE_BASE}nora-health-logo.png" width="172" height="33" alt="Nora Health" style="display:block; width:172px; max-width:172px; height:auto; border:0; ${text(22, 33, C.plum, 'font-weight:700; ')}">
              </a>
            </td>
          </tr>

          <!-- ============ CARD ============ -->
          <tr>
            <td class="card" style="background-color:${C.card}; border:1px solid ${C.line}; border-top:4px solid ${C.gold}; border-radius:18px; padding:33px 40px 46px;">
              <p style="margin:0; ${text(12, 16, C.gold, 'font-weight:700; letter-spacing:1.6px; text-transform:uppercase; ')}">${eyebrow}</p>
              <h1 class="h1" style="margin:8px 0 0; ${text(28, 34, C.ink, 'font-weight:700; ')}">${title}</h1>
${body}
            </td>
          </tr>

          <!-- ============ FOOTER ============ -->
          <tr>
            <td style="padding-top:16px; font-size:0; line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" class="foot" style="background-color:${C.plum}; border-radius:18px; padding:28px 24px 26px;">
              <a href="${WEBSITE}" target="_blank" style="display:inline-block; text-decoration:none;">
                <img src="${IMAGE_BASE}nora-health-logo-footer.png" width="136" height="26" alt="Nora Health" style="display:block; width:136px; max-width:136px; height:auto; border:0; ${text(18, 26, '#FFFFFF', 'font-weight:700; ')}">
              </a>
              <p style="margin:9px 0 0; ${text(14, 20, C.footText)}">Free Oral Contraception, Delivered to Your Door</p>
              <p style="margin:12px 0 0; ${text(14, 20, '#FFFFFF', 'font-weight:700; ')}">
                <a href="${WHATSAPP}" target="_blank" style="color:#FFFFFF; text-decoration:none;">WhatsApp</a>
                <span style="color:${C.footSep}; font-weight:400;">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
                <a href="${WEBSITE}" target="_blank" style="color:#FFFFFF; text-decoration:none;">Website</a>
                <span style="color:${C.footSep}; font-weight:400;">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
                <a href="mailto:${EMAIL}" target="_blank" style="color:#FFFFFF; text-decoration:none;">Email us</a>
              </p>
              <p style="margin:14px 0 0; ${text(12, 18, C.footCopy)}">&copy; {{year}} Nora Health. All rights reserved.</p>
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </table>
  </div>
</body>
</html>
`;
}

// ---------- the seven emails ----------
// Copy is the client's, word for word, as approved in the artifact.

const queries = small(`If you have any queries regarding your order please ${link('click here', WHATSAPP)} to message us on WhatsApp or send us an email on ${link(EMAIL, 'mailto:' + EMAIL)}.`);

const EMAILS = [
  {
    key: 'welcome',
    name: 'Welcome',
    when: 'Sent when a patient finishes registration.',
    notes: ['The two order options are now buttons instead of underlined links with an emoji.', 'Order lists use brand bullets with the bold lead-in kept.', 'Copy is word for word the same.'],
    subject: 'Welcome to Nora Health',
    preheader: 'Order by WhatsApp or online, delivered free to your door.',
    eyebrow: 'Welcome',
    title: 'Welcome to Nora Health',
    body: [
      p('Hello {{first_name}},', 32),
      p('Welcome to Nora Health &mdash; you have just joined the UK&rsquo;s simplest ordering service for contraception.'),
      p('Whether you need your regular supply, want to try a new pill or require urgent protection (morning after pill), we get it to you fast, discreetly and with zero hassle.'),
      h3('Option 1: Order via WhatsApp (Recommended)'),
      p('We highly recommend using our WhatsApp service for the absolute fastest experience. Chat directly with our team instantly:', 6),
      button('Click here to order on WhatsApp', WHATSAPP),
      small('(or text us at 07440 126 154)', 12),
      h3('Option 2: Order Online (Quick &amp; Easy)'),
      p('Prefer to use our website? You can safely submit your details and request your prescription through our secure online portal:', 6),
      button('Click here to order online at norahealth.co.uk', WEBSITE, { outline: true }),
      h3('What you can order today:'),
      bullets([
        ['Regular repeat contraception:', 'Never run out of your daily pill.'],
        ['New contraception:', 'Switch your method easily online or via chat.'],
        ['Emergency contraception:', 'Quick, confidential access to the morning-after pill.'],
      ]),
      h3('Our Promise To You:'),
      bullets([
        ['Total flexibility:', 'Order online or straight through WhatsApp.'],
        ['Fast &amp; reliable:', 'Secure Royal Mail 24-hour tracked delivery for next-day arrival.'],
        ['Zero stress:', 'No long pharmacy queues or waiting for appointments.'],
        ['Total transparency:', 'An online account to keep track of all of your orders.'],
      ]),
      p(`Ready to start? Tap the WhatsApp link below to say hello or visit our ${link('website', WEBSITE)} to secure your next order.`, 24),
      button('Chat with us on WhatsApp', WHATSAPP),
      p(`Best health,<br>The Nora Health Team<br>${link('norahealth.co.uk', WEBSITE)}`, 20),
    ],
  },
  {
    key: 'order-received',
    name: 'Order received',
    when: 'Sent after an Order Now request.',
    notes: ['The call date and time slot now sit in a Telephone appointment card at the top.', 'Calendar buttons sit in their own panel.', 'Copy, including Dev’s sign-off, is unchanged.'],
    subject: 'We’ve received your Nora Health request',
    preheader: 'We’ll call you on {{call_date}}, {{time_slot}}.',
    eyebrow: 'Request received',
    title: 'Order Confirmation',
    body: [
      p('Hello {{first_name}},', 32),
      p('Thank you for submitting your contraception request with Nora Health.'),
      details([['Telephone appointment', '{{call_date}}'], ['Time slot', '{{time_slot}}']]),
      h3('Next Steps:'),
      p(`Before we can approve your contraception request we need to complete a quick telephone call &mdash; usually only takes ${b('just 2&ndash;3 minutes')}. We will call you on ${b('{{call_date}}')} during ${b('{{time_slot}}')}. The 1-hour slot simply indicates when you may expect a call. If there is a specific time that works best for you, feel free to tell us and we&rsquo;ll try our best to match it.`, 6),
      calendar(),
      h3('Delivery:'),
      p(`After your consultation we will post your medication to ${b('{{delivery_address}}')} in discreet packaging. Our service is completely free. If we complete the call before 1pm we can usually arrange for next day delivery using Royal Mail 24 Hour Tracked service.`, 6),
      h3('Getting in Touch:'),
      p(`If you need to adjust your appointment or have any questions you may message us and/or call us directly on ${link('WhatsApp', WHATSAPP)} or email us at ${link(EMAIL, 'mailto:' + EMAIL)}. For anything urgent please call us directly via WhatsApp.`, 6),
      p('Thank you &mdash; we look forward to speaking with you soon,<br>Dev'),
    ],
  },
  {
    key: 'booking',
    name: 'Booking confirmation',
    when: 'Sent after a telephone appointment is booked.',
    notes: ['Appointment and notes move into a details card.', 'Calendar buttons get their own panel.', 'Copy is unchanged.'],
    subject: 'Your Nora Health appointment is confirmed',
    preheader: 'Your telephone appointment is booked for {{appointment_datetime}}.',
    eyebrow: 'Telephone appointment',
    title: 'Booking Confirmation',
    body: [
      p('Hi {{full_name}},', 32),
      p('Your appointment has been successfully booked. Here are the details:'),
      details([['Appointment', '{{appointment_datetime}}'], ['Notes', '{{notes}}']]),
      calendar(),
      small(`If you need to change or cancel your appointment, please ${link('message us on WhatsApp', WHATSAPP)} (+44 7440126154) or email us at ${link(EMAIL, 'mailto:' + EMAIL)}.`),
    ],
  },
  {
    key: 'status-awaiting',
    name: 'Awaiting dispatch',
    when: 'Sent when the order is approved.',
    notes: ['A status pill shows Awaiting Dispatch at a glance.', 'Medicine, status and tracking sit in a details card.', 'The Order details heading is replaced by the card.'],
    subject: 'Your Nora Health order is approved',
    preheader: 'Your order is approved and will be posted soon.',
    eyebrow: 'Approved',
    title: 'Contraception Update',
    body: [
      p('Hi {{first_name}},', 32),
      p('Your contraceptive request has been approved and is awaiting dispatch.'),
      pill('Awaiting Dispatch', 'amber'),
      details([['Oral Contraceptive', '{{medicine}}'], ['Status', 'Awaiting Dispatch'], ['Tracking ID', 'Pending']], 10),
      queries,
    ],
  },
  {
    key: 'status-posted',
    name: 'Posted',
    when: 'Sent when Royal Mail tracking is added.',
    notes: ['A green status pill shows Posted via Royal Mail.', 'Fixes a stray # that used to appear before the medicine name.', 'Medicine, delivery address and tracking ID sit in a details card.'],
    subject: 'Your Nora Health order has been posted',
    preheader: 'Your order is on its way with Royal Mail.',
    eyebrow: 'On its way',
    title: 'Contraception Posted',
    body: [
      p('Hi {{first_name}},', 32),
      p('Your contraceptive has been posted via Royal Mail tracked service.'),
      pill('Posted via Royal Mail', 'green'),
      details([['Contraceptive', '{{medicine}}'], ['Delivery Address', '{{delivery_address}}'], ['Tracking ID', '{{tracking_id}}']], 10),
      queries,
    ],
  },
  {
    key: 'status-declined',
    name: 'Declined',
    when: 'Sent when a request fails clinical checks.',
    notes: ['Adds a Message us on WhatsApp button so the patient can reply in one tap.', 'Copy is unchanged.'],
    subject: 'An update on your Nora Health request',
    preheader: 'We need a little more information before we can post your order.',
    eyebrow: 'Update on your request',
    title: 'Contraception Request Declined',
    body: [
      p('Hi {{first_name}},', 32),
      p('Your contraceptive request didn&rsquo;t pass our clinical safety checks so we haven&rsquo;t been able to post your medicines yet.'),
      p(`When you have a moment, please get in touch with us &mdash; we just need a little more information to make sure everything is safe for you. You can call us, ${link('message us on WhatsApp', WHATSAPP)}, or email us at ${link(EMAIL, 'mailto:' + EMAIL)}.`),
      button('Message us on WhatsApp', WHATSAPP, { mt: 20 }),
      p('We&rsquo;ll do our very best to sort this out quickly for you.', 20),
    ],
  },
  {
    key: 'reset',
    name: 'Password reset',
    when: 'Sent when a patient asks to reset their password.',
    notes: ['This was a bare link with no branding.', 'Now it has the same layout and a Reset Password button.', 'Wording is lightly tidied. This was not client-supplied copy.'],
    subject: 'Reset your Nora Health password',
    preheader: 'Your password reset link is valid for 15 minutes.',
    eyebrow: 'Account',
    title: 'Reset your password',
    body: [
      p(`Click the button below to reset your password (valid for ${b('15 minutes')}):`, 32),
      button('Reset Password', '{{reset_url}}', { mt: 20 }),
      small('If you didn&rsquo;t request this, you can ignore this email.', 18),
    ],
  },
];

// Sample data, the same examples the artifact used. Not real patients.
const SAMPLE = {
  first_name: 'Jane',
  full_name: 'Jane Doe',
  call_date: '15-Oct',
  time_slot: '10:00 &ndash; 11:00',
  appointment_datetime: 'Thursday, 15 October 2026 at 10:00 &ndash; 11:00',
  notes: 'Please call after 10am',
  delivery_address: '12 High Street, Mitcham, CR4 1DL',
  medicine: 'Microgynon 30',
  tracking_id: 'MZ 5607 9721 0GB',
  ics_url: '#',
  google_calendar_url: '#',
  reset_url: '#',
  year: '2026',
};

// ---------- write files ----------

const here = (...p) => path.join(__dirname, ...p);
fs.mkdirSync(here('templates'), { recursive: true });
fs.mkdirSync(here('previews'), { recursive: true });

const fill = (html) => {
  const out = html.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in SAMPLE ? SAMPLE[k] : m));
  const left = out.match(/\{\{\w+\}\}/g);
  if (left) throw new Error('Unfilled tokens: ' + left.join(', '));
  return out;
};

const dataUri = (file) => 'data:image/png;base64,' + fs.readFileSync(here(file)).toString('base64');
const images = Object.fromEntries(fs.readdirSync(here('images')).map((f) => [f, dataUri('images/' + f)]));

const built = EMAILS.map((e) => {
  const template = layout({ ...e, body: e.body.join('\n') });
  fs.writeFileSync(here('templates', e.key + '.html'), template);

  const preview = fill(template).split(IMAGE_BASE).join('../images/');
  fs.writeFileSync(here('previews', e.key + '.html'), preview);

  // index.html carries everything inline so it works as a single file.
  const inline = fill(template).replace(new RegExp(IMAGE_BASE.replace(/[.\/]/g, '\\$&') + '([\\w.-]+)', 'g'), (m, f) => images[f] || m);
  return {
    key: e.key, name: e.name, when: e.when, notes: e.notes, subject: e.subject,
    before: dataUri('before/' + e.key + '.png'),
    html: inline,
  };
});

const page = fs.readFileSync(here('index.template.html'), 'utf8')
  .replace('/*EMAILS*/[]', () => JSON.stringify(built).replace(/<\//g, '<\\/'));
fs.writeFileSync(here('index.html'), page);

console.log('Wrote ' + EMAILS.length + ' templates, ' + EMAILS.length + ' previews and index.html');
