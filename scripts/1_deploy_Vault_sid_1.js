// Use dotenv to read and set environment variables from a .env file
require('dotenv').config();

const hre = require("hardhat");

async function main() {


  const bind_sid = 1;

  // const distribution_address = process.env.DATA_DEBUG_DIVIDEND_DISTRIBUTION_ADDRESS;
  const distribution_address = process.env.DATA_POLYGON_DIVIDEND_DISTRIBUTION_ADDRESS;

  // at distribution_address
  const equity_proxy = await ethers.getContractAt("EcoDividendDistribution", distribution_address);

  console.log('bind_sid - ', bind_sid, 'implement version - ', await equity_proxy.impVersion());
  console.log('distribution_address - ', distribution_address)

  const EcoVault = await ethers.getContractFactory("EcoVault");
  const vault_proxy = await upgrades.deployProxy(EcoVault, [distribution_address], { initializer: 'initialize' });
  await vault_proxy.deployed();

  console.log('ECO Vault - ', vault_proxy.address);
  console.log('Register and bind sid to vault contract');

  await equity_proxy.registerSid(bind_sid, vault_proxy.address);

  console.log('Finish deploy artist eco none vault contract');

  // Check equit proxy register sid
  const check_vault_address = await equity_proxy.balanceAddressList(bind_sid);
  console.log(`For sid = ${bind_sid}, check_vault_address = ${check_vault_address}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
