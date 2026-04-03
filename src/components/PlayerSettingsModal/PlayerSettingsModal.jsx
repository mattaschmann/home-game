import React, { useEffect, useRef, useState } from 'react';
import './PlayerSettingsModal.css';

const normalizeVenmo = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.replace(/^@+/, '');
};

export default function PlayerSettingsModal({
  isOpen,
  player,
  existingPlayers = [],
  onClose,
  onSave
}) {
  const [name, setName] = useState('');
  const [venmoHandle, setVenmoHandle] = useState('');
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      return () => document.body.classList.remove('modal-open');
    }

    document.body.classList.remove('modal-open');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !player) {
      return;
    }

    setName(player.name ?? '');
    setVenmoHandle(player.venmoId ?? '');
    setTimeout(() => nameInputRef.current?.focus(), 50);
  }, [isOpen, player?.id]);

  if (!isOpen || !player) {
    return null;
  }

  const trimmedName = name.trim();
  const isDuplicateName = existingPlayers.some(
    (existing) =>
      existing.id !== player.id && existing.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );

  const nameError = !trimmedName
    ? 'Player name is required.'
    : isDuplicateName
      ? 'Another player is already using this name.'
      : '';

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (nameError) {
      nameInputRef.current?.focus();
      return;
    }

    onSave({
      name: trimmedName,
      venmoId: normalizeVenmo(venmoHandle)
    });
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="player-settings-modal" role="dialog" aria-modal="true">
        <div className="player-settings-header">
          <p className="eyebrow">Player Settings</p>
          <h3>Edit {player.name}</h3>
          <p className="player-settings-hint">Update this player&apos;s name or link their Venmo handle.</p>
        </div>

        <form className="player-settings-form" onSubmit={handleSubmit}>
          <label className="player-settings-field">
            <span>Player Name</span>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              className={nameError ? 'has-error' : ''}
              aria-invalid={Boolean(nameError)}
            />
          </label>
          {nameError && <p className="error-message">{nameError}</p>}

          <label className="player-settings-field">
            <span>Venmo Handle</span>
            <div className="player-settings-venmo-input">
              <span className="player-settings-venmo-prefix">@</span>
              <input
                type="text"
                value={venmoHandle}
                onChange={(event) => setVenmoHandle(event.target.value)}
                placeholder="username"
                aria-label="Venmo handle"
              />
            </div>
            <p className="player-settings-field-hint">Optional. Leave blank if they don&apos;t use Venmo.</p>
          </label>

          <div className="player-settings-actions">
            <button type="button" className="player-settings-button ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="player-settings-button primary" disabled={Boolean(nameError)}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
