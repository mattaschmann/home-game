import { useState, useEffect, useMemo } from 'react';
import { loadPlayerNames } from '../utils/storage';

export function usePlayerSuggestions(inputValue) {
  const [allNames, setAllNames] = useState([]);

  // Load player names on mount
  useEffect(() => {
    const names = loadPlayerNames();
    setAllNames(names);
  }, []);

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.length < 1) {
      return [];
    }

    const lowercaseInput = inputValue.toLowerCase();
    return allNames
      .filter(name => 
        name.toLowerCase().includes(lowercaseInput) &&
        name.toLowerCase() !== lowercaseInput // Don't suggest exact matches
      )
      .slice(0, 5); // Limit to 5 suggestions
  }, [inputValue, allNames]);

  // Refresh the list of names (call after adding a new player)
  const refreshNames = () => {
    const names = loadPlayerNames();
    setAllNames(names);
  };

  return { suggestions, refreshNames };
}