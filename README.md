# revenue-allocation
Receive a payment and distribute it to different accounts based on weights

## InterfaceEquityStructure
### getEquityVersion()
* 获取股权结构的版本，如果股权结构发生变化这里的数值一定要发生变化

## getEquityStructure():[payees[],shares_[]]
* 返回股权结构数据，返回值：[payees[],shares_[]] 表示支付的用户和对应的股权数据。

## If had error:
```
TypeError: (0 , ethers_1.getAddress) is not a function
      at new HardhatEthersSigner (node_modules/@nomicfoundation/hardhat-ethers/src/signers.ts:73:30)
      at Function.create (node_modules/@nomicfoundation/hardhat-ethers/src/signers.ts:65:12)
      at processTicksAndRejections (node:internal/process/task_queues:95:5)
      at getSigner (node_modules/@nomicfoundation/hardhat-ethers/src/internal/helpers.ts:60:29)
      at async Promise.all (index 0)
      at getSigners (node_modules/@nomicfoundation/hardhat-ethers/src/internal/helpers.ts:45:30)
      at deployFixture (test/TestEquityDividendDistribution.js:12:45)
      at loadFixture (node_modules/@nomicfoundation/hardhat-network-helpers/src/loadFixture.ts:59:18)
      at Context.<anonymous> (test/TestEquityDividendDistribution.js:232:42)
```
<!-- * install ethers@5.7.4 -->
* It'll solved by `yarn add --dev hardhat @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers`

## If `ethers.constants.AddressZero` had error:
```
TypeError: Cannot read properties of undefined (reading 'AddressZero')
```
* Use `ethers.ZeroAddress` instead of `ethers.constants.ZeroAddress
