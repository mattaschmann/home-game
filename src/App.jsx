import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import AddPlayer from './components/AddPlayer/AddPlayer';
import PlayerCard from './components/PlayerCard/PlayerCard';
import Settlement from './components/Settlement/Settlement';
import BuyInModal from './components/BuyInModal/BuyInModal';
import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog';
import GameSettingsModal from './components/GameSettingsModal/GameSettingsModal';
import {
  loadGameState,
  saveGameState,
  addPlayerNameToHistory,
  loadFirebaseConfigDraft,
  saveFirebaseConfigDraft,
  loadFirebaseSessionIdDraft,
  saveFirebaseSessionIdDraft,
  clearBitlyAccessToken,
  loadBitlyAccessToken,
  loadBitlyDomain,
  loadBitlyGroupGuid,
  loadBitlyLinkCache,
  saveBitlyAccessToken,
  saveBitlyDomain,
  saveBitlyGroupGuid,
  saveBitlyLinkCache
} from './utils/storage';
import { parseCurrencyInput, formatCurrency } from './utils/calculations';
import {
  clearFirebaseCollaborationFromHash,
  parseFirebaseCollaborationFromHash,
  sanitizeCollaborationHash,
  writeFirebaseCollaborationToHash
} from './utils/firebaseCollaborationUrl';
import {
  loadFirebaseSharedShortLink,
  saveFirebaseSharedShortLink,
  subscribeToFirebaseSession,
  writeFirebaseSessionState
} from './utils/firebaseSync';
import {
  createBitlyShortLink,
  resolveDefaultBitlyGroupAndDomain
} from './utils/bitlyLinks';

const initialGameState = loadGameState();

const ActionIconButton = ({ label, icon, onClick, disabled, variant }) => {
  const IconComponent = icon;

  return (
    <button
      className={`app-action-button ${variant ?? ''}`}
      aria-label={label}
      title={label}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="app-action-ring">
        <IconComponent />
      </span>
      <span className="app-action-text">{label}</span>
    </button>
  );
};

const AddUserIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const ResetIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 12a9 9 0 0115-6l2 2" />
    <path d="M20 8v5h-5" />
    <path d="M21 12a9 9 0 11-3-6" />
  </svg>
);

const BulkRemoveIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 7h12" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M8 7l1-2h6l1 2" />
    <path d="M9 21h6" />
  </svg>
);

const SettingsSliderIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 6h6" />
    <path d="M14 6h6" />
    <path d="M4 12h10" />
    <path d="M18 12h2" />
    <path d="M4 18h6" />
    <path d="M14 18h6" />
    <circle cx="12" cy="6" r="2" />
    <circle cx="16" cy="12" r="2" />
    <circle cx="12" cy="18" r="2" />
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M13 4l7 7-7 7" />
    <path d="M20 11H8a5 5 0 00-5 5v1" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.38 6.84 9.74.5.1.68-.22.68-.49 0-.24-.01-.89-.01-1.75-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .08 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.64-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.11-.26-.45-1.3.1-2.71 0 0 .85-.28 2.78 1.05A9.42 9.42 0 0112 7.1c.85 0 1.7.12 2.5.35 1.93-1.33 2.78-1.05 2.78-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.67.94.67 1.89 0 1.37-.01 2.47-.01 2.8 0 .27.18.6.69.49A10.27 10.27 0 0022 12.25C22 6.59 17.52 2 12 2z"
    />
  </svg>
);

