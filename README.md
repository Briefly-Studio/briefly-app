# Interval (Briefly Studios)

Interval (formerly Briefly) is an **offline-first** flashcard app with a **change-based sync engine** that lets users study fully offline and then seamlessly synchronize across devices.

Core features include deck/card management (create/edit/delete), difficulty tracking, soft deletes, revision control (`rev`), dirty-state tracking, and local persistence via AsyncStorage with migration support.

---

## Key Features

- Deck management (create/update/delete), soft deletes, timestamps, revision tracking
- Card management (create/edit/delete), difficulty tracking, cascade deletion
- Offline-first local storage (AsyncStorage) with record migration support
- Sync-ready data model with `dirty` flags + conflict handling via `rev`

---

## Cloud Sync Architecture (AWS)

Cloud sync is powered by:
- **AWS Lambda** (Node.js)
- **Amazon DynamoDB** (dual-table design)
- **API Gateway**

### DynamoDB Tables

**Interval_Records (Snapshot Table)**  
Stores the latest canonical state of each entity (Decks, Cards).

Key pattern:
- `PK = U#public`
- `SK = E#{entity}#{id}`

**Interval_Changes (Append-Only Log)**  
Stores every mutation for incremental sync.

Key pattern:
- `PK = U#public`
- `SK = C#{timestamp}|{deviceId}|{entity}|{id}|{operation}`

### Sync Flow

**Push Sync**
- Sends locally dirty records
- Appends changes to the log
- Updates snapshot state
- Idempotent and retry-safe

**Pull Sync**
- Requests changes after a cursor
- Receives incremental updates
- Applies changes locally
- Updates cursor for the next cycle

---

## Data Consistency & Reliability

- Soft deletes (`deletedAt`)
- Revision increment on every mutation
- Idempotent writes (conditional expressions)
- Device-aware change tracking
- Snapshot + change-log separation
- Cursor-based incremental pulls

---

## Local Development

### Prerequisites
- Node.js (LTS recommended)
- npm

### Install & Run
```bash
npm install
npx expo start
