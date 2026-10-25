# Custom Pokémon image uploads — Santara Fieldwork

The GM and Player wildlife editors now support **Upload artwork from device** alongside the existing HTTPS artwork URL.

## Using an image in Fieldwork

1. Open **GM Console → Wildlife records** and create or edit a species.
2. Select a PNG, JPG, or WebP file under **Custom Pokémon Artwork**. The image is compressed in the browser into a small WebP.
3. Choose **Framed (good for backgrounds)** for artwork that includes scenery, or **Cutout** for transparent Pokémon images.
4. Click **Save changes**. The image and display mode are saved with the record in this browser; export a private JSON backup regularly.
5. To share it with your players, give the wildlife record a **player-visible Pokémon name**, set an eligible stage (not Hidden/Locked), enable **Publish to players**, and click **Publish visible records**. The Player Pokédex receives the compressed image in the same Firestore publication.

If the player-visible name is still `Unknown Fire-type`, the artwork is **not included in the published record**. This prevents revealing the Pokémon's identity before the party discovers it.

The Player sighting editor also accepts local image uploads, but **player-created edits remain in that browser**; they are not automatically sent back to the GM or other trainers.

## Technical notes

- The browser accepts JPEG, PNG or WebP files up to 8 MB, then preserves the whole image in a centered square canvas and encodes a small WebP (55,000-character data URL limit, typically ~40 KiB).
- No new Firebase service, Firestore rule change, Firebase Storage or paid Firebase plan is needed.
- The upload takes precedence over a saved HTTPS artwork URL. **Remove uploaded image** restores the URL/standard automatic artwork fallback after saving.
- The existing shared publication is a **single Firestore document**. The GM publishing button now warns and stops if the JSON snapshot is over 850 KB; individual uploads are capped to keep a small party practical. With large galleries or lots of Pokémon, move images to Firebase Storage or separate image documents instead of inflating the shared snapshot.
- Source image backgrounds are **not automatically removed**. Framed mode presents them neatly, while Cutout mode works best for transparency.
- Uploaded files aren't added to GitHub repositories. The GM image remains in local browser storage until explicitly published to Firestore.
- All player-visible content remains gated by Firebase Authentication and GM approval. The existing GM repository/hosting source-code spoiler exposure is unrelated and still requires secure hosting.

## Test checklist

- Upload custom background art for a made-up Pokémon, save, reopen, and confirm the image is still visible in the GM wildlife list.
- Publish a revealed custom sighting, open the Player sightings page, and verify that image and style appeared.
- Change the visible name to `Unknown Fire-type`, publish again and verify the artwork is withheld.
- Remove the uploaded image, save, and confirm that the standard/URL image fallback resumes.
- Add a player-local image to a sighting and confirm it stays in their browser (not everybody else's).
