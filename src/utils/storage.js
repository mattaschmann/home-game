const STORAGE_KEYS = {
  PLAYERS: 'poker-players',
  PLAYER_NAMES: 'poker-player-names',
  SETTINGS: 'poker-settings'
};

// Load data from localStorage
export const loadFromStorage = (key, defaultValue = null) => {
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
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
};

// Player-specific functions
export const loadPlayers = () => {
  return loadFromStorage(STORAGE_KEYS.PLAYERS, []);
};

export const savePlayers = (players) => {
  saveToStorage(STORAGE_KEYS.PLAYERS, players);
};

// Player names history functions
export const loadPlayerNames = () => {
  return loadFromStorage(STORAGE_KEYS.PLAYER_NAMES, []);
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
  return loadFromStorage(STORAGE_KEYS.SETTINGS, {
    defaultBuyIn: 10.00
  });
};

export const saveSettings = (settings) => {
  saveToStorage(STORAGE_KEYS.SETTINGS, settings);
};