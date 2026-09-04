/* ============================================================================
 *  SONIA'S LOFT - SINGLE SOURCE OF TRUTH FOR ALL SITE CONTENT
 * ----------------------------------------------------------------------------
 *  Everything a non-developer would ever want to change lives in this file:
 *  every headline, every paragraph, every image path, every amenity.
 *
 *  You should never need to open a component file to change wording.
 *
 *  IMAGE PATHS: search this file for "TODO: IMAGE REPLACEMENT".
 *  Drop the matching .jpg into /public/images/ (see the README.txt in there).
 * ========================================================================== */

export const site = {
  name: "Sonia's Loft",
  location: "Antipolo, Rizal",
  tagline: "Stay a while by the water",
  description:
    "A three-bedroom loft with a pool in Antipolo. Bright, calm, and quietly upscale - ten minutes from the city edge, a world away from it.",
  // Update once you have a domain. Used for link previews.
  url: "https://soniasloft.com",
  contact: {
    email: "hello@soniasloft.com",
    phone: "+63 900 000 0000",
    // Leave as an empty string to hide the Facebook link everywhere.
    facebook: "https://m.me/soniasloft",
    // The Facebook page's photo album - linked from the Gallery section.
    // Leave as an empty string to hide that link.
    facebookPhotos: "https://www.facebook.com/SoniasLoftGuestHouse/photos",
  },

  // TODO: IMAGE REPLACEMENT -> /public/images/logo.png  (square mark, transparent background)
  // Until this file exists, the header just shows the text wordmark - nothing breaks.
  logo: "/images/logo.png",

  // TODO: IMAGE REPLACEMENT -> /public/images/favicon.ico  (the browser tab icon)
  favicon: "/images/favicon.ico",
} as const;

/* --------------------------------------------------------------------------
 *  NAVIGATION
 * ------------------------------------------------------------------------ */
export const nav = [
  { label: "The loft", href: "#the-loft" },
  { label: "Gallery", href: "#gallery" },
  { label: "The pool", href: "#the-pool" },
  { label: "Amenities", href: "#amenities" },
  { label: "Reviews", href: "#reviews" },
  { label: "Availability", href: "#availability" },
] as const;

/* --------------------------------------------------------------------------
 *  HERO
 * ------------------------------------------------------------------------ */
export const hero = {
  eyebrow: "Antipolo, Rizal",
  // One serif headline per section. Keep it under 24 characters per line.
  heading: "Stay a while by the water",
  subheading: "Three bedrooms, one very tall living room",
  body:
    "The pool is open from sunrise, and the glass doors fold all the way back. Breakfast is whatever you bring; the long teak table seats ten.",
  primaryCta: { label: "Book your stay", href: "#inquire" },
  secondaryCta: { label: "View the loft", href: "#gallery" },

  // TODO: IMAGE REPLACEMENT  ->  /public/images/hero.jpg   (16:9, no filter)
  image: "/images/hero.jpg",
  imageAlt:
    "The pool at Sonia's Loft at dusk, with the glass doors of the loft folded open behind it",
} as const;

/* --------------------------------------------------------------------------
 *  THE LOFT - intro strip + the four numbers under it
 * ------------------------------------------------------------------------ */
export const theLoft = {
  eyebrow: "The loft",
  heading: "Three bedrooms, one very tall living room",
  body:
    "The living room runs double height, so the light moves across it all day. Two bedrooms sit downstairs off the garden; the third is up under the roofline with its own view of the trees. It sleeps ten comfortably and stays cool without trying.",
  stats: [
    { value: "10", label: "Guests" },
    { value: "3", label: "Bedrooms" },
    { value: "2", label: "Baths" },
    { value: "24h", label: "Access" },
  ],

  // TODO: IMAGE REPLACEMENT  ->  /public/images/living.jpg   (16:9)
  image: "/images/living.jpg",
  imageAlt: "The double-height living room with glass doors folded back",
} as const;

/* --------------------------------------------------------------------------
 *  GALLERY
 *  ratio must be "16/9" or "3/4" - the design system allows nothing else.
 *  Add or remove items freely; the grid reflows on its own.
 * ------------------------------------------------------------------------ */
export const gallery = {
  eyebrow: "Gallery",
  heading: "A look around",
  body: "Nothing staged, nothing filtered. This is how it actually looks.",
  items: [
    // TODO: IMAGE REPLACEMENT  ->  /public/images/gallery-01.jpg  (3:4)
    { src: "/images/gallery-01.jpg", alt: "The pool deck in the morning", ratio: "3/4" },
    // TODO: IMAGE REPLACEMENT  ->  /public/images/gallery-02.jpg  (16:9)
    { src: "/images/gallery-02.jpg", alt: "The long teak dining table", ratio: "16/9" },
    // TODO: IMAGE REPLACEMENT  ->  /public/images/gallery-03.jpg  (3:4)
    { src: "/images/gallery-03.jpg", alt: "The upstairs bedroom under the roofline", ratio: "3/4" },
    // TODO: IMAGE REPLACEMENT  ->  /public/images/gallery-04.jpg  (16:9)
    { src: "/images/gallery-04.jpg", alt: "The kitchen and breakfast counter", ratio: "16/9" },
    // TODO: IMAGE REPLACEMENT  ->  /public/images/gallery-05.jpg  (3:4)
    { src: "/images/gallery-05.jpg", alt: "The shaded deck in the afternoon", ratio: "3/4" },
    // TODO: IMAGE REPLACEMENT  ->  /public/images/gallery-06.jpg  (16:9)
    { src: "/images/gallery-06.jpg", alt: "The garden and the trees beyond the wall", ratio: "16/9" },
  ],
} as const;

