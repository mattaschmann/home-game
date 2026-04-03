import React, { useState, useEffect, useRef } from 'react';
import { parseCurrencyInput, formatCurrency } from '../../utils/calculations';
import './BuyInModal.css';

export default function BuyInModal({
  isOpen,
  playerName,
  title,
  description,
  defaultAmount = 10,
  confirmLabel = 'Add',
  allowZero = false,
  onConfirm,
  onCancel,
  secondaryActionLabel,
  onSecondaryAction
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

  const resolvedTitle = title ?? `Add Buy-in for ${playerName || 'Player'}`;
  const resolvedDescription =
    description ??
    `Using table default ${formatCurrency(defaultAmount)}. Update this amount if this buy-in is different.`;

  const parsedAmount = parseCurrencyInput(amount);
  const canConfirm =
    amount !== '' && (allowZero ? parsedAmount >= 0 : parsedAmount > 0);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(parsedAmount);
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
        <h3 className="buyin-title">{resolvedTitle}</h3>
        <p className="buyin-default-note">{resolvedDescription}</p>
        
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
          {secondaryActionLabel && onSecondaryAction && (
            <button
              className="buyin-button ghost"
              type="button"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </button>
          )}
          <button 
            className="buyin-button confirm" 
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
