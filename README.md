# Hydrogen Contact Form (metaobjects and Admin API)

This example adds a simple contact form at `routes/index.tsx` and complementing api handler `/routes/api.contact-form.ts` to manage the creation of contact form metaobject entries on form submissions.

## The contact form metaobject definition:

- `name`: 'Contact Form',
- `type`: 'contact_form',
- `fields`: 
```ts[
  {
    key: 'name',
    value: fields.name,
    type: 'sigle_line_text'
  },
  {
    key: 'email',
    value: fields.email,
    type: 'sigle_line_text'
  },
  {
    key: 'date',
    value: fields.date,
    type: 'date'
  },
  {
    key: 'subject',
    value: fields.subject,
    type: 'single_line_text'
  },
  {
    key: 'message',
    value: fields.message,
    type: 'rich_text'
  }
]
```

### Requires the following additional `env vars`:

- `PRIVATE_ADMIN_API_TOKEN`: string; - WARNING: please ensure that the scope of this Admin API token is limited to `metaobjects write` only.
- `PRIVATE_ADMIN_API_VERSION`: string;

---

Hydrogen is Shopify’s stack for headless commerce. Hydrogen is designed to dovetail with [Remix](https://remix.run/), Shopify’s full stack web framework. This template contains a **minimal setup** of components, queries and tooling to get started with Hydrogen.

[Check out Hydrogen docs](https://shopify.dev/custom-storefronts/hydrogen)
[Get familiar with Remix](https://remix.run/docs/en/v1)

## What's included

- Remix
- Hydrogen
- Oxygen
- Shopify CLI
- ESLint
- Prettier
- GraphQL generator
- TypeScript and JavaScript flavors
- Minimal setup of components and routes

## Getting started

**Requirements:**

- Node.js version 16.14.0 or higher

```bash
npm create @shopify/hydrogen@latest --template hello-world
```

Remember to update `.env` with your shop's domain and Storefront API token!

## Building for production

```bash
npm run build
```

## Local development

```bash
npm run dev
```
