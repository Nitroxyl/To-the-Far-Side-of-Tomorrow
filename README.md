# Santara Fieldwork – private GM workspace

Upload the three `.html` files together to the SAME folder in a **private** repository, or open `index.html` from your computer.

- `index.html`: Landing page with both views.
- `Santara_Fieldwork_GM_Console.html`: GM console, with a **Switch to Player View** link.
- `Santara_Player_Pokedex.html`: Player preview, with a **Switch to GM Console** link.

The two links work through relative paths, so they work on the same folder locally or on a static host.

## Save behavior

Each page saves to that browser's localStorage, not to GitHub. Pushing source code won't sync live notes. Use the built-in JSON export/import tools for updates and backups. Your existing browser data persists when the origin and the page's key stay the same, but moving from `file://` to GitHub Pages may use a different save location: export a backup *before* moving, then import it at the new URL.
