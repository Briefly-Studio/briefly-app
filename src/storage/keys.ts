export const DECKS_KEY = "briefly.decks.v1";
export const CARDS_PREFIX = "briefly.cards.v1";

export const cardsKeyForDeck = (deckId: string) => `${CARDS_PREFIX}.${deckId}`;
