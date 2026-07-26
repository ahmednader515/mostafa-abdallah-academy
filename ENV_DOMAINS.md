# Domain environment variables

- `NEXT_PUBLIC_PRIMARY_DOMAIN`: the canonical public domain, with or without `https://`. It is used for sitemap URLs, robots metadata, and canonical URLs.
- `NEXT_PUBLIC_SECONDARY_DOMAIN`: an optional alternate domain for redirects or deployment configuration. It must not be used to generate canonical URLs.

If `NEXT_PUBLIC_PRIMARY_DOMAIN` is absent, development metadata uses `http://localhost:3000`.
# Dual-domain SEO setup for WorldWay

# Primary (canonical) domain — used by sitemap, robots, and Open Graph
NEXT_PUBLIC_PRIMARY_DOMAIN=https://www.example.com

# Secondary (alias / paid) domain — point both domains at the same Vercel project
NEXT_PUBLIC_SECONDARY_DOMAIN=https://paid.example.com

# Auth / absolute URLs should use the primary domain
NEXTAUTH_URL=https://www.example.com

# In Vercel:
# 1. Add both domains to the project
# 2. Set the env vars above
# 3. Prefer the primary domain for canonical metadata (layout uses PRIMARY)
