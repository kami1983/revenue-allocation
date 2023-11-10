# revenue-allocation
Receive a payment and distribute it to different accounts based on weights

## InterfaceStakeStructure
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
      at deployFixture (test/TestEcoDividendDistribution.js:12:45)
      at loadFixture (node_modules/@nomicfoundation/hardhat-network-helpers/src/loadFixture.ts:59:18)
      at Context.<anonymous> (test/TestEcoDividendDistribution.js:232:42)
```
<!-- * install ethers@5.7.4 -->
* It'll solved by `yarn add --dev hardhat @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers`

## If `ethers.constants.AddressZero` had error:
```
TypeError: Cannot read properties of undefined (reading 'AddressZero')
```
* Use `ethers.ZeroAddress` instead of `ethers.constants.ZeroAddress

## Deployed
* Owner: `0xF322adBc64a39d4EB5CF2B3E8296CaB0874f257d`

### On goerli
```
struct_address -  0x17CFCfB65EF80cb700409c8E7074D021336a2c75

ECO Dividend Distribution -  0x10cE8c0Bf1b5B314ED5aaBa2eB83AFA601067948
ECO Vault -  0xaa9578396a85806772D27922FDfBaBAa8506F181

```

* verify contract : `npx hardhat verify --network goerli --constructor-args scripts/params/vault-goerli.json 0xaa9578396a85806772D27922FDfBaBAa8506F181`

### On polygon
```
struct_address -  0xA956A8c1160A2B3f24e99B8f90d74Bf47521cfc5

ECO Dividend Distribution -  0xF1391060E4a3092796B60c1cFaeea94f07fDe9FE
ECO Vault -  0x63c889Cd71E8AA301910599b66818A24488acaCC
```
* verify contract : `npx hardhat verify --network polygon --constructor-args scripts/params/vault-polygon.json 0x63c889Cd71E8AA301910599b66818A24488acaCC`

* None vault: `0x3C42856EB03570E9d88030fEFE42878d1fcfa865`
* None vault, proxy : `0x4a12412E23e876434Fab3ec177C6856EaE83Db79`

### On polygon upgrade proxy vault for sid = 0
* AIM Vault proxy : `0x4a12412E23e876434Fab3ec177C6856EaE83Db79`
```
vault_address -  `0x4a12412E23e876434Fab3ec177C6856EaE83Db79`
distribution_address -  `0xF1391060E4a3092796B60c1cFaeea94f07fDe9FE`
vault native balance -  50000000000000000 distribution:  0xF1391060E4a3092796B60c1cFaeea94f07fDe9FE
```

### On polygon the dividend distribution upgrade to 1.0.1
```
distribution_address -  0xF1391060E4a3092796B60c1cFaeea94f07fDe9FE
equity_impVersion -  1.0.0
equity_owner -  0xF322adBc64a39d4EB5CF2B3E8296CaB0874f257d
new_dividend_distribution -  1.0.1
vault upgrade success of DividendDistribution! 1.0.1
```

### Upgrade vault to 1.1.0
* Owner: `0xE3b346E1295DB6a991099bAe6B46b317D165B41a`
* Vault proxy: `0x4a12412E23e876434Fab3ec177C6856EaE83Db79`
* Start truffle dashboard: `npx truffle dashboard`
* deploy order: `npx hardhat run scripts/deploy/0_upgrade_vault_1.1.0.js --network truffle-dashboard`


## Upgrade vault to 1.1.1
* `npx hardhat run scripts/0_upgrade_vault_1.1.1.js --network truffle-dashboard`
* Owner: `0xF322adBc64a39d4EB5CF2B3E8296CaB0874f257d`
```vault_address -  0x4a12412E23e876434Fab3ec177C6856EaE83Db79
vault native balance -  8165580000000000000 distribution:  0xF1391060E4a3092796B60c1cFaeea94f07fDe9FE
old_vault_version -  1.0.3
new_vault_version -  1.1.1
vault upgrade success! 1.1.1```


## Upgrade vault to 1.2.0
* `npx hardhat run scripts/0_upgrade_vault_1.2.0.js --network truffle-dashboard`
* Owner: `0xF322adBc64a39d4EB5CF2B3E8296CaB0874f257d`
```
vault_address -  0x4a12412E23e876434Fab3ec177C6856EaE83Db79
vault native balance -  8165580000000000000 distribution:  0xF1391060E4a3092796B60c1cFaeea94f07fDe9FE
old_vault_version -  1.1.2
new_vault_version -  1.2.0
vault upgrade success! 1.2.0
```

## Upgrade vault to 1.2.1
* `npx hardhat run scripts/0_upgrade_vault_1.2.1.js --network truffle-dashboard`
* Owner: `0xF322adBc64a39d4EB5CF2B3E8296CaB0874f257d`
```
vault_address -  0x4a12412E23e876434Fab3ec177C6856EaE83Db79
vault native balance -  8165580000000000000 distribution:  0xF1391060E4a3092796B60c1cFaeea94f07fDe9FE
old_vault_version -  1.2.0
new_vault_version -  1.2.1
vault upgrade success! 1.2.1
```

## Verify vault implementation contract 0x0FB8ADD7c4E86650a00edBCAf233fB24CBB795bC
* npx hardhat verify --network polygon 0x0FB8ADD7c4E86650a00edBCAf233fB24CBB795bC

## Depoly vault for 1
* truffle dashboard [--port <number>] [--host <string>] [--verbose]
```
bind_sid -  1 implement version -  1.0.1
distribution_address -  0xF1391060E4a3092796B60c1cFaeea94f07fDe9FE
ECO Vault -  0x9e7Fc30208C37566F0ffd47547b14f6a9135DBC6
Register and bind sid to vault contract
Finish deploy artist eco none vault contract
For sid = 1, check_vault_address = 0x0000000000000000000000000000000000000000

```

## Upgrade dividend 1.0.1 to 1.0.2
* This's version fix a bug that the sid != 0 can't get the dividend.
* `npx hardhat run scripts/0_upgrade_dividend_1.0.2.js --network truffle-dashboard` Need start `truffle dashboard`

## From Vault 1.3.0 the vault initialize need provide the `_assign_account`

## Upgrade vault to 1.3.0
