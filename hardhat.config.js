require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.11",
  networks: {
    'truffle-dashboard': {
      url: "http://localhost:24012/rpc",
      gas: 4200000,
      gasPrice: 8000000000,
    },
    'goerli': {
      url: process.env.GOERLI_RPC_URL,
      accounts: [process.env.GOERLI_PRIVATE_KEY],
    },
    'polygon': {
      // gasLimit: 91000000,
      gas: 4200000,
      gasPrice: 8000000000,
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.POLYGON_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      goerli: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
    }
  }
};


