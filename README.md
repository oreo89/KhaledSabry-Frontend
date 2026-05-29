# Shirt Commerce Frontend

Next.js frontend for the existing .NET API.

## Run

```bash
npm install
npm run dev
```

The app proxies API calls through `/api/backend/*` to avoid browser CORS issues. By default it targets:

```bash
https://khaledsabry-backend.onrender.com
```

Override it with `API_BASE_URL` or `NEXT_PUBLIC_API_BASE_URL`.
