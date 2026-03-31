import React, { useEffect, useRef, useState } from 'react';
import { parseCurrencyInput } from '../../utils/calculations';
import './GameSettingsModal.css';

export default function GameSettingsModal({
  isOpen,
  defaultBuyIn,
  firebaseConfigDraft,
  firebaseSessionIdDraft,
  collaborationMode,
  collaborationError,
  onClose,
  onSaveDefaultBuyIn,
  onFirebaseConfigDraftChange,
  onFirebaseSessionIdDraftChange,
  onStartCollaboration,
  onLeaveCollaboration
}) {
  const [buyInInput, setBuyInInput] = useState(defaultBuyIn.toFixed(2));
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      setTimeout(() => {
        firstInputRef.current?.focus();
        firstInputRef.current?.select();
      }, 50);
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, defaultBuyIn]);

  if (!isOpen) {
    return null;
  }

  const parsedBuyIn = parseCurrencyInput(buyInInput);
  const canSaveBuyIn = buyInInput !== '' && parsedBuyIn >= 0;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="settings-modal" role="dialog" aria-modal="true" aria-label="Game settings">
        <div className="settings-section">
          <h3>Table Settings</h3>
          <p className="settings-help">Set the default buy-in amount used when adding buy-ins.</p>
          <div className="settings-buyin-row">
            <span className="settings-currency">$</span>
            <input
              ref={firstInputRef}
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              className="settings-buyin-input"
              value={buyInInput}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                  setBuyInInput(value);
                }
              }}
            />
            <button
              type="button"
              className="settings-button primary"
              disabled={!canSaveBuyIn}
              onClick={() => {
                if (!canSaveBuyIn) {
                  return;
                }
                onSaveDefaultBuyIn(parsedBuyIn);
              }}
            >
              Save Default
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>Firebase Collaboration</h3>
          <p className="settings-help">
            Paste your Firebase web app config JSON and choose a session id to share this game.
          </p>
          <p className={`settings-mode ${collaborationMode === 'firebase' ? 'active' : ''}`}>
            Mode: {collaborationMode === 'firebase' ? 'Firebase (shared)' : 'Local only'}
          </p>
          <label className="settings-label" htmlFor="firebase-config">
            Firebase config (JSON)
          </label>
          <textarea
            id="firebase-config"
            className="settings-textarea"
            rows={6}
            value={firebaseConfigDraft}
            onChange={(event) => onFirebaseConfigDraftChange(event.target.value)}
            placeholder='{"apiKey":"...","authDomain":"...","projectId":"...","appId":"..."}'
          />
          <label className="settings-label" htmlFor="firebase-session-id">
            Session id
          </label>
          <input
            id="firebase-session-id"
            type="text"
            className="settings-text-input"
            value={firebaseSessionIdDraft}
            onChange={(event) => onFirebaseSessionIdDraftChange(event.target.value)}
            placeholder="friday-night-game"
          />

          {collaborationError && <p className="settings-error">{collaborationError}</p>}

          <div className="settings-actions-row">
            <button
              type="button"
              className="settings-button primary"
              onClick={onStartCollaboration}
            >
              Start / Update Link
            </button>
            {collaborationMode === 'firebase' && (
              <button
                type="button"
                className="settings-button ghost"
                onClick={onLeaveCollaboration}
              >
                Leave Collaboration
              </button>
            )}
          </div>
        </div>

        <div className="settings-footer">
          <button type="button" className="settings-button cancel" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
