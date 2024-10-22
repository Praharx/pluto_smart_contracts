import * as anchor from "@coral-xyz/anchor";
import { createMint, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { type Connection, Keypair, PublicKey, type Signer} from "@solana/web3.js";
import { BN } from "bn.js";

export async function sleep(seconds: number) {
    new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export const generatedSeededKeypair = (seed: string) => {
    return Keypair.fromSeed(anchor.utils.bytes.utf8.encode(anchor.utils.sha256.hash(seed)).slice(0, 32));
}

export interface TestValues {
    id: PublicKey;
    fee: number;
    mintAKeypair: Keypair;
    mintBKeypair: Keypair;
    defaultSupply: anchor.BN;
    minimumLiquidity: anchor.BN;
    poolKey: PublicKey;
    poolAuthority: PublicKey;
    mintLiquidity: PublicKey;
    depositAmountA: anchor.BN;
    depositAmountB: anchor.BN;
    liquidityAccount: PublicKey;
    poolAccountA: PublicKey;
    poolAccountB: PublicKey;
    holderAccountA: PublicKey;
    holderAccountB: PublicKey;
}

type TestValuesDefaults = {
    [K in keyof TestValues]+?: TestValues[K];
}

export function createValues(defaults: TestValuesDefaults): TestValues {
    const id = defaults.id || Keypair.generate().publicKey;
    const mintAKeypair = Keypair.generate();
    const mintBKeypair = defaults.mintBKeypair || generatedSeededKeypair(id.toBase58());
}

