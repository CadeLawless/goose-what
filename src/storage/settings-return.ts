import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SETTINGS_RETURN_DECK_KEY = 'settings-return-deck-id';

export type SettingsPermissionSnapshot = {
  camera: string;
  microphone: string;
  motion: string;
};

export type SettingsReturnRequest = {
  deckId: string;
  permissions?: SettingsPermissionSnapshot;
  sessionId: string | null;
  source: 'background' | 'explicit';
};

type StoredSettingsReturnRequest = SettingsReturnRequest & {
  version: 2;
};

export async function saveSettingsReturnDeckId(
  deckId: string,
  request: Omit<SettingsReturnRequest, 'deckId' | 'sessionId'> = {
    source: 'explicit',
  },
) {
  const stored: StoredSettingsReturnRequest = {
    version: 2,
    deckId,
    sessionId: Constants.sessionId,
    ...request,
  };
  await AsyncStorage.setItem(SETTINGS_RETURN_DECK_KEY, JSON.stringify(stored));
}

export async function clearSettingsReturnDeckId() {
  await AsyncStorage.removeItem(SETTINGS_RETURN_DECK_KEY);
}

export async function consumeSettingsReturnRequest() {
  let request: SettingsReturnRequest | null = null;

  try {
    const stored = await AsyncStorage.getItem(SETTINGS_RETURN_DECK_KEY);
    if (stored) request = parseSettingsReturnRequest(stored);
  } finally {
    await clearSettingsReturnDeckId().catch(() => undefined);
  }

  return request;
}

export function settingsPermissionsChanged(
  before: SettingsPermissionSnapshot,
  after: SettingsPermissionSnapshot,
) {
  return (
    before.camera !== after.camera ||
    before.microphone !== after.microphone ||
    before.motion !== after.motion
  );
}

function parseSettingsReturnRequest(stored: string): SettingsReturnRequest {
  try {
    const parsed = JSON.parse(stored) as Partial<StoredSettingsReturnRequest>;
    if (
      parsed.version === 2 &&
      typeof parsed.deckId === 'string' &&
      typeof parsed.sessionId === 'string' &&
      (parsed.source === 'background' || parsed.source === 'explicit')
    ) {
      return {
        deckId: parsed.deckId,
        sessionId: parsed.sessionId,
        source: parsed.source,
        permissions: isPermissionSnapshot(parsed.permissions)
          ? parsed.permissions
          : undefined,
      };
    }
  } catch {
    // Values written by older builds were plain deck IDs.
  }

  return { deckId: stored, sessionId: null, source: 'explicit' };
}

function isPermissionSnapshot(
  value: unknown,
): value is SettingsPermissionSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<SettingsPermissionSnapshot>;
  return (
    typeof snapshot.camera === 'string' &&
    typeof snapshot.microphone === 'string' &&
    typeof snapshot.motion === 'string'
  );
}
