// Use dotenv to read and set environment variables from a .env file
require('dotenv').config();

const hre = require("hardhat");

async function main() {

  const bind_sid = 0;

  // const distribution_address = process.env.DATA_DEBUG_DIVIDEND_DISTRIBUTION_ADDRESS;
  const distribution_address = process.env.DATA_POLYGON_DIVIDEND_DISTRIBUTION_ADDRESS;
  const vault_proxy_address_of_sid_0 = '0x4a12412E23e876434Fab3ec177C6856EaE83Db79';

  // at distribution_address
  const equity_proxy = await ethers.getContractAt("EcoDividendDistribution", distribution_address);

  console.log('bind_sid - ', bind_sid, 'implement version - ', await equity_proxy.impVersion());
  console.log('distribution_address - ', distribution_address)

  // Get vault address
  const old_vault_address = await equity_proxy.balanceAddressList(bind_sid);
  console.log('old_vault_address - ', old_vault_address);

  // Adjust vault address not equal to old_vault_address
  if (old_vault_address == vault_proxy_address_of_sid_0) {
    console.log('error! old_vault_address to equals vault_proxy_address_of_sid_0 is not allowed.');
    return;
  }

  // Set new vault address
  await equity_proxy.upgradeVaultAddress(bind_sid, vault_proxy_address_of_sid_0);

  // Get new vault address
  const new_vault_address = await equity_proxy.balanceAddressList(bind_sid);
  console.log('new_vault_address - ', new_vault_address);

  console.log('Finish deploy artist eco vault contract');

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
