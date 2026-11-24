# batchrx.com marketing site

Static Astro site for BatchRx. It is built from the BatchRx Figma brand: Poppins, Geist Mono, deep green / mint, and the diamond mark.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

Astro is pinned to 7.4.1 because later 7.4.x releases require Node ≥ 22.23.4.

## Structure

- `src/pages/index.astro`: the current homepage (v4: Cadvel-inspired, with a square grid, stepped section edges and isometric blocks). Sections live in `src/v4/`.
- `/v3` (`src/v3/`): clean white SaaS design in Inter, with a product-dashboard hero
- `/v2` (`src/v2/`): editorial serif design
- `/v1` (`src/components/`): first design
- `src/site.ts`: shared content: app URLs, stats, payers, PMS systems, wholesalers, testimonials

## Before launch

- Set `PUBLIC_DEMO_ENDPOINT` to a URL that accepts a JSON POST from the demo form, such as a CRM or form service.
- Confirm the app routes in `src/site.ts`: login, register, privacy and terms.
- Add real contact details (phone, email, address) to the footer.
- Verify the SOC 2 claim before adding it. It is deliberately left out for now.
