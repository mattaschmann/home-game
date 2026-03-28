import React from 'react';
import {
  calculateTotalInvested,
  calculateNetAmount,
  formatCurrency,
  formatNetAmount,
  parseCurrencyInput
} from '../../utils/calculations';
import './PlayerCard.css';

export default function PlayerCard({
  player,
  onRequestBuyIn,
  onFinalStackChange,
  onRemovePlayer
}) {
  const totalInvested = calculateTotalInvested(player.buyIns);
  const finalStackValue = player.finalStack ?? '';
  const numericFinalStack = parseCurrencyInput(finalStackValue);
  const netAmount = calculateNetAmount(numericFinalStack, totalInvested);
  const netDisplay = formatNetAmount(netAmount);

  const handleFinalStackInput = (event) => {
    const { value } = event.target;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      onFinalStackChange(player.id, value);
    }
  };

  const handleClearStack = () => {
    onFinalStackChange(player.id, '');
  };

  const buyInCount = player.buyIns.length;

  return (
    <article className="player-card">
      <header className="player-card__header">
        <div>
          <p className="player-label">Player</p>
          <h3 className="player-name">{player.name}</h3>
        </div>
        <button
          className="remove-player"
          onClick={() => onRemovePlayer(player.id)}
          aria-label={`Remove ${player.name}`}
        >
          ×
        </button>
      </header>

      <div className="player-card__stats">
        <div className="stat-block">
          <span className="stat-label">Buy-ins</span>
          <strong className="stat-value">{buyInCount}</strong>
          <button
            className="buy-in-trigger"
            onClick={() => onRequestBuyIn(player.id)}
          >
            + Add Buy-in
          </button>
        </div>

        <div className="stat-block">
          <span className="stat-label">Invested</span>
          <strong className="stat-value">{formatCurrency(totalInvested)}</strong>
        </div>

        <div className="stat-block">
          <span className="stat-label">Net</span>
          <strong className={`stat-value ${netDisplay.className}`}>
            {netDisplay.text}
          </strong>
        </div>
      </div>

      <div className="final-stack">
        <div className="final-stack__header">
          <span>Final Stack</span>
          {finalStackValue && (
            <button className="clear-stack" onClick={handleClearStack}>
              Clear
            </button>
          )}
        </div>
        <div className="currency-input">
          <span className="currency-prefix">$</span>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            value={finalStackValue}
            onChange={handleFinalStackInput}
            placeholder="0.00"
          />
        </div>
      </div>
    </article>
  );
}
