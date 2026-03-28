import React, { useState, useEffect, useRef } from 'react';
import { parseCurrencyInput, formatCurrency } from '../../utils/calculations';
import './BuyInModal.css';

export default function BuyInModal({ 
  isOpen, 
  playerName, 
  defaultAmount = 10,
  onConfirm, 
  onCancel 
}) {
  const [amount, setAmount] = useState(defaultAmount.toFixed(2));
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      setAmount(defaultAmount.toFixed(2));
      // Focus input after a short delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, defaultAmount]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow typing decimal numbers
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const handleConfirm = () => {
    const parsedAmount = parseCurrencyInput(amount);
    if (parsedAmount > 0) {
      onConfirm(parsedAmount);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="buyin-modal">
        <h3 className="buyin-title">Add Buy-in for {playerName || 'Player'}</h3>
        <p className="buyin-default-note">
          Using table default {formatCurrency(defaultAmount)}. Update this amount if this
          buy-in is different.
        </p>
        
        <div className="buyin-input-group">
          <span className="currency-symbol">$</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            className="buyin-input"
            value={amount}
            onChange={handleAmountChange}
            onKeyDown={handleKeyDown}
            placeholder="0.00"
          />
        </div>

        <div className="buyin-actions">
          <button 
            className="buyin-button cancel" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="buyin-button confirm" 
            onClick={handleConfirm}
            disabled={!amount || parseCurrencyInput(amount) <= 0}
          >
            Add {formatCurrency(parseCurrencyInput(amount))}
          </button>
        </div>
      </div>
    </div>
  );
}
