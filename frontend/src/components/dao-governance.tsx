"use client";

import React, { useState } from "react";

import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

interface Proposal {
  id: number;
  title: string;
  description: string;
  yesVotes: number;
  noVotes: number;
  status: "active" | "closed";
}

export default function DAOGovernance() {
  // Sample proposals data
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: 1,
      title: "Increase Staking Rewards",
      description: "Proposal to increase staking rewards by 10% for long-term holders.",
      yesVotes: 70,
      noVotes: 30,
      status: "active",
    },
    {
      id: 2,
      title: "Launch New NFT Collection",
      description: "Proposal to launch an exclusive NFT collection for DAO members.",
      yesVotes: 55,
      noVotes: 45,
      status: "closed",
    },
  ]);

  // Handle voting
  const handleVote = (id: number, type: "yes" | "no") => {
    setProposals((prev) =>
      prev.map((proposal) =>
        proposal.id === id
          ? {
            ...proposal,
            yesVotes: type === "yes" ? proposal.yesVotes + 5 : proposal.yesVotes,
            noVotes: type === "no" ? proposal.noVotes + 5 : proposal.noVotes,
          }
          : proposal
      )
    );
  };

  return (
    <>
      <h3 className="text-xl font-medium mb-4">Active Proposals</h3>
      {proposals
        .filter((proposal) => proposal.status === "active")
        .map((proposal) => (
          <div key={proposal.id} className="mb-6">
            <h4 className="text-md font-medium">{proposal.title}</h4>
            <p className="text-sm text-gray-400 mb-4">{proposal.description}</p>

            <div className="space-y-4">
              {/* Voting Progress */}
              <div>
                <p className="text-sm font-medium mb-1">Yes ({proposal.yesVotes}%)</p>
                <Progress value={proposal.yesVotes} />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">No ({proposal.noVotes}%)</p>
                <Progress value={proposal.noVotes} />
              </div>

              {/* Voting Buttons */}
              <div className="flex gap-4 justify-end">
                <Button
                  disabled={proposal.noVotes >= 100}
                  variant="destructive"
                  onClick={() => handleVote(proposal.id, "no")}
                >
                  Vote No
                </Button>
                <Button
                  disabled={proposal.yesVotes >= 100}
                  onClick={() => handleVote(proposal.id, "yes")}
                >
                  Vote Yes
                </Button>
              </div>
            </div>
          </div>
        ))}
    </>
  );
};