/* --------------------------------------------------------------------------
 *  THE POOL - the card & section pattern from the design document
 * ------------------------------------------------------------------------ */
export const pool = {
  eyebrow: "The pool",
  heading: "Aqua tile, lit until midnight",
  body:
    "Shallow end for the kids, underwater lights for the evening, and a shaded deck that stays cool after four.",
  stats: [
    { value: "1.2m", label: "Depth" },
    { value: "10", label: "Guests" },
    { value: "24h", label: "Access" },
  ],

  // TODO: IMAGE REPLACEMENT  ->  /public/images/pool.jpg   (3:4, portrait)
  image: "/images/pool.jpg",
  imageAlt: "The pool lit from below in the evening, aqua tile visible",
} as const;

/* --------------------------------------------------------------------------
 *  AMENITIES
 *  `icon` must be one of the keys in src/components/site/Amenities.tsx.
 *  Available: waves, wind, wifi, kitchen, car, tv, trees, shower,
 *             coffee, washer, grill, speaker
 * ------------------------------------------------------------------------ */
export const amenities = {
  eyebrow: "Amenities",
  heading: "What is already here",
  body:
    "Bring food and swimsuits. Everything else is waiting for you.",
  items: [
    { icon: "waves",   title: "Private pool",        detail: "1.2m deep, lit until midnight" },
    { icon: "wind",    title: "Air conditioning",    detail: "Every bedroom, plus the loft" },
    { icon: "wifi",    title: "Fibre wifi",          detail: "Fast enough to work on" },
    { icon: "kitchen", title: "Full kitchen",        detail: "Gas range, oven, full-size fridge" },
    { icon: "coffee",  title: "Coffee setup",        detail: "Kettle, press, and beans to start" },
    { icon: "grill",   title: "Grill on the deck",   detail: "Charcoal, in the shade" },
    { icon: "car",     title: "Gated parking",       detail: "Two cars inside the gate" },
    { icon: "washer",  title: "Washer and dryer",    detail: "For the long stays" },
    { icon: "tv",      title: "Smart TV",            detail: "Netflix and YouTube signed in" },
    { icon: "trees",   title: "Garden and deck",     detail: "Shaded from four onwards" },
    { icon: "shower",  title: "Outdoor shower",      detail: "Beside the pool" },
    { icon: "speaker", title: "Bluetooth speaker",   detail: "Yours until ten in the evening" },
  ],
} as const;

/* --------------------------------------------------------------------------
 *  REVIEWS
 *  TODO: REVIEW REPLACEMENT - swap in real guest reviews here. Add or
 *  remove items freely; the grid reflows on its own.
 * ------------------------------------------------------------------------ */
export const reviews = {
  eyebrow: "Reviews",
  heading: "What guests say",
  body: "A few words from people who have stayed.",
  items: [
    // TODO: REVIEW REPLACEMENT + IMAGE REPLACEMENT -> /public/images/review-01.jpg (3:4)
    { image: "/images/review-01.jpg", quote: "", name: "", detail: "" },
    // TODO: REVIEW REPLACEMENT + IMAGE REPLACEMENT -> /public/images/review-02.jpg (3:4)
    { image: "/images/review-02.jpg", quote: "", name: "", detail: "" },
    // TODO: REVIEW REPLACEMENT + IMAGE REPLACEMENT -> /public/images/review-03.jpg (3:4)
    { image: "/images/review-03.jpg", quote: "", name: "", detail: "" },
  ],
} as const;

/* --------------------------------------------------------------------------
 *  AVAILABILITY - the public read-only calendar
 * ------------------------------------------------------------------------ */
export const availability = {
  eyebrow: "Availability",
  heading: "Check your dates",
  body:
    "Shaded days are already taken. Two-night minimum on weekends. Send an inquiry and we will come back to you the same day.",
} as const;

/* --------------------------------------------------------------------------
 *  ENQUIRY FORM
 * ------------------------------------------------------------------------ */
export const enquiry = {
  eyebrow: "Inquire",
  heading: "Tell us when you are coming",
  body:
    "No booking fees, no platform in between. This goes straight to us.",
  successHeading: "Thank you - it is with us",
  successBody:
    "We have your inquiry and will reply to your email shortly, usually the same day.",
  submitLabel: "Send inquiry",
  facebookLabel: "Message on Facebook",
} as const;

/* --------------------------------------------------------------------------
 *  HOUSE NOTES - shown under the enquiry form
 * ------------------------------------------------------------------------ */
export const houseNotes = [
  "Check-in from 2pm, check-out by 12nn.",
  "Two-night minimum on weekends.",
  "Ten guests included. Ask us about more.",
  "No parties or events, please - the neighbours are close.",
] as const;

/* --------------------------------------------------------------------------
 *  FOOTER
 * ------------------------------------------------------------------------ */
export const footer = {
  heading: "Sonia's Loft",
  body: "Antipolo, Rizal, Philippines",
  note: "Booked directly, always.",
} as const;
