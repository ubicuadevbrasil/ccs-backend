# Mailing Campaign XLSX Upload Endpoint

This document describes the new XLSX upload endpoint for creating mailing campaigns in the CCS Backend v3.

## Overview

The endpoint allows users to upload XLSX files containing contact information to create mailing campaigns. The system will:

1. Parse the XLSX file to extract contact information
2. Create/update customer records in the database
3. Search for customer information in WhatsApp
4. Create queues for each contact
5. Send the specified message to all contacts

## Endpoint Details

- **URL**: `POST /dashboard/upload-xlsx`
- **Authentication**: JWT Bearer token required
- **Content-Type**: `application/json`

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileUrl` | String | Yes | URL to the XLSX file containing contact information |
| `name` | String | Yes | Name of the mailing campaign |
| `message` | String | Yes | Message to send to all contacts |

## XLSX File Format

The XLSX file should contain the following columns (case-insensitive):

| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| `phone` / `Phone` / `PHONE` / `telefone` / `Telefone` / `TELEFONE` | Phone number | Yes | 11999999999 |
| `cpf` / `CPF` | Brazilian individual tax ID | No | 12345678901 |
| `cnpj` / `CNPJ` | Brazilian company tax ID | No | 12345678000199 |
| `email` / `Email` / `EMAIL` | Email address | No | john@example.com |

### Phone Number Format

- Phone numbers are automatically normalized to include Brazil country code (55)
- Supports formats: 11999999999, 5511999999999, (11) 99999-9999
- Minimum length: 10 digits, Maximum length: 13 digits

## Response Format

### Success Response (201 Created)

```json
{
  "success": true,
  "mailingId": "uuid-string",
  "message": "XLSX file uploaded and mailing campaign created successfully"
}
```

### Error Responses

- **400 Bad Request**: Invalid file format, missing required fields
- **401 Unauthorized**: Missing or invalid JWT token
- **500 Internal Server Error**: Server processing error

## Background Processing

The XLSX file is processed asynchronously using BullMQ:

1. Mailing record is created in the database with the file URL
2. Job is added to the `mailing` queue
3. Background worker fetches the XLSX file from the URL
4. File is parsed and contacts are processed
5. Queues are created for each contact
6. Messages are sent via WhatsApp

## Queue Management

The system uses BullMQ with Redis for job processing:

- **Queue Name**: `mailing`
- **Job Type**: `process-mailing`
- **Retry Policy**: 3 attempts with exponential backoff
- **Job Cleanup**: Completed jobs are removed, failed jobs are retained

## Database Tables

### Mailing Table

```sql
CREATE TABLE mailing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Customer Table (existing)

The system will create or update customer records with:
- `remoteJid`: Phone number
- `pushName`: WhatsApp display name (if available)
- `email`: From XLSX file
- `cpf`: From XLSX file
- `cnpj`: From XLSX file

### Queues Table (existing)

New queue records are created with:
- `sessionId`: Unique session identifier
- `customerId`: Reference to customer record
- `status`: 'typebot'
- `direction`: 'outbound'
- `metadata`: Contains mailing campaign information

## File Requirements

- XLSX files must be accessible via HTTP/HTTPS URL
- Files should be publicly accessible or provide proper authentication
- Recommended file size: under 10MB for optimal performance
- Only XLSX files are supported

## Environment Variables

Ensure the following environment variables are set:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## Example Usage

### cURL Example

```bash
curl -X POST \
  http://localhost:8082/dashboard/upload-xlsx \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileUrl": "https://example.com/contacts.xlsx",
    "name": "Monthly Newsletter",
    "message": "Hello! Here is our monthly newsletter..."
  }'
```

### JavaScript Example

```javascript
const data = {
  fileUrl: 'https://example.com/contacts.xlsx',
  name: 'Campaign Name',
  message: 'Your message here'
};

fetch('/dashboard/upload-xlsx', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
.then(response => response.json())
.then(data => console.log(data));
```

## Monitoring

You can monitor the queue status using the BullMQ dashboard or by checking the Redis database directly.

## Error Handling

The system includes comprehensive error handling:

- Invalid file formats are rejected
- Invalid phone numbers are skipped
- Failed WhatsApp API calls are logged
- Database errors are handled gracefully
- Queue failures are retried automatically

## Security Considerations

- Only authenticated users can create mailing campaigns
- File URLs are validated and fetched securely
- HTTPS URLs are recommended for security
- JWT tokens are required for all operations
- File access is controlled by the external storage system
