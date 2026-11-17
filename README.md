# M365 — Exchange Operations Hub

## Upload and open
Upload index.html, the assets folder and .nojekyll to the root of your M365 repository. In repository Settings → Pages, choose Deploy from a branch, main, and /(root), then Save. Open https://glennarmbruster.github.io/M365/ after GitHub completes deployment. Everything needed to run the app is already built.

## Your records
Cases and history are saved in this browser's IndexedDB storage. Each device and browser has its own workspace. Use History → Export workspace for backups. On another device, use History → Import backup, review the counts, then Replace workspace. Export the current workspace before replacing it if it contains work you want to retain.

Clearing site data removes this browser's records. Private browsing can also remove records when the session ends. Export regularly. Store backups privately, outside the GitHub repository. The app's code and reference index follow the site's visibility. Your saved cases are kept in browser storage, with no upload to GitHub.

Existing JSON exports from the ChatGPT Site and standalone version are supported. Tabs on the same browser detect conflicting saves and ask you to reload.

## Future code changes
The source is in app/ with main.tsx and build.mjs. An editor can run npm ci and npm run build to regenerate the ready-to-upload index.html and assets. Running the website does not require Node.js, a database server or ChatGPT sign-in.

The cmdlet library includes 3,079 module/cmdlet entries (2,850 distinct names), task-based search, workload filters, and Microsoft syntax, parameter details and examples. See [REFERENCE-SOURCES.md](REFERENCE-SOURCES.md) for counts, coverage and source attribution. Run `npm test` before building changes. Microsoft announcements are tracked manually.
