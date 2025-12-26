# Transformer Backend API

This is the backend API for the Transformer Management System, built with Express.js and Prisma ORM.

## Features

- User authentication and authorization
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
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Start the production server:**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Consignees
- `GET /api/consignees` - Get all consignees
- `GET /api/consignees/:id` - Get consignee by ID
- `POST /api/consignees` - Create consignee
- `PUT /api/consignees/:id` - Update consignee
- `DELETE /api/consignees/:id` - Delete consignee

### Delivery Schedules
- `GET /api/delivery-schedules` - Get all delivery schedules
- `GET /api/delivery-schedules/:id` - Get delivery schedule by ID
- `POST /api/delivery-schedules` - Create delivery schedule
- `PUT /api/delivery-schedules/:id` - Update delivery schedule
- `DELETE /api/delivery-schedules/:id` - Delete delivery schedule

### Transformers
- `GET /api/transformers` - Get all transformers
- `GET /api/transformers/:id` - Get transformer by ID
- `POST /api/transformers` - Create transformer
- `PUT /api/transformers/:id` - Update transformer
- `DELETE /api/transformers/:id` - Delete transformer

### Delivery Challans
- `GET /api/delivery-challans` - Get all delivery challans
- `GET /api/delivery-challans/:id` - Get delivery challan by ID
- `POST /api/delivery-challans` - Create delivery challan
- `PUT /api/delivery-challans/:id` - Update delivery challan
- `DELETE /api/delivery-challans/:id` - Delete delivery challan

### GP Failures
- `GET /api/gp-failures` - Get all GP failures
- `GET /api/gp-failures/:id` - Get GP failure by ID
- `POST /api/gp-failures` - Create GP failure
- `PUT /api/gp-failures/:id` - Update GP failure
- `DELETE /api/gp-failures/:id` - Delete GP failure

### Failure Analyses
- `GET /api/failure-analyses` - Get all failure analyses
- `GET /api/failure-analyses/:id` - Get failure analysis by ID
- `POST /api/failure-analyses` - Create failure analysis
- `PUT /api/failure-analyses/:id` - Update failure analysis
- `DELETE /api/failure-analyses/:id` - Delete failure analysis

### GP Receipt Notes
- `GET /api/gp-receipt-notes` - Get all GP receipt notes
- `GET /api/gp-receipt-notes/:id` - Get GP receipt note by ID
- `POST /api/gp-receipt-notes` - Create GP receipt note
- `PUT /api/gp-receipt-notes/:id` - Update GP receipt note
- `DELETE /api/gp-receipt-notes/:id` - Delete GP receipt note

### TNs
- `GET /api/tns` - Get all TNs
- `GET /api/tns/:id` - Get TN by ID
- `POST /api/tns` - Create TN
- `PUT /api/tns/:id` - Update TN
- `DELETE /api/tns/:id` - Delete TN

### New GP Informations
- `GET /api/new-gp-informations` - Get all New GP Informations
- `GET /api/new-gp-informations/:id` - Get New GP Information by ID
- `POST /api/new-gp-informations` - Create New GP Information
- `PUT /api/new-gp-informations/:id` - Update New GP Information
- `DELETE /api/new-gp-informations/:id` - Delete New GP Information

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Health Check
- `GET /api/health` - Check API health

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

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

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
