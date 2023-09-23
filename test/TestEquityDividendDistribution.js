const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { json } = require("hardhat/internal/core/params/argumentTypes");
const { ethers } = require("hardhat")

describe("TestEquityDividendDistribution", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    // const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    // const ONE_GWEI = 1_000_000_000;
    // const ONE_ETH = 1_000_000_000_000_000_000n;

    // const lockedAmount = ONE_GWEI;
    // const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, test_a, test_b, test_c] = await ethers.getSigners();

    const Structre = await ethers.getContractFactory("TestEquityStructure");
    const struct = await Structre.deploy([test_a.address, test_b.address], [2, 3]);

    const Equity = await ethers.getContractFactory("EquityDividendDistribution");
    const equity = await Equity.deploy(struct.target);
    return { equity, struct, owner, test_a, test_b, test_c };
  }

  describe("Test Dividend Distribution", function () {
    it("Test construct datas.", async function () {
      const { equity, test_a, test_b } = await loadFixture(deployFixture);

      // Update shareholder information and set their equity distribution ratio.
      // await equity.updateShareholders([test_a.address, test_b.address], [2,3], 1)

      // Check total shares.
      expect(await equity.totalShares()).to.equal(5);
      // Check total dividend amount.
      expect(await equity.totalDividend()).to.equal(0);
      // Check current shares version .
      expect(await equity.lastSharesVersion()).to.equal(1);

      // Get all shareholder addresses from contract.
      const shareholder_addresses = await equity.getAllShareholders();
      expect(shareholder_addresses.length).to.equal(2);
      expect(shareholder_addresses[0]).to.equal(test_a.address);
      expect(shareholder_addresses[1]).to.equal(test_b.address);

    });

    it("Test equity dividend distribution functionality", async function () {
      const { equity, owner, test_a, test_b, test_c } = await loadFixture(deployFixture);

      // Update shareholder information and set their equity distribution ratio.
      // await equity.updateShareholders([test_a.address, test_b.address], [2,3], 1)
      
      // Get contract balance.
      const equity_balance = await ethers.provider.getBalance(equity.target);
      expect(equity_balance).to.equal(0);
      
      // Pay some Ether to the contract.
      const pay_amount = 100;
      await owner.sendTransaction({
        to: equity.target,
        value: pay_amount // ethers.parseEther("100.0"), // Sends exactly 1.0 ether
      });
      // Check contract balance.
      expect(await ethers.provider.getBalance(equity.target)).to.equal(pay_amount);

      // Check shareholder balance.
      shareholder_a = await equity.shareholders(test_a.address);
      expect(shareholder_a).to.deep.equal([2n, 40n, 0n, true]);

      shareholder_b = await equity.shareholders(test_b.address);
      expect(shareholder_b).to.deep.equal([3n, 60n, 0n, true]);

      shareholder_c = await equity.shareholders(test_c.address);
      expect(shareholder_c).to.deep.equal([0n, 0n, 0n, false]);

    });

    it("Should distribute dividends multiple times", async function () {
      const { equity, struct, owner, test_a, test_b, test_c } = await loadFixture(deployFixture);

      // Update shareholder information and set their equity distribution ratio.
      // await equity.updateShareholders([test_a.address, test_b.address], [2,3], 1)
      const equity_balance = await ethers.provider.getBalance(equity.target);
      expect(equity_balance).to.equal(0);
      
      // Pay some Ether to the contract.
      const pay_amount = 100;
      await owner.sendTransaction({
        to: equity.target,
        value: pay_amount // ethers.parseEther("100.0"), // Sends exactly 1.0 ether
      });
      // Check contract balance.
      expect(await ethers.provider.getBalance(equity.target)).to.equal(pay_amount);

      // Test second dividend distribution.
      const pay_amount_2 = 100;
      await owner.sendTransaction({
        to: equity.target,
        value: pay_amount_2 
      });
      // Check contract balance.
      expect(await ethers.provider.getBalance(equity.target)).to.equal(pay_amount + pay_amount_2);

      // Update shareholder information and set their equity distribution ratio.
      await struct.updateEquityStructure([test_a.address, test_b.address, test_c.address], [2,1,2])
      
      // Test third dividend distribution.
      const pay_amount_3 = 100;
      await owner.sendTransaction({
        to: equity.target,
        value: pay_amount_3 
      });
      // Check total shares.
      expect(await equity.totalShares()).to.equal(5);
      // Check total dividend amount.
      expect(await equity.totalDividend()).to.equal(300);
      // Check current shares version .
      expect(await equity.lastSharesVersion()).to.equal(2);

      // Check contract balance.
      expect(await ethers.provider.getBalance(equity.target)).to.equal(pay_amount + pay_amount_2 + pay_amount_3);

      // Check shareholder balance.
      shareholder_a = await equity.shareholders(test_a.address);
      // console.log(shareholder_a);
      expect(shareholder_a).to.deep.equal([2n, 120n, 0n, true]);

      shareholder_b = await equity.shareholders(test_b.address);
      // console.log(shareholder_b);
      expect(shareholder_b).to.deep.equal([1n, 140n, 0n, true]);

      shareholder_c = await equity.shareholders(test_c.address);
      // console.log(shareholder_c);
      expect(shareholder_c).to.deep.equal([2n, 40n, 0n, true]);

      expect(await equity.totalWithdrawnFunds()).to.equal(0);

    });

    it("Test withdraw dividends", async function () {

      const { equity, struct, owner, test_a, test_b, test_c } = await loadFixture(deployFixture);
      // await equity.updateShareholders([test_a.address, test_b.address], [2,3], 1)
      const pay_amount = 100;
      await owner.sendTransaction({
        to: equity.target,
        value: pay_amount // ethers.parseEther("100.0"), // Sends exactly 1.0 ether
      });

      expect(await equity.totalDividend()).to.equal(100);
      expect(await equity.totalWithdrawnFunds()).to.equal(0);

      
      // Check state before withdraw.
      shareholder_a = await equity.shareholders(test_a.address);
      expect(shareholder_a).to.deep.equal([2n, 40n, 0n, true]);
      // Check test_a balance 
      expect(await ethers.provider.getBalance(test_a.address)).to.equal(10000000000000000000000n);
      // Withdraw dividend for test_a.
      await equity.withdrawDividends(test_a.address);
      
      // Check state after withdraw.
      shareholder_a = await equity.shareholders(test_a.address);
      expect(shareholder_a).to.deep.equal([2n, 0n, 40n, true]);
      // Check test_a balance 
      expect(await ethers.provider.getBalance(test_a.address)).to.equal(10000000000000000000040n);
      // Check total dividend amount.
      expect(await equity.totalDividend()).to.equal(100);
      // Check total withdrawn funds.
      expect(await equity.totalWithdrawnFunds()).to.equal(40);

      // Continue with a transfer of 100
      await owner.sendTransaction({
        to: equity.target,
        value: pay_amount // ethers.parseEther("100.0"), // Sends exactly 1.0 ether
      });

      // Check state before withdraw.
      shareholder_a = await equity.shareholders(test_a.address);
      expect(shareholder_a).to.deep.equal([2n, 40n, 40n, true]);
      shareholder_b = await equity.shareholders(test_b.address);
      expect(shareholder_b).to.deep.equal([3n, 120n, 0n, true]);

      
      // Check test_a balance
      await equity.withdrawDividends(test_a.address);
      // Check state after withdraw.
      shareholder_a = await equity.shareholders(test_a.address);
      expect(shareholder_a).to.deep.equal([2n, 0n, 80n, true]);
      expect(await ethers.provider.getBalance(test_a.address)).to.equal(10000000000000000000080n);
      // Check test_b balance
      expect(await ethers.provider.getBalance(test_b.address)).to.equal(10000000000000000000000n);
      // Check total dividend amount.
      expect(await equity.totalDividend()).to.equal(200);
      // Check total withdrawn funds.
      expect(await equity.totalWithdrawnFunds()).to.equal(80);


      // Change shareholder information.
      await struct.updateEquityStructure([test_a.address, test_b.address, test_c.address], [2,0,2])
      // Continue with a transfer of 100
      await owner.sendTransaction({
        to: equity.target,
        value: pay_amount // ethers.parseEther("100.0"), // Sends exactly 1.0 ether
      });
      // Check state before withdraw.
      shareholder_a = await equity.shareholders(test_a.address);
      expect(shareholder_a).to.deep.equal([2n, 50n, 80n, true]);
      shareholder_b = await equity.shareholders(test_b.address);
      expect(shareholder_b).to.deep.equal([0n, 120n, 0n, true]);
      shareholder_c = await equity.shareholders(test_c.address);
      expect(shareholder_c).to.deep.equal([2n, 50n, 0n, true]);

      // Test_b withdraw his dividend.
      await equity.withdrawDividends(test_b.address);
      // Check state after withdraw.
      shareholder_b = await equity.shareholders(test_b.address);
      expect(shareholder_b).to.deep.equal([0n, 0n, 120n, true]);
      expect(await ethers.provider.getBalance(test_b.address)).to.equal(10000000000000000000120n);

    });

    // Shareholder does not exist
    it("Exception testing, Shareholder does not exist", async function () {

      const { equity, owner, test_a, test_b }  = await loadFixture(deployFixture);
      
      // If shareholder has no funds available, he can't withdraw.
      // await equity.updateShareholders([test_a.address, test_b.address], [2,3], 1)
      await expect(equity.withdrawDividends(owner.address)).to.be.revertedWith("Shareholder does not exist");

    });

    it("Exception testing, No dividends to withdraw", async function () {

      const { equity, test_a, test_b } = await loadFixture(deployFixture);
      
      // If shareholder has no funds available, he can't withdraw.
      // await equity.updateShareholders([test_a.address, test_b.address], [2,3], 1)
      await expect(equity.withdrawDividends(test_a.address)).to.be.revertedWith("No dividends to withdraw");

    });


  });

});
