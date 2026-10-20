Aftermediate is a Next.js 16 career-guidance platform for Pakistani FSc, ICS,
I.Com, and A-Level students. It combines localized university, scholarship,
entry-test, career, and study-abroad data with authenticated AI assistants.

## Getting Started

Copy `.env.example` to `.env.local`, fill the required values described in
`docs/deployment.md`, then run:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000). Before the first production
deploy, apply `supabase/schema.sql`; for an existing deployment, apply the
latest files under `supabase/migrations/` in timestamp order.

Run `npm test`, `npm run lint`, and `npm run build` before shipping.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
