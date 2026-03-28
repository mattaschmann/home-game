// Calculate total invested amount for a player
export const calculateTotalInvested = (buyIns) => {
  return buyIns.reduce((total, buyIn) => total + buyIn.amount, 0);
};

// Calculate net amount (profit/loss) for a player
export const calculateNetAmount = (finalStack, totalInvested) => {
  return finalStack - totalInvested;
};

// Format currency with 2 decimal places
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  const prefix = num < 0 ? '-$' : '$';
  return prefix + Math.abs(num).toFixed(2);
};

// Format net amount with color class
export const formatNetAmount = (amount) => {
  const num = Number(amount) || 0;
  if (num > 0) {
    return { text: `+${formatCurrency(num)}`, className: 'profit' };
  } else if (num < 0) {
    return { text: formatCurrency(num), className: 'loss' };
  } else {
    return { text: formatCurrency(0), className: 'even' };
  }
};

// Calculate total pot (sum of all investments)
export const calculateTotalPot = (players) => {
  return players.reduce((total, player) => {
    return total + calculateTotalInvested(player.buyIns);
  }, 0);
};

// Calculate total cashed out (sum of all final stacks)
export const calculateTotalCashedOut = (players) => {
  return players.reduce((total, player) => {
    return total + (Number(player.finalStack) || 0);
  }, 0);
};

// Verify pot is balanced (should be close to 0)
export const isPotBalanced = (players) => {
  const totalIn = calculateTotalPot(players);
  const totalOut = calculateTotalCashedOut(players);
  const difference = Math.abs(totalIn - totalOut);
  return difference < 0.01; // Account for floating point precision
};

// Parse currency input (remove $ and validate)
export const parseCurrencyInput = (input) => {
  const cleaned = String(input).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100; // Round to cents
};