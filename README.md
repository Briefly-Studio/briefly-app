## Current Version
Briefly v1.5 — Manual Study MVP (Offline-first)


# Briefly — Flashcards + Review + Quiz (Expo Router + AsyncStorage)

Briefly is a mobile flashcard app built with **Expo (React Native)** using **file-based routing (expo-router)** and **local persistence (AsyncStorage)**. Users can create decks, add/edit/delete cards, review cards in flip mode, and take a multiple-choice quiz with a results screen.

This project focuses on clean, scalable architecture: separation of concerns between UI routes and storage utilities, and safe deletion behavior to prevent orphaned data.

---

## Features

### Decks
- Create decks
- View all decks
- Delete decks (with cascade deletion for cards)

### Cards
- Add cards to a deck
- View cards inside a deck
- Edit a card
- Delete a card (long-press behavior supported in the deck list)

### Review Mode
- Flip card (front/back)
- Next card navigation
- Progress indicator

### Quiz Mode
- Multiple-choice quiz generated from deck cards
- Progress indicator
- Correct/incorrect feedback
- Quiz results screen
- Retry quiz
- Return back to deck

---

## Tech Stack

- **Expo + React Native**
- **expo-router** (file-based routing)
- **AsyncStorage** for local persistence
- TypeScript

---

## Project Structure

```txt
app/
  index.tsx                       # Decks Home (list/create/delete decks)
  create-deck.tsx                 # Create deck screen
  deck/
    [id]/
      _layout.tsx                 # Deck stack layout
      index.tsx                   # Deck details + card list
      add-card.tsx                # Add card
      review.tsx                  # Review mode (flip cards)
      quiz.tsx                    # Quiz mode (multiple choice)
      quiz-results.tsx            # Results screen
      edit-card/
        [cardId].tsx              # Edit/delete card

src/
  models/
    deck.ts                       # Deck type definition
    card.ts                       # Card type definition
  storage/
    decks.ts                      # Deck storage functions
    cards.ts                      # Card storage functions (per-deck keys)
