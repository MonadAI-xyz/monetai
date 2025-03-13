"use client";

import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import {decodeEventLog, formatEther} from 'viem';
import {
    useAccount,
    useContractRead,
    useContractWrite,
    usePublicClient,
    useWaitForTransactionReceipt,
    UseWriteContractParameters
} from 'wagmi';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Loader} from "@/components/ui/loader";
import {Progress} from '@/components/ui/progress';
import {Textarea} from "@/components/ui/textarea";
import {CONTRACTS} from '@/config/contracts';


// Helper for proposal states
const ProposalState = {
    Pending: 0,
    Active: 1,
    Canceled: 2,
    Defeated: 3,
    Succeeded: 4,
    Queued: 5,
    Expired: 6,
    Executed: 7
} as const;

type VoteType = 'For' | 'Against' | 'Abstain';

// Helper functions for conversion
const secondsToDays = (seconds: bigint) => Number(seconds) / 86400; // 86400 seconds in a day
const weiToTokens = (wei: bigint | undefined | null) => {
    if (!wei) return 0;
    return Number(formatEther(wei));
};

// Update the Proposal type to match our data
type Proposal = {
    id: bigint;
    description: string;
    proposer?: string;
    status: string;
    forVotes: number;
    againstVotes: number;
    abstainVotes: number;
    deadline: number;
    startBlock: number;
    endBlock: number;
};

interface ProposalCreatedLog {
    args: {
        proposalId: bigint;
        proposer: string;
        targets: string[];
        values: bigint[];
        signatures: string[];
        calldatas: string[];
        voteStart: bigint;  // Renamed from startBlock
        voteEnd: bigint;    // Renamed from endBlock
        description: string;
    };
}

interface ProposalVotes {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
}

// Update the DEPLOY_BLOCK and END_BLOCK constants
const DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK || "0");

// We'll set END_BLOCK after fetching the current block if not defined
let END_BLOCK: bigint | undefined = process.env.NEXT_PUBLIC_END_BLOCK
    ? BigInt(process.env.NEXT_PUBLIC_END_BLOCK)
    : undefined;

// Update the formatBlockTime helper function
const formatBlockTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000); // Convert Unix timestamp to milliseconds
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

