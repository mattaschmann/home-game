import React from 'react';
import { calculateTotalInvested, formatCurrency } from '../../utils/calculations';
import './PlayerCard.css';

const IconButton = ({ label, onClick, children, disabled }) => (
  <button
    className="icon-button"
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const UndoIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 7H5v4" />
    <path d="M5 11c1.5-3 4.5-5 8-5a7 7 0 110 14" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 7h12" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M8 7l1-2h6l1 2" />
    <path d="M9 21h6" />
  </svg>
);

export default function PlayerCard({
  player,
  onRequestBuyIn,
  onRemovePlayer,
  onUndoBuyIn
}) {
  const totalInvested = calculateTotalInvested(player.buyIns);
  const buyInCount = player.buyIns.length;

  return (
    <article className="player-row">
      <div className="row-primary">
        <div className="player-identity">
          <span className="player-name">{player.name}</span>
          <span className="buyin-chip">{buyInCount}</span>
        </div>

        <div className="player-metrics">
          <div className="metric">
            <span className="metric-value">{formatCurrency(totalInvested)}</span>
          </div>
        </div>
      </div>

      <div className="row-secondary">
        <div className="player-actions">
          <IconButton label={`Add buy-in for ${player.name}`} onClick={() => onRequestBuyIn(player.id)}>
            <PlusIcon />
          </IconButton>
          <IconButton
            label={`Undo last buy-in for ${player.name}`}
            onClick={() => onUndoBuyIn(player.id)}
            disabled={player.buyIns.length === 0}
          >
            <UndoIcon />
          </IconButton>
          <IconButton label={`Remove ${player.name}`} onClick={() => onRemovePlayer(player.id)}>
            <TrashIcon />
          </IconButton>
        </div>
      </div>
    </article>
  );
}
