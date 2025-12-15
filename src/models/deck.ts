
export type Deck = {
  id: string;
  title: string;
  createdAt: string; // ISO string
};

export function makeId() {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
