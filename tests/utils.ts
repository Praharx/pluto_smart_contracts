import * as anchor from '@coral-xyz/anchor';
import { createMint, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { type Connection, Keypair, PublicKey, type Signer } from '@solana/web3.js';
import { BN } from 'bn.js';

export async function sleep(seconds: number) {
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export const generateSeededKeypair = (seed: string) => {
  return Keypair.fromSeed(anchor.utils.bytes.utf8.encode(anchor.utils.sha256.hash(seed)).slice(0, 32));
};

export const expectRevert = async (promise: Promise<any>) => {
  try {
    await promise;
    throw new Error('Expected a revert');
  } catch {
    return;
  }
};

export const mintingTokens = async ({
  connection,
  creator,
  holder = creator,
  mintAKeypair,
  mintBKeypair,
  mintedAmount = 100,
  decimals = 6,
}: {
  connection: Connection;
  creator: Signer;
  holder?: Signer;
  mintAKeypair: Keypair;
  mintBKeypair: Keypair;
  mintedAmount?: number;
  decimals?: number;
}) => {
  // Mint tokens
  await connection.confirmTransaction(await connection.requestAirdrop(creator.publicKey, 10 ** 10));
  await createMint(connection, creator, creator.publicKey, creator.publicKey, decimals, mintAKeypair);
  await createMint(connection, creator, creator.publicKey, creator.publicKey, decimals, mintBKeypair);
  await getOrCreateAssociatedTokenAccount(connection, holder, mintAKeypair.publicKey, holder.publicKey, true);
  await getOrCreateAssociatedTokenAccount(connection, holder, mintBKeypair.publicKey, holder.publicKey, true);
  await mintTo(
    connection,
    creator,
    mintAKeypair.publicKey,
    getAssociatedTokenAddressSync(mintAKeypair.publicKey, holder.publicKey, true),
    creator.publicKey,
    mintedAmount * 10 ** decimals,
  );
  await mintTo(
    connection,
    creator,
    mintBKeypair.publicKey,
    getAssociatedTokenAddressSync(mintBKeypair.publicKey, holder.publicKey, true),
    creator.publicKey,
    mintedAmount * 10 ** decimals,
  );
};

export interface TestValues {
  id: PublicKey;
  payer: Keypair;
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
};
export function createValues(defaults?: TestValuesDefaults): TestValues {
  const id = defaults?.id || Keypair.generate().publicKey;
  const payer = Keypair.generate();

  // Making sure tokens are in the right order
  const mintAKeypair = Keypair.generate();
  let mintBKeypair = Keypair.generate();
  while (new BN(mintBKeypair.publicKey.toBytes()).lt(new BN(mintAKeypair.publicKey.toBytes()))) {
    mintBKeypair = Keypair.generate();
  }

  const poolKey = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mintAKeypair.publicKey.toBuffer(), mintBKeypair.publicKey.toBuffer()],
    anchor.workspace.PlutoSmartContracts.programId,
  )[0];
  const poolAuthority = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_authority'), mintAKeypair.publicKey.toBuffer(), mintBKeypair.publicKey.toBuffer()],
    anchor.workspace.PlutoSmartContracts.programId,
  )[0];
  const mintLiquidity = PublicKey.findProgramAddressSync(
    [Buffer.from('mint_authority'), mintAKeypair.publicKey.toBuffer(), mintBKeypair.publicKey.toBuffer()],
    anchor.workspace.PlutoSmartContracts.programId,
  )[0];
  return {
    id,
    payer,
    mintAKeypair,
    mintBKeypair,
    mintLiquidity,
    poolKey,
    poolAuthority,
    poolAccountA: getAssociatedTokenAddressSync(mintAKeypair.publicKey, poolAuthority, true),
    poolAccountB: getAssociatedTokenAddressSync(mintBKeypair.publicKey, poolAuthority, true),
    liquidityAccount: getAssociatedTokenAddressSync(mintLiquidity, payer.publicKey, true),
    holderAccountA: getAssociatedTokenAddressSync(mintAKeypair.publicKey, payer.publicKey, true),
    holderAccountB: getAssociatedTokenAddressSync(mintBKeypair.publicKey, payer.publicKey, true),
    depositAmountA: new anchor.BN(10 * 10 ** 6),
    depositAmountB: new anchor.BN(3 * 10 ** 6),
    minimumLiquidity: new anchor.BN(1),
    defaultSupply: new anchor.BN(100),
  };
}