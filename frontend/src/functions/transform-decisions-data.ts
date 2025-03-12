// TODO - define `data` type here
export function parseTradingData(data) {
  if (!data) return null;

  const tradingDecisions = [];
  const curvanceDecisions = [];

  data?.forEach((row) => {
    const { id, decision } = row;
    
    if (decision.trading) {
      const {reasoning, ...restTrading} = decision.trading;
      const {comparativeAnalysis, ...restReasoning} = reasoning;

      // Restructure data
      tradingDecisions.push({ 
        id, 
        ...restTrading,
        ...restReasoning,
        ...comparativeAnalysis
      });
    }

    if (decision.curvance) {
      curvanceDecisions.push({ id, ...decision.curvance });
    }
  });

  return { tradingDecisions, curvanceDecisions };
}