export default function DAOGovernance() {
    const {address} = useAccount();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Add publicClient hook
    const publicClient = usePublicClient();

    // Contract reads
    const {data: votingDelay, isLoading: isLoadingVotingDelay} = useContractRead({
        address: CONTRACTS.GOVERNOR.address as `0x${string}`,
        abi: CONTRACTS.GOVERNOR.abi,
        functionName: 'votingDelay',
    });

    const {data: votingPeriod, isLoading: isLoadingVotingPeriod} = useContractRead({
        address: CONTRACTS.GOVERNOR.address as `0x${string}`,
        abi: CONTRACTS.GOVERNOR.abi,
        functionName: 'votingPeriod',
    });

    const {data: proposalThreshold, isLoading: isLoadingThreshold} = useContractRead({
        address: CONTRACTS.GOVERNOR.address as `0x${string}`,
        abi: CONTRACTS.GOVERNOR.abi,
        functionName: 'proposalThreshold',
    });

    // Update the contract read to include loading state
    const {data: userVotes, isLoading: isLoadingVotes} = useContractRead({
        address: CONTRACTS.TOKEN.address as `0x${string}`,
        abi: CONTRACTS.TOKEN.abi,
        functionName: 'getVotes',
        args: [address || '0x0'],
    });

    // Add balance check
    const {data: tokenBalance} = useContractRead({
        address: CONTRACTS.TOKEN.address as `0x${string}`,
        abi: CONTRACTS.TOKEN.abi,
        functionName: 'balanceOf',
        args: [address || '0x0'],
    });

    // Check if user can propose
    const canPropose = userVotes && proposalThreshold ?
        (userVotes as bigint) >= (proposalThreshold as bigint) :
        false;

    // Update contract writes
    const {writeContract} = useContractWrite();

    // Track transaction hashes
    const [proposalTxHash, setProposalTxHash] = useState<`0x${string}` | undefined>();
    const [voteTxHash, setVoteTxHash] = useState<`0x${string}` | undefined>();

    // Wait for transactions
    const {isLoading: isProposalPending, isSuccess: isProposalSuccess} = useWaitForTransactionReceipt({
        hash: proposalTxHash,
    });

    const {isLoading: isVotePending, isSuccess: isVoteSuccess} = useWaitForTransactionReceipt({
        hash: voteTxHash,
    });

    // Watch for transaction success
    useEffect(() => {
        if (isProposalSuccess) {
            toast.success('Proposal created successfully!');
            setIsModalOpen(false);
            setDescription('');
            setProposalTxHash(undefined);
        }
    }, [isProposalSuccess]);

    useEffect(() => {
        if (isVoteSuccess) {
            toast.success('Vote cast successfully');
            setVoteTxHash(undefined);
            setVotingProposalId(null);
            setPreparingVote(null);
        }
    }, [isVoteSuccess]);

    // Add debug log for description state
    useEffect(() => {
        console.log('Description:', description);
    }, [description]);

    // Log balance and votes whenever they change
    useEffect(() => {
        if (address && tokenBalance) {
            console.log('Token Balance:', weiToTokens(tokenBalance as bigint), 'tokens');
            console.log('Voting Power:', userVotes ? weiToTokens(userVotes as bigint) : 0, 'votes');
        }
    }, [address, tokenBalance, userVotes]);

    // Add delegate transaction tracking
    const [delegateTxHash, setDelegateTxHash] = useState<`0x${string}` | undefined>();

    // Add delegate transaction receipt watch
    const {isLoading: isDelegating, isSuccess: isDelegateSuccess} = useWaitForTransactionReceipt({
        hash: delegateTxHash,
    });

    // Watch for delegate success
    useEffect(() => {
        if (isDelegateSuccess) {
            toast.success('Successfully delegated tokens');
            setDelegateTxHash(undefined);
        }
    }, [isDelegateSuccess]);

    // Add loading state
    const [isLoadingProposals, setIsLoadingProposals] = useState(true);

    // Add state for vote loading
    const [votingProposalId, setVotingProposalId] = useState<string | null>(null);

    // Add state for vote preparation
    const [preparingVote, setPreparingVote] = useState<string | null>(null);

    // Update the useEffect to fetch proposals in chunks
    useEffect(() => {
        const fetchProposals = async () => {
            setIsLoadingProposals(true);
            try {
                // If END_BLOCK isn't defined, fetch current block number
                if (!END_BLOCK) {
                    END_BLOCK = await publicClient.getBlockNumber();
                    console.log(`Using current block as END_BLOCK: ${END_BLOCK}`);
                }

                const CHUNK_SIZE = BigInt(25); // Reduced to 25 blocks per request

                const events = [];

                for (let fromBlock = DEPLOY_BLOCK; fromBlock <= END_BLOCK;) {
                    let toBlock = fromBlock + CHUNK_SIZE > END_BLOCK ? END_BLOCK : fromBlock + CHUNK_SIZE - BigInt(1);

                    console.log(`Fetching logs from block ${fromBlock} to ${toBlock}`);

                    try {
                        // Add delay between requests
                        await new Promise(resolve => setTimeout(resolve, 200));

                        const chunkEvents :any[]= await publicClient.getLogs({
                            address: CONTRACTS.GOVERNOR.address as `0x${string}`,
                            event: {
                                type: 'event',
                                name: 'ProposalCreated',
                                inputs: [
                                    {type: 'uint256', name: 'proposalId', indexed: false},
                                    {type: 'address', name: 'proposer', indexed: true},
                                    {type: 'address[]', name: 'targets', indexed: false},
                                    {type: 'uint256[]', name: 'values', indexed: false},
                                    {type: 'string[]', name: 'signatures', indexed: false},
                                    {type: 'bytes[]', name: 'calldatas', indexed: false},
                                    {type: 'uint256', name: 'startBlock', indexed: false},
                                    {type: 'uint256', name: 'endBlock', indexed: false},
                                    {type: 'string', name: 'description', indexed: false}
                                ]
                            },
                            fromBlock,
                            toBlock
                        }) as any;

                        events.push(...chunkEvents);
                        fromBlock = toBlock + BigInt(1); // Move to next chunk

                    } catch (error: any) {
                        if (error?.message?.includes('eth_getLogs is limited')) {
                            // If we hit the limit, reduce chunk size and retry
                            const newChunkSize = (toBlock - fromBlock) / BigInt(2);
                            toBlock = fromBlock + newChunkSize;
                            console.log(`Reducing chunk size, retrying with range ${fromBlock} to ${toBlock}`);
                            continue; // Retry with smaller chunk
                        } else {
                            console.log(`Error fetching chunk ${fromBlock}-${toBlock}:`, error);
                            fromBlock = toBlock + BigInt(1); // Skip problematic chunk
                        }
                    }
                }

                console.log('Found events:', events);

                // Map over events to fetch proposal details
                const proposalPromises = events.map(async (event) => {
                    try {
                        const decodedData = decodeEventLog({
                            abi: CONTRACTS.GOVERNOR.abi,
                            data: event.data,
                            topics: [event.topics[0]],
                            strict: false
                        });

                        const {
                            proposalId,
                            description,
                            startBlock: voteStart, // These are actually timestamps
                            endBlock: voteEnd
                        } =
                            // @ts-expect-error - Temporary fix
                            decodedData.args as {
                                proposalId: bigint,
                                description: string,
                                startBlock: number, // Timestamp
                                endBlock: number // Timestamp
                            };

                        console.log("Calling read contract")

                        // // Get proposer from indexed topic
                        // const proposer = event.topics[1] as `0x${string}`;

                        const [state, votes, deadline] = await Promise.all([
                            publicClient.readContract({
                                address: CONTRACTS.GOVERNOR.address as `0x${string}`,
                                abi: CONTRACTS.GOVERNOR.abi,
                                functionName: 'state',
                                args: [proposalId],
                            }),
                            publicClient.readContract({
                                address: CONTRACTS.GOVERNOR.address as `0x${string}`,
                                abi: CONTRACTS.GOVERNOR.abi,
                                functionName: 'proposalVotes',
                                args: [proposalId],
                            }),
                            publicClient.readContract({
                                address: CONTRACTS.GOVERNOR.address as `0x${string}`,
                                abi: CONTRACTS.GOVERNOR.abi,
                                functionName: 'proposalDeadline',
                                args: [proposalId],
                            }),
                        ]);

                        console.log("Read contract done")

                        // Add null checks for votes
                        const proposalVotes = votes as ProposalVotes;
                        const forVotes = proposalVotes?.forVotes ?? BigInt(0);
                        const againstVotes = proposalVotes?.againstVotes ?? BigInt(0);
                        const abstainVotes = proposalVotes?.abstainVotes ?? BigInt(0);

                        return {
                            id: proposalId,
                            description,
                            // proposer,
                            status: getProposalState(Number(state)),
                            startBlock: Number(voteStart), // Store as timestamp
                            endBlock: Number(voteEnd), // Store as timestamp
                            forVotes: Number(formatEther(forVotes)),
                            againstVotes: Number(formatEther(againstVotes)),
                            abstainVotes: Number(formatEther(abstainVotes)),
                            deadline: Number(deadline)
                        };
                    } catch (error) {
                        console.log(`Error decoding/fetching proposal:`, error);
                        return null;
                    }
                });

                const fetchedProposals = await Promise.all(proposalPromises);
                const validProposals = fetchedProposals.filter((p): p is Proposal => p !== null);

                console.log('📊 All proposals summary:', validProposals);
                setProposals(validProposals);
            } catch (error) {
                console.log('❌ Error fetching proposals:', error);
            } finally {
                setIsLoadingProposals(false);
            }
        };

        fetchProposals();
    }, [publicClient]);

    // Function to get proposal state string
    const getProposalState = (state: number) => {
        switch (state) {
            case ProposalState.Pending:
                return 'Pending';
            case ProposalState.Active:
                return 'Active';
            case ProposalState.Canceled:
                return 'Canceled';
            case ProposalState.Defeated:
                return 'Defeated';
            case ProposalState.Succeeded:
                return 'Succeeded';
            case ProposalState.Queued:
                return 'Queued';
            case ProposalState.Expired:
                return 'Expired';
            case ProposalState.Executed:
                return 'Executed';
            default:
                return 'Unknown';
        }
    };

    const handleCreateProposal = async () => {
        console.log('Creating proposal with description:', description);

        if (!description.trim()) {
            toast.error('Please enter a proposal description');
            return;
        }

        if (!canPropose) {
            toast.error(`You need at least ${formattedThreshold} voting power to create a proposal`);
            return;
        }

        try {
            setIsSubmitting(true);

            // @ts-expect-error - Temporary fix
            const result = await writeContract({
                address: CONTRACTS.GOVERNOR.address as `0x${string}`,
                abi: CONTRACTS.GOVERNOR.abi,
                functionName: 'propose',
                args: [
                    [CONTRACTS.GOVERNOR.address], // target address
                    [BigInt(0)], // value in wei
                    ["0x"], // empty calldata
                    description.trim(),
                ],
            } as UseWriteContractParameters);

            console.log('Proposal created:', result);

        } catch (error: any) {
            console.log('Error creating proposal:', error);
            if (error?.message?.includes('GovernorInsufficientProposerVotes')) {
                toast.error(`You need at least ${formattedThreshold} voting power to create a proposal`);
            } else {
                toast.error(error?.message || 'Failed to create proposal');
            }
            setIsSubmitting(false);
            setProposalTxHash(undefined);
        }
    };

    const handleVote = async (proposalId: string, voteType: VoteType) => {
        if (!address) return;

        try {
            setPreparingVote(proposalId); // Show loader while preparing
            const support = voteType === 'For' ? 1 : voteType === 'Against' ? 0 : 2;

            // @ts-expect-error - Temporary fix
            const _tx = await writeContract({
                address: CONTRACTS.GOVERNOR.address as `0x${string}`,
                abi: CONTRACTS.GOVERNOR.abi,
                functionName: 'castVote',
                args: [BigInt(proposalId), BigInt(support)],
            } as UseWriteContractParameters);

        } catch (error: any) {
            console.log('Error casting vote:', error);
            toast.error(error?.message || 'Failed to cast vote');
            setVoteTxHash(undefined);
            setVotingProposalId(null);
            setPreparingVote(null); // Clear preparation state on error
        }
    };

    // Update the dialog description to show formatted threshold
    const formattedThreshold = proposalThreshold ?
        `${weiToTokens(proposalThreshold as bigint)} Tokens` :
        'Loading...';

    // Add delegate contract write
    const handleDelegate = async () => {
        if (!address) return;

        try {
            // @ts-expect-error - Temporary fix
            const _tx = await writeContract({
                address: CONTRACTS.TOKEN.address as `0x${string}`,
                abi: CONTRACTS.TOKEN.abi,
                functionName: 'delegate',
                args: [address], // delegate to self
            } as UseWriteContractParameters);

        } catch (error) {
            console.log('Error delegating tokens:', error);
            toast.error('Failed to delegate tokens');
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>DAO Governance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium">Voting Delay</h4>
                            <div className="text-2xl font-bold">
                                {isLoadingVotingDelay ? (
                                    <div className="flex items-center gap-2">
                                        <Loader/> Loading...
                                    </div>
                                ) : votingDelay ? (
                                    `${secondsToDays(votingDelay as bigint)} Day${secondsToDays(votingDelay as bigint) !== 1 ? 's' : ''}`
                                ) : (
                                    'N/A'
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium">Voting Period</h4>
                            <div className="text-2xl font-bold">
                                {isLoadingVotingPeriod ? (
                                    <div className="flex items-center gap-2">
                                        <Loader/> Loading...
                                    </div>
                                ) : votingPeriod ? (
                                    `${secondsToDays(votingPeriod as bigint)} Day${secondsToDays(votingPeriod as bigint) !== 1 ? 's' : ''}`
                                ) : (
                                    'N/A'
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium">Proposal Threshold</h4>
                            <div className="text-2xl font-bold">
                                {isLoadingThreshold ? (
                                    <div className="flex items-center gap-2">
                                        <Loader/> Loading...
                                    </div>
                                ) : proposalThreshold ? (
                                    formattedThreshold
                                ) : (
                                    'N/A'
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium">Your Voting Power</h4>
                            <div className="text-2xl font-bold">
                                {isLoadingVotes ? (
                                    <div className="flex items-center gap-2">
                                        <Loader/> Loading...
                                    </div>
                                ) : userVotes ? (
                                    `${weiToTokens(userVotes as bigint)} votes`
                                ) : (
                                    '0 votes'
                                )}
                            </div>
                            {tokenBalance && (tokenBalance as bigint) > BigInt(0) && (!userVotes || userVotes === BigInt(0)) && (
                                <Button
                                    className="mt-2"
                                    disabled={isDelegating}
                                    variant="outline"
                                    onClick={handleDelegate}
                                >
                                    {isDelegating ? (
                                        <div className="flex items-center gap-2">
                                            <Loader size={14}/> Delegating...
                                        </div>
                                    ) : (
                                        'Delegate Tokens to Get Voting Power'
                                    )}
                                </Button>
                            )}
                        </div>

                        <div className="pt-4">
                            <Dialog
                                open={isModalOpen}
                                onOpenChange={(open) => {
                                    setIsModalOpen(open);
                                    if (!open) {
                                        setDescription('');
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        className="w-full"
                                        disabled={!address || isLoadingThreshold || !canPropose}
                                        onClick={handleCreateProposal}
                                    >
                                        {isLoadingThreshold ? (
                                            <div className="flex items-center gap-2">
                                                <Loader/> Loading...
                                            </div>
                                        ) : !address ? (
                                            'Connect Wallet'
                                        ) : !canPropose ? (
                                            `Need ${formattedThreshold} voting power`
                                        ) : (
                                            'Create Proposal'
                                        )}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create New Proposal</DialogTitle>
                                        <DialogDescription>
                                            Create a new governance proposal. You need {formattedThreshold} to create a
                                            proposal.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Proposal Description</Label>
                                            <Textarea
                                                className="min-h-[100px]"
                                                id="description"
                                                placeholder="Enter your proposal description..."
                                                value={description}
                                                onChange={(e) => {
                                                    setDescription(e.target.value);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            disabled={isSubmitting || isProposalPending}
                                            onClick={handleCreateProposal}
                                        >
                                            {isProposalPending ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader/> Confirming Transaction...
                                                </div>
                                            ) : isSubmitting ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader/> Preparing Transaction...
                                                </div>
                                            ) : (
                                                'Create Proposal'
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Proposals Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Proposals</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {isLoadingProposals ? (
                            <div className="text-center py-8">
                                <Loader/>
                                <p className="text-muted-foreground mt-2">Loading proposals...</p>
                            </div>
                        ) : proposals.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No proposals yet
                            </div>
                        ) : (
                            proposals.map((proposal) => (
                                <Card key={proposal.id.toString()} className="p-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold">
                                                    Proposal
                                                    #{proposal.id.toString().slice(0, 4)}...{proposal.id.toString().slice(-4)}
                                                </h3>
                                                <p className="text-sm text-muted-foreground font-semibold">{proposal.description}</p>
                                                {/* <p className="text-xs text-muted-foreground mt-1">
                          Proposed by: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                        </p> */}
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                proposal.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                    proposal.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                        {proposal.status}
                      </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>Start: {formatBlockTime(proposal.startBlock)}</span>
                                                <span>End: {formatBlockTime(proposal.endBlock)}</span>
                                            </div>
                                            <Progress
                                                className="h-2"
                                                value={((proposal.forVotes) / (proposal.forVotes + proposal.againstVotes + proposal.abstainVotes || 1)) * 100}
                                            />
                                            <div className="flex justify-between text-sm">
                                                <span>For: {proposal.forVotes.toFixed(2)}</span>
                                                <span>Against: {proposal.againstVotes.toFixed(2)}</span>
                                                <span>Abstain: {proposal.abstainVotes.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-4">
                                            <Button
                                                disabled={!address || isVotePending || votingProposalId === proposal.id.toString() || preparingVote === proposal.id.toString()}
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleVote(proposal.id.toString(), 'For')}
                                            >
                                                {preparingVote === proposal.id.toString() ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader size={14}/> Preparing...
                                                    </div>
                                                ) : isVotePending && votingProposalId === proposal.id.toString() ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader size={14}/> Voting...
                                                    </div>
                                                ) : (
                                                    'Vote For'
                                                )}
                                            </Button>
                                            <Button
                                                disabled={!address || isVotePending || votingProposalId === proposal.id.toString() || preparingVote === proposal.id.toString()}
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleVote(proposal.id.toString(), 'Against')}
                                            >
                                                {preparingVote === proposal.id.toString() ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader size={14}/> Preparing...
                                                    </div>
                                                ) : isVotePending && votingProposalId === proposal.id.toString() ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader size={14}/> Voting...
                                                    </div>
                                                ) : (
                                                    'Vote Against'
                                                )}
                                            </Button>
                                            <Button
                                                disabled={!address || isVotePending || votingProposalId === proposal.id.toString() || preparingVote === proposal.id.toString()}
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleVote(proposal.id.toString(), 'Abstain')}
                                            >
                                                {preparingVote === proposal.id.toString() ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader size={14}/> Preparing...
                                                    </div>
                                                ) : isVotePending && votingProposalId === proposal.id.toString() ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader size={14}/> Voting...
                                                    </div>
                                                ) : (
                                                    'Abstain'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
