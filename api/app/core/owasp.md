# OWASP Top 10 API — WasteLens

## API1: Broken Object Level Authorization
All requests to `/predict` require a valid JWT (`Depends(verify_token)`).
`/health` and `/login` are intentionally public.

## API2: Broken Authentication
- JWT tokens signed with HS256, 24h expiration.
- `JWT_SECRET` loaded from `.env`, never hardcoded.
- Authentication via username/password: password is hashed with **bcrypt** (cost 12).
- The token contains only `sub` and `exp`, no sensitive data.

## API3: Broken Object Property Level Exposure
Responses are typed using `PredictResponse` (Pydantic): only
`predicted_class`, `confidence`, and `bin_recommendation` are exposed.
No internal data (model weights, paths, config) is returned.

## API4: Unrestricted Resource Consumption
- Upload size limited to 10 MB.
- Magic bytes validation before PIL decoding.

## API8: Security Misconfiguration
- All secrets (`APP_USERNAME`, `APP_PASSWORD_HASH`, `JWT_SECRET`) are stored in `.env`, outside the git repository.
- `.env` is included in `.gitignore`.

## API9: Improper Inventory Management
- Only one production environment is exposed.
- The API version is tracked via the `VERSION` variable in `.env`
  and exposed on `GET /health`.
- No debug or staging endpoints are exposed in production.

## Not applicable
- **API5 (Function Level Authorization)**: only one access level, no roles.
- **API6 / API7 (Injection, SSRF)**: no database, no requests
  to client-provided URLs.
