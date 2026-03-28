import React, { useState, useRef, useEffect } from 'react';
import { usePlayerSuggestions } from '../../hooks/usePlayerSuggestions';
import './AddPlayer.css';

export default function AddPlayer({ onAddPlayer, existingPlayers = [] }) {
  const [playerName, setPlayerName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const { suggestions, refreshNames } = usePlayerSuggestions(playerName);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Filter out existing players from suggestions
  const filteredSuggestions = suggestions.filter(
    name => !existingPlayers.some(
      player => player.name.toLowerCase() === name.toLowerCase()
    )
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setPlayerName(value);
    setShowSuggestions(value.length > 0 && filteredSuggestions.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
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
    }
  };

  const handleSuggestionClick = (name) => {
    setPlayerName(name);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    handleAddPlayer(name);
  };

  const handleAddPlayer = (name = playerName.trim()) => {
    if (name && !existingPlayers.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      onAddPlayer(name);
      setPlayerName('');
      setShowSuggestions(false);
      refreshNames(); // Refresh the suggestions list
      inputRef.current?.focus();
    }
  };

  const isNameTaken = existingPlayers.some(
    p => p.name.toLowerCase() === playerName.trim().toLowerCase()
  );

  return (
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
          onFocus={() => {
            if (playerName.length > 0 && filteredSuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        <button
          className="add-player-button"
          onClick={() => handleAddPlayer()}
          disabled={!playerName.trim() || isNameTaken}
        >
          Add Player
        </button>
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div ref={suggestionsRef} className="player-suggestions">
            {filteredSuggestions.map((name, index) => (
              <button
                key={name}
                className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
                onClick={() => handleSuggestionClick(name)}
                onMouseEnter={() => setSelectedSuggestionIndex(index)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
      {isNameTaken && (
        <p className="error-message">Player already exists</p>
      )}
    </div>
  );
}