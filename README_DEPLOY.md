# Middara Combat Helper V2.2F Hosted / PWA Package

This folder is ready to upload to GitHub Pages, Netlify, Cloudflare Pages, or another static host.

## Files

```text
index.html
manifest.webmanifest
service-worker.js
.nojekyll
icons/
  icon-192.png
  icon-512.png
  apple-touch-icon.png
  favicon.svg
```

## GitHub Pages setup

1. Open your `middara-combat-helper` repository.
2. Export a full snapshot from your current hosted app before replacing anything.
3. Upload all files and folders from this package to the repository root.
4. Commit the changes.
5. In GitHub, go to **Settings > Pages**.
6. Use **Deploy from a branch**, branch `main`, folder `/ (root)`.
7. Open the Pages URL after the deployment finishes.

## iPhone install

1. Open the GitHub Pages URL in Safari.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Name it `Middara Helper`.
5. Open it from the Home Screen icon.

## Updating later

Before replacing `index.html`, always do:

```text
Data > Export full snapshot > Download JSON
```

After deploying a new version, open the app and use:

```text
Data > V2.2F hosted / installable web app > Update app cache
```

Then reload the app if the old version is still visible.

## Save data warning

Do not upload save snapshots or campaign notes to a public repository. The app uses browser localStorage, which is tied to the exact hosted URL. A different GitHub repo name, custom domain, or local file path will have a different save area. Use full snapshot export/import when moving between URLs or devices.

## Offline behavior

After the first successful hosted load, the service worker caches the app shell for offline fallback. It uses network-first loading for `index.html`, so normal GitHub Pages updates should be picked up when online. If the browser holds an old version, use the in-app PWA panel to update or clear the app cache only.


## Remi app icon refresh

This package uses the supplied square Remi artwork for the Home Screen / PWA icon files. Upload the extracted `icons/` folder together with `index.html`, `manifest.webmanifest`, and `service-worker.js` so Safari and GitHub Pages can pick up the new icon set. If your phone still shows the old icon, remove the old Home Screen shortcut, open the site in Safari, run **Data -> V2.2F hosted / installable web app -> Update app cache**, then add it to the Home Screen again.


## V2.2F notes

This build keeps the hosted/PWA deployment package and adds mobile/tablet target/action/apply flow polish: attack/spell roll trays are moved next to the Mobile combat flow, selected actions no longer fall back to stale spell results, Apply labels say what they will apply, and Eliphie support actions now prompt for a support target before firing.


## V2.2F notes

- Mobile flow is now ordered Actor -> Target -> Action -> Resolve.
- Attack/Spell actions wait for an encounter target before jumping to the roll tray.
- The sticky Apply button stays locked to the selected action and changes to Applied ✓ after use.
- Eliphie support actions require an explicitly selected support target from the Target drawer before applying.


## V2.2F notes

V2.2F makes the Mobile/Tablet Combat Flow the first Play screen, hides the older Play cockpit in focused mode, adds quick encounter enemy setup from the target drawer, adds a Target + Attack shortcut, strengthens selected-target visibility, and adds confirmation before Command support actions apply to a support target.
