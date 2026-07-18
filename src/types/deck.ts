export type Card = {
  id: string;
  text: string;
  byline?: string;
};

export type Deck = {
  id: string;
  order: number;
  title: string;
  description: string;
  coverImage?: number;
  version: number;
  cards: Card[];
};