function App() {
  const [players, setPlayers] = useState(() => initialGameState.players);
  const [settings, setSettings] = useState(() => initialGameState.settings);
  const [amountDialog, setAmountDialog] = useState({ isOpen: false, mode: null, playerId: null });
  const [confirmState, setConfirmState] = useState({ isOpen: false, action: null, payload: null });
  const [isAddPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [firebaseConfigDraft, setFirebaseConfigDraft] = useState(() => loadFirebaseConfigDraft());
  const [firebaseSessionIdDraft, setFirebaseSessionIdDraft] = useState(() => loadFirebaseSessionIdDraft());
  const [bitlyAccessToken, setBitlyAccessToken] = useState(() => loadBitlyAccessToken());
  const [bitlyAccessTokenDraft, setBitlyAccessTokenDraft] = useState(() => loadBitlyAccessToken());
  const [bitlyGroupGuid, setBitlyGroupGuid] = useState(() => loadBitlyGroupGuid());
  const [bitlyDomain, setBitlyDomain] = useState(() => loadBitlyDomain());
  const [bitlyLinkCache, setBitlyLinkCache] = useState(() => loadBitlyLinkCache());
  const [bitlyError, setBitlyError] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [collaborationSession, setCollaborationSession] = useState(() => parseFirebaseCollaborationFromHash());
  const [isFirebaseReady, setFirebaseReady] = useState(false);
  const [collaborationError, setCollaborationError] = useState('');
  const lastRemoteStateRef = useRef(null);
  const sessionNameInputRef = useRef(null);
  const [isEditingSessionName, setIsEditingSessionName] = useState(false);
  const [sessionNameDraft, setSessionNameDraft] = useState('');

  const sessionName =
    typeof settings.sessionName === 'string' && settings.sessionName.trim()
      ? settings.sessionName.trim()
      : 'Home Game';

  useEffect(() => {
    saveGameState({ players, settings });
  }, [players, settings]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.title = sessionName;
  }, [sessionName]);

  useEffect(() => {
    if (!isEditingSessionName) {
      setSessionNameDraft(sessionName);
    }
  }, [isEditingSessionName, sessionName]);

  useEffect(() => {
    if (!isEditingSessionName) {
      return;
    }

    sessionNameInputRef.current?.focus();
    sessionNameInputRef.current?.select();
  }, [isEditingSessionName]);

  useEffect(() => {
    saveFirebaseConfigDraft(firebaseConfigDraft);
  }, [firebaseConfigDraft]);

  useEffect(() => {
    saveFirebaseSessionIdDraft(firebaseSessionIdDraft);
  }, [firebaseSessionIdDraft]);

  useEffect(() => {
    saveBitlyAccessToken(bitlyAccessToken);
  }, [bitlyAccessToken]);

  useEffect(() => {
    saveBitlyGroupGuid(bitlyGroupGuid);
  }, [bitlyGroupGuid]);

  useEffect(() => {
    saveBitlyDomain(bitlyDomain);
  }, [bitlyDomain]);

  useEffect(() => {
    saveBitlyLinkCache(bitlyLinkCache);
  }, [bitlyLinkCache]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncCollaborationModeFromUrl = () => {
      sanitizeCollaborationHash();
      const parsed = parseFirebaseCollaborationFromHash();
      setCollaborationSession(parsed);
      setCollaborationError('');
      setFirebaseReady(false);
      lastRemoteStateRef.current = null;
    };

    syncCollaborationModeFromUrl();

    window.addEventListener('hashchange', syncCollaborationModeFromUrl);
    window.addEventListener('popstate', syncCollaborationModeFromUrl);

    return () => {
      window.removeEventListener('hashchange', syncCollaborationModeFromUrl);
      window.removeEventListener('popstate', syncCollaborationModeFromUrl);
    };
  }, []);

  useEffect(() => {
    if (!collaborationSession) {
      return undefined;
    }

    let isActive = true;
    let unsubscribe = () => {};

    subscribeToFirebaseSession({
      firebaseConfig: collaborationSession.firebaseConfig,
      sessionId: collaborationSession.sessionId,
      onState: (remoteState) => {
        if (!isActive) {
          return;
        }

        if (!remoteState) {
          setFirebaseReady(true);
          return;
        }

        const serialized = JSON.stringify(remoteState);
        lastRemoteStateRef.current = serialized;
        setPlayers(remoteState.players);
        setSettings(remoteState.settings);
        setFirebaseReady(true);
      },
      onError: (error) => {
        if (!isActive) {
          return;
        }

        console.error('Firebase session subscription error:', error);
        setCollaborationError(error?.message ?? 'Unable to subscribe to Firebase session.');
        setFirebaseReady(true);
      }
    })
      .then((resolvedUnsubscribe) => {
        if (!isActive) {
          resolvedUnsubscribe();
          return;
        }

        unsubscribe = resolvedUnsubscribe;
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        console.error('Firebase session initialization error:', error);
        setCollaborationError(error?.message ?? 'Unable to initialize Firebase collaboration.');
        setFirebaseReady(true);
      });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [collaborationSession]);

  useEffect(() => {
    if (!collaborationSession || !isFirebaseReady) {
      return;
    }

    const nextState = { players, settings };
    const serializedState = JSON.stringify(nextState);
    if (serializedState === lastRemoteStateRef.current) {
      return;
    }

    writeFirebaseSessionState({
      firebaseConfig: collaborationSession.firebaseConfig,
      sessionId: collaborationSession.sessionId,
      state: nextState
    })
      .then(() => {
        lastRemoteStateRef.current = serializedState;
      })
      .catch((error) => {
        console.error('Firebase session write error:', error);
        setCollaborationError(error?.message ?? 'Unable to sync state to Firebase session.');
      });
  }, [players, settings, collaborationSession, isFirebaseReady]);

  const openBuyInModal = (playerId) => {
    setAmountDialog({ isOpen: true, mode: 'buy-in', playerId });
  };

  const openStackModal = (playerId) => {
    setAmountDialog({ isOpen: true, mode: 'stack', playerId });
  };

  const openDefaultBuyInModal = () => {
    setSettingsOpen(true);
  };

  const closeSettingsModal = () => {
    setSettingsOpen(false);
  };

  const closeAmountDialog = () => {
    setAmountDialog({ isOpen: false, mode: null, playerId: null });
  };

  const handleAddPlayer = (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return false;
    }

    const exists = players.some(
      (player) => player.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      return false;
    }

    setPlayers((prev) => [
      ...prev,
      {
        id: uuidv4(),
        name: trimmedName,
        buyIns: [],
        finalStack: ''
      }
    ]);
    addPlayerNameToHistory(trimmedName);
    return true;
  };

  const openAddPlayerDialog = () => setAddPlayerDialogOpen(true);
  const closeAddPlayerDialog = () => setAddPlayerDialogOpen(false);

  const handleConfirmDialog = (amount) => {
    switch (amountDialog.mode) {
      case 'buy-in': {
        setPlayers((prev) =>
          prev.map((player) =>
            player.id === amountDialog.playerId
              ? {
                  ...player,
                  buyIns: [...player.buyIns, { amount, timestamp: Date.now() }]
                }
              : player
          )
        );
        setSettings((prev) => ({ ...prev, defaultBuyIn: amount }));
        break;
      }
      case 'stack': {
        setPlayers((prev) =>
          prev.map((player) =>
            player.id === amountDialog.playerId
              ? { ...player, finalStack: amount.toFixed(2) }
              : player
          )
        );
        break;
      }
      default:
        break;
    }

    closeAmountDialog();
  };

  const handleClearStack = () => {
    if (amountDialog.mode !== 'stack' || !amountDialog.playerId) {
      return;
    }

    setPlayers((prev) =>
      prev.map((player) =>
        player.id === amountDialog.playerId ? { ...player, finalStack: '' } : player
      )
    );
    closeAmountDialog();
  };

  const handleUndoBuyIn = (playerId) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === playerId && player.buyIns.length > 0
          ? { ...player, buyIns: player.buyIns.slice(0, -1) }
          : player
      )
    );
  };

  const handleRemovePlayer = (playerId) => {
    setConfirmState({
      isOpen: true,
      action: 'remove-player',
      payload: { playerId }
    });
  };

  const handleResetValues = () => {
    setConfirmState({ isOpen: true, action: 'reset-values' });
  };

  const handleClearPlayers = () => {
    setConfirmState({ isOpen: true, action: 'clear-players' });
  };

  const closeConfirmDialog = () => {
    setConfirmState({ isOpen: false, action: null, payload: null });
  };

  const confirmContent = useMemo(() => {
    if (!confirmState.action) {
      return null;
    }

    switch (confirmState.action) {
      case 'remove-player': {
        const player = players.find((p) => p.id === confirmState.payload?.playerId);
        const hasData =
          (player?.buyIns.length ?? 0) > 0 || parseCurrencyInput(player?.finalStack ?? '') > 0;

        return {
          title: `Remove ${player?.name ?? 'player'}?`,
          message: hasData
            ? 'This will delete all buy-ins and stack data for this player.'
            : 'This will remove this player from the game.',
          confirmText: 'Remove Player'
        };
      }
      case 'reset-values':
        return {
          title: 'Reset all totals?',
          message: 'All players will remain, but their buy-ins and final stacks will be cleared.',
          confirmText: 'Reset Values'
        };
      case 'clear-players':
        return {
          title: 'Remove all players?',
          message: 'This will remove every player from the game. Saved names stay in suggestions.',
          confirmText: 'Remove All'
        };
      default:
        return null;
    }
  }, [confirmState, players]);

  const handleConfirmAction = () => {
    switch (confirmState.action) {
      case 'remove-player': {
        const playerId = confirmState.payload?.playerId;
        setPlayers((prev) => prev.filter((player) => player.id !== playerId));
        break;
      }
      case 'reset-values': {
        setPlayers((prev) =>
          prev.map((player) => ({ ...player, buyIns: [], finalStack: '' }))
        );
        break;
      }
      case 'clear-players':
        setPlayers([]);
        break;
      default:
        break;
    }
    closeConfirmDialog();
  };

  const hasValuesToReset = players.some(
    (player) => player.buyIns.length > 0 || (player.finalStack ?? '') !== ''
  );

  const activePlayer = players.find((player) => player.id === amountDialog.playerId);

  const dialogConfig = useMemo(() => {
    if (!amountDialog.isOpen || !amountDialog.mode) {
      return null;
    }

    switch (amountDialog.mode) {
      case 'buy-in': {
        const defaultAmount = settings.defaultBuyIn ?? 10;
        const name = activePlayer?.name ?? 'Player';
        return {
          title: `Add Buy-in for ${name}`,
          description: `Using table default ${formatCurrency(defaultAmount)}. Update this amount if this buy-in is different.`,
          defaultAmount,
          confirmLabel: 'Add',
          confirmTextBuilder: (value) => `Add ${formatCurrency(value)}`,
          allowZero: false
        };
      }
      case 'stack': {
        const name = activePlayer?.name ?? 'Player';
        const hasExisting = (activePlayer?.finalStack ?? '') !== '';
        const stackAmount = hasExisting
          ? parseCurrencyInput(activePlayer?.finalStack ?? '')
          : 0;
        return {
          title: `Enter Final Stack for ${name}`,
          description: 'Record how much this player cashed out at the end of the game.',
          defaultAmount: stackAmount,
          confirmLabel: 'Save',
          confirmTextBuilder: (value) => `Save ${formatCurrency(value)}`,
          allowZero: true,
          secondaryActionLabel: hasExisting ? 'Clear Stack' : null
        };
      }
      default:
        return null;
    }
  }, [amountDialog, activePlayer, settings]);

  const getCanonicalShareUrl = () => {
    if (typeof window === 'undefined') {
      return '';
    }

    const url = new URL(window.location.href);
    ['code', 'state', 'error', 'error_description'].forEach((key) => {
      url.searchParams.delete(key);
    });
    return url.toString();
  };

  const getBitlyEligibilityReason = (longUrl) => {
    try {
      const parsed = new URL(longUrl);
      const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      if (!isHttp) {
        return 'Bitly only supports http/https URLs. Full URL will be shared.';
      }

      const hostname = parsed.hostname.toLowerCase();
      if (hostname === 'localhost' || hostname.endsWith('.local')) {
        return 'Bitly does not shorten localhost/private URLs. Full URL will be shared.';
      }

      if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return 'Bitly may reject IP-based URLs. Full URL will be shared.';
      }

      if (longUrl.length > 2000) {
        return 'URL is likely too long for Bitly. Full URL will be shared.';
      }

      return '';
    } catch {
      return 'URL is invalid. Full URL will be shared.';
    }
  };

  const ensureBitlyDefaults = async (accessToken) => {
    if (bitlyGroupGuid && bitlyDomain) {
      return {
        groupGuid: bitlyGroupGuid,
        domain: bitlyDomain
      };
    }

    const defaults = await resolveDefaultBitlyGroupAndDomain({ accessToken });
    setBitlyGroupGuid(defaults.groupGuid);
    setBitlyDomain(defaults.domain);
    return defaults;
  };

  const resolveShareUrl = async (longUrl) => {
    if (collaborationSession) {
      try {
        const firebaseShortLink = await loadFirebaseSharedShortLink({
          firebaseConfig: collaborationSession.firebaseConfig,
          sessionId: collaborationSession.sessionId,
          longUrl
        });

        if (firebaseShortLink) {
          return firebaseShortLink;
        }
      } catch (error) {
        console.error('Unable to read shared short link from Firebase:', error);
      }
    }

    const localShortLink = bitlyLinkCache[longUrl];
    if (typeof localShortLink === 'string' && localShortLink) {
      return localShortLink;
    }

    if (!bitlyAccessToken.trim()) {
      return longUrl;
    }

    const bitlyEligibilityReason = getBitlyEligibilityReason(longUrl);
    if (bitlyEligibilityReason) {
      setBitlyError(bitlyEligibilityReason);
      return longUrl;
    }

    try {
      const defaults = await ensureBitlyDefaults(bitlyAccessToken);
      const shortUrl = await createBitlyShortLink({
        accessToken: bitlyAccessToken,
        longUrl,
        groupGuid: defaults.groupGuid,
        domain: defaults.domain
      });

      setBitlyLinkCache((prev) => ({
        ...prev,
        [longUrl]: shortUrl
      }));
      setBitlyError('');

      if (collaborationSession) {
        try {
          await saveFirebaseSharedShortLink({
            firebaseConfig: collaborationSession.firebaseConfig,
            sessionId: collaborationSession.sessionId,
            longUrl,
            shortUrl,
            provider: 'bitly'
          });
        } catch (error) {
          console.error('Unable to persist shared short link to Firebase:', error);
        }
      }

      return shortUrl;
    } catch (error) {
      console.error('Unable to create Bitly short link:', error);
      const message = String(error?.message ?? '');
      if (message.includes('INVALID_ARG_LONG_URL')) {
        setBitlyError('Bitly rejected this URL as invalid (often local/private or too long). Sharing full URL instead.');
      } else {
        setBitlyError(error?.message ?? 'Unable to shorten URL with Bitly right now.');
      }
      return longUrl;
    }
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const longUrl = getCanonicalShareUrl();
    if (!longUrl) {
      return;
    }

    setIsSharing(true);
    setShareFeedback('');

    try {
      const shareUrl = await resolveShareUrl(longUrl);

      if (navigator.share) {
        await navigator.share({
          title: sessionName,
          text: `Join my ${sessionName} session`,
          url: shareUrl
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Share link copied to clipboard.');
        return;
      }

      setShareFeedback('Sharing is not supported in this browser.');
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }

      console.error('Share action failed:', error);
      setShareFeedback('Unable to open share dialog.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleSaveBitlySettings = async () => {
    const trimmedToken = bitlyAccessTokenDraft.trim();
    setBitlyAccessToken(trimmedToken);
    setBitlyLinkCache({});

    if (!trimmedToken) {
      setBitlyGroupGuid('');
      setBitlyDomain('bit.ly');
      setBitlyError('');
      return;
    }

    try {
      const defaults = await resolveDefaultBitlyGroupAndDomain({ accessToken: trimmedToken });
      setBitlyGroupGuid(defaults.groupGuid);
      setBitlyDomain(defaults.domain);
      setBitlyError('');
    } catch (error) {
      console.error('Unable to validate Bitly access token:', error);
      setBitlyError(error?.message ?? 'Unable to validate Bitly access token.');
    }
  };

  const handleClearBitlySettings = () => {
    setBitlyAccessToken('');
    setBitlyAccessTokenDraft('');
    setBitlyGroupGuid('');
    setBitlyDomain('bit.ly');
    setBitlyLinkCache({});
    setBitlyError('');
    clearBitlyAccessToken();
  };

  const bitlyEligibilityReason = getBitlyEligibilityReason(getCanonicalShareUrl());

  const handleStartCollaboration = () => {
    const sessionId = firebaseSessionIdDraft.trim();
    if (!sessionId) {
      setCollaborationError('Session id is required.');
      return;
    }

    const trimmedConfigDraft = firebaseConfigDraft.trim();
    let parsedConfig = collaborationSession?.firebaseConfig ?? null;

    if (trimmedConfigDraft) {
      try {
        parsedConfig = JSON.parse(trimmedConfigDraft);
      } catch {
        setCollaborationError('Firebase config must be valid JSON.');
        return;
      }
    }

    if (!parsedConfig) {
      setCollaborationError('Firebase config is required.');
      return;
    }

    const didWrite = writeFirebaseCollaborationToHash({
      firebaseConfig: parsedConfig,
      sessionId
    });

    if (!didWrite) {
      setCollaborationError('Unable to write Firebase collaboration metadata to URL.');
      return;
    }

    const parsedSession = parseFirebaseCollaborationFromHash();
    setFirebaseReady(false);
    setCollaborationSession(parsedSession);
    setFirebaseConfigDraft('');
    setCollaborationError('');
    lastRemoteStateRef.current = null;
  };

  const handleLeaveCollaboration = () => {
    clearFirebaseCollaborationFromHash();
    setCollaborationSession(null);
    setFirebaseReady(false);
    setCollaborationError('');
    lastRemoteStateRef.current = null;
  };

  const collaborationMode = collaborationSession ? 'firebase' : 'local';

  const startSessionNameEdit = () => {
    setSessionNameDraft(sessionName);
    setIsEditingSessionName(true);
  };

  const saveSessionName = () => {
    const nextSessionName = sessionNameDraft.trim() || 'Home Game';
    setSettings((prev) => ({
      ...prev,
      sessionName: nextSessionName
    }));
    setIsEditingSessionName(false);
  };

  const cancelSessionNameEdit = () => {
    setSessionNameDraft(sessionName);
    setIsEditingSessionName(false);
  };

  return (
    <div className="app container">
      <header className="app-header">
        <div className="app-title-group">
          {isEditingSessionName ? (
            <input
              ref={sessionNameInputRef}
              type="text"
              className="app-session-name-input"
              value={sessionNameDraft}
              maxLength={80}
              onChange={(event) => setSessionNameDraft(event.target.value)}
              onBlur={saveSessionName}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  saveSessionName();
                }

                if (event.key === 'Escape') {
                  cancelSessionNameEdit();
                }
              }}
              aria-label="Session name"
            />
          ) : (
            <button
              type="button"
              className="app-session-name-button"
              onClick={startSessionNameEdit}
              title="Click to edit session name"
            >
              {sessionName}
            </button>
          )}
          <p className={`mode-badge ${collaborationMode === 'firebase' ? 'firebase' : ''}`}>
            {collaborationMode === 'firebase' ? 'Firebase Shared Session' : 'Local Session'}
          </p>
        </div>
      </header>

      <div className="app-actions" role="group" aria-label="Table controls">
        <ActionIconButton
          label="Add Player"
          icon={AddUserIcon}
          onClick={openAddPlayerDialog}
          variant="primary"
        />
        <ActionIconButton
          label="Reset Values"
          icon={ResetIcon}
          onClick={handleResetValues}
          disabled={!hasValuesToReset}
        />
        <ActionIconButton
          label="Remove All"
          icon={BulkRemoveIcon}
          onClick={handleClearPlayers}
          disabled={players.length === 0}
          variant="destructive"
        />
        <ActionIconButton
          label="Game Settings"
          icon={SettingsSliderIcon}
          onClick={openDefaultBuyInModal}
          variant="secondary"
        />
        <ActionIconButton
          label={isSharing ? 'Sharing...' : 'Share Link'}
          icon={ShareIcon}
          onClick={handleShare}
          disabled={isSharing}
          variant="secondary"
        />
      </div>

      {shareFeedback && <p className="app-share-feedback">{shareFeedback}</p>}

      {players.length === 0 ? (
        <div className="empty-state">
          <p>No players yet.</p>
          <p className="muted">Add everyone at the table to get started.</p>
        </div>
      ) : (
        <div className="player-grid">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onRequestBuyIn={openBuyInModal}
              onRemovePlayer={handleRemovePlayer}
              onUndoBuyIn={handleUndoBuyIn}
            />
          ))}
        </div>
      )}

      <Settlement players={players} onRequestStackEntry={openStackModal} />

      <footer className="app-footer">
        <a
          className="app-footer-link"
          href="https://github.com/mattaschmann/home-game"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open the Home Game GitHub repository"
          title="GitHub"
        >
          <GitHubIcon />
        </a>
      </footer>

      {dialogConfig && (
        <BuyInModal
          isOpen={amountDialog.isOpen}
          playerName={activePlayer?.name}
          title={dialogConfig.title}
          description={dialogConfig.description}
          defaultAmount={dialogConfig.defaultAmount}
          confirmLabel={dialogConfig.confirmLabel}
          confirmTextBuilder={dialogConfig.confirmTextBuilder}
          allowZero={dialogConfig.allowZero}
          secondaryActionLabel={dialogConfig.secondaryActionLabel}
          onSecondaryAction={
            dialogConfig.secondaryActionLabel ? handleClearStack : undefined
          }
          onConfirm={handleConfirmDialog}
          onCancel={closeAmountDialog}
        />
      )}

      <GameSettingsModal
        isOpen={isSettingsOpen}
        defaultBuyIn={settings.defaultBuyIn ?? 0}
        firebaseConfigDraft={firebaseConfigDraft}
        firebaseSessionIdDraft={firebaseSessionIdDraft}
        bitlyAccessTokenDraft={bitlyAccessTokenDraft}
        bitlyConnected={Boolean(bitlyAccessToken.trim())}
        bitlyError={bitlyError}
        bitlyEligibilityReason={bitlyEligibilityReason}
        collaborationMode={collaborationMode}
        collaborationError={collaborationError}
        onClose={closeSettingsModal}
        onSaveDefaultBuyIn={(defaultBuyIn) => {
          setSettings((prev) => ({ ...prev, defaultBuyIn }));
        }}
        onFirebaseConfigDraftChange={setFirebaseConfigDraft}
        onFirebaseSessionIdDraftChange={setFirebaseSessionIdDraft}
        onBitlyAccessTokenDraftChange={setBitlyAccessTokenDraft}
        onSaveBitlySettings={handleSaveBitlySettings}
        onClearBitlySettings={handleClearBitlySettings}
        onStartCollaboration={handleStartCollaboration}
        onLeaveCollaboration={handleLeaveCollaboration}
      />

      <AddPlayer
        isOpen={isAddPlayerDialogOpen}
        onClose={closeAddPlayerDialog}
        onAddPlayer={handleAddPlayer}
        existingPlayers={players}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmContent?.title}
        message={confirmContent?.message}
        confirmText={confirmContent?.confirmText}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
      />
    </div>
  );
}

export default App;
