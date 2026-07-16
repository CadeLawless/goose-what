export type StoredDailyCardMemory = {
  day: string;
  seenCardIdsByDeck: Record<string, string[]>;
};

export type DailyCardPool = {
  cardIds: string[];
  resetMemory: boolean;
};

export function getLocalDayKey(now: Date = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createEmptyDailyCardMemory(day: string): StoredDailyCardMemory {
  return { day, seenCardIdsByDeck: {} };
}

export function parseDailyCardMemory(
  storedValue: string | null,
  currentDay: string,
): StoredDailyCardMemory {
  if (!storedValue) return createEmptyDailyCardMemory(currentDay);

  try {
    const parsed: unknown = JSON.parse(storedValue);
    if (!isRecord(parsed) || parsed.day !== currentDay || !isRecord(parsed.seenCardIdsByDeck)) {
      return createEmptyDailyCardMemory(currentDay);
    }

    const seenCardIdsByDeck = Object.fromEntries(
      Object.entries(parsed.seenCardIdsByDeck).flatMap(([deckId, cardIds]) =>
        Array.isArray(cardIds)
          ? [[deckId, [...new Set(cardIds.filter((cardId): cardId is string => typeof cardId === 'string'))]]]
          : [],
      ),
    );

    return { day: currentDay, seenCardIdsByDeck };
  } catch {
    return createEmptyDailyCardMemory(currentDay);
  }
}

export function getDailyCardPool(
  allCardIds: readonly string[],
  seenCardIds: ReadonlySet<string>,
): DailyCardPool {
  const unseenCardIds = allCardIds.filter((cardId) => !seenCardIds.has(cardId));
  if (unseenCardIds.length > 0) {
    return { cardIds: unseenCardIds, resetMemory: false };
  }

  return { cardIds: [...allCardIds], resetMemory: seenCardIds.size > 0 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
