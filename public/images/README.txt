================================================================================
 SONIA'S LOFT - IMAGE DROP FOLDER
================================================================================

Drop your photos in THIS folder (/public/images/) using the EXACT filenames
below. No code changes needed - the site picks them up automatically.

Until a file exists, that slot shows a warm "sand" skeleton block so the page
layout never collapses. You can upload them one at a time.

--------------------------------------------------------------------------------
REQUIRED FILENAMES
--------------------------------------------------------------------------------

  hero.jpg          16:9   The wide establishing shot. Pool + glass doors, or
                           the facade at dusk. This is the first thing guests
                           see - make it the best one you have.

  pool.jpg          3:4    Tall portrait of the pool. Aqua tile, lights on.

  living.jpg        16:9   The double-height living room, glass doors folded
                           back if possible.

  gallery-01.jpg    3:4
  gallery-02.jpg    16:9
  gallery-03.jpg    3:4
  gallery-04.jpg    16:9
  gallery-05.jpg    3:4
  gallery-06.jpg    16:9

  og-image.jpg      16:9   Used as the link preview when someone shares the
                           site on Facebook / Messenger / Viber.
                           (Optional - falls back to hero.jpg.)

  review-01.jpg     3:4    Guest photos for the Reviews section. Optional -
  review-02.jpg     3:4    each card works fine with just a quote and no
  review-03.jpg     3:4    photo, or a photo and no quote yet.

  logo.png          any    Square mark for the header, next to "Sonia's
                           Loft". Transparent background works best.
                           Optional - the header just shows the text name
                           until this exists.

  favicon.ico        -     The little icon in the browser tab. Optional -
                           browsers show a default icon until this exists.

--------------------------------------------------------------------------------
RULES FROM THE DESIGN SYSTEM (soniasloftdesign.pdf, section 04)
--------------------------------------------------------------------------------

  * Aspect ratios: 3:4 and 16:9 ONLY. Anything else gets cropped by the
    layout and you lose the edges you cared about.
  * NO FILTERS. No VSCO, no Instagram presets, no heavy contrast. The palette
    is already doing the work - filtered photos fight it.
  * Shoot or pick bright, airy frames. Natural light, mid-morning or the
    hour before sunset. Avoid flash.
  * Photos are full-bleed or edge-anchored, never floated in a rounded box.

--------------------------------------------------------------------------------
FILE FORMAT + SIZE
--------------------------------------------------------------------------------

  * .jpg preferred (.png works, but files are much bigger).
  * Longest edge ~2400px is plenty. Next.js resizes automatically.
  * Keep each file under ~1.5 MB before upload. Use squoosh.app if needed.
  * Filenames are case-sensitive on the server: use lowercase, exactly as
    written above. "Hero.JPG" will NOT be found.

--------------------------------------------------------------------------------
WANT DIFFERENT FILENAMES OR MORE PHOTOS?
--------------------------------------------------------------------------------

  Edit ONE file: src/lib/content.ts

  Every image path on the site lives there, next to the text it belongs to.
  Search that file for "TODO: IMAGE REPLACEMENT" to find them all. To add a
  seventh gallery photo, copy a line in the `gallery.items` array and drop the
  matching file in here.

================================================================================
