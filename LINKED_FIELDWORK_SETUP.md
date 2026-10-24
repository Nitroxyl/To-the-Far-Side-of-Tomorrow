# Santara Fieldwork — Linked records and Pokémon artwork

The Fieldwork dashboard now links **sites, research quests, wildlife sightings, and session visits**.

## GM workflow

1. Open **Atlas & discoveries** and click **◈ Connections** on a location (e.g. Research Station E-03). The inspector shows related requests, local Pokémon, and previous recorded session visits. Tap any related entry to inspect that record.
2. Click **View / edit** on a site or quest. The form now has a **FIELDWORK CONNECTIONS** section with checkboxes to associate requests, local Pokémon, and locations. Opening a quest or wildlife record lets you pick its linked locations directly.
3. Create a **Session log**. In its editor, check the locations visited. Session visits then show up on the corresponding locations, even if its free-text `where` field differs.
4. Make the desired records **Publish to players** and change any Hidden/Locked stages appropriately. Use the existing **Publish visible records** Firestore button.

The starter-kit links are preserved:
- Research Station E-03 → **A Routine Field Assignment** and **Wimpod**.
- Tideglass Mangroves → **A Routine Field Assignment** and **Krabby**.
- Old Brickworks → **An Unusual Sighting** and **Charcadet** (visible only after being published).
- Kingler's Basin → **The Giant Claw** and Alpha Kingler (visible only when published).

Links added to other locations can be edited from the location itself, from the quest, or from the wildlife entry. The underlying quest `linked` IDs remain compatible with the original starter kit.

## Player Pokédex

The Player Pokédex receives only connections between **records actually included in the GM's player-safe publication**. Unpublished quests, locations, true species names and GM-only notes are omitted.

The player sees **◈ Connections** on existing records and can navigate from locations to public requests, sightings and journaled session visits. Personal notes still save locally as before. The new relation fields are additional fields in the existing Firestore publication document; **no Firestore security rule changes are necessary**.

## Automatic Pokémon artwork

Wildlife and sighting cards request official artwork from **PokéAPI** by their player-visible species name. Examples: Wimpod, Wingull and Kingler (Alpha) resolve to familiar artwork. Unidentified sightings (such as “Unknown Fire-type”) do not trigger an image lookup, so they cannot reveal the hidden species.

In **GM → Wildlife records → Edit**, you can set **Custom artwork URL (HTTPS, optional)** for your own Pokémon, forms, fossil restorations, or artwork you want to override. Only set player-safe artwork when making a wildlife record public. Players can also add a personal artwork link to their own local sighting notes.

Unrecognized species and unavailable artwork display a neutral placeholder instead of misleading imagery. Image availability needs an internet connection and depends on PokéAPI/its sprite host.

PokéAPI sources: https://pokeapi.co/docs/v2 and https://github.com/PokeAPI/sprites .

## Deployment

Merge the GM and Player linked-record pull requests independently. Both websites will continue to use their existing Firebase connections. After GitHub Pages updates, refresh the websites and test:

- Research Station E-03 → Connections → Wimpod and A Routine Field Assignment.
- Edit a location → choose linked Pokémon / requests → Save → reopen the inspector.
- Check an Alpha or unrevealed wildlife entry remains hidden in the Player Pokédex until published.
- Publish a visible record, verify linked records on the Player page, and confirm an unpublished record doesn't show.
- Record a new session visit and see it in the site connection inspector.
- For custom Pokémon, set a safe HTTPS image URL and verify it appears.

**Important:** the GM repository's HTML currently embeds private campaign spoilers in a public GitHub repo. Firestore authorization cannot hide publicly accessible HTML source; protect GM hosting/repository separately.
