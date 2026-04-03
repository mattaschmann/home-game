import React, { useState, useEffect, useRef } from 'react';
import { parseCurrencyInput, formatCurrency } from '../../utils/calculations';
import './BuyInModal.css';

export default function BuyInModal(props) {
  const { isOpen } = props;

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      return () => document.body.classList.remove('modal-open');
    }

    document.body.classList.remove('modal-open');
    return undefined;
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <BuyInModalContent
      key={`${props.playerName ?? 'player'}-${props.defaultAmount ?? 10}`}
      {...props}
    />
  );
}

function BuyInModalContent({
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
  const [amount, setAmount] = useState(() => defaultAmount.toFixed(2));
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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
