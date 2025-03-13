"use client";

// import { formatEther } from "ethers";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MOCK_PROPOSALS = {
  recent: [
    {
      id: '1',
      title: 'Treasury Allocation Q2 2024',
      status: 'Active',
      votes: 4500, // 4500 tokens
      deadline: '2024-03-20',
      category: 'Treasury'
    },
    {
      id: '2',
      title: 'Reduce Proposal Threshold',
      status: 'Pending',
      votes: 2300, // 2300 tokens
      deadline: '2024-03-15',
      category: 'Governance'
    },
    {
      id: '3',
      title: 'Protocol Upgrade v2.0',
      status: 'Executed',
      votes: 4200, // 4200 tokens
      deadline: '2024-03-01',
      category: 'Development'
    }
  ],
  categories: [
    { name: 'Treasury', count: 8 },
    { name: 'Governance', count: 4 },
    { name: 'Development', count: 3 }
  ]
};

export default function DAOProposalOverview() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>DAO Proposals</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Recent Proposals</h4>
              <div className="space-y-3">
                {MOCK_PROPOSALS.recent.map((proposal) => (
                  <div key={proposal.id} className="bg-muted rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{proposal.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {proposal.votes.toLocaleString()} tokens · Due {proposal.deadline}
                        </p>
                      </div>
                      <Badge variant={
                        proposal.status === 'Active' ? 'default' :
                          proposal.status === 'Pending' ? 'secondary' :
                            'outline'
                      }>
                        {proposal.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Proposal Categories</h4>
              <div className="grid grid-cols-2 gap-2">
                {MOCK_PROPOSALS.categories.map((category) => (
                  <div key={category.name} className="bg-muted rounded-lg p-3">
                    <p className="text-sm font-medium">{category.name}</p>
                    <p className="text-2xl font-bold">{category.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 