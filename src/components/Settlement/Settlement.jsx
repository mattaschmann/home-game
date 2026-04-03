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

const buildVenmoLink = ({ handle, net, sessionName }) => {
  if (!handle || typeof net !== 'number' || Math.abs(net) < 0.01) {
    return null;
  }

  const normalizedHandle = handle.replace(/^@+/, '').trim();
  if (!normalizedHandle) {
    return null;
  }

  const txn = net > 0 ? 'pay' : 'charge';
  const amount = Math.abs(net).toFixed(2);
  const noteBase = sessionName?.trim() ? sessionName.trim() : 'Home Game';
  const note = `${noteBase} settlement`;
  const params = new URLSearchParams({
    txn,
    recipients: normalizedHandle,
    amount,
    note,
    audience: 'friends'
  });
  const query = params.toString();

  return {
    txn,
    appUrl: `venmo://paycharge?${query}`,
    webUrl: `https://venmo.com/?${query}`,
    label: txn === 'pay' ? 'Pay via Venmo' : 'Request via Venmo'
  };
};

const VenmoIcon = () => (
  <svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">
    <path d="M278 387H174.32L132.75 138.44l90.75-8.62 22 176.87c20.53-33.45 45.88-86 45.88-121.87 0-19.62-3.36-33-8.61-44L365.4 124.1c9.56 15.78 13.86 32 13.86 52.57C379.25 242.17 323.34 327.26 278 387Z" />
  </svg>
);

export default function Settlement({ players, onRequestStackEntry, sessionName }) {
  const summary = useMemo(() => {
    const totalInvested = calculateTotalPot(players);
    const totalCashedOut = calculateTotalCashedOut(players);
    const difference = totalCashedOut - totalInvested;

    const standings = players
      .map((player) => {
        const invested = calculateTotalInvested(player.buyIns);
        const finalStackRaw = player.finalStack ?? '';
        const finalStackAmount = parseCurrencyInput(finalStackRaw);
        const net = calculateNetAmount(finalStackAmount, invested);
        return {
          id: player.id,
          name: player.name,
          invested,
          finalStackRaw,
          finalStackAmount,
          net,
          venmoLink: buildVenmoLink({ handle: player.venmoId ?? '', net, sessionName }),
          display: formatNetAmount(net)
        };
      });

    return {
      totalInvested,
      totalCashedOut,
      difference,
      standings
    };
  }, [players, sessionName]);

  const isBalanced = Math.abs(summary.difference) < 0.01;
  const handleVenmoLinkClick = (event, venmoLink) => {
    if (!venmoLink || typeof navigator === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      return;
    }

    // Attempt to trigger the Venmo app; browser will still follow the fallback link.
    window.location.href = venmoLink.appUrl;
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

      <div
        className={`standings ${summary.standings.length === 0 ? 'is-empty' : ''}`}
      >
        {summary.standings.length === 0 ? (
          <p className="empty-state">Add players to enter and settle stacks.</p>
        ) : (
          summary.standings.map((player) => {
            const hasStack = player.finalStackRaw !== '';

            return (
              <div key={player.id} className="standing-row">
                <div className="standing-player">
                  <span className="standing-name">{player.name}</span>
                  <span className="standing-invested">{formatCurrency(player.invested)}</span>
                </div>
                <button
                  type="button"
                  className={`stack-chip ${hasStack ? 'has-value' : ''}`}
                  onClick={() => onRequestStackEntry?.(player.id)}
                >
                  <span className="stack-chip-label">Stack</span>
                  <span className="stack-chip-value">
                    {hasStack ? formatCurrency(player.finalStackAmount) : 'Set Stack'}
                  </span>
                </button>
                <div className="standing-actions">
                  <span className={`standing-net ${player.display.className}`}>
                    {player.display.text}
                  </span>
                  {player.venmoLink && (
                    <a
                      className={`standing-venmo-link ${player.venmoLink.txn}`}
                      href={player.venmoLink.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={player.venmoLink.label}
                      title={player.venmoLink.label}
                      onClick={(event) => handleVenmoLinkClick(event, player.venmoLink)}
                    >
                      <VenmoIcon />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
