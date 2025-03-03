// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {MonetAI} from "../src/MonetAI.sol";
import {MonetAIGovernor} from "../src/MonetAIGovernor.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract MonetAITest is Test {
    // Custom Errors
    error GovernorUnexpectedProposalState(uint256 proposalId, uint8 current, bytes32 expectedStates);
    error GovernorAlreadyCastVote(address voter);

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Paused(address account);
    event Unpaused(address account);
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    // State Variables
    MonetAI public token;
    MonetAIGovernor public governor;
    address public admin;
    address public pauser;
    address public recipient;
    address public minter;
    address public user1;
    address public user2;

    // Setup
    function setUp() public {
        // Create test addresses
        admin = makeAddr("admin");
        pauser = makeAddr("pauser");
        recipient = makeAddr("recipient");
        minter = makeAddr("minter");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy contracts
        token = new MonetAI(admin, pauser, recipient, minter);
        governor = new MonetAIGovernor(token);

        // Setup initial state
        vm.startPrank(minter);
        token.mint(recipient, 10000000e18);
        vm.stopPrank();

        vm.startPrank(recipient);
        token.delegate(recipient);
        vm.stopPrank();

        skip(1); // Wait for voting power to be active

        // Verify setup
        uint256 votes = token.getVotes(recipient);
        uint256 threshold = governor.proposalThreshold();
        require(votes >= threshold, "Insufficient voting power");
    }

    /**************************************************************************
     * Basic Token Tests
     *************************************************************************/
    
    function test_InitialSetup() public view {
        assertEq(token.name(), "MonetAI");
        assertEq(token.symbol(), "MAI");
        assertEq(token.decimals(), 18);
        assertEq(token.balanceOf(recipient), 11000000 * 10 ** token.decimals());
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(token.hasRole(token.PAUSER_ROLE(), pauser));
        assertTrue(token.hasRole(token.MINTER_ROLE(), minter));
    }

    function test_ClockMode() public view {
        assertEq(token.CLOCK_MODE(), "mode=timestamp");
        assertEq(token.clock(), block.timestamp);
    }

    /**************************************************************************
     * Role Management Tests
     *************************************************************************/
    
    function test_RoleManagement() public {
        address newPauser = makeAddr("newPauser");
        
        vm.startPrank(admin);
        
        vm.expectEmit(true, true, true, true);
        emit RoleGranted(token.PAUSER_ROLE(), newPauser, admin);
        token.grantRole(token.PAUSER_ROLE(), newPauser);
        assertTrue(token.hasRole(token.PAUSER_ROLE(), newPauser));
        
        vm.expectEmit(true, true, true, true);
        emit RoleRevoked(token.PAUSER_ROLE(), newPauser, admin);
        token.revokeRole(token.PAUSER_ROLE(), newPauser);
        assertFalse(token.hasRole(token.PAUSER_ROLE(), newPauser));
        
        vm.stopPrank();
    }

    /**************************************************************************
     * Minting Tests
     *************************************************************************/
    
    function test_Minting() public {
        vm.startPrank(minter);
        vm.expectEmit(true, true, true, true);
        emit Transfer(address(0), user1, 1000);
        token.mint(user1, 1000);
        assertEq(token.balanceOf(user1), 1000);
        vm.stopPrank();
    }

    function test_MintingToZeroAddress() public {
        vm.startPrank(minter);
        vm.expectRevert();
        token.mint(address(0), 1000);
        vm.stopPrank();
    }

    function test_MintingUnauthorized() public {
        vm.startPrank(user1);
        vm.expectRevert();
        token.mint(user2, 1000);
        vm.stopPrank();
    }

    /**************************************************************************
     * Burning Tests
     *************************************************************************/
    
    function test_Burning() public {
        vm.startPrank(recipient);
        uint256 initialBalance = token.balanceOf(recipient);
        vm.expectEmit(true, true, true, true);
        emit Transfer(recipient, address(0), 1000);
        token.burn(1000);
        assertEq(token.balanceOf(recipient), initialBalance - 1000);
        vm.stopPrank();
    }

    function test_BurningMoreThanBalance() public {
        vm.startPrank(recipient);
        uint256 balance = token.balanceOf(recipient);
        vm.expectRevert();
        token.burn(balance + 1);
        vm.stopPrank();
    }

    /**************************************************************************
     * Pausing Tests
     *************************************************************************/
    
    function test_Pausing() public {
        vm.startPrank(pauser);
        
        vm.expectEmit(true, true, true, true);
        emit Paused(pauser);
        token.pause();
        assertTrue(token.paused());

        vm.expectRevert();
        token.transfer(user1, 1000);

        vm.expectEmit(true, true, true, true);
        emit Unpaused(pauser);
        token.unpause();
        assertFalse(token.paused());
        
        vm.stopPrank();
    }

    function test_PausingWhenPaused() public {
        vm.startPrank(pauser);
        token.pause();
        vm.expectRevert();
        token.pause();
        vm.stopPrank();
    }

    function test_UnpausingWhenNotPaused() public {
        vm.startPrank(pauser);
        vm.expectRevert();
        token.unpause();
        vm.stopPrank();
    }

    /**************************************************************************
     * Transfer Tests
     *************************************************************************/
    
    function test_Transfer() public {
        vm.startPrank(recipient);
        vm.expectEmit(true, true, true, true);
        emit Transfer(recipient, user1, 1000);
        token.transfer(user1, 1000);
        assertEq(token.balanceOf(user1), 1000);
        vm.stopPrank();
    }

    function test_TransferWhenPaused() public {
        vm.prank(pauser);
        token.pause();
        
        vm.startPrank(recipient);
        vm.expectRevert();
        token.transfer(user1, 1000);
        vm.stopPrank();
    }

    function test_TransferToZeroAddress() public {
        vm.startPrank(recipient);
        vm.expectRevert();
        token.transfer(address(0), 1000);
        vm.stopPrank();
    }

    function test_TransferMoreThanBalance() public {
        vm.startPrank(recipient);
        uint256 balance = token.balanceOf(recipient);
        vm.expectRevert();
        token.transfer(user1, balance + 1);
        vm.stopPrank();
    }

    /**************************************************************************
     * Voting Power Tests
     *************************************************************************/
    
    function test_DelegateVotes() public {
        vm.startPrank(recipient);
        token.delegate(user1);
        assertEq(token.getVotes(user1), token.balanceOf(recipient));
        vm.stopPrank();
    }

    function test_DelegateToSelf() public {
        vm.startPrank(recipient);
        token.delegate(recipient);
        assertEq(token.getVotes(recipient), token.balanceOf(recipient));
        vm.stopPrank();
    }

    function test_TransferAfterDelegate() public {
        vm.startPrank(recipient);
        token.delegate(user1);
        uint256 initialVotes = token.getVotes(user1);
        token.transfer(user2, 1000);
        assertEq(token.getVotes(user1), initialVotes - 1000);
        vm.stopPrank();
    }

    /**************************************************************************
     * Governor Tests
     *************************************************************************/
    
    function test_GovernorInitialSetup() public view {
        assertEq(governor.name(), "MonetAIGovernor");
        assertEq(governor.votingDelay(), 1 days);
        assertEq(governor.votingPeriod(), 1 weeks);
        assertEq(governor.proposalThreshold(), 500e18);
        assertEq(governor.quorum(0), 100e18);
    }

    function test_ProposalCreation() public {
        vm.startPrank(recipient);
        
        // Ensure recipient has enough voting power
        assertGe(token.getVotes(recipient), governor.proposalThreshold());
        
        address[] memory targets = new address[](1);
        targets[0] = address(token);
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("mint(address,uint256)", user1, 1000);
        
        string memory description = "Mint 1000 tokens to user1";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);
        assertTrue(proposalId != 0);
        vm.stopPrank();
    }

    function test_ProposalWithEmptyTargets() public {
        vm.startPrank(recipient);
        token.delegate(recipient);
        
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        
        vm.expectRevert();
        governor.propose(targets, values, calldatas, "Empty proposal");
        vm.stopPrank();
    }

    function test_ProposalThresholdCheck() public {
        vm.startPrank(user1);
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        vm.expectRevert();
        governor.propose(targets, values, calldatas, "Should fail - not enough votes");
        vm.stopPrank();
    }

    function test_CompleteVotingCycle() public {
        vm.startPrank(recipient);
        
        assertGe(token.getVotes(recipient), governor.proposalThreshold());
        
        address[] memory targets = new address[](1);
        targets[0] = address(token);
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("mint(address,uint256)", user1, 1000);
        
        uint256 proposalId = governor.propose(targets, values, calldatas, "Test Proposal");
        
        // Wait for voting delay
        vm.warp(block.timestamp + governor.votingDelay() + 1);
        
        // Verify proposal is active
        assertEq(uint(governor.state(proposalId)), uint(1)); // Active
        
        // Cast vote
        governor.castVote(proposalId, 1);
        
        // Move past voting period
        vm.warp(block.timestamp + governor.votingPeriod());
        
        // Check proposal state
        assertEq(uint(governor.state(proposalId)), 4); // Succeeded
        vm.stopPrank();
    }

    function test_VotingBeforeDelay() public {
        vm.startPrank(recipient);
        
        address[] memory targets = new address[](1);
        targets[0] = address(token);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        uint256 proposalId = governor.propose(targets, values, calldatas, "Test Proposal");
        
        // Updated expected state from 1 to 2
        vm.expectRevert(
            abi.encodeWithSelector(
                GovernorUnexpectedProposalState.selector,
                proposalId,
                0, // Current state (Pending)
                bytes32(uint256(2)) // Expected state (was 1, should be 2)
            )
        );
        governor.castVote(proposalId, 1);
        vm.stopPrank();
    }

    function test_DoubleVoting() public {
        vm.startPrank(recipient);
        
        address[] memory targets = new address[](1);
        targets[0] = address(token);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        uint256 proposalId = governor.propose(targets, values, calldatas, "Test Proposal");
        
        // Wait for voting to start
        vm.warp(block.timestamp + governor.votingDelay() + 1);
        
        // Verify proposal is active
        assertEq(uint(governor.state(proposalId)), uint(1)); // Active
        
        governor.castVote(proposalId, 1);
        
        // Updated error message to match OpenZeppelin's actual error
        vm.expectRevert(
            abi.encodeWithSelector(
                GovernorAlreadyCastVote.selector,
                recipient
            )
        );
        governor.castVote(proposalId, 1);
        vm.stopPrank();
    }
} 