// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.8;

interface ABV {
    function giveVote(address voter) external;
    function delegate(address to) external;
}

contract Test is ABV {
    struct Voter {
        bool voted;
        address delegate;
    }

    mapping(address => Voter) public voters;
    Proposal[] public proposals;

    constructor(bytes32[] memory proposalNames) {
        Proposal memory p;
        for (uint i = 0; i < proposalNames.length; i++) {
            ( p, ) = newProposalAndVoter(proposalNames[i], false, msg.sender);
            proposals.push(p);
        }
    }

    function giveVote(address voter) public virtual override {
        voters[voter].voted = true;
    }

    function giveVoteAndDelegate(address voter, address to) public {
        giveVote(voter);
        delegate(to);
    }

    function delegate(address to) public virtual override {
        voters[msg.sender].delegate = to;
    }

    function newProposalAndVoter(bytes32 name, bool voted, address delegateTo) public pure returns (Proposal memory p, Voter memory v) {
        p = Proposal({
            name: name
        });

        v = Voter({
            voted: voted,
            delegate: delegateTo
        });
    }

    function getLastProposalName() public view returns (bytes32 name) {
        name = proposals[proposals.length - 1].name;
    }

    struct Proposal {
        bytes32 name;
    }
}
