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

  const vault_address = network == POLYGON  ? process.env.VAULT_POLYGON_ADDRESS : process.env.VAULT_GOERLI_ADDRESS;

  // Check vault contract balance.
  console.log('vault_address - ', vault_address)
  console.log('distribution_address - ', distribution_address) 

  // getDividendAddress()
  const vault_proxy = await ethers.getContractAt("EcoVault", vault_address);

  // Get vault balance.
  const vault_balance = await ethers.provider.getBalance(vault_address);
  console.log('vault native balance - ', vault_balance.toString(), 'distribution: ', await vault_proxy.getDividendAddress());

  // Get equity contract balance.
  console.log('before dividend inVaultBalanceList - ', await vault_proxy.inVaultBalanceList(ethers.constants.AddressZero));
  console.log('before dividend outVaultBalanceList - ', await vault_proxy.outVaultBalanceList(ethers.constants.AddressZero));
  console.log('before dividend dividendBalanceList - ', await vault_proxy.dividendBalanceList(ethers.constants.AddressZero));

  // 
  // await vault_proxy.recordForDividends(ethers.constants.AddressZero);

  // Get equity contract balance.
  console.log('after dividend inVaultBalanceList - ', await vault_proxy.inVaultBalanceList(ethers.constants.AddressZero));
  console.log('after dividend outVaultBalanceList - ', await vault_proxy.outVaultBalanceList(ethers.constants.AddressZero));
  console.log('after dividend dividendBalanceList - ', await vault_proxy.dividendBalanceList(ethers.constants.AddressZero));

  // At distribution_address
  const equity_proxy = await ethers.getContractAt("EcoDividendDistribution", distribution_address);

  const all_shareholders = await equity_proxy.getAllShareholders(sid);
  console.log('all_shareholders - ', all_shareholders)
  for(let i = 0; i < all_shareholders.length; i++) {
    console.log('shareholder_details - ', await equity_proxy.getShareholdersList(sid, ethers.constants.AddressZero, all_shareholders[i]));
    console.log('-------------------')
  }

  const related_infos = await equity_proxy.getSidRelatedInfos(sid);
  console.log('related_infos - ', related_infos);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
