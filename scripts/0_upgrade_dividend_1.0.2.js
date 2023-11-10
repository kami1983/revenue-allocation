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

  console.log('Fix a bug of sid > 0')
  // 
  const network = POLYGON // goerli, polygon

  const distribution_address = '0xF1391060E4a3092796B60c1cFaeea94f07fDe9FE';
  // const distribution_address = network == POLYGON  ? process.env.DATA_POLYGON_DIVIDEND_DISTRIBUTION_ADDRESS : process.env.DATA_GOERLI_DIVIDEND_DISTRIBUTION_ADDRESS;

  console.log('distribution_address proxy - ', distribution_address, network)  


  // Get vault balance.
  // const vault_balance = await ethers.provider.getBalance(vault_address);
  // console.log('vault native balance - ', vault_balance.toString(), 'distribution: ', await vault_proxy.getDividendAddress());

  // Get dividend distribution contract impVersion.
  const distribution_proxy = await ethers.getContractAt("EcoDividendDistribution", distribution_address);
  const equity_impVersion = await distribution_proxy.impVersion();
  console.log('old distribution_impVersion - ', equity_impVersion.toString());

  // Get dividend distribution contract owner.
  const distribution_owner = await distribution_proxy.owner();
  console.log('distribution_contract_owner - ', distribution_owner.toString());

  // Upgrade vault.
  const EcoDividendDistribution = await ethers.getContractFactory("EcoDividendDistribution");
  const new_dividend_distribution = await upgrades.upgradeProxy(distribution_address, EcoDividendDistribution);
  await new_dividend_distribution.deployed();

  // Get new vault version.
  const new_dividend_distribution_version = await new_dividend_distribution.impVersion();
  console.log('new_dividend_distribution - ', new_dividend_distribution_version.toString());

  // Get implementation address.
  const implementation_address = await upgrades.erc1967.getImplementationAddress(distribution_address)

  console.log('vault upgrade success of DividendDistribution! 1.0.2, implementation_address - ', implementation_address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
