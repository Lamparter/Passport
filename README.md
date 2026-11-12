# Hack Club Passport

A digital passport that proves, at the door of a Hack Club event, that someone is an
identity-verified Hack Clubber. A first-time visitor sees the passport open slowly and is
carried straight into Hack Club sign-in (there is no button; tapping the passport skips the
wait). On return, the passport folds open to a verdict that reads from across the room:

| State | Colour / shape | Meaning |
| --- | --- | --- |
| **Verified** | green, tick in a circle | IDV-verified, 13–18. No other ID needed. |
| **Verified 18+** | amber, "18+" diamond | IDV-verified but over 18. Must make themselves known to staff. |
| **Not verified** | red stripes, cross in an octagon | Must present another accepted form of ID. |

Anti-spoofing: the verdict page has a ticking clock and a moving light sweep (a screenshot
has neither), plus a QR code staff can scan to see the same verdict on their own phone. QR
links are encrypted, expire after 90 seconds, and are kept short so the code is coarse and
easy to scan.

## Stack

SvelteKit + TypeScript, deployed to Vercel. No database: the session is an encrypted
(JWE) cookie holding a snapshot of the identity, valid for 12 hours. The Hack Club access
token is used once at sign-in and never stored.

## Setup

1. Create an OAuth app at <https://auth.hackclub.com/developer/apps> with redirect URIs
   `https://passport.lamparter.dev/auth/callback` and `http://localhost:5173/auth/callback`.
2. Copy `.env.example` to `.env` and fill in `HCA_CLIENT_ID`, `HCA_CLIENT_SECRET` and a
   random `SESSION_SECRET`. Set the same variables in the Vercel project.
3. `npm install`, then `npm run dev`.

Hack Club only redirects back to a registered URI, so the dev server must run on the port you
registered (`5173`). If that port is busy Vite silently picks `5174` and sign-in fails.

Until `HCA_CLIENT_ID` is set, the footer shows "Demo" links (`/auth/demo?as=verified|adult|rejected`)
that open each passport state with a fake identity. Once an OAuth app is configured they are
hidden; set `DEMO=1` to bring them back for design work (this also turns off the automatic
redirect; the "intro" link previews the opening). They never exist in production.

### Scopes

Community apps only receive name, Slack ID and verification status, so by default the
passport shows "Age: 13–18 · verified" (from `ysws_eligible`), the Slack avatar as the
photo, and "Hack Clubber" as nationality. If Hack Club HQ promotes the app to
`hq_official`, set `HCA_SCOPES="openid profile email name slack_id verification_status basic_info address"`
and the passport shows the real date of birth, age and country instead.

The photo is loaded from [Cachet](https://cachet.dunkirk.sh) by Slack ID, as the Hack Club
Auth docs suggest; there is no picture claim in Hack Club Auth itself.

## Design

The layout borrows from real travel documents (UK, Canadian, US, Australian): a foil-blocked
jacket with the biometric symbol, a data page with numbered bilingual labels, monospaced
values, a ghost portrait and a machine-readable zone, and an "official observations" page
that carries the verdict as an entry-clearance label. The jacket is Hack Club red taken down
to a passport burgundy, with gold foil and the ICAO biometric symbol.

- **Type:** serif throughout. Zarathustra (Hack Club's display serif, from `hackclub/site`)
  for the jacket, titles and verdict; Libre Caslon Text for small print; B612 Mono (standing
  in for OCR-B) for values and the MRZ.
- **Emblem:** a gold-plated Hack Club sticker (`hero_sticker3` from `hackclub/site`).
  `npm run emblem -- <sticker image>` splits any sticker into a silhouette mask (the foil
  plate) and a line-art mask (the engraving).
- **Line art:** `static/art/*.png` are alpha masks generated from black-and-white drawings,
  so they can be tinted with CSS. To regenerate: `npm run assets -- <folder of source PNGs>`.
- **Security print:** the guilloche waves and rosettes are generated as SVG in
  `src/lib/guilloche.ts`.

Hack Club Passport is an unofficial companion to Hack Club Identity Vault.
