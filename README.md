# Chronolite NG

Chronolite NG is a full-stack watch storefront built with:

- `Next.js` frontend in [`client/`](/home/joseph-bawo/Desktop/chronoliteng/client)
- `Express` + `MongoDB` backend in [`server/`](/home/joseph-bawo/Desktop/chronoliteng/server)

It includes:

- customer storefront and product detail pages
- cart flow
- account creation and sign-in
- admin authentication
- admin product upload, edit, and delete
- order creation on checkout
- admin order details and analytics

## Project Structure

```text
chronoliteng/
├── client/   # Next.js frontend
├── server/   # Express API, MongoDB models, admin seed script
├── package.json
└── README.md
```

## Requirements

- Node.js 20+
- npm
- MongoDB
  - local MongoDB, or
  - MongoDB Atlas

## Environment Setup

Create a backend env file from the example:

```bash
cp server/.env.example server/.env
```

Required variables:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/chronoliteng
JWT_SECRET=replace-with-a-long-random-secret
```

If you use MongoDB Atlas, replace `MONGO_URI` with your cluster connection string.

## Install Dependencies

From the project root:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

## Run The App

Run frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:client
npm run dev:server
```

Default local URLs:

- frontend: `http://localhost:3000`
- backend: `http://localhost:5000`

## Build

Frontend production build:

```bash
npm run build
```

## Seed The First Admin

Create or update the first admin user:

```bash
npm run seed:admin -- admin@chronolite.com admin12345 "Chronolite Admin"
```

Default admin credentials after seeding:

- email: `admin@chronolite.com`
- password: `admin12345`

## Admin Flow

1. Sign in as an admin user.
2. Admin users are redirected to `/admin/dashboard`.
3. From the dashboard you can:
   - upload products
   - edit products
   - delete products
   - review order details
   - view analytics

## Order Flow

- signed-in users can check out from the cart
- checkout creates a real backend order
- admin dashboard shows recent orders and revenue stats

## Uploaded Assets

Product images are uploaded to:

```text
server/uploads/
```

These files are ignored by git through [`.gitignore`](/home/joseph-bawo/Desktop/chronoliteng/.gitignore).

## Git Notes

Sensitive local files are excluded in [`.gitignore`](/home/joseph-bawo/Desktop/chronoliteng/.gitignore), including:

- env files
- uploaded assets
- local database dumps
- private key/certificate files

## Known Notes

- if you change `client/next.config.js`, restart the frontend dev server
- if you add backend models/routes/controllers, restart the backend dev server

