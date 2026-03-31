import {
  getEncodedStateFromHash,
  decodeGameState,
  clearEncodedStateFromHash
} from './urlState';

const STORAGE_KEYS = {
  PLAYERS: 'poker-players',
  PLAYER_NAMES: 'poker-player-names',
  SETTINGS: 'poker-settings',
  FIREBASE_CONFIG_DRAFT: 'poker-firebase-config-draft',
  FIREBASE_SESSION_ID_DRAFT: 'poker-firebase-session-id-draft'
};

const DEFAULT_SETTINGS = {
  defaultBuyIn: 10
};

const DEFAULT_GAME_STATE = {
  players: [],
  settings: DEFAULT_SETTINGS
};

const hasStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizeBuyIns = (buyIns) => {
  if (!Array.isArray(buyIns)) {
    return [];
  }

  return buyIns
    .map((buyIn) => {
      if (!isObject(buyIn)) {
        return null;
      }

      const amount = Number(buyIn.amount);
      const timestamp = Number(buyIn.timestamp);
      if (!Number.isFinite(amount) || !Number.isFinite(timestamp)) {
        return null;
      }

      return { amount, timestamp };
    })
    .filter(Boolean);
};

const normalizePlayers = (players) => {
  if (!Array.isArray(players)) {
    return [];
  }

  return players
    .map((player) => {
      if (!isObject(player) || typeof player.id !== 'string' || typeof player.name !== 'string') {
        return null;
      }

      const finalStack =
        typeof player.finalStack === 'string'
          ? player.finalStack
          : player.finalStack == null
            ? ''
            : String(player.finalStack);

      return {
        id: player.id,
        name: player.name,
        buyIns: normalizeBuyIns(player.buyIns),
        finalStack
      };
    })
    .filter(Boolean);
};

const normalizeSettings = (settings) => {
  if (!isObject(settings)) {
    return DEFAULT_SETTINGS;
  }

  const defaultBuyIn = Number(settings.defaultBuyIn);
  return {
    defaultBuyIn: Number.isFinite(defaultBuyIn) ? defaultBuyIn : DEFAULT_SETTINGS.defaultBuyIn
  };
};

const normalizeGameState = (state) => {
  if (!isObject(state)) {
    return DEFAULT_GAME_STATE;
  }

  return {
    players: normalizePlayers(state.players),
    settings: normalizeSettings(state.settings)
  };
};

// Load data from localStorage
export const loadFromStorage = (key, defaultValue = null) => {
  if (!hasStorage()) {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return defaultValue;
  }
};

// Save data to localStorage
export const saveToStorage = (key, data) => {
  if (!hasStorage()) {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
};

// Player-specific functions
export const loadPlayers = () => {
  return normalizePlayers(loadFromStorage(STORAGE_KEYS.PLAYERS, []));
};

export const savePlayers = (players) => {
  saveToStorage(STORAGE_KEYS.PLAYERS, normalizePlayers(players));
};

// Player names history functions
export const loadPlayerNames = () => {
  const names = loadFromStorage(STORAGE_KEYS.PLAYER_NAMES, []);
  if (!Array.isArray(names)) {
    return [];
  }

  return names.filter((name) => typeof name === 'string');
};

export const savePlayerNames = (names) => {
  // Keep unique names, sorted by most recent
  const uniqueNames = [...new Set(names)];
  saveToStorage(STORAGE_KEYS.PLAYER_NAMES, uniqueNames);
};

export const addPlayerNameToHistory = (name) => {
  const existingNames = loadPlayerNames();
  // Move name to front if it exists, otherwise add it
  const filteredNames = existingNames.filter(n => n.toLowerCase() !== name.toLowerCase());
  const updatedNames = [name, ...filteredNames].slice(0, 50); // Keep last 50 names
  savePlayerNames(updatedNames);
};

// Settings functions
export const loadSettings = () => {
  return normalizeSettings(loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
};

export const saveSettings = (settings) => {
  saveToStorage(STORAGE_KEYS.SETTINGS, normalizeSettings(settings));
};

export const loadGameStateFromUrl = () => {
  const encodedState = getEncodedStateFromHash();
  return decodeGameState(encodedState, DEFAULT_SETTINGS);
};

export const loadGameState = () => {
  const localState = normalizeGameState({
    players: loadPlayers(),
    settings: loadSettings()
  });

  const hasLocalPlayers = localState.players.length > 0;
  const hasCustomLocalSettings =
    localState.settings.defaultBuyIn !== DEFAULT_SETTINGS.defaultBuyIn;

  if (hasLocalPlayers || hasCustomLocalSettings) {
    clearEncodedStateFromHash();
    return localState;
  }

  const legacyUrlState = loadGameStateFromUrl();
  if (legacyUrlState) {
    const normalizedLegacyState = normalizeGameState(legacyUrlState);
    savePlayers(normalizedLegacyState.players);
    saveSettings(normalizedLegacyState.settings);
    clearEncodedStateFromHash();
    return normalizedLegacyState;
  }

  return localState;
};

export const saveGameState = (state) => {
  const normalizedState = normalizeGameState(state);
  savePlayers(normalizedState.players);
  saveSettings(normalizedState.settings);
  return true;
};

export const loadFirebaseConfigDraft = () => {
  const draft = loadFromStorage(STORAGE_KEYS.FIREBASE_CONFIG_DRAFT, '');
  return typeof draft === 'string' ? draft : '';
};

export const saveFirebaseConfigDraft = (draft) => {
  if (typeof draft !== 'string') {
    return;
  }

  saveToStorage(STORAGE_KEYS.FIREBASE_CONFIG_DRAFT, draft);
};

export const loadFirebaseSessionIdDraft = () => {
  const sessionId = loadFromStorage(STORAGE_KEYS.FIREBASE_SESSION_ID_DRAFT, '');
  return typeof sessionId === 'string' ? sessionId : '';
};

export const saveFirebaseSessionIdDraft = (sessionId) => {
  if (typeof sessionId !== 'string') {
    return;
  }

  saveToStorage(STORAGE_KEYS.FIREBASE_SESSION_ID_DRAFT, sessionId.trim());
};
