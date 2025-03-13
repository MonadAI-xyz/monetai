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
        const {id, decision, createdAt} = row;

        if (decision.trading) {
            const {reasoning, ...restTrading} = decision.trading;
            const {comparativeAnalysis, ...restReasoning} = reasoning;

            // Restructure data
            tradingDecisions.push({
                id,
                createdAt,
                ...restTrading,
                ...restReasoning,
                ...comparativeAnalysis
            });
        }

        if (decision.curvance) {
            const {reasoning, ...restCurvance} = decision.curvance;
            // Restructure data
            curvanceDecisions.push({id, createdAt, ...restCurvance, ...reasoning});
        }
    });

    return {tradingDecisions, curvanceDecisions};
}