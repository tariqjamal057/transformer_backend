# API Endpoints

This document provides a summary of the API endpoints for the Transformer Backend.

## Authentication

### POST /api/auth/login

Logs in a user and returns a JWT token.

**Request Body:**

```json
{
  "loginId": "testuser",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "your-jwt-token",
  "user": {
    "id": "user-id",
    "name": "Test User",
    "loginId": "testuser",
    "number": "1234567890",
    "role": "USER",
    "pages": ["dashboard", "transformers"],
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

## Users

### GET /api/users

Retrieves a list of all users.

**Response:**

```json
[
  {
    "id": "user-id",
    "name": "Test User",
    "loginId": "testuser",
    "number": "1234567890",
    "role": "USER",
    "pages": ["dashboard", "transformers"],
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

### GET /api/users/:id

Retrieves a single user by their ID.

**Response:**

```json
{
  "id": "user-id",
  "name": "Test User",
  "loginId": "testuser",
  "number": "1234567890",
  "role": "USER",
  "pages": ["dashboard", "transformers"],
  "isActive": true,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### POST /api/users

Creates a new user.

**Request Body:**

```json
{
  "name": "New User",
  "loginId": "newuser",
  "number": "0987654321",
  "password": "newpassword",
  "role": "USER",
  "pages": ["dashboard"]
}
```

**Response:**

```json
{
  "id": "new-user-id",
  "name": "New User",
  "loginId": "newuser",
  "number": "0987654321",
  "role": "USER",
  "pages": ["dashboard"],
  "isActive": true,
  "createdAt": "2023-01-02T00:00:00.000Z",
  "updatedAt": "2023-01-02T00:00:00.000Z"
}
```

### PUT /api/users/:id

Updates an existing user.

**Request Body:**

```json
{
  "name": "Updated User Name",
  "pages": ["dashboard", "reports"]
}
```

**Response:**

```json
{
  "id": "user-id",
  "name": "Updated User Name",
  "loginId": "testuser",
  "number": "1234567890",
  "role": "USER",
  "pages": ["dashboard", "reports"],
  "isActive": true,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-02T01:00:00.000Z"
}
```

### DELETE /api/users/:id

Deletes a user.

**Response:**

`204 No Content`

## Chalan Descriptions

### GET /api/chalan-descriptions

Retrieves a paginated list of chalan descriptions.

**Query Parameters:**

- `page`: The page number to retrieve (default: 1).
- `limit`: The number of items per page (default: 10).

**Response:**

```json
{
  "data": [
    {
      "id": "chalan-desc-id",
      "name": "Chalan Description Name"
    }
  ],
  "totalPages": 1,
  "currentPage": 1
}
```

### POST /api/chalan-descriptions

Creates a new chalan description.

**Request Body:**

```json
{
  "name": "New Chalan Description"
}
```

**Response:**

```json
{
  "id": "new-chalan-desc-id",
  "name": "New Chalan Description"
}
```

## Companies

### GET /api/companies

Retrieves a paginated list of companies.

**Query Parameters:**

- `page`: The page number to retrieve (default: 1).
- `limit`: The number of items per page (default: 10).

**Response:**

```json
{
  "data": [
    {
      "id": "company-id",
      "name": "Company Name"
    }
  ],
  "totalPages": 1,
  "currentPage": 1
}
```

### POST /api/companies

Creates a new company.

**Request Body:**

```json
{
  "name": "New Company"
}
```

**Response:**

```json
{
  "id": "new-company-id",
  "name": "New Company"
}
```

## Consignees

### GET /api/consignees

Retrieves a list of all consignees.

**Response:**

```json
[
  {
    "id": "consignee-id",
    "name": "Consignee Name",
    "address": "Consignee Address",
    "finalInspectionConsignees": [],
    "deliveryChallans": []
  }
]
```

### GET /api/consignees/:id

Retrieves a single consignee by their ID.

**Response:**

```json
{
  "id": "consignee-id",
  "name": "Consignee Name",
  "address": "Consignee Address",
  "finalInspectionConsignees": [],
  "deliveryChallans": []
}
```

### POST /api/consignees

Creates a new consignee.

**Request Body:**

```json
{
  "name": "New Consignee",
  "address": "New Consignee Address"
}
```

**Response:**

```json
{
  "id": "new-consignee-id",
  "name": "New Consignee",
  "address": "New Consignee Address"
}
```

### PUT /api/consignees/:id

Updates an existing consignee.

**Request Body:**

```json
{
  "name": "Updated Consignee Name"
}
```

**Response:**

```json
{
  "id": "consignee-id",
  "name": "Updated Consignee Name",
  "address": "Consignee Address"
}
```

### DELETE /api/consignees/:id

Deletes a consignee.

**Response:**

`204 No Content`

## Damaged Transformers

### GET /api/damaged-transformers

Retrieves a paginated list of damaged transformers.

**Query Parameters:**

- `page`: The page number to retrieve (default: 1).
- `limit`: The number of items per page (default: 10).

**Response:**

```json
{
  "data": [
    {
      "id": "damaged-transformer-id",
      "serialNumber": "12345"
    }
  ],
  "totalPages": 1,
  "currentPage": 1
}
```

### POST /api/damaged-transformers

Creates a new damaged transformer record.

**Request Body:**

```json
{
  "serialNumber": "67890"
}
```

**Response:**

```json
{
  "id": "new-damaged-transformer-id",
  "serialNumber": "67890"
}
```

## Defferments

### GET /api/defferments

Retrieves a paginated list of defferments.

**Query Parameters:**

- `page`: The page number to retrieve (default: 1).
- `limit`: The number of items per page (default: 10).

**Response:**

```json
{
  "data": [
    {
      "id": "defferment-id",
      "reason": "Reason for defferment"
    }
  ],
  "totalPages": 1,
  "currentPage": 1
}
```

### POST /api/defferments

Creates a new defferment.

**Request Body:**

```json
{
  "reason": "New reason for defferment"
}
```

**Response:**

```json
{
  "id": "new-defferment-id",
  "reason": "New reason for defferment"
}
```

## Delivery Challans

### GET /api/delivery-challans

Retrieves a list of all delivery challans.

**Response:**

```json
[
  {
    "id": "delivery-challan-id",
    "challanNumber": "CH-123",
    "finalInspection": {},
    "consignee": {},
    "gpFailures": []
  }
]
```

### GET /api/delivery-challans/:id

Retrieves a single delivery challan by its ID.

**Response:**

```json
{
  "id": "delivery-challan-id",
  "challanNumber": "CH-123",
  "finalInspection": {},
  "consignee": {},
  "gpFailures": []
}
```

### POST /api/delivery-challans

Creates a new delivery challan.

**Request Body:**

```json
{
  "challanNumber": "CH-456",
  "finalInspectionId": "fi-id",
  "consigneeId": "consignee-id"
}
```

**Response:**

```json
{
  "id": "new-delivery-challan-id",
  "challanNumber": "CH-456",
  "finalInspectionId": "fi-id",
  "consigneeId": "consignee-id"
}
```

### PUT /api/delivery-challans/:id

Updates an existing delivery challan.

**Request Body:**

```json
{
  "challanNumber": "CH-789"
}
```

**Response:**

```json
{
  "id": "delivery-challan-id",
  "challanNumber": "CH-789"
}
```

### DELETE /api/delivery-challans/:id

Deletes a delivery challan.

**Response:**

`204 No Content`