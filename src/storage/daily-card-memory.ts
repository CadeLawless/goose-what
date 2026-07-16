import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createEmptyDailyCardMemory,
  getLocalDayKey,
  parseDailyCardMemory,
  type StoredDailyCardMemory,
} from '@/game/daily-card-memory';

const STORAGE_KEY = 'whatz-it:daily-card-memory:v1';

let memory: StoredDailyCardMemory | null = null;
let loadingDay: string | null = null;
let loadingPromise: Promise<StoredDailyCardMemory> | null = null;
let saveQueue: Promise<void> = Promise.resolve();

export async function loadDailySeenCardIds(deckId: string) {
  const currentMemory = await loadCurrentDayMemory();
  if (currentMemory.day !== getLocalDayKey()) return loadDailySeenCardIds(deckId);
  return new Set(currentMemory.seenCardIdsByDeck[deckId] ?? []);
}

export function rememberDailyCard(deckId: string, cardId: string) {
  const day = getLocalDayKey();
  if (memory?.day === day) {
    addCardAndPersist(memory, deckId, cardId);
    return;
  }

  void loadCurrentDayMemory().then((currentMemory) => {
    if (currentMemory.day !== getLocalDayKey()) {
      rememberDailyCard(deckId, cardId);
      return;
    }
    addCardAndPersist(currentMemory, deckId, cardId);
  });
}

export function resetDailySeenCardIds(deckId: string): Promise<void> {
  const day = getLocalDayKey();
  if (memory?.day === day) {
    if (!(deckId in memory.seenCardIdsByDeck)) return Promise.resolve();
    delete memory.seenCardIdsByDeck[deckId];
    return persistMemory(memory);
  }

  return loadCurrentDayMemory().then((currentMemory) => {
    if (currentMemory.day !== getLocalDayKey()) {
      return resetDailySeenCardIds(deckId);
    }
    if (!(deckId in currentMemory.seenCardIdsByDeck)) return;
    delete currentMemory.seenCardIdsByDeck[deckId];
    return persistMemory(currentMemory);
  });
}

async function loadCurrentDayMemory() {
  const day = getLocalDayKey();
  if (memory?.day === day) return memory;
  if (loadingPromise && loadingDay === day) return loadingPromise;

  loadingDay = day;
  const request = AsyncStorage.getItem(STORAGE_KEY)
    .then((storedValue) => parseDailyCardMemory(storedValue, day))
    .catch(() => createEmptyDailyCardMemory(day))
    .then((loadedMemory) => {
      if (getLocalDayKey() === day) memory = loadedMemory;
      return loadedMemory;
    })
    .finally(() => {
      if (loadingPromise === request) {
        loadingDay = null;
        loadingPromise = null;
      }
    });
  loadingPromise = request;

  return request;
}

function addCardAndPersist(
  currentMemory: StoredDailyCardMemory,
  deckId: string,
  cardId: string,
) {
  const seenCardIds = currentMemory.seenCardIdsByDeck[deckId] ?? [];
  if (seenCardIds.includes(cardId)) return;

  currentMemory.seenCardIdsByDeck[deckId] = [...seenCardIds, cardId];
  void persistMemory(currentMemory);
}

function persistMemory(currentMemory: StoredDailyCardMemory) {
  const snapshot = JSON.stringify(currentMemory);
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(() => AsyncStorage.setItem(STORAGE_KEY, snapshot))
    .catch(() => undefined);
  return saveQueue;
}
