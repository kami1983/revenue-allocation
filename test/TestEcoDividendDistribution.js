const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
// const { ethers, ZeroAddress } = require("hardhat")

// const { AbiCoder } = ethers.utils;

describe("TestEcoDividendDistribution", function () {

  async function deployFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, test_a, test_b, test_c] = await ethers.getSigners();

    const Structre = await ethers.getContractFactory("TestEquityStructure");
    const struct = await Structre.deploy(0, [test_a.address, test_b.address], [2, 3]);

    const Equity = await ethers.getContractFactory("EcoDividendDistribution");
    const equity_proxy = await upgrades.deployProxy(Equity, [struct.address], { initializer: 'initialize' });
    await equity_proxy.deployed();

    // Deploy a vault contract for sid = 0.
    const EcoVault = await ethers.getContractFactory("EcoVault");
    const vault = await upgrades.deployProxy(EcoVault, [equity_proxy.address], { initializer: 'initialize' });
    await vault.deployed();

    await equity_proxy.registerSid(0, vault.address);

    return { vault, equity:equity_proxy, struct, owner, test_a, test_b, test_c };
  }

  describe("Test Dividend Distribution", function () {
    it("Test construct datas.", async function () {
      const { equity, vault, test_a, test_b } = await loadFixture(deployFixture);

      // Check total shares.
      expect(await equity.getTotalShares(0)).to.equal(5);
      // Check total dividend amount.
      expect(await vault.getAllInVaultBalance(ethers.constants.AddressZero)).to.equal(0);
      // Check current shares version .
      expect(await equity.getLastSharesVersion(0)).to.equal(1);

      // Get all shareholder addresses from contract.
      const shareholder_addresses = await equity.getAllShareholders(0);
      expect(shareholder_addresses.length).to.equal(2);
      expect(shareholder_addresses[0]).to.equal(test_a.address);
      expect(shareholder_addresses[1]).to.equal(test_b.address);

    });

    it("Test equity dividend distribution functionality", async function () {
      const { vault, equity, owner, test_a, test_b, test_c } = await loadFixture(deployFixture);

      // Update shareholder information and set their equity distribution ratio.
      // await equity.updateShareholders([test_a.address, test_b.address], [2,3], 1)
      
      // Get contract balance.
      const equity_balance = await ethers.provider.getBalance(equity.address);
      expect(equity_balance).to.equal(0);
      
      // Pay some Ether to the contract.
      const pay_amount = 100;
      await owner.sendTransaction({
        to: vault.address,
        value: pay_amount // ethers.utils.parseEther("100.0"), // Sends exactly 1.0 ether
      });
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(0);
      await vault.recordForDividends(ethers.constants.AddressZero);
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(100);
      // Check contract balance.
      expect(await ethers.provider.getBalance(vault.address)).to.equal(pay_amount);

      // Check shareholder balance.
      shareholder_a = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_a.address);
 
      expect(shareholder_a).to.deep.equal([2n, true, 0n, 40n,]);

      shareholder_b = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_b.address);
      expect(shareholder_b).to.deep.equal([3n, true, 0n, 60n, ]);

      shareholder_c = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_c.address);
      expect(shareholder_c).to.deep.equal([0n, false, 0n, 0n,]);

    });

    it("Should distribute dividends multiple times", async function () {
      const { vault, equity, struct, owner, test_a, test_b, test_c } = await loadFixture(deployFixture);

      // Update shareholder information and set their equity distribution ratio.
      // await equity.updateShareholders([test_a.address, test_b.address], [2,3], 1)
      const equity_balance = await ethers.provider.getBalance(equity.address);
      expect(equity_balance).to.equal(0);
      
      // Pay some Ether to the contract.
      const pay_amount = 100;
      await owner.sendTransaction({
        to: vault.address,
        value: pay_amount // ethers.utils.parseEther("100.0"), // Sends exactly 1.0 ether
      });
      // Check contract balance.
      expect(await ethers.provider.getBalance(vault.address)).to.equal(pay_amount);
      // record for dividends.
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(0);
      await vault.recordForDividends(ethers.constants.AddressZero);
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(100);

      // Test second dividend distribution.
      const pay_amount_2 = 100;
      await owner.sendTransaction({
        to: vault.address,
        value: pay_amount_2 
      });
      // Check contract balance.
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(100);
      expect(await ethers.provider.getBalance(vault.address)).to.equal(pay_amount + pay_amount_2);
      await vault.recordForDividends(ethers.constants.AddressZero);
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(200);

      // Update shareholder information and set their equity distribution ratio.
      await struct.updateEquityStructure(0, [test_a.address, test_b.address, test_c.address], [2,1,2])
      
      // Test third dividend distribution.
      const pay_amount_3 = 100;
      await owner.sendTransaction({
        to: vault.address,
        value: pay_amount_3 
      });
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(200);
      await vault.recordForDividends(ethers.constants.AddressZero);
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(300);
      // Check total shares.
      expect(await equity.getTotalShares(0)).to.equal(5);
      // Check total dividend amount.
      expect(await vault.getAllInVaultBalance(ethers.constants.AddressZero)).to.equal(300);
      // Check current shares version .
      expect(await equity.getLastSharesVersion(0)).to.equal(2);
      

      // Check contract balance.
      expect(await ethers.provider.getBalance(vault.address)).to.equal(pay_amount + pay_amount_2 + pay_amount_3);

      // Check shareholder balance.
      shareholder_a = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_a.address);
      // console.log(shareholder_a);
      expect(shareholder_a).to.deep.equal([2n, true,  0n, 120n, ]);

      shareholder_b = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_b.address);
      // console.log(shareholder_b);
      expect(shareholder_b).to.deep.equal([1n, true,  0n, 140n, ]);

      shareholder_c = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_c.address);
      // console.log(shareholder_c);
      expect(shareholder_c).to.deep.equal([2n, true, 0n, 40n, ]);

      expect(await equity.totalWithdrawnFunds(0, ethers.constants.AddressZero)).to.equal(0);

    });

    it("Test withdraw dividends", async function () {

      const { vault, equity, struct, owner, test_a, test_b, test_c } = await loadFixture(deployFixture);
      // await equity.updateShareholders([test_a.address, test_b.address], [2,3], 1)
      const pay_amount = 100;
      await owner.sendTransaction({
        to: vault.address,
        value: pay_amount // ethers.utils.parseEther("100.0"), // Sends exactly 1.0 ether
      });
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(0);
      await vault.recordForDividends(ethers.constants.AddressZero);
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(100);
      expect(await vault.getAllInVaultBalance(ethers.constants.AddressZero)).to.equal(100);
      console.log(' ethers.constants.AddressZero - ', ethers.constants.AddressZero);
      expect(await equity.totalWithdrawnFunds(0, ethers.constants.AddressZero)).to.equal(0);

      
      // Check state before withdraw.
      shareholder_a = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_a.address);
      expect(shareholder_a).to.deep.equal([2n, true, 0n, 40n]);
      
      // Check test_a balance 
      expect(await ethers.provider.getBalance(test_a.address)).to.equal(10000000000000000000000n);
      // Withdraw dividend for test_a.
      await equity.withdrawDividends(0, ethers.constants.AddressZero, test_a.address);
      
      // Check state after withdraw.
      shareholder_a = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_a.address);
      expect(shareholder_a).to.deep.equal([2n, true, 40n, 0n]);
      // Check test_a balance 
      expect(await ethers.provider.getBalance(test_a.address)).to.equal(10000000000000000000040n);
      // Check total dividend amount.
      expect(await vault.getAllInVaultBalance(ethers.constants.AddressZero)).to.equal(100);
      // Check total withdrawn funds.
      expect(await equity.totalWithdrawnFunds(0, ethers.constants.AddressZero)).to.equal(40);

      // Continue with a transfer of 100
      await owner.sendTransaction({
        to: vault.address,
        value: pay_amount // ethers.utils.parseEther("100.0"), // Sends exactly 1.0 ether
      });
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(100);
      await vault.recordForDividends(ethers.constants.AddressZero);
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(200);
      // Check state before withdraw.
      shareholder_a = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_a.address);
      expect(shareholder_a).to.deep.equal([2n, true, 40n, 40n]);
      shareholder_b = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_b.address);
      expect(shareholder_b).to.deep.equal([3n, true, 0n, 120n ]);

      
      // Check test_a balance
      await equity.withdrawDividends(0, ethers.constants.AddressZero, test_a.address);
      // Check state after withdraw.
      shareholder_a = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_a.address);
      expect(shareholder_a).to.deep.equal([2n, true, 80n, 0n,]);
      expect(await ethers.provider.getBalance(test_a.address)).to.equal(10000000000000000000080n);
      // Check test_b balance
      expect(await ethers.provider.getBalance(test_b.address)).to.equal(10000000000000000000000n);
      // Check total dividend amount.
      expect(await vault.getAllInVaultBalance(ethers.constants.AddressZero)).to.equal(200);
      // Check total withdrawn funds.
      expect(await equity.totalWithdrawnFunds(0, ethers.constants.AddressZero)).to.equal(80);


      // Change shareholder information.
      await struct.updateEquityStructure(0, [test_a.address, test_b.address, test_c.address], [2,0,2])
      // Continue with a transfer of 100
      await owner.sendTransaction({
        to: vault.address,
        value: pay_amount // ethers.utils.parseEther("100.0"), // Sends exactly 1.0 ether
      });
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(200);
      await vault.recordForDividends(ethers.constants.AddressZero);
      expect(await vault.dividendBalanceList(ethers.constants.AddressZero)).to.equal(300);
      // Check state before withdraw.
      shareholder_a = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_a.address);
      expect(shareholder_a).to.deep.equal([2n, true, 80n, 50n]);
      shareholder_b = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_b.address);
      expect(shareholder_b).to.deep.equal([0n, true, 0n, 120n,  ]);
      shareholder_c = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_c.address);
      expect(shareholder_c).to.deep.equal([2n, true, 0n, 50n,  ]);

      // Test_b withdraw his dividend.
      await equity.withdrawDividends(0, ethers.constants.AddressZero, test_b.address);
      // Check state after withdraw.
      shareholder_b = await equity.getShareholdersList(0, ethers.constants.AddressZero, test_b.address);
      expect(shareholder_b).to.deep.equal([0n, true, 120n, 0n, ]);
      expect(await ethers.provider.getBalance(test_b.address)).to.equal(10000000000000000000120n);

    });

    


  });

});
