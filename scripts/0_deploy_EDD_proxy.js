// Use dotenv to read and set environment variables from a .env file
require('dotenv').config();

const hre = require("hardhat");

async function main() {


  // const struct_address = process.env.DATA_DEBUG_STRUCTURE_ADDRESS;
  const struct_address = process.env.DATA_POLYGON_STRUCTURE_ADDRESS;

  console.log('struct_address - ', struct_address)

  const Equity = await ethers.getContractFactory("EcoDividendDistribution");
  const equity_proxy = await upgrades.deployProxy(Equity, [struct_address], { initializer: 'initialize' });
  await equity_proxy.deployed();

  console.log('ECO Dividend Distribution - ', equity_proxy.address);

  console.log('Finish deploy artist eco dividend distribution contract');

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
