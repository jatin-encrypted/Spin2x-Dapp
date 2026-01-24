const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("Starting SpinWheel deployment...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

    // Deploy contract
    console.log("Deploying SpinWheel contract...");
    const SpinWheel = await ethers.getContractFactory("SpinWheel");
    const spinWheel = await SpinWheel.deploy();

    await spinWheel.waitForDeployment();
    const contractAddress = await spinWheel.getAddress();

    console.log("SpinWheel deployed to:", contractAddress);
    console.log("Transaction hash:", spinWheel.deploymentTransaction().hash);

    // Fund the contract with initial balance
    const fundingAmount = ethers.parseEther("0.1"); // 0.1 ETH for testing
    console.log("\nFunding contract with", ethers.formatEther(fundingAmount), "ETH...");

    const fundTx = await deployer.sendTransaction({
        to: contractAddress,
        value: fundingAmount
    });
    await fundTx.wait();

    const contractBalance = await ethers.provider.getBalance(contractAddress);
    console.log("Contract funded! Balance:", ethers.formatEther(contractBalance), "ETH");

    // Verify multipliers
    console.log("\nVerifying contract setup...");
    const multipliers = [];
    for (let i = 0; i < 6; i++) {
        const mult = await spinWheel.multipliers(i);
        multipliers.push(mult.toString());
    }
    console.log("Multipliers:", multipliers.map(m => m / 100).join(", "));

    const owner = await spinWheel.owner();
    console.log("Owner:", owner);

    // Display network info
    const network = await ethers.provider.getNetwork();
    console.log("\n📋 Deployment Summary:");
    console.log("========================");
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId);
    console.log("Contract Address:", contractAddress);
    console.log("Contract Balance:", ethers.formatEther(contractBalance), "ETH");
    console.log("Owner:", owner);
    console.log("========================\n");

    console.log("🎯 Next Steps:");
    console.log("1. Update src/config/contract.js with:");
    console.log(`   export const CONTRACT_ADDRESS = '${contractAddress}';`);
    console.log("\n2. Update network RPC URLs in your app config");
    console.log("\n3. Test the contract with a small spin!");

    // Save deployment info
    const fs = require('fs');
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId.toString(),
        contractAddress: contractAddress,
        deployer: deployer.address,
        blockNumber: await ethers.provider.getBlockNumber(),
        timestamp: new Date().toISOString(),
        transactionHash: spinWheel.deploymentTransaction().hash
    };

    fs.writeFileSync(
        'deployment-info.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\n💾 Deployment info saved to: contracts/deployment-info.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
