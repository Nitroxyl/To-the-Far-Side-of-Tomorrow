# Pokémon assignment permission denial — targeted repair

> **Update — 27 October 2026:** Mega form linking now uses the independent `santara_pokemon_mega_assignments/{pokemonId}` collection; earlier instructions below about writing `megaForm` into the main Pokémon record are superseded. See [ISOLATED_MEGA_ASSIGNMENTS.md](./ISOLATED_MEGA_ASSIGNMENTS.md) for the current implementation and Firebase rules deployment steps.

## Why the last Firestore rules publication did not settle the issue

Firestore reports the same **Missing or insufficient permissions** result for a missing GM role, an invalid Pokémon payload, or an invalid *other* record inside the assignment's atomic batch. The GM screen previously replaced all these possibilities with a generic rules warning.

This update **does not assume the previous rules were unpublished**. It fixes an additional legacy-record write path and provides an on-screen diagnosis that names the attempted write and current account authorization.

## New GM capabilities

1. **Save Mega form only** appears when editing an already assigned Pokémon. It updates ONLY the Pokémon's `megaForm`, sets `megaActive=false`, and stamps `updatedAt`. It does not change its owner, HP, moves, base stats or party slot. Use this to attach Mega Charizard Z to a regular Charizard that is already on your trainer roster, even if it was created before the gimmick system existed.
2. **Pre-save validation** explains malformed source data rather than sending it to Firestore. In particular, the Mega snapshot must have six integer base stats (1–255), a short ability name, valid type list and acceptable HTTPS/WebP artwork. Our current Mega Charizard Z numbers (including 200 Sp. Atk) pass.
3. **More useful authorization diagnostics** appear only after Firestore rejects an assignment. The GM page refreshes the Firebase ID token and checks the currently signed-in UID's GM role *read-only*, then indicates whether the write also touched an occupied party slot or an outstanding Pokémon request. This does not claim to identify the exact failed Firestore rule.
4. **Legacy slot-swap compatibility:** Firestore Rules now permit authorized GMs to update only `slot` and `updatedAt` on older Pokémon, without requiring that old document to satisfy every newer field validator.
5. **Legacy Mega linking compatibility:** Authorized GMs may update only `megaForm`, `megaActive=false`, and `updatedAt` on older Pokémon. The rule still validates the Mega snapshot and requires it to match the original species.

Both compatibility exceptions are **GM-only**. Approved Trainers cannot edit custom Mega stats or use the exceptions to change someone else's Pokémon.

## Rollout

1. This change contains a **new** Firestore rule compared with the one you already published. Open the accompanying GM PR's `firestore.rules` on the feature branch, copy the full contents into **Firebase Console → Firestore Database → Rules → Publish**. Do this once, and check that Firebase accepts it.
2. Merge the GM PR and let GitHub Pages deploy, then use the refreshed **Trainer Pokémon** sidebar link. No Player website update is necessary.
3. Edit your existing regular Charizard in the GM Pokémon Manager. Choose **Mega Charizard Z**, and click **Save Mega form only**. The attached form should display 200 Sp. Atk upon Mega Evolution without replacing Charizard's base stats.
4. If you are creating a *new* Charizard rather than editing an existing one, use party slot **Storage (0)** for the first assignment to eliminate any additional occupied-slot update. Then move it into your intended party slot afterward.
5. If a denial persists, the updated page will say whether Firebase sees a verified delegated GM account or an incomplete role/token and whether the operation includes a slot swap. This is the diagnostic to use next; waiting or repeatedly republishing identical rules won't fix it.

The new files are `pokemon-assignment-check.js` and `tests/pokemon-assignment-diagnostics.test.mjs`; the GM repository's `pokemon-party.js`, `firestore.rules`, and versioned HTML links are also updated. Source syntax checks, client payload simulations and isolated Mega write mocks passed. Actual Firestore authentication and database writes cannot be verified without a signed-in live session.
