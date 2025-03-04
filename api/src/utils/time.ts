export const getTimeRanges = () => {
  const now = Math.floor(Date.now() / 1000); // current timestamp in seconds
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60); // 30 days ago in seconds
  
  return {
    from: thirtyDaysAgo,
    to: now,
    resolution: '240' // 4-hour intervals
  };
};

export const timestampToDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toISOString();
}; 