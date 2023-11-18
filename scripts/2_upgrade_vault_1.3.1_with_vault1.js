// Use dotenv to read and set environment variables from a .env file
require('dotenv').config();

const hre = require("hardhat");

async function main() {

  const bind_sid = 1;

  // const distribution_address = process.env.DATA_DEBUG_DIVIDEND_DISTRIBUTION_ADDRESS;
  const distribution_address = process.env.DATA_POLYGON_DIVIDEND_DISTRIBUTION_ADDRESS;
  const vault_proxy_address_of_sid_1 = '0x9e7Fc30208C37566F0ffd47547b14f6a9135DBC6';

  // at distribution_address
  const equity_proxy = await ethers.getContractAt("EcoDividendDistribution", distribution_address);

  console.log('bind_sid - ', bind_sid, 'implement version - ', await equity_proxy.impVersion());
  console.log('distribution_address - ', distribution_address)

  // Get vault address
  const old_vault_address = await equity_proxy.balanceAddressList(bind_sid);
  console.log('old_vault_address - ', old_vault_address);

  // Adjust vault address not equal to old_vault_address
  if (old_vault_address != vault_proxy_address_of_sid_1) {
    console.log('old_vault_address != vault_proxy_address_of_sid_1');
    return;
  }

  // Check vault contract balance.
  console.log('will upgrade vault_address - ', vault_proxy_address_of_sid_1)

  // getDividendAddress()
  const vault_proxy = await ethers.getContractAt("EcoVault", vault_proxy_address_of_sid_1);

  // Get vault balance.
  const vault_balance = await ethers.provider.getBalance(vault_proxy_address_of_sid_1);
  console.log('vault native balance - ', vault_balance.toString(), 'distribution: ', await vault_proxy.getDividendAddress());

  // Get old vault version.
  const old_vault_version = await vault_proxy.impVersion();
  console.log('old_vault_version - ', old_vault_version.toString());

  // Upgrade vault.
  const EcoVault = await ethers.getContractFactory("EcoVault");
  const new_vault = await upgrades.upgradeProxy(vault_proxy_address_of_sid_1, EcoVault, {initializer: 'initialize_131', args: []});
  await new_vault.deployed();

  // Get new vault version.
  const new_vault_version = await new_vault.impVersion();
  console.log('new_vault_version - ', new_vault_version.toString());

  console.log('Finish deployed artist eco vault contract');

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
