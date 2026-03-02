Interval (formerly Briefly) is an offline-first flashcard app with a change-based sync engine that lets users study fully offline and then seamlessly synchronize across devices.

Core features include deck/card management (create/edit/delete), difficulty tracking, soft deletes, revision control (rev), dirty-state tracking, and local persistence via AsyncStorage with migration support.

Cloud sync is powered by AWS Lambda (Node.js), API Gateway, and a DynamoDB dual-table design:
• Snapshot table (Interval_Records) stores the latest canonical state of decks/cards
• Append-only log (Interval_Changes) records every mutation for cursor-based incremental pull sync

The sync flow supports retry-safe, idempotent push/pull operations, device-aware change tracking, conflict handling via revisions, and incremental cursor pagination. Interval is built with production-oriented patterns (offline-first design, event-sourcing-inspired change log, snapshot + change history separation, and operational visibility via AWS tooling).
