import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, getFirestore, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

const DEFAULT_SETTINGS = {
  defaultBuyIn: 10,
  sessionName: 'Home Game'
};

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizeVenmoId = (venmoId) => {
  if (typeof venmoId !== 'string') {
    return '';
  }

  const trimmed = venmoId.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
};

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
        finalStack,
        venmoId: normalizeVenmoId(player.venmoId)
      };
    })
    .filter(Boolean);
};

const normalizeSettings = (settings) => {
  if (!isObject(settings)) {
    return DEFAULT_SETTINGS;
  }

  const defaultBuyIn = Number(settings.defaultBuyIn);
  const sessionName =
    typeof settings.sessionName === 'string' && settings.sessionName.trim()
      ? settings.sessionName.trim()
      : DEFAULT_SETTINGS.sessionName;

  return {
    defaultBuyIn: Number.isFinite(defaultBuyIn) ? defaultBuyIn : DEFAULT_SETTINGS.defaultBuyIn,
    sessionName
  };
};

const normalizeGameState = (state) => {
  if (!isObject(state)) {
    return {
      players: [],
      settings: DEFAULT_SETTINGS
    };
  }

  return {
    players: normalizePlayers(state.players),
    settings: normalizeSettings(state.settings)
  };
};

const appCache = new Map();

const getCacheKey = (firebaseConfig) => {
  const keys = Object.keys(firebaseConfig).sort();
  return JSON.stringify(keys.reduce((result, key) => {
    result[key] = firebaseConfig[key];
    return result;
  }, {}));
};

const ensureSession = async (firebaseConfig) => {
  const cacheKey = getCacheKey(firebaseConfig);
  if (!appCache.has(cacheKey)) {
    const appName = `home-game-${appCache.size + 1}`;
    const app = initializeApp(firebaseConfig, appName);
    const db = getFirestore(app);
    const auth = getAuth(app);
    appCache.set(cacheKey, { app, db, auth });
  }

  const session = appCache.get(cacheKey);
  if (!session.auth.currentUser) {
    await signInAnonymously(session.auth);
  }

  return session;
};

const getSessionDocRef = (db, sessionId) => doc(db, 'homeGameSessions', sessionId);

const toShortLinkKey = (longUrl) => {
  let hash = 2166136261;

  for (let index = 0; index < longUrl.length; index += 1) {
    hash ^= longUrl.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `u${(hash >>> 0).toString(36)}`;
};

export const subscribeToFirebaseSession = async ({ firebaseConfig, sessionId, onState, onError }) => {
  const { db } = await ensureSession(firebaseConfig);
  const sessionRef = getSessionDocRef(db, sessionId);

  return onSnapshot(
    sessionRef,
    (snapshot) => {
      const data = snapshot.data();
      if (!data) {
        onState(null);
        return;
      }

      onState(normalizeGameState(data));
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
};

export const writeFirebaseSessionState = async ({ firebaseConfig, sessionId, state }) => {
  const { db } = await ensureSession(firebaseConfig);
  const sessionRef = getSessionDocRef(db, sessionId);
  const normalizedState = normalizeGameState(state);

  await setDoc(
    sessionRef,
    {
      ...normalizedState,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const loadFirebaseSharedShortLink = async ({ firebaseConfig, sessionId, longUrl }) => {
  if (typeof longUrl !== 'string' || !longUrl) {
    return null;
  }

  const { db } = await ensureSession(firebaseConfig);
  const sessionRef = getSessionDocRef(db, sessionId);
  const snapshot = await getDoc(sessionRef);
  const data = snapshot.data();
  if (!data || typeof data !== 'object') {
    return null;
  }

  const shareLinks = data.shareLinks;
  if (!shareLinks || typeof shareLinks !== 'object') {
    return null;
  }

  const key = toShortLinkKey(longUrl);
  const entry = shareLinks[key];

  if (!entry || typeof entry !== 'object') {
    return null;
  }

  if (entry.longUrl !== longUrl || typeof entry.shortUrl !== 'string' || !entry.shortUrl) {
    return null;
  }

  return entry.shortUrl;
};

export const saveFirebaseSharedShortLink = async ({
  firebaseConfig,
  sessionId,
  longUrl,
  shortUrl,
  provider = 'bitly'
}) => {
  if (
    typeof longUrl !== 'string' ||
    !longUrl ||
    typeof shortUrl !== 'string' ||
    !shortUrl ||
    typeof provider !== 'string' ||
    !provider
  ) {
    return;
  }

  const { db } = await ensureSession(firebaseConfig);
  const sessionRef = getSessionDocRef(db, sessionId);
  const key = toShortLinkKey(longUrl);

  await setDoc(
    sessionRef,
    {
      shareLinks: {
        [key]: {
          longUrl,
          shortUrl,
          provider,
          updatedAt: Date.now()
        }
      }
    },
    { merge: true }
  );
};
