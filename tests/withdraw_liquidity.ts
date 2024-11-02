import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import type { PlutoSmartContracts } from "../target/types/pluto_smart_contracts";
import { type TestValues, createValues, mintingTokens } from "./utils";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("Withdraw Liquidity", () => {
    const provider = anchor.AnchorProvider.env();
    const connection = provider.connection;
    anchor.setProvider(provider);

    const program = anchor.workspace.PlutoSmartContracts as Program<PlutoSmartContracts>;
    
    let values: TestValues;

    beforeEach(async() => {
            values = createValues();

            // Mint tokens to the depositor
            await mintingTokens({
                connection,
                creator: values.payer,
                mintAKeypair: values.mintAKeypair,
                mintBKeypair: values.mintBKeypair
            })

            //Initializing the pool
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


            // Deposit Liquidity in pool
            await program.methods
            .poolDeposit(
                values.depositAmountA,
                values.depositAmountB
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
            .signers([values.payer])
            .rpc();
           
    });

    it("Withdraw all the collateral", async () => {
        await program.methods
        .poolWithdrawal(new anchor.BN(5 * 10 ** 6))
        .accountsStrict({
            payer: values.payer.publicKey,
            pool: values.poolKey,
            poolAuthority: values.poolAuthority,
            depositor: values.payer.publicKey,
            mintLiquidity: values.mintLiquidity,
            mintA: values.mintAKeypair.publicKey,
            mintB: values.mintBKeypair.publicKey,
            poolAccountA: values.poolAccountA,
            poolAccountB: values.poolAccountB,
            depositorAccountLiquidity: values.liquidityAccount,
            depositorAccountA: values.holderAccountA,
            depositorAccountB: values.holderAccountB,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId
        })
        .signers([values.payer])
        .rpc();

        const poolAccountA = await connection.getTokenAccountBalance(values.poolAccountA);
        const poolAccountB = await connection.getTokenAccountBalance(values.poolAccountB);
        const liquidityTokenAccount = await connection.getTokenAccountBalance(values.liquidityAccount);
        const depositorTokenAccountA = await connection.getTokenAccountBalance(values.holderAccountA);
        const depositorTokenAccountB = await connection.getTokenAccountBalance(values.holderAccountB);
        console.log(":::::::",liquidityTokenAccount.value.amount);
        console.log(":::::::",depositorTokenAccountA.value.amount);
        console.log(":::::::",depositorTokenAccountB.value.amount);
        console.log("///////////", poolAccountA);
        console.log("//////////", poolAccountB);

        expect(liquidityTokenAccount.value.amount).to.equal('0');
        expect(Number(depositorTokenAccountA.value.amount)).to.be.lessThan(values.defaultSupply.toNumber());
        expect(Number(depositorTokenAccountA.value.amount)).to.be.greaterThan(values.defaultSupply.sub(values.depositAmountA).toNumber());
        expect(Number(depositorTokenAccountB.value.amount)).to.be.lessThan(values.defaultSupply.toNumber());
        // expect(Number(depositorTokenAccountB.value.amount)).to.be.greaterThan(values.defaultSupply.sub(values.depositAmountB).toNumber());
    })
})
