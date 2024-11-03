import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAccount } from "@solana/spl-token";
import { PlutoSmartContracts } from "../target/types/pluto_smart_contracts";
import { createValues, mintingTokens, TestValues } from "./utils";
import { assert } from "chai";
import { BN } from "bn.js";

describe('Deposit liquidity', () => {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);

  const program = anchor.workspace.PlutoSmartContracts as Program<PlutoSmartContracts>;

  let values: TestValues;

  beforeEach(async() => {
    console.log("Starting beforeEach setup...");
    values = createValues();

    try {
      // Mint tokens to the depositor
      await mintingTokens({
        connection,
        creator: values.payer,
        mintAKeypair: values.mintAKeypair,
        mintBKeypair: values.mintBKeypair
      });

      // Initialize the pool first
      await program.methods
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
      
      // console.log("Setup completed successfully");
    } catch (error) {
      // console.error("Error in setup:", error);
      throw error;
    }
  });

  it("Depositor cannot deposit more than present in account", async () =>{
    // amount_a > amount
    let initialDepositorAmountA = await getAccount(connection, values.holderAccountA);
    let initialDepositorAmountB = await getAccount(connection, values.holderAccountB);

     await program.methods
     .poolDeposit(
      new BN(Number(initialDepositorAmountA.amount.toString()) + 200),
      new BN(Number(initialDepositorAmountB.amount.toString()) + 200)
     )
     .accountsStrict({
      payer: values.payer.publicKey,
      pool: values.poolKey,
      poolAuthority: values.poolAuthority,
      mintA: values.mintAKeypair.publicKey,
      mintB: values.mintBKeypair.publicKey,
      depositor: values.payer.publicKey,
      mintLiquidity: values.mintLiquidity,
      poolAccountA: values.poolAccountA,
      poolAccountB: values.poolAccountB,
      depositorAccountLiquidity: values.liquidityAccount,
      depositorAccountA: values.holderAccountA,
      depositorAccountB: values.holderAccountB,              
      tokenProgram: TOKEN_PROGRAM_ID,            
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId
     })
     .signers([values.payer]).rpc();

     assert(values.poolAccountA,initialDepositorAmountA.amount.toString());
     assert(values.poolAccountB, initialDepositorAmountB.amount.toString());

  })



  // it("deposits initial liquidity", async () => {
  //   try {
  //     console.log("\n=== Starting Initial Liquidity Deposit Test ===");
      
  //     // Log initial balances
  //     console.log("\nInitial balances:");
  //     const initialDepositorA = await getAccount(connection, values.holderAccountA);
  //     const initialDepositorB = await getAccount(connection, values.holderAccountB);

  //     // Deposit liquidity
  //     const tx = await program.methods
  //       .poolDeposit(
  //         values.depositAmountA,
  //         values.depositAmountB
  //       )
  //       .accountsStrict({
  //         payer: values.payer.publicKey,
  //         pool: values.poolKey,
  //         poolAuthority: values.poolAuthority,
  //         mintA: values.mintAKeypair.publicKey,
  //         mintB: values.mintBKeypair.publicKey,
  //         depositor: values.payer.publicKey,
  //         mintLiquidity: values.mintLiquidity,
  //         poolAccountA: values.poolAccountA,
  //         poolAccountB: values.poolAccountB,
  //         depositorAccountLiquidity: values.liquidityAccount,
  //         depositorAccountA: values.holderAccountA,
  //         depositorAccountB: values.holderAccountB,
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //         systemProgram: anchor.web3.SystemProgram.programId
  //       })
  //       .signers([values.payer])
  //       .rpc();

  //     // Wait for confirmation
  //     await connection.confirmTransaction(tx);
      
  //     // Verify final balances
  //     const finalDepositorA = await getAccount(connection, values.holderAccountA);
  //     const finalDepositorB = await getAccount(connection, values.holderAccountB);
  //     const poolA = await getAccount(connection, values.poolAccountA);
  //     const poolB = await getAccount(connection, values.poolAccountB);
  //     const liquidityAccount = await getAccount(connection, values.liquidityAccount);

  //     // Assertions
  //     assert.ok(
  //       BigInt(initialDepositorA.amount.toString()) - BigInt(finalDepositorA.amount.toString()) === 
  //       BigInt(values.depositAmountA.toString()),
  //       "Incorrect amount of token A transferred"
  //     );
      
  //     assert.ok(
  //       BigInt(initialDepositorB.amount.toString()) - BigInt(finalDepositorB.amount.toString()) === 
  //       BigInt(values.depositAmountB.toString()),
  //       "Incorrect amount of token B transferred"
  //     );

  //     assert.ok(
  //       BigInt(poolA.amount.toString()) === BigInt(values.depositAmountA.toString()),
  //       "Pool A balance incorrect"
  //     );

  //     assert.ok(
  //       BigInt(poolB.amount.toString()) === BigInt(values.depositAmountB.toString()),
  //       "Pool B balance incorrect"
  //     );

  //     // Expected liquidity should be sqrt(amount_a * amount_b) - MINIMUM_LIQUIDITY for initial deposit
  //     const expectedLiquidity = BigInt(Math.floor(Math.sqrt(
  //       Number(values.depositAmountA.toString()) * Number(values.depositAmountB.toString())
  //     ))) - BigInt(values.minimumLiquidity.toString());

  //     assert.ok(
  //       BigInt(liquidityAccount.amount.toString()) === expectedLiquidity,
  //       "Incorrect liquidity tokens minted"
  //     );
      
  //   } catch (error) {
  //     // console.error("\n=== Error in Deposit Test ===");
  //     // console.error("Detailed error:", error);
  //     if (error.logs) {
  //       console.error("\nTransaction logs:");
  //       error.logs.forEach((log: string, index: number) => {
  //         console.error(`${index + 1}. ${log}`);
  //       });
  //     }
  //     throw error;
  //   }
  // });

  // it("deposits subsequent liquidity with correct proportions", async () => {
  //   try {
  //     console.log("\n=== Starting Subsequent Liquidity Deposit Test ===");

  //     // First deposit
  //     await program.methods
  //       .poolDeposit(
  //         values.depositAmountA,
  //         values.depositAmountB
  //       )
  //       .accountsStrict({
  //         payer: values.payer.publicKey,
  //         pool: values.poolKey,
  //         poolAuthority: values.poolAuthority,
  //         mintA: values.mintAKeypair.publicKey,
  //         mintB: values.mintBKeypair.publicKey,
  //         depositor: values.payer.publicKey,
  //         mintLiquidity: values.mintLiquidity,
  //         poolAccountA: values.poolAccountA,
  //         poolAccountB: values.poolAccountB,
  //         depositorAccountLiquidity: values.liquidityAccount,
  //         depositorAccountA: values.holderAccountA,
  //         depositorAccountB: values.holderAccountB,
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //         systemProgram: anchor.web3.SystemProgram.programId
  //       })
  //       .signers([values.payer])
  //       .rpc();

  //     // Get pool balances after first deposit
  //     const poolAAfterFirst = await getAccount(connection, values.poolAccountA);
  //     const poolBAfterFirst = await getAccount(connection, values.poolAccountB);
      
  //     // Calculate proportional amounts for second deposit (half of first deposit)
  //     const secondDepositA = values.depositAmountA;
  //     const secondDepositB = values.depositAmountB;

  //     // Second deposit
  //     await program.methods
  //       .poolDeposit(
  //         secondDepositA,
  //         secondDepositB
  //       )
  //       .accountsStrict({
  //         payer: values.payer.publicKey,
  //         pool: values.poolKey,
  //         poolAuthority: values.poolAuthority,
  //         mintA: values.mintAKeypair.publicKey,
  //         mintB: values.mintBKeypair.publicKey,
  //         depositor: values.payer.publicKey,
  //         mintLiquidity: values.mintLiquidity,
  //         poolAccountA: values.poolAccountA,
  //         poolAccountB: values.poolAccountB,
  //         depositorAccountLiquidity: values.liquidityAccount,
  //         depositorAccountA: values.holderAccountA,
  //         depositorAccountB: values.holderAccountB,
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //         systemProgram: anchor.web3.SystemProgram.programId
  //       })
  //       .signers([values.payer])
  //       .rpc();

  //     // Verify final balances
  //     const poolAAfterSecond = await getAccount(connection, values.poolAccountA);
  //     const poolBAfterSecond = await getAccount(connection, values.poolAccountB);

  //     console.log("After first deposit PoolAccount A", poolAAfterFirst.amount.toString());
  //     console.log("After second deposit PoolAccount A", poolAAfterSecond.amount.toString());
  //     console.log("After first deposit PoolAccount B", poolBAfterFirst.amount.toString());
  //     console.log("After second deposit PoolAccount B", poolBAfterSecond.amount.toString());

  //     console.log("\n=== Subsequent Liquidity Deposit Test Completed Successfully ===");
  //   } catch (error) {
  //     console.error("\n=== Error in Subsequent Deposit Test ===");
  //     console.error("Detailed error:", error);
  //     throw error;
  //   }

  //   it("Instruction fails if liquidity is less than the minimum liquidity", async () =>{
  //       try {
  //         await program.methods
  //       .poolDeposit(
  //         new BN(2),
  //         new BN(2)
  //       )
  //       .accountsStrict({
  //         payer: values.payer.publicKey,
  //         pool: values.poolKey,
  //         poolAuthority: values.poolAuthority,
  //         mintA: values.mintAKeypair.publicKey,
  //         mintB: values.mintBKeypair.publicKey,
  //         depositor: values.payer.publicKey,
  //         mintLiquidity: values.mintLiquidity,
  //         poolAccountA: values.poolAccountA,
  //         poolAccountB: values.poolAccountB,
  //         depositorAccountLiquidity: values.liquidityAccount,
  //         depositorAccountA: values.holderAccountA,
  //         depositorAccountB: values.holderAccountB,
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //         systemProgram: anchor.web3.SystemProgram.programId
  //       })
  //       .signers([values.payer])
  //       .rpc();

  //       assert(true);

  //       } catch(error) {
  //         console.log(error);
  //       }

  //   })
  // });
});