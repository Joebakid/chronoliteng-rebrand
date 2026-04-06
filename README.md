# Chronolite NG

Chronolite NG is a full-stack watch storefront built with:

- `Next.js` frontend in `client/`
- `Firebase` backend (Firestore, Auth, Storage, Cloud Functions) in `function/`

It includes:

- customer storefront and product detail pages
- cart flow
- account creation and sign-in (Firebase Auth)
- admin authentication
- admin product upload, edit, and delete (Cloudinary)
- order creation on checkout (Paystack)
- admin order details and analytics

## Project Structure

```text
chronoliteng/
├── client/       # Next.js frontend
├── function/     # Firebase Cloud Functions
│   ├── functions/  # Cloud Functions code
│   └── src/        # Firebase triggers and lib
├── package.json
└── README.md
```

## Requirements

- Node.js 20+
- npm
- Firebase account (Firebase Console)
- Cloudinary account (for image uploads)
- Paystack account (for payments)

 

## Install Dependencies

From the project root:

```bash
npm install
npm install --prefix client
npm install --prefix function/functions
```

## Run The App

Run the Next.js frontend:

```bash
cd client
npm run dev
```

Default local URL: `http://localhost:3000`

To run Firebase Cloud Functions locally:

```bash
cd function
firebase emulators:start
```

## Build

Frontend production build:

```bash
cd client
npm run build
```

## Firebase Deployment

Deploy to Firebase Hosting:

```bash
firebase deploy
```

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
- checkout creates a real backend order via Paystack
- admin dashboard shows recent orders and revenue stats

## Uploaded Assets

Product images are uploaded to Cloudinary.

## Git Notes

Sensitive local files are excluded in `.gitignore`, including:

- env files
- private key/certificate files

## Known Notes

- if you change `client/next.config.js`, restart the frontend dev server
- if you modify Firebase Cloud Functions, redeploy with `firebase deploy --only functions`
