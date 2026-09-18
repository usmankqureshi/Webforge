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
