# Fix: Official Mega Evolution discovery and GM self-assignment

## Why Charizard X/Y were missing
The GM assignment dropdown previously enumerated **only** documents in `santara_mega_forms`. Custom Mega Charizard Z appeared because it had been registered; official Mega Charizard X and Y had not been manually added.

The assignment editor now:
1. Loads registered Santara Mega forms from Firestore as before.
2. Automatically queries `https://pokeapi.co/api/v2/pokemon-species/{regular-species}/` and finds varieties containing `-mega`.
3. Fetches official base stats, typing, ability and artwork for each official Mega through PokéAPI.
4. Displays those official Megas **together with** Santara custom Megas (e.g. Charizard X / Y / Z).
5. Gives GM-registered definitions precedence over an official form with the same display name, so a reworked Mega isn't silently replaced.
6. Saves the chosen form's snapshot onto the assigned Pokémon document. The regular Pokémon's original base stats are never overwritten.

You do **not** have to register official Mega forms to assign them. Imported official forms do not populate the GM-only custom content library unless you explicitly save one there.

If PokéAPI is unavailable, the editor reports a lookup error and continues offering saved custom forms. The official-forms lookup is cached per species during the current browser session.

## Fix: Authorized GM accounts assigning to themselves

Previously, the GM assignment dropdown and pre-save check required the target UID to appear in **approved Trainers** or **existing Pokémon requests**. A founding or delegated GM account with neither record could not select its own UID. The new editor always includes the **currently signed-in authorized GM's own Firebase UID** as an assignment target, labelled by their Trainer Card name or **My GM account**. This does not grant unauthorized users any permissions.

The Firestore validator also incorrectly treated recently introduced optional gimmick fields as *mandatory* on legacy Pokémon. This could cause an atomic assignment/party-slot swap involving an older Pokémon to fail with **Missing or insufficient permissions**. The new rules require the original core fields, while still validating every gimmick field that is present.

**GM create and edit permissions stay GM-only.** Neither Player Dex nor an unapproved account can modify a Mega template or assign itself Pokémon.

## Rollout (important)

1. In the **GM pull request**, copy the **entire feature-branch `firestore.rules` file** into Firebase Console → Firestore Database → Rules and **Publish**. GitHub merges do not deploy Firestore rules.
2. Merge the GM pull request and allow its website to deploy. Open GM Fieldwork → Trainer Pokémon using the refreshed sidebar link.
3. Make sure your existing account has **GM access** on the Account & GM Access page. If not, the founding GM must grant the role first. These changes do not self-grant privileges.
4. Choose **My GM account** (or your Trainer Card name) as the target Trainer. Choose regular **Charizard** as the species and **Fetch stats**.
5. Under **Mega Evolution form**, check for **Mega Charizard X**, **Mega Charizard Y**, and the custom **Mega Charizard Z**. Select Z, finish the ordinary Pokémon's data, and click **Assign to Trainer**.
6. Open the same Charizard in the Player Dex under this exact Firebase UID. Verify its regular base stats and that the assigned Mega Z form becomes available after the GM unlocks Mega Evolution. Mega Evolve/Revert should display the assigned 200 Sp. Atk form and return to regular Charizard.
7. With an older Pokémon already occupying the selected party slot, test swapping into that slot; the older Pokémon should no longer fail solely because it lacks optional gimmick fields.

The Play­er website already supports the assigned form snapshot and requires no code changes for this feature. The key remaining real-world checks are successful Firebase Rules **Publish**, successful authorized Firestore writes and Pokémon-API access in your browser.

## Validation
- Mocked official PokéAPI Charizard species lookup returns X/Y and excludes Gigantamax.
- Custom Mega Z is merged, and GM-defined reworks override official matches.
- Mocked authorized founding GM account with no Trainer approval/request successfully creates regular Charizard with Mega Z attached and 200 Sp. Atk.
- JavaScript parser and Firestore rules delimiter checks passed.
- Live Firebase security rules and browser writes cannot be verified from GitHub alone.
