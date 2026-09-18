# Development API

- `GET /api/info`: application name and setup status.
- `GET /health`: process liveness (no database required).
- `GET /health/ready`: 200 when the database schema is available, otherwise 503.
- `GET /openapi/v1.json`: OpenAPI document, enabled only in Development.

Content and authentication endpoints in the main README are planned contracts.
