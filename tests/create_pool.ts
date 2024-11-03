import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PlutoSmartContracts } from "../target/types/pluto_smart_contracts";
import { createValues, mintingTokens, TestValues } from "./utils";
import { assert } from "chai";
import { PublicKey } from "@solana/web3.js";

describe('Create pool', () => {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);

  const program = anchor.workspace.PlutoSmartContracts as Program<PlutoSmartContracts>;

  let values: TestValues;

  beforeEach(async() => {
    // console.log("Starting beforeEach setup...");
    values = createValues();
    // console.log("Values created successfully");

    try {
      // console.log("Starting token minting process...");
      await mintingTokens({
        connection,
        creator: values.payer,
        mintAKeypair: values.mintAKeypair,
        mintBKeypair: values.mintBKeypair
      });
      // console.log("Token minting completed successfully");
    } catch (error) {
      console.error("Error in minting tokens:", error);
      throw error;
    }
  });

  it("initialize pool", async () => {
    try {
      // console.log("\n=== Starting Pool Initialization Test ===");
      
      // Log the accounts being passed to verify they are correct
      // console.log("\nAccount Validation:");
      // console.log("Program ID:", program.programId.toBase58());
      // console.log("Payer:", values.payer.publicKey.toBase58());
      // console.log("Pool Key:", values.poolKey.toBase58());
      // console.log("Pool Authority:", values.poolAuthority.toBase58());
      // console.log("Mint Liquidity:", values.mintLiquidity.toBase58());
      // console.log("Mint A:", values.mintAKeypair.publicKey.toBase58());
      // console.log("Mint B:", values.mintBKeypair.publicKey.toBase58());
      // console.log("Pool Account A:", values.poolAccountA.toBase58());
      // console.log("Pool Account B:", values.poolAccountB.toBase58());

      // Verify PDA derivation
      // console.log("\nVerifying PDA derivation...");
      const [expectedPoolKey] = await PublicKey.findProgramAddress(
        [
          Buffer.from('pool'),
          values.mintAKeypair.publicKey.toBuffer(),
          values.mintBKeypair.publicKey.toBuffer()
        ],
        program.programId
      );
      
      assert.ok(values.poolKey.equals(expectedPoolKey), "Pool PDA derivation mismatch");
      // console.log("PDA verification successful");

      // console.log("\nSubmitting transaction...");
      const tx = await program.methods
        .initializePool()
        .accountsStrict({
          payer: values.payer.publicKey,
          pool: values.poolKey,
          poolAuthority: values.poolAuthority,
          mintLiquidity: values.mintLiquidity,
          mintA: values.mintAKeypair.publicKey,
          mintB: values.mintBKeypair.publicKey,
          poolAccountA: values.poolAccountA,
          poolAccountB: values.poolAccountB,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId
        })
        .signers([values.payer])
        .rpc();

      // console.log("Transaction submitted:", tx);

      // Wait for transaction confirmation
      // console.log("\nWaiting for transaction confirmation...");
      const confirmation = await connection.confirmTransaction(tx);
      // console.log("Transaction confirmed:", confirmation);
      
      // Add small delay before fetching account
      // console.log("\nWaiting before account fetch...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the pool was created
      // console.log("\nFetching pool account...");
      const poolAccount = await program.account.poolState.fetch(values.poolKey);  // Note: Changed from pool to poolState
      
      // Log the pool account data
      // console.log("\nPool Account Data:");
      console.log("Mint A:", poolAccount.mintA.toBase58());
      console.log("Mint B:", poolAccount.mintB.toBase58());
      
      // Verify the pool's mint addresses
      // console.log("\nVerifying mint addresses...");
      assert.ok(poolAccount.mintA.equals(values.mintAKeypair.publicKey), "Mint A mismatch");
      assert.ok(poolAccount.mintB.equals(values.mintBKeypair.publicKey), "Mint B mismatch");
      
      // console.log("\n=== Pool Initialization Test Completed Successfully ===");
    } catch (error) {
      console.error("\n=== Error in Pool Initialization Test ===");
      console.error("Detailed error:", error);
      if (error.logs) {
        console.error("\nTransaction logs:");
        error.logs.forEach((log: string, index: number) => {
          console.error(`${index + 1}. ${log}`);
        });
      }
      if (error.message) {
        console.error("\nError message:", error.message);
      }
      throw error;
    }
  });
});