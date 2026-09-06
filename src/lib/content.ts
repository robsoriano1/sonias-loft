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
    phone: "+63 917 797 5483",
    // Leave as an empty string to hide the Facebook link everywhere.
    facebook: "https://www.facebook.com/SoniasLoftGuestHouse/photos",
    // The Facebook page's photo album - linked from the Gallery section.
    // Leave as an empty string to hide that link.
    facebookPhotos: "https://www.facebook.com/SoniasLoftGuestHouse/photos",
  },

  // TODO: IMAGE REPLACEMENT -> /public/images/logo.png  (square mark, transparent background)
  // Until this file exists, the header just shows the text wordmark - nothing breaks.
  logo: "/images/logo.png",

  // Browser tab icon. Reuses logo.png since no dedicated favicon.ico was
  // provided - drop one in at /public/images/favicon.ico to use that instead.
  favicon: "/images/logo.png",
} as const;

/* --------------------------------------------------------------------------
 *  QUICK CONTACT - the floating WhatsApp / Viber / Messenger button shown
 *  on every page, for guests who'd rather message than fill out the form.
 *  Leave any one field as "" to hide that channel's button.
 * ------------------------------------------------------------------------ */
export const quickContact = {
  prefilledMessage: "Hi! I'd like to ask about staying at Sonia's Loft.",
  // Digits only, country code first, no "+", spaces, or dashes - used in wa.me links.
  whatsappNumber: "639177975483",
  // Full international format with "+", no spaces - used in Viber's chat deep link.
  viberNumber: "+639177975483",
  // The part after facebook.com/ in your Page URL - used in m.me links.
  messengerUsername: "SoniasLoftGuestHouse",
} as const;

/* --------------------------------------------------------------------------
 *  NAVIGATION
 * ------------------------------------------------------------------------ */
