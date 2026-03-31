const STATE_PARAM = 's';
const SCHEMA_VERSION = 1;
const MAX_ENCODED_STATE_LENGTH = 3500;

const textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;

const bytesToBinary = (bytes) => {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return binary;
};

const binaryToBytes = (binary) => {
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const toBase64Url = (value) => {
  const bytes = textEncoder ? textEncoder.encode(value) : [];
  const base64 = btoa(bytesToBinary(bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (value) => {
  const padded = `${value}${'='.repeat((4 - (value.length % 4)) % 4)}`
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = binaryToBytes(binary);
  return textDecoder ? textDecoder.decode(bytes) : '';
};

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
      if (!isObject(player)) {
        return null;
      }

      if (typeof player.id !== 'string' || typeof player.name !== 'string') {
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

const normalizeSettings = (settings, defaultSettings) => {
  if (!isObject(settings)) {
    return defaultSettings;
  }

  const defaultBuyIn = Number(settings.defaultBuyIn);
  return {
    defaultBuyIn: Number.isFinite(defaultBuyIn) ? defaultBuyIn : defaultSettings.defaultBuyIn
  };
};

export const getEncodedStateFromHash = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;

  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash);
  return params.get(STATE_PARAM);
};

export const encodeGameState = (state) => {
  try {
    return toBase64Url(JSON.stringify({
      v: SCHEMA_VERSION,
      players: normalizePlayers(state.players),
      settings: normalizeSettings(state.settings, { defaultBuyIn: 10 })
    }));
  } catch (error) {
    console.error('Error encoding state for URL:', error);
    return null;
  }
};

export const decodeGameState = (encodedState, defaultSettings = { defaultBuyIn: 10 }) => {
  if (!encodedState) {
    return null;
  }

  try {
    const decodedString = fromBase64Url(encodedState);
    const parsed = JSON.parse(decodedString);
    if (!isObject(parsed) || parsed.v !== SCHEMA_VERSION) {
      return null;
    }

    return {
      players: normalizePlayers(parsed.players),
      settings: normalizeSettings(parsed.settings, defaultSettings)
    };
  } catch (error) {
    console.error('Error decoding state from URL:', error);
    return null;
  }
};

export const writeEncodedStateToHash = (encodedState) => {
  if (typeof window === 'undefined' || !encodedState) {
    return false;
  }

  if (encodedState.length > MAX_ENCODED_STATE_LENGTH) {
    console.warn('State payload is too large for URL persistence.');
    return false;
  }

  try {
    const currentHash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;

    const params = new URLSearchParams(currentHash);
    params.set(STATE_PARAM, encodedState);

    const nextHash = params.toString();
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash ? `#${nextHash}` : ''}`;
    window.history.replaceState(window.history.state, '', nextUrl);
    return true;
  } catch (error) {
    console.error('Error writing state to URL hash:', error);
    return false;
  }
};

export const clearEncodedStateFromHash = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const currentHash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;

    if (!currentHash) {
      return true;
    }

    const params = new URLSearchParams(currentHash);
    if (!params.has(STATE_PARAM)) {
      return true;
    }

    params.delete(STATE_PARAM);
    const nextHash = params.toString();
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash ? `#${nextHash}` : ''}`;
    window.history.replaceState(window.history.state, '', nextUrl);
    return true;
  } catch (error) {
    console.error('Error clearing legacy URL state from hash:', error);
    return false;
  }
};
