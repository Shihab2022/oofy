# OOFY — Modern Fashion E-commerce

**Wear Your Confidence**

A premium, minimal, mobile-first fashion e-commerce website for OOFY, a Bangladesh-based menswear brand. Built with Next.js 14 (App Router), Express.js, TypeScript, PostgreSQL, Prisma ORM, Tailwind CSS, and shadcn/ui.

## Tech Stack

### Frontend (`front-end/`)
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React
- Framer Motion
- React Hook Form + Zod
- Axios

### Backend (`backend/`)
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT authentication
- bcrypt password hashing
- Nodemailer (SMTP)
- Rate limiting, Helmet, CORS

## Project Structure

```
oofy/
├── front-end/          # Next.js 14 frontend
│   ├── src/
│   │   ├── app/        # App Router pages
│   │   ├── components/ # UI components (shadcn/ui + custom)
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utilities & API client
│   │   ├── services/   # API service functions
│   │   ├── types/      # TypeScript type definitions
│   │   └── utils/      # Helper functions
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/            # Express.js backend API
│   ├── src/
│   │   ├── config/     # Database & env config
│   │   ├── controllers/# Route controllers
│   │   ├── middlewares/# Auth, error, validation
│   │   ├── routes/     # API route definitions
│   │   ├── services/   # Email service
│   │   ├── validators/ # Zod schemas
│   │   └── utils/      # Error & async handlers
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── seed/
│   │   └── seed.ts     # Database seed script
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

## Features

### Customer-Facing
- **Home page** — Hero banner, featured collections, new arrivals, best-sellers, promotional banners, brand intro, newsletter signup
- **Shop page** — Product grid with category/price/size filtering, sorting, search, pagination
- **Product details** — Image gallery, size/color selection, stock validation, add to cart, related products
- **Cart** — Persistent client-side cart with quantity updates, remove items, subtotal/delivery/total calculation
- **Checkout** — Guest checkout (no account required), Zod validation, order summary, Cash on Delivery
- **Order confirmation** — Order number, summary, delivery confirmation
- **About page** — Brand story, philosophy, mission
- **Contact page** — Contact form, email (oofybrand@gmail.com), social links

### Admin Dashboard (`/admin`)
- **Dashboard** — Total orders, products, pending/completed orders, total sales, recent orders
- **Product Management** — Create, edit, delete products; manage images, categories, prices, discounts, sizes, colors, inventory, featured/new arrival flags, publish/unpublish
- **Order Management** — View all orders, order details, search by order number/customer phone, filter by status, update order status
- **Settings** — Store information, contact email, delivery charges, payment methods, email configuration

### Security
- JWT authentication for admin (httpOnly cookies)
- bcrypt password hashing
- Rate limiting on API routes
- Helmet security headers
- CORS configuration
- Input validation with Zod
- Server-side price and stock validation (never trust frontend prices)
- Order placement in database transaction with inventory updates

## Installation

### Prerequisites
- Node.js v20 or higher
- PostgreSQL database
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/Shihab2022/oofy.git
cd oofy
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database URL and SMTP credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/oofy"

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed the database (creates admin user, categories, products, settings)
npm run seed

# Start the development server
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd front-end

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit NEXT_PUBLIC_API_URL if your backend runs on a different port
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Start the development server
npm run dev
```

Frontend runs on `http://localhost:3000`

### 4. Access the Application

- **Storefront**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login
- **Admin Dashboard**: http://localhost:3000/admin

### Default Admin Credentials

- **Email**: admin@oofy.com
- **Password**: Admin@123

(These are configured via `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables)

## Database Schema

The Prisma schema (`backend/prisma/schema.prisma`) includes the following models:

| Model | Description |
|-------|-------------|
| Admin | Admin users (authentication only) |
| Category | Product categories (T-shirts, Shirts, Hoodies, Handkerchiefs) |
| Product | Products with name, slug, price, discount, featured/new flags |
| ProductImage | Multiple images per product |
| ProductVariant | Size/color/stock/SKU variants per product |
| Order | Customer orders with totals, status, payment method |
| OrderItem | Individual items in an order (with historical pricing) |
| Address | Customer delivery addresses |
| Customer | Guest customer records (phone-based, no account) |
| StoreSettings | Store name, tagline, email, delivery charges |
| Payment | Payment records (extensible for bKash, Nagad, etc.) |
| EmailSettings | SMTP configuration |

## Email Configuration

Order confirmation emails use Nodemailer with SMTP. Configure in `backend/.env`:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
SMTP_FROM=noreply@oofy.com
SMTP_FROM_NAME=OOFY
COMPANY_EMAIL=oofybrand@gmail.com
```

The company notification email is sent to `COMPANY_EMAIL` (default: `oofybrand@gmail.com`).

## Payment Methods

Currently supports **Cash on Delivery (COD)**. The payment module is structured to integrate bKash, Nagad, and other gateways later. See `backend/src/controllers/order.controller.ts` and `backend/src/models/Payment` for extensibility.

## Scripts

### Backend
| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with tsx |
| `npm run build` | TypeScript compile |
| `npm start` | Start production server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run seed` | Seed database with initial data |

### Frontend
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Deployment

### Backend (Node.js + PostgreSQL)
1. Set `NODE_ENV=production` in `.env`
2. Build: `npm run build`
3. Start: `npm start`
4. Ensure PostgreSQL is running and accessible
5. Set up a reverse proxy (nginx) if needed

### Frontend (Next.js)
1. Set `NEXT_PUBLIC_API_URL` to your production backend URL
2. Build: `npm run build`
3. Start: `npm start`
4. Or deploy to Vercel, Netlify, etc.

## Testing the Shopping Workflow

1. Visit http://localhost:3000
2. Browse products on the home page or shop page
3. Add a product to cart (select size first if applicable)
4. Go to cart and proceed to checkout
5. Fill in customer details (name, Bangladesh phone, address, district, area)
6. Place order (Cash on Delivery)
7. View order confirmation with order number
8. Log in to admin at /admin/login to manage orders and products

## License

MIT

## Brand

**OOFY** — Wear Your Confidence  
Bangladesh-based premium menswear  
Email: oofybrand@gmail.com
