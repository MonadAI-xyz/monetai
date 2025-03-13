export const universalBalanceABI = [
  'function depositFor(uint256, bool, address) returns (bool)',
  'function withdrawFor(uint256, bool, address, address) returns (bool)',
  'function isDelegateApproved(address, address) view returns (bool)',
  'function setDelegateApproval(address, bool) returns (bool)',
]; 