export type SessionCardPool = {
  cardIds: string[];
  resetMemory: boolean;
};

export function getSessionCardPool(
  allCardIds: readonly string[],
  seenCardIds: ReadonlySet<string>,
): SessionCardPool {
  const unseenCardIds = allCardIds.filter((cardId) => !seenCardIds.has(cardId));

  if (unseenCardIds.length > 0) {
    return { cardIds: unseenCardIds, resetMemory: false };
  }

  return { cardIds: [...allCardIds], resetMemory: seenCardIds.size > 0 };
}
