import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import AddPlayer from './components/AddPlayer/AddPlayer';
import PlayerCard from './components/PlayerCard/PlayerCard';
import Settlement from './components/Settlement/Settlement';
import BuyInModal from './components/BuyInModal/BuyInModal';
import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog';
import {
  loadPlayers,
  savePlayers,
  loadSettings,
  saveSettings,
  addPlayerNameToHistory
} from './utils/storage';
import { parseCurrencyInput } from './utils/calculations';

function App() {
  const [players, setPlayers] = useState(() => loadPlayers());
  const [settings, setSettings] = useState(() => loadSettings());
  const [defaultBuyInInput, setDefaultBuyInInput] = useState(() =>
    (loadSettings().defaultBuyIn ?? 0).toFixed(2)
  );
  const [buyInModal, setBuyInModal] = useState({ isOpen: false, playerId: null });
  const [confirmState, setConfirmState] = useState({ isOpen: false, action: null, payload: null });

  useEffect(() => {
    savePlayers(players);
  }, [players]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const stats = useMemo(() => {
    const buyIns = players.reduce((total, player) => total + player.buyIns.length, 0);
    const activeStacks = players.filter((player) => player.finalStack && player.finalStack !== '').length;
    return {
      players: players.length,
      buyIns,
      activeStacks
    };
  }, [players]);

  const openBuyInModal = (playerId) => {
    setBuyInModal({ isOpen: true, playerId });
  };

  const closeBuyInModal = () => {
    setBuyInModal({ isOpen: false, playerId: null });
  };

  const handleAddPlayer = (name) => {
    setPlayers((prev) => [
      ...prev,
      {
        id: uuidv4(),
        name,
        buyIns: [],
        finalStack: ''
      }
    ]);
    addPlayerNameToHistory(name);
  };

  const handleConfirmBuyIn = (amount) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === buyInModal.playerId
          ? {
              ...player,
              buyIns: [...player.buyIns, { amount, timestamp: Date.now() }]
            }
          : player
      )
    );
    setSettings((prev) => ({ ...prev, defaultBuyIn: amount }));
    closeBuyInModal();
  };

  const handleFinalStackChange = (playerId, value) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === playerId ? { ...player, finalStack: value } : player
      )
    );
  };

  const handleDefaultBuyInChange = (value) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setDefaultBuyInInput(value);
      const parsed = Math.max(0, parseCurrencyInput(value));
      setSettings((prev) => ({ ...prev, defaultBuyIn: parsed }));
    }
  };

  const handleDefaultBuyInBlur = () => {
    setDefaultBuyInInput((settings.defaultBuyIn ?? 0).toFixed(2));
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

  const activePlayer = players.find((player) => player.id === buyInModal.playerId);

  return (
    <div className="app container">
      <header className="app-header">
        <div>
          <p className="eyebrow">Home Game Helper</p>
          <h1>Poker Buy-in Tracker</h1>
          <p className="subtitle">
            Track buy-ins, final stacks, and see who ended up ahead on any phone.
          </p>
        </div>
        <div className="header-stats">
          <div>
            <span>Players</span>
            <strong>{stats.players}</strong>
          </div>
          <div>
            <span>Buy-ins</span>
            <strong>{stats.buyIns}</strong>
          </div>
          <div>
            <span>Stacks Entered</span>
            <strong>{stats.activeStacks}</strong>
          </div>
        </div>
      </header>

      <AddPlayer onAddPlayer={handleAddPlayer} existingPlayers={players} />

      <div className="app-controls">
        <button
          className="control-button"
          onClick={handleResetValues}
          disabled={!hasValuesToReset}
        >
          Reset All Values
        </button>
        <button
          className="control-button secondary"
          onClick={handleClearPlayers}
          disabled={players.length === 0}
        >
          Remove All Players
        </button>
      </div>

      <section className="settings-panel">
        <div>
          <p className="eyebrow">Game Settings</p>
          <p className="settings-hint">Choose the default amount that pre-fills every buy-in.</p>
        </div>
        <label className="settings-field">
          <span>Default Buy-in</span>
          <div className="settings-input">
            <span className="currency-prefix">$</span>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={defaultBuyInInput}
              onChange={(event) => handleDefaultBuyInChange(event.target.value)}
              onBlur={handleDefaultBuyInBlur}
              placeholder="0.00"
            />
          </div>
        </label>
      </section>

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

      <Settlement players={players} onFinalStackChange={handleFinalStackChange} />

      <BuyInModal
        isOpen={buyInModal.isOpen}
        playerName={activePlayer?.name}
        defaultAmount={settings.defaultBuyIn ?? 10}
        onConfirm={handleConfirmBuyIn}
        onCancel={closeBuyInModal}
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
