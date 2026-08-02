# Domain environment variables

Canonical public domain for sitemap, robots, Open Graph, and absolute URLs:

```env
# Preferred (any of these; first valid wins)
SITE_URL=https://www.worldway.net
NEXT_PUBLIC_SITE_URL=https://www.worldway.net
NEXT_PUBLIC_PRIMARY_DOMAIN=https://www.worldway.net

# Auth should match the primary domain in production
NEXTAUTH_URL=https://www.worldway.net
```

Optional secondary alias (redirects only — never used for canonical URLs):

```env
NEXT_PUBLIC_SECONDARY_DOMAIN=https://paid.example.com
```

## Rules

- Use a full origin with a real hostname that includes a TLD (e.g. `www.worldway.net`).
- Values like `mostafa-abdullah-academy` (no TLD) or the R2 bucket name are **rejected**.
- In production / on Vercel, if no valid env is set, the app falls back to `https://www.worldway.net`.
- `robots.txt` always advertises `https://www.worldway.net/sitemap.xml`.

## Vercel checklist

1. Project → Settings → Domains: add `www.worldway.net` (and apex if needed).
2. Environment Variables (Production): set `NEXT_PUBLIC_PRIMARY_DOMAIN=https://www.worldway.net` and `NEXTAUTH_URL=https://www.worldway.net`.
3. Redeploy so sitemap/robots regenerate.
4. In Google Search Console, submit `https://www.worldway.net/sitemap.xml` for the www property.
