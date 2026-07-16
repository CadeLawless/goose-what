import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getDailyCardPool,
  getLocalDayKey,
  parseDailyCardMemory,
} from '@/game/daily-card-memory';

describe('daily card memory', () => {
  const allCards = ['one', 'two', 'three'];

  it('offers only cards that have not appeared today', () => {
    assert.deepEqual(getDailyCardPool(allCards, new Set(['one', 'three'])), {
      cardIds: ['two'],
      resetMemory: false,
    });
  });

  it('restores the full deck after every card has appeared today', () => {
    assert.deepEqual(getDailyCardPool(allCards, new Set(allCards)), {
      cardIds: allCards,
      resetMemory: true,
    });
  });

  it('restores the full deck on a new day', () => {
    const stored = JSON.stringify({
      day: '2026-07-15',
      seenCardIdsByDeck: { animals: ['one'] },
    });

    assert.deepEqual(parseDailyCardMemory(stored, '2026-07-16'), {
      day: '2026-07-16',
      seenCardIdsByDeck: {},
    });
  });

  it('keeps valid card IDs for the current day and removes duplicates', () => {
    const stored = JSON.stringify({
      day: '2026-07-16',
      seenCardIdsByDeck: { animals: ['one', 'one', 42], invalid: 'two' },
    });

    assert.deepEqual(parseDailyCardMemory(stored, '2026-07-16'), {
      day: '2026-07-16',
      seenCardIdsByDeck: { animals: ['one'] },
    });
  });

  it('uses the device local calendar date', () => {
    assert.equal(getLocalDayKey(new Date(2026, 0, 2, 23, 59)), '2026-01-02');
  });
});
