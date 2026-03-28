import React, { useMemo } from 'react';
import {
  calculateTotalPot,
  calculateTotalCashedOut,
  calculateTotalInvested,
  calculateNetAmount,
  formatCurrency,
  formatNetAmount,
  parseCurrencyInput
} from '../../utils/calculations';
import './Settlement.css';

export default function Settlement({ players, onFinalStackChange }) {
  const summary = useMemo(() => {
    const totalInvested = calculateTotalPot(players);
    const totalCashedOut = calculateTotalCashedOut(players);
    const difference = totalCashedOut - totalInvested;

    const standings = players
      .map((player) => {
        const invested = calculateTotalInvested(player.buyIns);
        const finalStack = parseCurrencyInput(player.finalStack ?? '');
        const net = calculateNetAmount(finalStack, invested);
        return {
          id: player.id,
          name: player.name,
          net,
          display: formatNetAmount(net)
        };
      })
      .sort((a, b) => b.net - a.net);

    return {
      totalInvested,
      totalCashedOut,
      difference,
      standings
    };
  }, [players]);

  const isBalanced = Math.abs(summary.difference) < 0.01;

  const handleStackChange = (playerId, value) => {
    if (!onFinalStackChange) return;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      onFinalStackChange(playerId, value);
    }
  };

  return (
    <section className="settlement">
      <div className="section-header">
        <div>
          <p className="eyebrow">Game Summary</p>
          <h2>Settlement</h2>
        </div>
        <span className={`balance-pill ${isBalanced ? 'balanced' : 'unbalanced'}`}>
          {isBalanced ? 'Balanced' : 'Check Totals'}
        </span>
      </div>

      <div className="totals-grid">
        <div>
          <p className="label">Total Buy-ins</p>
          <strong>{formatCurrency(summary.totalInvested)}</strong>
        </div>
        <div>
          <p className="label">Total Stacks</p>
          <strong>{formatCurrency(summary.totalCashedOut)}</strong>
        </div>
        <div>
          <p className="label">Difference</p>
          <strong className={isBalanced ? 'even' : 'loss'}>
            {formatCurrency(summary.difference)}
          </strong>
        </div>
      </div>

      <div className="stack-manager">
        <p className="label">Enter final stacks</p>
        {players.length === 0 ? (
          <p className="empty-state">Add players to enter their stacks.</p>
        ) : (
          <div className="stack-list">
            {players.map((player) => {
              const invested = calculateTotalInvested(player.buyIns);
              const finalStackValue = player.finalStack ?? '';
              const net = calculateNetAmount(parseCurrencyInput(finalStackValue), invested);
              const netDisplay = formatNetAmount(net);

              return (
                <div key={player.id} className="stack-row">
                  <div className="stack-player">
                    <span className="stack-name">{player.name}</span>
                    <span className="stack-invested">{formatCurrency(invested)}</span>
                  </div>
                  <div className="stack-controls">
                    <div className="stack-input">
                      <span className="currency-prefix">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        value={finalStackValue}
                        onChange={(event) => handleStackChange(player.id, event.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <span className={`stack-net ${netDisplay.className}`}>{netDisplay.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="standings">
        {summary.standings.length === 0 ? (
          <p className="empty-state">Add players to see standings.</p>
        ) : (
          summary.standings.map((player) => (
            <div key={player.id} className="standing-row">
              <span>{player.name}</span>
              <span className={player.display.className}>{player.display.text}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
