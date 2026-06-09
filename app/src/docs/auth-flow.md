# Authentication Flow — WasteLens Frontend

## Login
1. User submits username/password on LoginScreen
2. POST /api/login → FastAPI verifies bcrypt hash
3. JWT returned (expires in 24h, signed HS256)
4. Token stored in localStorage (key: wastelens_token)
5. User redirected to home screen

## Authenticated requests
- Every POST /api/predict includes Authorization: Bearer <token>
- Token injected automatically in api.js predict() function
- Token never hardcoded — always read from localStorage

## Token expiration
- On app load: JWT payload decoded client-side (atob)
- exp claim verified against Date.now()
- If expired: token cleared, user redirected to login
- If predict returns 401: token cleared, user redirected to login

## Logout
- clearToken() removes wastelens_token from localStorage
- History state cleared
- User redirected to login screen

## Security notes
- Password never stored client-side
- JWT payload contains only sub (username) and exp
- Token stored in localStorage (acceptable for this use case)
