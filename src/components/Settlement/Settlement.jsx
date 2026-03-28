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

export default function Settlement({ players }) {
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
