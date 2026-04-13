
meroBhariya
A robust logistics and delivery platform that connects merchants with porters. 
Built with the PERN stack and containerized for scalability, meroBhariya handles everything from real-time geospatial tracking to secure role-based access.

Features
Role-Based Access Control (RBAC) — Distinct dashboards and permissions for Admins, Riders, and Merchants.
Geospatial Capabilities — Location tracking and mapping powered by PostGIS.
Message Brokering — Asynchronous task handling via RabbitMQ.
Containerized Workflow — Fully orchestrated using Docker Compose for consistent development and deployment.


Tech Stack
Layer           Technology
Frontend        React, Tailwind CSS
Backend         Node.js, Express
Database        PostgreSQL + PostGIS
Message Broker  RabbitMQ
DevOps          Docker, Docker Compose

Prerequisites
Before getting started, ensure you have the following installed:
Docker Desktop
Node.js (for local linting/testing only)


Getting Started
1. Clone the repository
bashgit clone https://github.com/gurungrosan01/meroBhariya.git
cd meroBhariya
2. Configure environment variables
Copy the example environment file and fill in your values:
bashcp server/.env.example server/.env

Note: A .env.example file should list all required variables (e.g. DATABASE_URL, JWT_SECRET, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD).

3. Spin up the containers
bashdocker compose up --build
This will launch the database, RabbitMQ, backend, and frontend services simultaneously. On first run, the backend will also run migrations and seed the database automatically.
4. Access the application
Service                 URL
Frontend                http://localhost:5173
Backend API             http://localhost:3000
RabbitMQ Dashboard      http://localhost:15672

Default RabbitMQ credentials: guest / guest

Project Structure
.
├── client/             # React frontend (Tailwind CSS)
├── server/             # Express backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js     # Seeds admin user and vehicle types
│   └── src/
├── docker-compose.yml  # Service orchestration
└── README.md

Default Admin Credentials
On first startup, the seed script creates a Super Admin account:
Field       Default Value
Email       admin@merobhariya.com
Password    Admin@1234

You can override these by setting SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your .env file.


License
This project is licensed under the MIT License.