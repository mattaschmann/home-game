import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import AddPlayer from './components/AddPlayer/AddPlayer';
import PlayerCard from './components/PlayerCard/PlayerCard';
import Settlement from './components/Settlement/Settlement';
import BuyInModal from './components/BuyInModal/BuyInModal';
import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog';
import {
  loadGameState,
  loadGameStateFromUrl,
  saveGameState,
  addPlayerNameToHistory
} from './utils/storage';
import { parseCurrencyInput, formatCurrency } from './utils/calculations';

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

function App() {
  const [players, setPlayers] = useState(() => initialGameState.players);
  const [settings, setSettings] = useState(() => initialGameState.settings);
  const [amountDialog, setAmountDialog] = useState({ isOpen: false, mode: null, playerId: null });
  const [confirmState, setConfirmState] = useState({ isOpen: false, action: null, payload: null });
  const [isAddPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);

  useEffect(() => {
    saveGameState({ players, settings });
  }, [players, settings]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncStateFromUrl = () => {
      const urlState = loadGameStateFromUrl();
      if (!urlState) {
        return;
      }

      setPlayers(urlState.players);
      setSettings(urlState.settings);
    };

    window.addEventListener('hashchange', syncStateFromUrl);
    window.addEventListener('popstate', syncStateFromUrl);

    return () => {
      window.removeEventListener('hashchange', syncStateFromUrl);
      window.removeEventListener('popstate', syncStateFromUrl);
    };
  }, []);

  const openBuyInModal = (playerId) => {
    setAmountDialog({ isOpen: true, mode: 'buy-in', playerId });
  };

  const openStackModal = (playerId) => {
    setAmountDialog({ isOpen: true, mode: 'stack', playerId });
  };

  const openDefaultBuyInModal = () => {
    setAmountDialog({ isOpen: true, mode: 'settings', playerId: null });
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
      case 'settings': {
        setSettings((prev) => ({ ...prev, defaultBuyIn: amount }));
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
    const targetPlayer = players.find((player) => player.id === playerId);
    const hasData =
      (targetPlayer?.buyIns.length ?? 0) > 0 ||
      parseCurrencyInput(targetPlayer?.finalStack ?? '') > 0;

    if (hasData) {
      setConfirmState({
        isOpen: true,
        action: 'remove-player',
        payload: { playerId }
      });
    } else {
      setPlayers((prev) => prev.filter((player) => player.id !== playerId));
    }
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
        return {
          title: `Remove ${player?.name ?? 'player'}?`,
          message: 'This will delete all buy-ins and stack data for this player.',
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
      case 'settings': {
        const defaultAmount = settings.defaultBuyIn ?? 0;
        return {
          title: 'Set Table Default',
          description: 'This amount pre-fills every buy-in at the table.',
          defaultAmount,
          confirmLabel: 'Set',
          confirmTextBuilder: (value) => `Set ${formatCurrency(value)}`,
          allowZero: true
        };
      }
      default:
        return null;
    }
  }, [amountDialog, activePlayer, settings]);

  return (
    <div className="app container">
      <header className="app-header">
        <div>
          <p className="eyebrow">Home Game</p>
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
      </div>

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
