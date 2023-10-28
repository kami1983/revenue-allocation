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
  const sid = 0;

  // 
  const network = POLYGON // goerli, polygon

  // const distribution_address = process.env.DATA_DEBUG_DIVIDEND_DISTRIBUTION_ADDRESS;
  const distribution_address = network == POLYGON  ? process.env.DATA_POLYGON_DIVIDEND_DISTRIBUTION_ADDRESS : process.env.DATA_GOERLI_DIVIDEND_DISTRIBUTION_ADDRESS;

  // const vault_address = process.env.VAULT_DEBUG_ADDRESS
  const vault_address = network == POLYGON  ? process.env.VAULT_POLYGON_ADDRESS : process.env.VAULT_GOERLI_ADDRESS;

  // Check vault contract balance.
  console.log('vault_address - ', vault_address)
  console.log('distribution_address - ', distribution_address)  

  // getDividendAddress()
  const vault_proxy = await ethers.getContractAt("EcoVault", vault_address);

  // Get vault balance.
  const vault_balance = await ethers.provider.getBalance(vault_address);
  console.log('vault native balance - ', vault_balance.toString(), 'distribution: ', await vault_proxy.getDividendAddress());

  // At distribution_address
  const equity_proxy = await ethers.getContractAt("EcoDividendDistribution", distribution_address);

  const before_all_shareholders = await equity_proxy.getAllShareholders(sid);
  console.log('before all_shareholders - ', before_all_shareholders)
  const before_shareholder_details = await equity_proxy.getShareholdersList(sid, ethers.constants.AddressZero, '0xE3b346E1295DB6a991099bAe6B46b317D165B41a');
  console.log('before shareholder_details - ', before_shareholder_details)

  //
  console.log('call recordForDividends() on vault_proxy')
  await vault_proxy.recordForDividends(ethers.constants.AddressZero);

  const after_all_shareholders = await equity_proxy.getAllShareholders(sid);
  console.log('before all_shareholders - ', after_all_shareholders)
  const after_shareholder_details = await equity_proxy.getShareholdersList(sid, ethers.constants.AddressZero, '0xE3b346E1295DB6a991099bAe6B46b317D165B41a');
  console.log('before shareholder_details - ', after_shareholder_details)


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
