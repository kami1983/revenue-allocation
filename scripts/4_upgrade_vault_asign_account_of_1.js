// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

require('dotenv').config();

async function main() {

  // const vault_address = process.env.VAULT_DEBUG_ADDRESS
  const vault_address = '0x9e7Fc30208C37566F0ffd47547b14f6a9135DBC6'

  // Check vault contract balance.
  console.log('vault_address - ', vault_address)

  // getDividendAddress()
  const vault_proxy = await ethers.getContractAt("EcoVault", vault_address);

  // Get vault balance.
  console.log('Distribution: ', await vault_proxy.getDividendAddress());

  // Get old vault version.
  const old_vault_version = await vault_proxy.impVersion();
  console.log('old_vault_version - ', old_vault_version.toString());

  const assign_account = '0x7CBe7b2511dabC3fa90e4425d3f1a938951F80F1'

  await vault_proxy.setAssignAccount(assign_account);

  console.log('Set assign account', assign_account);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
