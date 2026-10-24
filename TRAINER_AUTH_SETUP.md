# Verified Trainers & Trainer Cards — Setup

This update is staged on a feature branch. It DOES NOT change the live sites until the two pull requests are merged.

## Enable the authentication provider

In [Firebase Authentication](https://console.firebase.google.com/project/to-the-far-side-of/authentication/providers), turn on **Email/Password** under Sign-in method. Keep **Google** enabled for the GM.

## Apply the updated Firestore security rules

Copy the entire [firestore.rules](./firestore.rules) contents from this feature branch into [Firebase Firestore → Rules](https://console.firebase.google.com/project/to-the-far-side-of/firestore/rules) and click **Publish**. Do not just commit rules to GitHub: GitHub does not deploy them automatically.

IMPORTANT: These new rules replace public Pokédex read access with **verified and GM-approved access**. Apply them as part of the same rollout as the new Player website; the old Player site will no longer be able to read publication data without signing in. The GM site's publishing remains authorized.

## Deploy the two website changes

Merge the **GM Trainer approvals** pull request and the **Player Trainer Cards** pull request. GitHub Pages may need time to rebuild. Make sure both new deployments are available before inviting players.

## Test a player's registration

1. Open the Player Pokédex in a separate browser/private window.
2. Click **Create account**, enter an email and password (at least 6 characters).
3. Check the email inbox for the Firebase verification link. Follow it, return to the Player site, and click **I've verified my email**.
4. Click **Request Trainer access**; the player will see a waiting screen.
5. In your **GM Console → Trainer approvals**, confirm their email is someone you invited, then **Approve Trainer**.
6. The player should receive their Pokédex updates automatically. They can open **Trainer Cards** and save their chosen card colour, name, hometown, class, favorite type, partner Pokémon, badge count, and motto.
7. Verify another approved player can see that card in the roster, but cannot edit it. Test **Revoke access** as well.

## Important distinctions

- Email verification only proves that someone can access that inbox. It does not prove they're in your campaign: manually approve only known people.
- Full GM data remains browser-local and must still be backed up.
- Trainer Cards are shared with **approved** trainers; unpublished GM fieldwork remains in the separate GM app. A player's own journal notes remain browser-local.
- Player email/passwords are handled by Firebase Authentication. Never collect or store their passwords yourself.
- The GM HTML/repository currently contains embedded campaign spoilers and is public. Lock down access to that source and hosting separately; Firebase does not secure public website source code.
- Firebase's email sending has usage quotas. If verification messages aren't arriving, check Firebase Auth email templates, spam folders, and quota/error reporting.
