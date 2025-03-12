// TODO - define `data` type here
/**
 * Transform decisions data to populate in Data Table
 * @param data Array
 * @returns Object
 */
export function transformDecisionsData(data) {
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
      const {reasoning, ...restCurvance} = decision.curvance;
      // Restructure data
      curvanceDecisions.push({ id, ...restCurvance, ...reasoning });
    }
  });

  return { tradingDecisions, curvanceDecisions };
}