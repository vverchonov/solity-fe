import { Connection, Transaction, SystemProgram, ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { createMemoInstruction } from "@solana/spl-memo";

// Initialize connection using RPC URL from environment
const connection = new Connection(
  import.meta.env.VITE_RPC_URL || "https://eleonore-edy6fd-fast-mainnet.helius-rpc.com/",
  'confirmed'
);

export const solanaService = {
  // Get Solana connection instance
  getConnection: () => connection,

  // Build transaction using prepare response data (simpler version without priority fee estimation)
  buildTransaction: async (invoiceData, walletProvider) => {
    try {

      const { lamports, toAddress, memo } = invoiceData;

      // Get wallet public key
      if (!walletProvider?.publicKey) {
        throw new Error('Wallet not connected');
      }

      const fromPubkey = walletProvider.publicKey;

      if (!toAddress) {
        throw new Error('No destination address provided');
      }

      const toPubkey = new PublicKey(toAddress);

      if (!lamports || lamports <= 0) {
        throw new Error('Invalid payment amount');
      }


      // Build transaction
      const transaction = new Transaction();

      // Add priority fee instruction (use a reasonable default)
      const priorityFee = 10000; // 0.00001 SOL priority fee
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFee
        })
      );

      // Add memo instruction if provided
      if (memo) {
        const memoIx = createMemoInstruction(memo, [fromPubkey]);
        transaction.add(memoIx);
      }

      // Create transfer instruction
      const transferIx = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      });

      transaction.add(transferIx);

      // Set transaction metadata
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = fromPubkey;


      return {
        success: true,
        transaction,
        priorityFee,
        estimatedFee: priorityFee + 5000 // Base fee + priority fee
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to build transaction'
      };
    }
  },

  // Sign and send transaction using Phantom wallet
  signAndSendTransaction: async (transaction, walletProvider) => {
    try {

      // Sign transaction with Phantom wallet (user approval required)
      const signedTx = await walletProvider.signTransaction(transaction);

      // Send raw transaction to Solana network
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          ...await connection.getLatestBlockhash()
        },
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
      }


      return {
        success: true,
        signature,
        confirmationStatus: 'confirmed'
      };

    } catch (error) {

      // Handle user rejection
      if (error.message?.includes('User rejected')) {
        return {
          success: false,
          error: 'Transaction rejected by user',
          userRejected: true
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to sign or send transaction'
      };
    }
  },

  // Complete flow: build, sign, and send transaction
  executePayment: async (invoiceData, walletProvider) => {
    try {

      // 1. Build transaction
      const buildResult = await solanaService.buildTransaction(invoiceData, walletProvider);
      if (!buildResult.success) {
        return buildResult;
      }

      // 2. Sign and send transaction
      const sendResult = await solanaService.signAndSendTransaction(buildResult.transaction, walletProvider);
      if (!sendResult.success) {
        return sendResult;
      }


      return {
        success: true,
        signature: sendResult.signature,
        priorityFee: buildResult.priorityFee,
        estimatedFee: buildResult.estimatedFee
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to execute payment'
      };
    }
  },

  // Helper function to format lamports to SOL
  lamportsToSol: (lamports) => {
    return lamports / 1000000000; // 1 SOL = 1e9 lamports
  },

  // Helper function to format SOL to lamports
  solToLamports: (sol) => {
    return Math.round(sol * 1000000000);
  },

  // Get wallet balance in SOL
  getWalletBalance: async (walletAddress) => {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(publicKey);
      return {
        success: true,
        balance: balance / 1000000000 // Convert lamports to SOL
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get wallet balance'
      };
    }
  },

  // Check if wallet has sufficient balance for transaction
  hasSufficientBalance: async (walletAddress, requiredSol) => {
    try {
      const balanceResult = await solanaService.getWalletBalance(walletAddress);
      if (!balanceResult.success) {
        return { success: false, error: balanceResult.error };
      }

      // Add some buffer for transaction fees (0.001 SOL)
      const feeBuffer = 0.001;
      const totalRequired = requiredSol + feeBuffer;

      return {
        success: true,
        hasSufficient: balanceResult.balance >= totalRequired,
        currentBalance: balanceResult.balance,
        requiredBalance: totalRequired,
        shortfall: Math.max(0, totalRequired - balanceResult.balance)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to check balance'
      };
    }
  }
};

export default solanaService;
