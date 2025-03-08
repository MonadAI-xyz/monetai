export const eTokenABI = [
  'function interestRateModel() view returns (uint256)',
  'function totalBorrows() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function getBorrowingPower(address) view returns (uint256)',
  'function borrowFor(address, address, uint256) returns (bool)',
  'function isDelegateApproved(address, address) view returns (bool)',
  'function setDelegateApproval(address, bool) returns (bool)',
]; 