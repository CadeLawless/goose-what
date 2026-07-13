import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getSessionCardPool } from '@/game/session-card-memory';

describe('session card memory', () => {
  const allCards = ['one', 'two', 'three'];

  it('offers only cards that have not appeared in the session', () => {
    const pool = getSessionCardPool(allCards, new Set(['one', 'three']));

    assert.deepEqual(pool, { cardIds: ['two'], resetMemory: false });
  });

  it('restores the full deck after every card has appeared', () => {
    const pool = getSessionCardPool(allCards, new Set(allCards));

    assert.deepEqual(pool, { cardIds: allCards, resetMemory: true });
  });

  it('starts a new app session with the full deck', () => {
    const pool = getSessionCardPool(allCards, new Set());

    assert.deepEqual(pool, { cardIds: allCards, resetMemory: false });
  });
});
