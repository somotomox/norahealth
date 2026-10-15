# Nora Health patient emails, new design

The seven patient emails in the approved design from the "Nora Email Redesign" artifact
(https://claude.ai/artifact/5EFytbXehTuzatdRGoiVpM). The copy is the client's, word for word, as the artifact shows it.

## Files

| Path | What it is |
|---|---|
| `templates/<email>.html` | The emails to send. Patient data goes in `{{tokens}}`, and images load from the live site. |
| `previews/<email>.html` | The same emails filled with sample data (Jane Doe and so on). They open in a browser. |
| `index.html` | One self-contained page, laid out like the artifact: the current email next to the new one, with a Desktop / Phone switch. The new one is live HTML, not a screenshot. |
| `images/` | Logo, footer logo and the two calendar icons, at 3x for sharp retina screens. |
| `before/` | Screenshots of the current emails, taken from the artifact. Used by `index.html`. |
| `build.js` | Generates everything above. Run `node build.js` after any change. |
| `index.template.html` | The page shell for `index.html`. |

All seven emails are built in `build.js` from the same parts: header, card, button, details card, status pill, bullets, calendar panel and footer. **Edit `build.js`, not the generated files**, or the next build overwrites your change.

This replaces `../booking-confirmation.html` (the 27 Sep 2026 design) for the booking email.

## Before it goes live

1. Upload the four files in `images/` so they load from
   `https://www.norahealth.co.uk/images/email/`
   (in the Next.js project: `public/images/email/`). Email clients can't show the site's SVG logo, so these are PNGs.
2. HTML-escape every token value before inserting it, especially names, notes and addresses.
3. Send a test of each email to Gmail, Outlook desktop and Apple Mail. They have only been checked in Chrome so far.

## The seven emails

| File | Sent when | Suggested subject | Tokens |
|---|---|---|---|
| `welcome.html` | A patient finishes registration | Welcome to Nora Health | `first_name` |
| `order-received.html` | After an Order Now request | We've received your Nora Health request | `first_name`, `call_date`, `time_slot`, `delivery_address`, `ics_url`, `google_calendar_url` |
| `booking.html` | A telephone appointment is booked | Your Nora Health appointment is confirmed | `full_name`, `appointment_datetime`, `notes`, `ics_url`, `google_calendar_url` |
| `status-awaiting.html` | The order is approved | Your Nora Health order is approved | `first_name`, `medicine` |
| `status-posted.html` | Royal Mail tracking is added | Your Nora Health order has been posted | `first_name`, `medicine`, `delivery_address`, `tracking_id` |
| `status-declined.html` | A request fails clinical checks | An update on your Nora Health request | `first_name` |
| `reset.html` | A patient asks to reset their password | Reset your Nora Health password | `reset_url` |

Every email also uses `{{year}}` in the footer.

Subjects and inbox preview text are kept free of the word "contraception". Both show on lock screens and in shared inboxes. The subjects above are suggestions. If the live emails already have subjects the client likes, keep those.

### Token formats (from the sample data)

| Token | Example |
|---|---|
| `call_date` | 15-Oct |
| `time_slot` | 10:00 &ndash; 11:00 |
| `appointment_datetime` | Thursday, 15 October 2026 at 10:00 &ndash; 11:00 |
| `notes` | Please call after 10am |
| `delivery_address` | 12 High Street, Mitcham, CR4 1DL |
| `medicine` | Microgynon 30 (just the name, no leading `#`; the old Posted email showed a stray one) |
| `tracking_id` | MZ 5607 9721 0GB |
| `ics_url` | Link to the .ics file the "Apple / Other" button opens |
| `google_calendar_url` | Same link the current email uses |
| `reset_url` | The reset link, valid for 15 minutes |

Use UK time for dates and times.

In `booking.html`, if the patient left no notes, remove the Notes row (the second `<tr>` in the details card) instead of sending it empty.

## Links used

- WhatsApp: `https://wa.me/447440126154`
- Website and "order online": `https://www.norahealth.co.uk/`
- Email: `mailto:pharmacy.fap80@nhs.net`

If the current emails send "order online" to a specific page, change `WEBSITE` in the welcome email's button in `build.js`.

## Known

- White text on the gold buttons, and gold link text on white, measure 2.9:1 contrast. That is below the WCAG AA target of 4.5:1 for text this size. The approved design uses them, so they are kept. Darker gold or plum text would fix it if the client wants.
- The client's copy keeps its own dashes (for example "Welcome to Nora Health &mdash; you have just joined...").
- Outlook on Windows shows square corners and Arial instead of DM Sans. Everything else still lines up.
