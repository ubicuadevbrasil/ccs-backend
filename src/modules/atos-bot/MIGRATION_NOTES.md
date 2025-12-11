# Atos Bot API Migration Notes

## Overview
The API endpoints have been migrated from legacy database tables to the new structure. This document outlines what has been implemented and what still needs attention.

## Mapping Summary

### ✅ Completed Mappings

1. **tab_filain → Queue (Redis)**
   - Queue with status `BOT` or `WAITING` replaces `tab_filain`
   - Fields mapped:
     - `sessionBot` → `queue.sessionId`
     - `mobile` → `queue.customer.contact` or `queue.customer.platformId`
     - `name` → `queue.customer.name` or `queue.customer.pushName`
     - `cnpj` → `queue.customer.cnpj`
     - `email` → `queue.customer.email`
     - `telefone` → `queue.customer.contact`
     - `status` → `queue.status` (1 = WAITING, 0 = BOT)
     - `origem` → `queue.platform` (mapped to 'wpp', 'telegram', etc.)
     - `segmento` → `queue.metadata.bot.segment`
     - `context` → `queue.metadata.bot.context`
     - `dtin` → `queue.createdAt`

2. **tab_atendein → Queue with SERVICE status**
   - Queue with status `SERVICE` replaces `tab_atendein`
   - Additional fields:
     - `fkto` → `queue.userId`
     - `fkname` → `queue.user.name`

3. **tab_logs → Messages**
   - Messages table replaces `tab_logs`
   - Fields mapped:
     - `id` → `message.id`
     - `sessionid` → `message.sessionId`
     - `fromid` → `message.fromMe ? botUserId : message.customerId`
     - `fromname` → `message.fromMe ? 'Bot' : customer.name`
     - `toid` → `message.fromMe ? message.customerId : botUserId`
     - `toname` → `message.fromMe ? customer.name : 'Bot'`
     - `msgdir` → `message.fromMe ? 'o' : 'i'`
     - `msgtype` → `message.type` (mapped to legacy types)
     - `msgtext` → `message.message`
     - `msgurl` → `message.media`
     - `dt` → `message.sentAt`
     - Legacy fields stored in `message.metadata.legacy`

4. **tab_optin → Customer table**
   - Customer table replaces `tab_optin`
   - Fields mapped:
     - `cnpj` → `customer.cnpj`
     - `email` → `customer.email`
     - `phone` → `customer.contact`
     - `nome` → `customer.name` or `customer.pushName`

## ⚠️ Missing Fields / Required Implementations

### 1. Customer.skipBot Field
**Status:** ❌ Not implemented

**Required:**
- Add `skipBot: boolean` field to `CustomerEntity` interface
- Add `skipBot` column to `customer` database table
- Update `Customer` class to include the field
- Update `checkSkipBot()` method in `AtosBotApiService` to use the field

**Current Implementation:**
- `checkSkipBot()` always returns `false`
- Uses legacy `tab_skip_bot` table (still works but should be migrated)

**Location:**
- `src/modules/customer/entities/customer.entity.ts`
- `src/modules/atos-bot/atos-bot-api.service.ts` (line ~188)

### 2. Customer Optin Flag/Tag
**Status:** ⚠️ Partial

**Required:**
- Decide on implementation approach:
  - Option A: Add `optin: boolean` field to Customer entity
  - Option B: Use Customer tags with tag name "optin"
  - Option C: Create separate optin tracking table

**Current Implementation:**
- `checkOptin()` considers customer exists = opted in
- No explicit optin flag/tag checking

**Location:**
- `src/modules/customer/entities/customer.entity.ts`
- `src/modules/atos-bot/atos-bot-api.service.ts` (line ~172)

### 3. Optin Access Tracking (tab_acesso_optin)
**Status:** ❌ Not implemented

**Required:**
- Create new table or use existing structure to track optin access timestamps
- Fields needed:
  - `cnpj: string`
  - `acesso: Date` (timestamp)
- Or integrate into Customer table with `lastOptinAccess: Date` field

**Current Implementation:**
- `updateOptin()` updates customer but doesn't track access history
- Legacy `tab_acesso_optin` table still exists but not used

**Location:**
- `src/modules/atos-bot/atos-bot-api.service.ts` (line ~229)

### 4. Legacy Fields Not Directly Mapped

The following legacy fields don't have direct equivalents in the new structure:

#### From tab_filain:
- `account` - Not in Customer or Queue
- `photo` - Maps to `customer.profilePicUrl` but not always available
- `transfer` - Not directly mapped (could use queue metadata)

#### From tab_atendein:
- `photo` - Same as above
- `account` - Same as above
- `atendir` - Direction ('in'/'out') - Could use queue metadata

#### From tab_logs:
- `stread` - Read status flag - Not in Message entity
- `msgcaption` - Media caption - Stored in `message.metadata.legacy.msgcaption` but not in main message field

### 5. Queue Metadata Structure

**Current:** Queue metadata can store bot context via `queue.metadata.bot`

**Missing mappings:**
- Some legacy fields from `tab_filain` and `tab_atendein` that were stored directly now need to be in metadata
- Ensure all bot context is properly stored in `queue.metadata.bot` per `AtosBotContext` interface

## Migration Checklist

- [x] Map tab_filain to Queue
- [x] Map tab_atendein to Queue (SERVICE status)
- [x] Map tab_logs to Messages
- [x] Map tab_optin to Customer
- [ ] Implement Customer.skipBot field
- [ ] Implement Customer optin flag/tag
- [ ] Implement optin access tracking
- [ ] Test all endpoints with new structure
- [ ] Update database schema for missing fields
- [ ] Create migration script for existing data (if needed)

## Notes

1. **Backward Compatibility:** The API still returns data in legacy format for backward compatibility. The transformation happens in `getWhatsAppSession()`.

2. **Bot User ID:** The hardcoded bot user ID `491b9564-2d79-11ea-978f-2e728ce88125` is used throughout. Consider making this configurable.

3. **Error Handling:** When queue or customer is not found, methods return `null` or empty arrays to maintain backward compatibility with legacy behavior.

4. **Message Creation:** When creating messages from legacy log format, we need to determine customer and platform from queue context. If queue doesn't exist, message creation may fail or use defaults.

## Recommendations

1. **Add skipBot to Customer:**
   ```typescript
   // In customer.entity.ts
   skipBot?: boolean;
   ```

2. **Add optin tracking:**
   ```typescript
   // Option A: Add to Customer
   optin?: boolean;
   lastOptinAccess?: Date;
   
   // Option B: Use tags
   // Check for tag with name "optin"
   ```

3. **Create access tracking table:**
   ```sql
   CREATE TABLE customer_optin_access (
     id UUID PRIMARY KEY,
     customer_id UUID REFERENCES customer(id),
     accessed_at TIMESTAMP DEFAULT NOW()
   );
   ```

4. **Consider adding missing fields to Customer:**
   - `account` (if needed)
   - `photo` (already exists as `profilePicUrl`)

