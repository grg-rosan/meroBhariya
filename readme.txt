meroBhariya 🚚

Live: https://merobhariya.me/

A robust logistics and delivery platform that connects merchants with riders (porters).
Built with the PERN stack and containerized for scalability, meroBhariya handles everything from real-time geospatial tracking to secure role-based access.


Features

- Role-Based Access Control (RBAC) — Distinct dashboards and permissions for Admins, Dispatchers, Riders, and Merchants
- Geospatial Capabilities — Location tracking and distance calculation powered by PostGIS
- Real-Time Updates — Live delivery status and notifications via WebSockets
- Message Brokering — Asynchronous task handling via RabbitMQ
- Document Verification — Admin-controlled rider and merchant document review workflow
- COD Management — Cash-on-delivery tracking, remittance, and reconciliation
- Fare Engine — Dynamic fare calculation based on distance, weight, vehicle type, zone surcharges, and fragile/COD charges
- Rider Wallet — Earnings tracking, payout requests, and transaction history
- Insurance Claims — Merchant-initiated claims for lost or damaged shipments
- Khalti Payment Integration — Online prepaid payment support for merchants
- Containerized Workflow — Fully orchestrated using Docker Compose for consistent development and deployment


Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Frontend       | React, Tailwind CSS, Vite               |
| Backend        | Node.js, Express                        |
| Database       | PostgreSQL + PostGIS                    |
| ORM            | Prisma                                  |
| Auth           | JWT (Role-based)                        |
| Real-Time      | Socket.IO                               |
| Cache          | Redis                                   |
| Message Broker | RabbitMQ                                |
| Payments       | Khalti                                  |
| Storage        | Cloudinary                              |
| Logging        | Winston + BetterStack                   |
| DevOps         | Docker, Docker Compose                  |
| Frontend Host  | Vercel                                  |
| Backend Host   | Render                                  |


Prerequisites

Before getting started, ensure you have the following installed:
- Docker Desktop — https://www.docker.com/products/docker-desktop
- Node.js — https://nodejs.org/ (for local linting/testing only)


Getting Started

1. Clone the repository

git clone https://github.com/grg-rosan/meroBhariya.git
cd meroBhariya

2. Configure environment variables

Create a .env file at the project root (same level as docker-compose.yml)

| Variable                | Description                              |
|-------------------------|------------------------------------------|
| POSTGRES_USER           | PostgreSQL username                      |
| POSTGRES_PASSWORD       | PostgreSQL password                      |
| POSTGRES_DB             | PostgreSQL database name                 |
| DATABASE_URL            | Full PostgreSQL connection string        |
| JWT_SECRET              | Secret key for JWT signing               |
| JWT_EXPIRES_IN          | JWT expiry duration (e.g. 7d)            |
| RABBITMQ_URL            | RabbitMQ connection string               |
| REDIS_URL               | Redis connection string                  |
| EMAIL_HOST              | SMTP host (e.g. smtp.gmail.com)          |
| EMAIL_PORT              | SMTP port (e.g. 587)                     |
| EMAIL_USER              | SMTP email address                       |
| EMAIL_PASS              | SMTP app password                        |
| KHALTI_SECRET_KEY       | Khalti secret key                        |
| KHALTI_BASE_URL         | Khalti API base URL                      |
| CLOUDINARY_CLOUD_NAME   | Cloudinary cloud name                    |
| CLOUDINARY_API_KEY      | Cloudinary API key                       |
| CLOUDINARY_API_SECRET   | Cloudinary API secret                    |
| BACKEND_URL             | Public backend URL                       |
| FRONTEND_URL            | Public frontend URL                      |
| SEED_ADMIN_EMAIL        | Email for the seeded Super Admin         |
| SEED_ADMIN_PASSWORD     | Password for the seeded Super Admin      |
| NODE_ENV                | development or production                |

3. Spin up the containers

docker compose up --build

This will launch the database, RabbitMQ, Redis, backend, and frontend services simultaneously.
On first run, the backend will automatically run Prisma migrations and seed the database.

4. Access the application

| Service             | URL                          |
|---------------------|------------------------------|
| Frontend            | http://localhost:5173         |
| Backend API         | http://localhost:3000         |
| RabbitMQ Dashboard  | http://localhost:15672        |

Default RabbitMQ credentials: guest / guest


Project Structure

.
├── client/                   # React frontend (Vite + Tailwind CSS)
│   └── src/
│       ├── modules/          # Feature modules (auth, rider, merchant, admin, dispatcher)
│       ├── shared/           # Shared hooks, components, services
│       ├── context/          # React context (Auth, Toast, Notifications, Socket)
│       └── layouts/          # Role-based layout wrappers
├── server/                   # Express backend
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (PostgreSQL + PostGIS)
│   │   ├── migrations/       # Prisma migration history
│   │   └── seed.js           # Seeds admin, zones, districts, and vehicle types
│   └── src/
│       ├── modules/          # Feature modules (admin, rider, merchant, dispatcher, shipment)
│       ├── infrastructure/   # RabbitMQ, Socket.IO, logger
│       ├── utils/            # Helpers (fare engine, pagination, error handling, etc.)
│       └── config/           # DB, Redis, email, and app config
├── docker-compose.yml        # Development orchestration
├── docker-compose.prod.yml   # Production orchestration
└── README.md


Roles & Dashboards

Admin
- Verify rider and merchant documents
- Manage vehicle types and fare configurations per vehicle
- Monitor platform finance, revenue, and COD settlements
- View and manage rider payouts
- Create and manage dispatcher and admin staff accounts

Dispatcher
- Monitor hub inventory and shipment status
- Assign routes and manage stuck packages
- Oversee delivery operations across zones

Merchant
- Create and track shipments
- View fare breakdown before booking
- Manage COD and prepaid payments via Khalti
- Raise insurance claims for lost or damaged shipments

Rider
- Toggle on/off duty status
- Scan and manage assigned shipments
- Confirm deliveries with GPS geofence validation and proof-of-delivery (POD)
- View earnings, wallet balance, and payout history


Fare Calculation

Fares are computed at shipment creation and frozen as a snapshot:

Total Fare = Base fare
           + (Distance km × per km rate)
           + (Weight kg × per kg rate)
           + Fragile charge (if applicable)
           + Zone surcharge
           + COD charge (% of COD amount)

Each vehicle type has its own FareConfig managed by the admin.


Default Admin Credentials

On first startup, the seed script creates a Super Admin account:

| Field    | Default Value           |
|----------|-------------------------|
| Email    | admin@merobhariya.com   |
| Password | Admin123!               |

Override these by setting SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your .env file before the first run.


Development Notes

- Hot reload is enabled in development via Vite's polling watcher (configured for Windows/Docker compatibility)
- Console logs are automatically stripped in production builds via Terser
- Backend logs are controlled by NODE_ENV — verbose in development, structured JSON via Winston + BetterStack in production
- PostGIS is required for geospatial queries — handled automatically inside the Docker PostgreSQL container
- Prisma migrations must be run inside the Docker container: docker compose exec server npx prisma migrate dev --name description


License

This project is licensed under the MIT License.