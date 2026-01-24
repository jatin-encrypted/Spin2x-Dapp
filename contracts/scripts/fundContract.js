const { ethers } = require('ethers');
require('dotenv').config();

/**
 * Fund the SpinWheel contract with MON tokens
 * This script sends MON from your wallet to the contract to create the initial pool
 */

async function fundContract() {
    try {
        // Contract address on Monad testnet
        const CONTRACT_ADDRESS = '0x2F4613edDb2e8C976fA3457C7E8d10a1d4eeaE53';

        // Amount to fund (in MON) - Change this to how much you want to send
        const FUND_AMOUNT = '1'; 

        // Connect to Monad testnet (ethers v5 syntax)
        const provider = new ethers.providers.JsonRpcProvider('https://testnet-rpc.monad.xyz');

        // Load your wallet from private key
        // Make sure PRIVATE_KEY is in your .env file
        if (!process.env.PRIVATE_KEY) {
            console.error(' Error: PRIVATE_KEY not found in .env file');
            console.log('\nAdd this to your .env file:');
            console.log('PRIVATE_KEY=your_private_key_here');
            return;
        }

        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

        console.log('📋 Funding Details:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`From Wallet: ${wallet.address}`);
        console.log(`To Contract: ${CONTRACT_ADDRESS}`);
        console.log(`Amount: ${FUND_AMOUNT} MON`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Check current balance
        const currentBalance = await wallet.getBalance();
        console.log(`💰 Your current balance: ${ethers.utils.formatEther(currentBalance)} MON\n`);

        if (currentBalance.lt(ethers.utils.parseEther(FUND_AMOUNT))) {
            console.error('Error: Insufficient balance to fund contract');
            return;
        }

        // Check contract current balance
        const contractBalance = await provider.getBalance(CONTRACT_ADDRESS);
        console.log(`🏦 Contract current balance: ${ethers.utils.formatEther(contractBalance)} MON\n`);

        // Send transaction
        console.log('📤 Sending transaction...');
        const tx = await wallet.sendTransaction({
            to: CONTRACT_ADDRESS,
            value: ethers.utils.parseEther(FUND_AMOUNT)
        });

        console.log(`⏳ Transaction sent: ${tx.hash}`);
        console.log('⏳ Waiting for confirmation...\n');

        // Wait for confirmation
        const receipt = await tx.wait();

        console.log('Transaction confirmed!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Block: ${receipt.blockNumber}`);
        console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
        console.log(`Transaction Hash: ${receipt.transactionHash}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Check new balances
        const newWalletBalance = await wallet.getBalance();
        const newContractBalance = await provider.getBalance(CONTRACT_ADDRESS);

        console.log('Final Balances:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Your wallet: ${ethers.utils.formatEther(newWalletBalance)} MON`);
        console.log(`Contract pool: ${ethers.utils.formatEther(newContractBalance)} MON`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🎉 Contract funded successfully!');
        console.log('✨ Players can now spin and win from the pool!\n');

    } catch (error) {
        console.error('\n❌ Error funding contract:', error.message);
        if (error.reason) {
            console.error('Reason:', error.reason);
        }
    }
}

fundContract();
