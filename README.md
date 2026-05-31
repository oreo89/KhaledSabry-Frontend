# Shirt Commerce Frontend

Next.js frontend for the existing .NET API.

## Run

```bash
npm install
npm run dev
```

The React app calls the deployed backend directly by default:

```bash
https://khaledsabry-backend-6lda.onrender.com
```

Override it with `NEXT_PUBLIC_API_BASE_URL`. You can provide either the backend root URL or the `/api` URL.
