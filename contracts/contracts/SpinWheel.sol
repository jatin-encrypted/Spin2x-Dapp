// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SpinWheel {
    // Segment multipliers (scaled by 100 to avoid decimals)
    // [0, 0, 1.0, 1.2, 1.5, 2.0] => [0, 0, 100, 120, 150, 200]
    uint16[6] public multipliers = [0, 0, 100, 120, 150, 200];

    // Owner for funding and emergency withdrawal
    address public owner;

    // Events
    event SpinResult(
        address indexed player,
        uint256 stake,
        uint8 segment,
        uint256 payout,
        uint256 timestamp
    );

    event ContractFunded(address indexed funder, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function spin() external payable {
        require(msg.value > 0, "Stake must be greater than 0");

        uint256 stake = msg.value;

        // Generate random segment using blockhash and sender address
        // Using previous block hash for randomness
        uint256 randomSeed = uint256(
            keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender))
        );

        // Get segment (0-5)
        uint8 segment = uint8(randomSeed % 6);

        // Calculate payout: stake × (multiplier / 100)
        uint256 payout = (stake * multipliers[segment]) / 100;

        // Check if contract has sufficient balance
        require(
            address(this).balance >= payout,
            "Contract has insufficient funds"
        );

        // Emit event before transfer (checks-effects-interactions pattern)
        emit SpinResult(msg.sender, stake, segment, payout, block.timestamp);

        // Transfer payout to player (if payout > 0)
        if (payout > 0) {
            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Payout transfer failed");
        }
    }

    receive() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }

    fallback() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function emergencyWithdraw(uint256 amount) external {
        require(msg.sender == owner, "Only owner can withdraw");
        require(amount <= address(this).balance, "Insufficient balance");

        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner can transfer");
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
