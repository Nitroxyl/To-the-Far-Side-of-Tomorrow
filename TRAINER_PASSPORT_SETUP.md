# Santara Trainer Passport Studio

This feature adds a full-screen **Trainer Passport** page to the Player Pokédex at `trainer.html`. It uses the existing Firebase login and Firestore database.

## What players get

- A dedicated individual profile page connected to their verified, GM-approved Firebase account.
- Read-only views of other Trainers' cards from the roster (only the owner may edit).
- A live preview with preset themes, two independently editable card colours, and background patterns.
- Trainer name, class, title, hometown, partner Pokémon, favourite type, gym badges, emblem, and motto.
- Six cosmetic team name slots, which do not affect actual combat rosters.
- Upload a custom **portrait** and **background banner**, or remove either.

## Image handling and cost

Photos are processed entirely in the browser, cropped/resized, encoded to WebP, and stored in the owner's Firestore Trainer Card document. Size is limited to approximately 130,000 characters for the portrait and 230,000 for the banner, well below Firestore's document maximum. The server rules independently cap these at 150,000 and 260,000 characters.

**No Firebase Storage bucket or Blaze upgrade is required.** This is suitable for a small D&D party, not a large-scale photo gallery. Since images travel with the Firestore document, each card may be substantially larger than ordinary text-only records. If the party later needs lots of photos or larger images, migrate images to Cloud Storage.

Only verified/approved Trainers can read and list the Trainer Card documents. Never upload photos the players do not want to share within the group.

## How to deploy

1. Open the [GM `firestore.rules`](./firestore.rules) file **on this feature branch**, copy its complete contents into [Firebase Console → Firestore Database → Rules](https://console.firebase.google.com/project/to-the-far-side-of/firestore/rules), and click **Publish**. These new rules add the portrait/banner/team/colour fields. GitHub commits do not deploy Firebase rules automatically.
2. Merge the separate **Player Trainer Passport Studio** pull request. The GM dashboard does not need new UI code for this feature.
3. After GitHub Pages deploys, open the Player Pokédex, then **Trainer Cards → Customize my Trainer Card**. It opens `trainer.html`.
4. Choose a colour theme, add a portrait and banner (optional), fill in the details, and click **Save Trainer Card**.
5. Return to the roster and open a different player's card. Confirm that it is read-only.
6. Test that a revoked or unapproved account cannot access card details.

**Rollout caveat:** The original Trainer Card inline editor writes the older schema and may be blocked by the new rules during the brief window before the Player site deploys. After the Player site deploys, the roster links to the standalone editor.

## Security and known limitations

- These card pages use the existing Firebase approval and verification rules. They never query unpublished GM location or plot data.
- Profile images are shared with your approved group, but **not public website visitors** through Firestore rules.
- **GM source-code privacy is a separate issue:** The public GM GitHub repository still embeds plot spoilers; Firestore doesn't hide public source code.
- All fields are bounded and image data must be small WebP data URLs. The Trainer Card remains editable only by the owner.
- The features haven't been verified against the live Firebase database yet; test after deploying rules and the new player code.
