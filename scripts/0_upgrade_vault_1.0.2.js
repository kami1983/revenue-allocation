// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

require('dotenv').config();

async function main() {

  const POLYGON = 'polygon'
  const GOERLI = 'goerli'

  // 
  const network = POLYGON // goerli, polygon

  // const distribution_address = process.env.DATA_DEBUG_DIVIDEND_DISTRIBUTION_ADDRESS;
  const distribution_address = network == POLYGON  ? process.env.DATA_POLYGON_DIVIDEND_DISTRIBUTION_ADDRESS : process.env.DATA_GOERLI_DIVIDEND_DISTRIBUTION_ADDRESS;

  // const vault_address = process.env.VAULT_DEBUG_ADDRESS
  const vault_address = '0x4a12412E23e876434Fab3ec177C6856EaE83Db79'

  // Check vault contract balance.
  console.log('vault_address - ', vault_address)
  console.log('distribution_address - ', distribution_address)  

  // getDividendAddress()
  const vault_proxy = await ethers.getContractAt("EcoVault", vault_address);

  // Get vault balance.
  const vault_balance = await ethers.provider.getBalance(vault_address);
  console.log('vault native balance - ', vault_balance.toString(), 'distribution: ', await vault_proxy.getDividendAddress());

//   // Get old vault version.
//   const old_vault_version = await vault_proxy.impVersion();
//   console.log('old_vault_version - ', old_vault_version.toString());

  // Upgrade vault.
  const EcoVault = await ethers.getContractFactory("EcoVault");
  const new_vault = await upgrades.upgradeProxy(vault_address, EcoVault);
  await new_vault.deployed();

  // Get new vault version.
  const new_vault_version = await new_vault.impVersion();
  console.log('new_vault_version - ', new_vault_version.toString());

  console.log('vault upgrade success! 1.0.2');

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
