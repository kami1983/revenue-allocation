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

  console.log('distribution_address - ', distribution_address)  


  // Get vault balance.
  // const vault_balance = await ethers.provider.getBalance(vault_address);
  // console.log('vault native balance - ', vault_balance.toString(), 'distribution: ', await vault_proxy.getDividendAddress());

  // Get dividend distribution contract impVersion.
  const equity_proxy = await ethers.getContractAt("EcoDividendDistribution", distribution_address);
  const equity_impVersion = await equity_proxy.impVersion();
  console.log('equity_impVersion - ', equity_impVersion.toString());

  // Get dividend distribution contract owner.
  const equity_owner = await equity_proxy.owner();
  console.log('equity_owner - ', equity_owner.toString());

  // Upgrade vault.
  const EcoDividendDistribution = await ethers.getContractFactory("EcoDividendDistribution");
  const new_dividend_distribution = await upgrades.upgradeProxy(distribution_address, EcoDividendDistribution);
  await new_dividend_distribution.deployed();

  // Get new vault version.
  const new_dividend_distribution_version = await new_dividend_distribution.impVersion();
  console.log('new_dividend_distribution - ', new_dividend_distribution_version.toString());

  console.log('vault upgrade success of DividendDistribution! 1.0.1');

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
