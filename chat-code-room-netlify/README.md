# Chat Code

A quick Netlify chat app where someone can create a room, copy the room link/code, and another person can join with that code.

## Deploy

Use Netlify with a Git repo or the Netlify CLI so the `netlify/functions` folder gets deployed. A plain static drag-and-drop upload will not run the chat backend.

1. Put these files in a GitHub repo.
2. In Netlify, choose **Add new site** then **Import an existing project**.
3. Pick the repo.
4. Keep the detected build settings from `netlify.toml`.
5. Deploy.

After it is live, open the site, type a name, press **Create Chat**, then copy the room button and send it to someone.

## Files

- `index.html` is the page.
- `styles.css` is the design.
- `app.js` handles the buttons and messages.
- `netlify/functions` stores chat rooms and messages with Netlify Blobs.
