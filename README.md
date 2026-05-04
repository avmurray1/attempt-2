# The London Dreamhouse

A shared property comparison scorecard for flat hunting.

## Run Locally

```bash
npm start
```

Then open:

```text
http://localhost:4173
```

## Shared Updates

The app stores the property list on the server in:

```text
data/properties.json
```

Every open browser refreshes from the shared list every 5 seconds. When someone adds, edits, deletes, votes, or changes the light / ceilings score, everyone else sees the update automatically shortly after.

## Deploy As A Live Website

Deploy the whole folder to a Node-friendly host such as Render, Railway, Fly.io, or a small VPS.

Use:

```bash
npm start
```

Make sure the host keeps the `data/` folder persistent if you want saved properties to survive restarts. Some hosts need a persistent disk/volume for this.
