# Webforge Angular client

Requires Node.js 24 LTS. From this directory:

```bash
npm ci
npm start
```

Open http://localhost:4200. Start the API on http://localhost:5080 first; the
configured development proxy forwards API, health, and OpenAPI requests there.
The starter page reports the API connection status.

```bash
npm run build
npm test -- --watch=false
```

Production output is in `dist/webforge-angular/browser`. The Docker image serves
it with Nginx and proxies backend requests to the Compose API service.
See the [root README](../../README.md#getting-started) for SQL Server, migrations,
and full-stack Docker startup. Content management features are still planned.

## Post body editor

Create and edit pages use TinyMCE with the official Angular integration. TinyMCE
is self-hosted with `licenseKey="gpl"`; no Tiny Cloud API key is needed.
The Angular build copies its scripts, plugins, and skins to `/tinymce`.
Editor options are in `src/app/rich-text.ts`. Bodies are saved as HTML; existing
plain-text posts are escaped and converted to paragraphs when opened.

This setup uses TinyMCE under GPLv2+. See the
[TinyMCE licensing documentation](https://www.tiny.cloud/docs/tinymce/latest/license-key/).
