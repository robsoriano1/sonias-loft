# Sonia's Loft

A direct-booking site for a three-bedroom guest house with a pool in Antipolo,
Rizal. Built to be run and maintained by one person.

Next.js (App Router) - TypeScript - Tailwind - Supabase - Lucide.

---

## Get it running (about ten minutes)

### 1. Install

```bash
npm install
```

### 2. Create the Supabase project

1. Go to <https://supabase.com> and create a free project.
2. Open **SQL Editor -> New query**, paste the whole of `supabase/schema.sql`,
   and hit **Run**. That creates both tables and locks down the permissions.
3. Open **Authentication -> Users -> Add user -> Create new user**. Use Tita
   Sonia's email and a strong password, and tick **Auto Confirm User**.
4. Open **Authentication -> Providers -> Email** and turn OFF
   *"Allow new users to sign up"* so nobody else can create an account.

### 3. Add your keys

```bash
cp .env.local.example .env.local
```

Fill in both values from **Project Settings -> API**.

### 4. Run it

```bash
npm run dev
```

- Public site: <http://localhost:3000>
- Owner dashboard: <http://localhost:3000/admin>

---

## The two files you will actually edit

| I want to change... | Open this |
| --- | --- |
| Any text on the site, or an image path | `src/lib/content.ts` |
| A colour, a font size, spacing | `tailwind.config.ts` |

Everything else is plumbing.

---

## Adding your photos

Drop the files into `public/images/`. The filenames are listed in
`public/images/README.txt`. Until a file is there, that slot shows a warm
skeleton block with the expected filename printed on it, so the layout never
breaks and you always know what is missing.

Search the codebase for `TODO: IMAGE REPLACEMENT` to find every image path.

---

## The owner dashboard

`/admin` is protected by Supabase Auth. Anyone not signed in is redirected to
`/admin/login`. There is a quiet "Owner" link in the site footer.

**Enquiries** - every submission from the public form, newest first. Change a
status (new / replied / confirmed / archived) as you work through them, or
delete one outright.

**Calendar** - click any day to flip it between available and booked. Blocked
days immediately show as unavailable on the public calendar. The range control
underneath blocks a whole stay in one action.

---

## Deploying

Push to GitHub, import the repo at <https://vercel.com>, and add the same two
environment variables in the Vercel project settings. That is the whole
deployment. The free tier covers a site like this comfortably.

---

## Design system

Every colour, font size, corner radius and shadow comes from
`soniasloftdesign.pdf` and is encoded in `tailwind.config.ts`.

**Palette** - ink (wood black), lagoon (pool water), brass (logo gold) and
teak (wood stains), on shell / sand / stone neutrals.

**Type** - Cormorant Garamond for display, Jost for body and UI. One serif
headline per section, never two competing.

**Corners** - 2px on inputs and buttons, 4px on cards, 0 on images. The
building is straight lines and mullions; rounded corners soften it into a
generic booking site.

**Elevation** - `shadow-soft` for card hover, `shadow-lift` for the sticky bar.
Everything else uses a 1px stone border. No coloured or glowing shadows.

**Motion** - 250-400ms `ease-calm`, a 1.03 image zoom on hover, 12px fade-up on
scroll. Nothing bouncy.

**Buttons** - primary is ink filled and hovers to lagoon; secondary is a
hairline outline. Brass never fills a button; it only underlines links and
marks small details.
