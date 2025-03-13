import { Metadata } from "next";

import DAOGovernance from "@/components/dao-governance";
import DAOProposalOverview from "@/components/dao-proposal-overview";
import DAOVotingStats from "@/components/dao-voting-stats";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "DAO Governance",
};

export default function Page() {
  return (
    <main className="bg-background relative flex min-h-svh flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {/* Left Section (Voting Stats) */}
          <div className="bg-muted/50 rounded-xl p-6">
            <DAOVotingStats />
          </div>

          {/* Center Section (Main DAO Governance Panel) */}
          <div className="bg-muted/50 rounded-xl p-6">
            <DAOGovernance />
          </div>

          {/* Right Section (Proposal Overview) */}
          <div className="bg-muted/50 rounded-xl p-6">
            <DAOProposalOverview />
          </div>
        </div>
      </div>
    </main>
  );
}