export const nav = [
  { label: "The loft", href: "#the-loft" },
  { label: "Gallery", href: "#gallery" },
  { label: "The pool", href: "#the-pool" },
  { label: "Amenities", href: "#amenities" },
  { label: "Location", href: "#location" },
  { label: "House rules", href: "#house-rules" },
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
  primaryCta: { label: "Book now", href: "#inquire" },
  secondaryCta: { label: "View availability", href: "#availability" },

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
    "The living room runs double height, so the light moves across it all day. Two of the three bedrooms sleep four each on bunk beds; the third holds a queen. Four bathrooms keep mornings easy across 280 sqm (3,014 sq ft) - room enough for 16 guests comfortably, up to 25 at a squeeze.",
  stats: [
    { value: "16", label: "Guests" },
    { value: "3", label: "Bedrooms" },
    { value: "4", label: "Baths" },
    { value: "280m²", label: "Size" },
  ],

  image: "/images/living.jpg",
  imageAlt: "Looking down from the stairs at the double-height living room, its cluster of pendant lights, and the pool through the glass doors",
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
    // TODO: IMAGE REPLACEMENT  ->  /public/images/gallery-07.jpg  (3:4)
    { src: "/images/gallery-07.jpg", alt: "A bedroom with a low platform bed and sheer curtains", ratio: "3/4" },
    // TODO: IMAGE REPLACEMENT  ->  /public/images/gallery-08.jpg  (3:4)
    { src: "/images/gallery-08.jpg", alt: "The gated entrance and carport at dusk", ratio: "3/4" },
    // TODO: IMAGE REPLACEMENT  ->  /public/images/gallery-09.jpg  (3:4)
    { src: "/images/gallery-09.jpg", alt: "The gate and driveway, banana trees over the wall", ratio: "3/4" },
    // TODO: IMAGE REPLACEMENT  ->  /public/images/gallery-10.jpg  (3:4)
    { src: "/images/gallery-10.jpg", alt: "The covered porch with a bench by the front door", ratio: "3/4" },
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
    { value: "16", label: "Guests" },
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
 *  LOCATION - the interactive map, driving times, and nearby landmarks
 *  Pinned to the actual "Sonia's Loft Guest House" listing on Google Maps
 *  (LOT 2, Ponderosa Heights, Block 6A Cactus Drive, Antipolo, 1870 Rizal -
 *  14.5742229, 121.164547). If the business ever moves or gets re-listed
 *  under a different name, search the new address on Google Maps and swap
 *  the coordinates/name below.
 * ------------------------------------------------------------------------ */
export const location = {
  eyebrow: "Getting here",
  heading: "Up in the hills above the city",
  body:
    "Antipolo sits in the hills east of Metro Manila, so the last stretch in climbs steadily and winds a little. Any car manages it fine - just budget a few extra minutes, especially after dark or in the rain.",
  roadNote:
    "Roads in are paved and used daily by locals, but expect a real incline with some switchbacks near the top. Drive slow, arrive earlier for sunset check-ins, and let us know if you're bringing anything low to the ground.",

  mapEmbedSrc:
    "https://www.google.com/maps?q=Sonia's+Loft+Guest+House,+Antipolo,+Rizal,+Philippines&output=embed",
  directionsHref:
    "https://www.google.com/maps/dir/?api=1&destination=Sonia's+Loft+Guest+House,+Antipolo,+Rizal,+Philippines",

  // Typical light-traffic driving times from the pinned address above -
  // Metro Manila traffic can easily double these at peak hours.
  driveTimes: [
    { from: "BGC, Taguig", time: "45–60 min" },
    { from: "Ortigas, Pasig", time: "35–50 min" },
    { from: "Quezon City", time: "40–55 min" },
  ],

  landmarks: [
    { name: "Pinto Art Museum", detail: "About 10 min by car" },
    { name: "Hinulugang Taktak", detail: "About 15 min by car" },
    { name: "Supermarket & groceries", detail: "About 10 min by car" },
    { name: "Antipolo Cathedral", detail: "About 15 min by car" },
  ],
} as const;

/* --------------------------------------------------------------------------
 *  FULL AMENITIES LIST - shown in the "Show all amenities" modal, not
 *  inline on the page. Deliberately excludes anything already covered by
 *  the curated grid above (pool, air con, wifi, kitchen, coffee, grill,
 *  parking, washer/dryer, smart TV, garden, outdoor shower, speaker) so
 *  the same fact never appears twice under two different names. Add or
 *  remove items/groups freely - just check the curated grid first.
 * ------------------------------------------------------------------------ */
export const facilities = {
  heading: "All amenities",
  groups: [
    {
      category: "Kitchen & Dining",
      items: [
        "Dishes & dining utensils",
        "Dishwasher",
        "Microwave",
        "Kitchen basics (cookware, oils & condiments)",
      ],
    },
    {
      category: "Bed & Bath",
      items: ["Towels", "Toiletries & body wash"],
    },
    {
      category: "Outdoor & Pool",
      items: ["Balcony or terrace"],
    },
    {
      category: "Entertainment",
      items: ["Board games", "Sound system", "Cable TV channels"],
    },
    {
      category: "Safety & Utilities",
      items: [
        "Professional cleaning between stays",
        "Hand sanitizer & soap provided",
        "Doorman on duty",
        "Fans (ceiling & portable)",
        "Private entrance",
        "Desk / workspace",
      ],
    },
  ],
} as const;

/* --------------------------------------------------------------------------
 *  REVIEWS
 *  Add or remove items freely; the grid reflows on its own.
 * ------------------------------------------------------------------------ */
export const reviews = {
  eyebrow: "Reviews",
  heading: "What guests say",
  body: "A few words from people who have stayed.",
  items: [
    // TODO: IMAGE REPLACEMENT -> /public/images/review-01.jpg (3:4) - a guest photo from this stay
    {
      image: "/images/review-01.jpg",
      quote: "Thank you, Sonia's Loft Guest House! Sa uulitin po.",
      name: "Dawn Grace",
      detail: "Facebook review",
    },
    // TODO: IMAGE REPLACEMENT -> /public/images/review-02.jpg (3:4) - a guest photo from this stay
    {
      image: "/images/review-02.jpg",
      quote:
        "Sonia's place is perfect for my team building. Very spacious and super clean. All the staff are very accommodating - especially Ate Erlin (Tata). Highly recommended.",
      name: "Airbnb guest",
      detail: "5-star review, 1-night stay",
    },
    // TODO: IMAGE REPLACEMENT -> /public/images/review-03.jpg (3:4) - a guest photo from this stay
    {
      image: "/images/review-03.jpg",
      quote:
        "Thank you so much! Your place is very homey, beautiful, and very clean too. We'll recommend it to our friends and family. God bless, Sonia's Loft Guest House.",
      name: "Vicelle Vicente",
      detail: "Facebook review",
    },
  ],
};

/* --------------------------------------------------------------------------
 *  RATINGS - the aggregate score shown above the review cards
 * ------------------------------------------------------------------------ */
export const ratings = {
  score: "9.8",
  label: "Exceptional",
  count: 11,
  categories: [
    { label: "Cleanliness", value: "10.0" },
    { label: "Facilities", value: "10.0" },
    { label: "Service", value: "10.0" },
    { label: "Value for money", value: "10.0" },
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
  facebookLabel: "View on Facebook",
} as const;

/* --------------------------------------------------------------------------
 *  HOUSE NOTES - shown under the enquiry form
 * ------------------------------------------------------------------------ */
export const houseNotes = [
  "Check-in 9am-7pm, check-out 7am-5pm. Reception open until 10pm.",
  "Two-night minimum on weekends.",
  "16 guests included, max 25. Ask us about more.",
  "No parties or events, please - the neighbours are close.",
] as const;

/* --------------------------------------------------------------------------
 *  HOUSE RULES - shown in full before the enquiry form
 * ------------------------------------------------------------------------ */
export const houseRules = {
  eyebrow: "Before you book",
  heading: "House rules",
  body:
    "Welcome, and thank you for staying with us. To keep the stay safe and pleasant for everyone, please observe the following.",
  items: [
    "No smoking inside the property.",
    "Pets: only one small pet allowed, with diaper and pee pad. Pets are not allowed on beds or sofas. Any damages will have a fee, and deep cleaning due to pet pee/poop smell will incur ₱2,500.",
    "No unregistered guests allowed.",
    "No eating or drinking in bedrooms and inside the pool.",
    "Noise curfew: 11:00 PM – 7:00 AM.",
    "Turn off air-conditioners when not in use.",
    "Respect check-out time.",
    "Do not rearrange furnishings. Guests are responsible for any damages.",
    "Use the provided bins to segregate your trash.",
    "Board games are for resort use only - please do not take them home.",
    "Clean As You Go (CAYGO): wash used dishes, return items to their place, and help keep the space neat for the next guest.",
    "Pool safety: there is no lifeguard on duty. Please watch over your children at all times, especially in or near the pool - unattended kids are not allowed.",
  ],
} as const;

/* --------------------------------------------------------------------------
 *  FOOTER
 * ------------------------------------------------------------------------ */
export const footer = {
  heading: "Sonia's Loft",
  body: "Antipolo, Rizal, Philippines",
  note: "Booked directly, always.",
} as const;
