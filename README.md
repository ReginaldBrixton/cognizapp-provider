# CognizApp Provider Portal

Provider portal for the CognizApp platform.

## Prerequisites

- [Bun](https://bun.sh/) (JavaScript runtime and package manager)
- CognizApp Backend API running on port 4040

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

The default configuration points to:

- Backend API: `http://localhost:4040`
- Production API: `https://api.cognizapp.com`

### 3. Start the Backend API

**IMPORTANT:** The provider portal requires the CognizApp Backend API to be running first.

In a separate terminal, start the backend API service:

```bash
cd ../cognizapp-backend-api
bun run dev
```

The backend API should start on port 4040.

### 4. Start the Provider Portal

Once the backend service is running, start the provider portal:

```bash
bun run dev
```

The provider portal will be available at `http://localhost:3002`

## Development

### Available Scripts

- `bun run dev` - Start development server with Webpack
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run lint:fix` - Fix ESLint errors
- `bun run type-check` - Run TypeScript type checking
- `bun run format` - Format code with Prettier
- `bun run test` - Run tests

### Project Structure

```
cognizapp-provider/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── provider/          # Provider workspace
│   │   ├── dashboard/     # Provider dashboard
│   │   ├── inbox/         # Request inbox & workspace
│   │   └── _lib/          # Provider utilities
│   └── api/               # API routes
├── components/            # Shared React components
├── lib/                   # Utilities and services
└── public/               # Static assets
```

## Troubleshooting

### "Fetch failed" Error

If you see errors like:

```
[fetchProviderData] Fetch failed: {}
```

This means the backend service is not running. Make sure:

1. The backend service is running on port 4040
2. Check with: `lsof -i :4040` (Mac/Linux)
3. Start the backend API: `cd ../cognizapp-backend-api && bun run dev`

### Port Already in Use

If port 3002 is already in use, you can specify a different port:

```bash
PORT=3002 bun run dev
```

## Authentication

The provider portal uses token-based authentication with role checks:

- Provider users can access `/provider/*` routes
- Non-provider users are redirected to login

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:

- `BACKEND_URL` - Backend API URL (default: `http://localhost:4040`)
- `NEXT_PUBLIC_BACKEND_URL` - Public backend URL
- `NEXT_PUBLIC_BACKEND_PRODUCTION_URL` - Production backend URL

## Deployment

The provider portal is deployed to Vercel. Push to the `main` branch to trigger a deployment.

## License

MIT
