# Santara custom Pokémon artwork manager

This feature adds a **Manage Artwork** button under **GM Trainer Pokémon → Custom Pokémon & forms**. It works with custom Pokémon and alternate species templates as well as every registered Mega form, including forms imported from the Santara catalogue.

## How to use

1. Merge the GM pull request and hard-refresh the GM Pokémon page.
2. Open **Trainer Pokémon → Manage Artwork**.
3. Browse all registered forms, select **Custom species** or **Mega Evolutions**, or search by name.
4. Click a Pokémon to open its artwork editor.
5. Select a PNG, JPG or WebP from your computer, or enter an HTTPS artwork link.
6. The page previews the replacement. Leave the **Update previously assigned Pokémon** checkbox enabled to synchronize inherited artwork to Trainer parties, then click **Save artwork**.
7. To remove an image, use **Remove artwork** and confirm. To apply a previously saved image to assigned Pokémon later, use **Sync saved image**.

The uploader automatically resizes and compresses uploads into WebP data no larger than 150,000 characters. Source files must be under 5 MB. Transparent PNGs preserve transparency, but this tool does **not** remove photographic/art backgrounds automatically.

## What is changed and what is preserved

- The artwork fields on the existing Firestore species template or Mega form are updated using partial writes; **types, stats, abilities, moves, Pokémon levels, held items, and nickname are untouched**.
- Players already assigned custom species get the new template artwork when their current instance image is blank or still matches the previously saved template artwork.
- Players with attached Mega form snapshots get the updated Mega artwork when their snapshot image is blank or matches the previous template art. The **regular Pokémon image is never changed** by editing a Mega form.
- If a Trainer's Pokémon has its own different image, that individual image is preserved.
- Changes appear in the Player Dex through the existing Firestore listeners.
- You can turn off syncing for an edit; the new image then applies to future assignments only. Use **Sync saved image** later for blank/inherited images.
- Existing assignment snapshots and uploaded individual artwork are never recreated or replaced wholesale.
- If syncing assigned Pokémon fails partway through, the template artwork remains saved; an error explains the partial update. Retry with **Sync saved image** for blank/inherited records, or refresh a particular Pokémon from the GM editor when it has an obsolete nonmatching snapshot.

## Privacy and security

Only the authorized GM account can edit these fields. The feature uses the **existing Firestore collections and security rules**, so there are no new collections or rules to deploy.

Custom **species template artwork** is readable by approved Trainers. Registered **Mega form templates** remain GM-only until assigned to individual Pokémon; attached Mega snapshots are visible to their owner. Avoid using a secret form image on a player-visible custom species before it is supposed to be revealed.

Moves and abilities do not have independent image fields in the existing schema; this feature is specifically for Pokémon species/forms and their Mega variants.
