import { Metadata } from "next";

import DAOGovernance from "@/components/dao-governance";
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
          {/* Left Section (Voting Stats or Community Polls) */}
          <div className="bg-muted/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Voting Stats</h3>
            <p className="text-sm text-gray-400">Total votes, participation rate, etc.</p>
          </div>

          {/* Center Section (Main DAO Governance Panel) */}
          <div className="bg-muted/50 rounded-xl p-6">
            <DAOGovernance />
          </div>

          {/* Right Section (Other DAO Features) */}
          <div className="bg-muted/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">DAO Proposals</h3>
            <p className="text-sm text-gray-400">View all past and active proposals.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
