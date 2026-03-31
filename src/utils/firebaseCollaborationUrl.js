const COLLAB_PARAM = 'f';
const SCHEMA_VERSION = 1;
const KNOWN_HASH_PARAMS = new Set([COLLAB_PARAM]);

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

const normalizeFirebaseConfig = (config) => {
  if (!isObject(config)) {
    return null;
  }

  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingRequiredKey = requiredKeys.some((key) => typeof config[key] !== 'string' || !config[key].trim());
  if (missingRequiredKey) {
    return null;
  }

  const normalized = {};
  Object.entries(config).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      normalized[key] = value.trim();
    }
  });

  return normalized;
};

const normalizeSessionId = (sessionId) => {
  if (typeof sessionId !== 'string') {
    return null;
  }

  const trimmed = sessionId.trim();
  return trimmed ? trimmed : null;
};

const readHashParams = () => {
  if (typeof window === 'undefined') {
    return new URLSearchParams('');
  }

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;

  return new URLSearchParams(hash);
};

const writeHashParams = (params) => {
  if (typeof window === 'undefined') {
    return false;
  }

  const nextHash = params.toString();
  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash ? `#${nextHash}` : ''}`;
  window.history.replaceState(window.history.state, '', nextUrl);
  return true;
};

export const parseFirebaseCollaborationFromHash = () => {
  const params = readHashParams();
  const encodedPayload = params.get(COLLAB_PARAM);
  if (!encodedPayload) {
    return null;
  }

  return parseFirebaseCollaborationPayload(encodedPayload);
};

const parseFirebaseCollaborationPayload = (encodedPayload) => {
  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload));
    if (!isObject(parsed) || parsed.v !== SCHEMA_VERSION) {
      return null;
    }

    const firebaseConfig = normalizeFirebaseConfig(parsed.firebaseConfig);
    const sessionId = normalizeSessionId(parsed.sessionId);
    if (!firebaseConfig || !sessionId) {
      return null;
    }

    return {
      firebaseConfig,
      sessionId
    };
  } catch (error) {
    console.error('Error parsing Firebase collaboration URL metadata:', error);
    return null;
  }
};

export const sanitizeCollaborationHash = () => {
  const params = readHashParams();
  let didMutate = false;

  Array.from(params.keys()).forEach((key) => {
    if (!KNOWN_HASH_PARAMS.has(key)) {
      params.delete(key);
      didMutate = true;
    }
  });

  const encodedPayload = params.get(COLLAB_PARAM);
  if (encodedPayload && !parseFirebaseCollaborationPayload(encodedPayload)) {
    params.delete(COLLAB_PARAM);
    didMutate = true;
  }

  if (!didMutate) {
    return true;
  }

  return writeHashParams(params);
};

export const writeFirebaseCollaborationToHash = ({ firebaseConfig, sessionId }) => {
  const normalizedConfig = normalizeFirebaseConfig(firebaseConfig);
  const normalizedSessionId = normalizeSessionId(sessionId);

  if (!normalizedConfig || !normalizedSessionId) {
    return false;
  }

  const payload = {
    v: SCHEMA_VERSION,
    firebaseConfig: normalizedConfig,
    sessionId: normalizedSessionId
  };

  try {
    const encodedPayload = toBase64Url(JSON.stringify(payload));
    const params = readHashParams();
    params.set(COLLAB_PARAM, encodedPayload);
    params.delete('s');
    return writeHashParams(params);
  } catch (error) {
    console.error('Error writing Firebase collaboration URL metadata:', error);
    return false;
  }
};

export const clearFirebaseCollaborationFromHash = () => {
  const params = readHashParams();
  params.delete(COLLAB_PARAM);
  return writeHashParams(params);
};
