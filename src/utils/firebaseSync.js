import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { doc, getFirestore, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

const DEFAULT_SETTINGS = { defaultBuyIn: 10 };

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
