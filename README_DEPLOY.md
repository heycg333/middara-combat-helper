# Middara Combat Helper V2.3B Header Stability

This folder is the GitHub Pages root for Middara Combat Helper V2.3B.

## Upload

Upload these extracted files to the root of your GitHub repository:

- `index.html`
- `manifest.webmanifest`
- `service-worker.js`
- `.nojekyll`
- `CURRENT_VERSION.txt`
- `README_DEPLOY.md`
- `icons/`

Do not upload the ZIP file itself as the app.

## After deployment

1. Wait for GitHub Pages to finish publishing.
2. Open the hosted app on the tablet.
3. Go to **Data > V2.3B hosted / installable web app**.
4. Tap **Update app cache**.
5. Reload or reopen the Home Screen app.
6. Confirm the app shows V2.3B.

## V2.3B notes

- Fixes the header/subtitle text loop that caused the page to jump every few seconds.
- Keeps V2.3A Rook defensive/counter shortcuts.
- Keeps explicit Spell Empower checkbox behavior.
- Keeps auto-calc live flow: Actor -> Target -> Action -> Dice -> Apply.

## Save-state reminder

The app is local-first. Saves are stored in this browser for this hosted URL. Multiple devices do not sync live. Export a full snapshot before updating if you are preserving active game state.
