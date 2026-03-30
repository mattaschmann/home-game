import React, { useState, useRef, useEffect } from 'react';
import { usePlayerSuggestions } from '../../hooks/usePlayerSuggestions';
import './AddPlayer.css';

export default function AddPlayer({ isOpen, onClose, onAddPlayer, existingPlayers = [] }) {
  const [playerName, setPlayerName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const { suggestions, refreshNames } = usePlayerSuggestions(playerName);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const filteredSuggestions = suggestions.filter(
    (name) =>
      !existingPlayers.some(
        (player) => player.name.toLowerCase() === name.toLowerCase()
      )
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      setPlayerName('');
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  useEffect(() => {
    if (playerName.length === 0 || filteredSuggestions.length === 0) {
      setShowSuggestions(false);
    }
  }, [playerName, filteredSuggestions.length]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setPlayerName(value);
    setShowSuggestions(value.length > 0 && filteredSuggestions.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        handleSuggestionClick(filteredSuggestions[selectedSuggestionIndex]);
      } else {
        handleAddPlayer();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      onClose();
    }
  };

  const handleSuggestionClick = (name) => {
    setPlayerName(name);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    handleAddPlayer(name);
  };

  const handleAddPlayer = (name = playerName.trim()) => {
    if (!name) {
      return;
    }

    if (existingPlayers.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return;
    }

    const didAdd = onAddPlayer(name);

    if (didAdd) {
      setPlayerName('');
      setShowSuggestions(false);
      refreshNames();
      onClose();
    }
  };

  const isNameTaken = existingPlayers.some(
    (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
  );

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="add-player-modal" role="dialog" aria-modal="true">
        <div className="add-player-header">
          <p className="eyebrow">Players</p>
          <h3>Add Someone New</h3>
          <p className="add-player-hint">
            Type a new name or pick one you have used before.
          </p>
        </div>
        <div className="add-player">
          <div className="add-player-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className={`add-player-input ${isNameTaken ? 'error' : ''}`}
              placeholder="Enter player name..."
              value={playerName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div ref={suggestionsRef} className="player-suggestions">
                {filteredSuggestions.map((name, index) => (
                  <button
                    key={name}
                    className={`suggestion-item ${
                      index === selectedSuggestionIndex ? 'selected' : ''
                    }`}
                    onClick={() => handleSuggestionClick(name)}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {isNameTaken && <p className="error-message">Player already exists</p>}
        </div>
        <div className="add-player-actions">
          <button
            type="button"
            className="add-player-button ghost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="add-player-button primary"
            onClick={() => handleAddPlayer()}
            disabled={!playerName.trim() || isNameTaken}
          >
            Add Player
          </button>
        </div>
      </div>
    </div>
  );
}
