# Tabulations Module

This module is responsible for storing completed queues tabulation data. It provides a comprehensive system for tracking the status and outcomes of customer service interactions.

## Database Schema

### Tabulations Table
- `id` (UUID): Primary key
- `sessionId` (UUID): Foreign key to Queue.sessionId
- `tabulatedBy` (UUID): Foreign key to User.id
- `tabulatedAt` (Timestamp): When the tabulation was created
- `tabulationId` (UUID): Foreign key to tabulation_status_sub.id

## API Endpoints

### Tabulations
- `POST /tabulations` - Create a new tabulation
- `GET /tabulations` - Get all tabulations
- `GET /tabulations/:id` - Get a specific tabulation
- `GET /tabulations/session/:sessionId` - Get tabulations by session ID
- `GET /tabulations/user/:tabulatedBy` - Get tabulations by user
- `PATCH /tabulations/:id` - Update a tabulation
- `DELETE /tabulations/:id` - Delete a tabulation

## Dependencies

This module depends on the `TabulationStatusModule` for status and sub-status management.

## Usage Example

```typescript
// Create a new tabulation
const tabulation = await tabulationsService.create({
  sessionId: 'queue-session-id',
  tabulatedBy: 'user-id',
  tabulationId: 'status-sub-id'
});

// Find tabulations by session
const sessionTabulations = await tabulationsService.findBySessionId('session-id');

// Get all available statuses
const statuses = await tabulationStatusService.findAll();
```

## Relationships

- A Queue can have multiple Tabulations
- A User can create multiple Tabulations
- A TabulationStatus can have multiple TabulationStatusSub entries
- A Tabulation references a TabulationStatusSub for its final status

## Initial Data

The module includes seed data with common tabulation statuses:
- Completed Successfully
- Customer Unavailable
- Callback Requested
- Issue Resolved
- Escalated
- Cancelled
- Technical Issue
- Follow-up Required
