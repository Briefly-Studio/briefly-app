## Architecture

- `app/` – screens and navigation (Expo Router)
- `src/models/` – TypeScript data models
- `src/storage/` – local persistence (AsyncStorage)
- `src/domain/` – pure business logic and calculations
- `src/utils/` – generic helpers

The domain layer isolates logic so storage and UI can evolve independently.
