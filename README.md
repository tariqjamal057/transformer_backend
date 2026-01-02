# Transformer Backend API

This is the backend API for the Transformer Management System, built with Express.js and Prisma ORM.

## Features

- User authentication and authorization
- Role-Based Access Control (RBAC) with module-based permissions
- User Activity Logging for all CUD operations
- CRUD operations for all entities (Consignees, Delivery Schedules, Transformers, etc.)
- PostgreSQL database integration
- JWT-based authentication
- CORS enabled for frontend integration

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - ORM for database operations
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the backend directory with the following variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/transformer_db"
   JWT_SECRET="your_jwt_secret_key"
   PORT=5000
   ```

3. **Set up the database:**
   Run the following command to apply pending migrations and generate a new migration if schema changes are detected.
   ```bash
   npx prisma migrate dev
   ```
   You will also need to generate the Prisma client:
   ```bash
   npx prisma generate
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Start the production server:**
   ```bash
   npm start
   ```

## Database Schema

The application uses Prisma ORM with a PostgreSQL database. The schema includes the following models:

- User
- Consignee
- DeliverySchedule
- FinalInspection
- Transformer
- FinalInspectionConsignee
- FinalInspectionTransformer
- DeliveryChallan
- GPFailure
- GPReceiptNote
- FailureAnalysis
- TN
- LOA
- NewGPInformation
- ActivityLog

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Role-Based Access Control (RBAC)
The application implements a role-based access control system.
- The **OWNER** role has unrestricted access to all API endpoints.
- Other roles (e.g., `MANAGER`, `DATA_FEEDER`, `SUPERVISOR`) have access to modules based on the `pages` array assigned to them.
- The `pages` array contains the names of the modules (e.g., `consignees`, `transformers`) that the user is allowed to access.
- Access to all routes (except for authentication) is protected by a middleware that enforces these permissions.

## Error Handling

The API returns appropriate HTTP status codes and error messages in JSON format.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the ISC License.
