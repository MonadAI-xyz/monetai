import React from 'react'

import { Progress } from './ui/progress'

export default function DAOGovernance() {
  const yesVotes = 90; // Percentage of Yes votes
  const noVotes = 10; // Percentage of No votes

  return (
    <>
      <h3 className="text-lg font-semibold mb-6">DAO GOV - Active proposals</h3>

      <div className="mb-4">
        <p className="text-sm font-medium mb-1">Yes ({yesVotes}%)</p>
        <Progress value={yesVotes} />
      </div>

      <div>
        <p className="text-sm font-medium mb-1">No ({noVotes}%)</p>
        <Progress value={noVotes} />
      </div>
    </>
  )
}
