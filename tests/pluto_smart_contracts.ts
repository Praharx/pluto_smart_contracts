import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { PlutoSmartContracts } from "../target/types/pluto_smart_contracts";

describe("pluto_smart_contracts", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.PlutoSmartContracts as Program<PlutoSmartContracts>;

  it("pool initializes correctly", async () => {
    // Add your test here.
    const tx = await program.methods.initializePool().rpc();
    console.log("Your transaction signature", tx);
  });
});
