import { Connection, Transaction, SystemProgram, ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { createMemoInstruction } from "@solana/spl-memo";
import bs58 from "bs58";

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
      console.log('🔗 Building transaction for invoice:', invoiceData.id || invoiceData.invoice);
      console.log('🔗 Full invoice data received:', invoiceData);

      const { lamports, toAddress, memo } = invoiceData;
      console.log('🔗 Extracted transaction data:', { lamports, toAddress, memo });

      // Get wallet public key
      if (!walletProvider?.publicKey) {
        console.error('❌ Wallet not connected - no public key');
        throw new Error('Wallet not connected');
      }

      const fromPubkey = walletProvider.publicKey;
      console.log('🔑 From address:', fromPubkey.toBase58());

      if (!toAddress) {
        console.error('❌ No toAddress in invoice data');
        throw new Error('No destination address provided');
      }

      const toPubkey = new PublicKey(toAddress);
      console.log('🎯 To address:', toPubkey.toBase58());

      if (!lamports || lamports <= 0) {
        console.error('❌ Invalid lamports amount:', lamports);
        throw new Error('Invalid payment amount');
      }

      console.log('💰 Amount:', lamports, 'lamports (', lamports / 1e9, 'SOL)');

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
        try {
          const memoIx = createMemoInstruction(memo, [fromPubkey]);
          transaction.add(memoIx);
        } catch (error) {
          console.warn('💡 Error creating memo instruction, continuing without memo:', error);
        }
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

      console.log('✅ Transaction built successfully');
      console.log('🧾 Transaction details:', {
        instructions: transaction.instructions.length,
        feePayer: transaction.feePayer?.toBase58(),
        recentBlockhash: transaction.recentBlockhash
      });

      return {
        success: true,
        transaction,
        priorityFee,
        estimatedFee: priorityFee + 5000 // Base fee + priority fee
      };

    } catch (error) {
      console.error('❌ Error building transaction:', error);
      return {
        success: false,
        error: error.message || 'Failed to build transaction'
      };
    }
  },

  // Sign and send transaction using Phantom wallet
  signAndSendTransaction: async (transaction, walletProvider) => {
    try {
      console.log('✍️ Requesting signature from Phantom wallet...');
      console.log('✍️ Transaction to be signed:', transaction);

      // Sign and send transaction using Phantom's signAndSendTransaction method
      // This will show the transaction details in Phantom for user approval
      console.log('✍️ Calling walletProvider.signAndSendTransaction...');
      const { signature } = await walletProvider.signAndSendTransaction(transaction);

      console.log('🎉 Transaction signed and sent with signature:', signature);

      // Confirm transaction
      console.log('⏳ Confirming transaction...');
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

      console.log('✅ Transaction confirmed:', signature);

      return {
        success: true,
        signature,
        confirmationStatus: 'confirmed'
      };

    } catch (error) {
      console.error('❌ Error signing/sending transaction:', error);

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
      console.log('🚀 Starting payment execution for invoice:', invoiceData.id || invoiceData.invoice);

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

      console.log('🎉 Payment executed successfully:', sendResult.signature);

      return {
        success: true,
        signature: sendResult.signature,
        priorityFee: buildResult.priorityFee,
        estimatedFee: buildResult.estimatedFee
      };

    } catch (error) {
      console.error('❌ Error executing payment:', error);
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
  }
};

export default solanaService;