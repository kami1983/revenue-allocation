const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat")

describe("TestEcoDividendDistribution", function () {

  async function deployFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, test_a, test_b, test_c, test_d, test_e, test_f] = await ethers.getSigners();

    const Structre = await ethers.getContractFactory("TestEquityStructure");
    const struct = await Structre.deploy(0, [test_a.address, test_b.address], [2, 3]);

    struct.updateEquityStructure(2, [test_b.address, test_c.address, test_d.address], [2,2,6]);
    struct.updateEquityStructure(4, [test_d.address, test_e.address, test_f.address], [1,1,1]);

    const Equity = await ethers.getContractFactory("EcoDividendDistribution");
    // const equity = await Equity.deploy(struct.address);

    const equity_proxy = await upgrades.deployProxy(Equity, [struct.address], { initializer: 'initialize' });
    await equity_proxy.deployed();


    const EcoVault = await ethers.getContractFactory("EcoVault");
    
    const vault0 = await upgrades.deployProxy(EcoVault, [equity_proxy.address, owner.address], { initializer: 'initialize' });
    await vault0.deployed();
    await equity_proxy.registerSid(0, vault0.address);

    const vault2 = await upgrades.deployProxy(EcoVault, [equity_proxy.address, owner.address], { initializer: 'initialize' });
    await vault2.deployed();
    await equity_proxy.registerSid(2, vault2.address);

    const vault4 = await upgrades.deployProxy(EcoVault, [equity_proxy.address, owner.address], { initializer: 'initialize' });
    await vault4.deployed();
    await equity_proxy.registerSid(4, vault4.address);

    // Create some ERC20 tokens.
    const TestToken = await ethers.getContractFactory("TestToken");
    const ttk0 = await TestToken.deploy(TestToken, "TTK0");
    const ttk1 = await TestToken.deploy(TestToken, "TTK1");
    const ttk2 = await TestToken.deploy(TestToken, "TTK2");

    return { vault0, vault2, vault4, equity: equity_proxy, struct, owner, test_a, test_b, test_c, test_d, test_e, test_f, ttk0, ttk1, ttk2 };
  }

  describe("Test Dividend Distribution", function () {

    it("Test construct datas sid = 0.", async function () {
      const { equity, struct, owner, test_a, test_b, test_c, test_d, test_e, test_f, vault0, vault2, vault4 } = await loadFixture(deployFixture);

      const sid = 0;
      // Check total shares.
      expect(await equity.getTotalShares(sid)).to.equal(5);
      // Check total dividend amount.
      expect(await vault0.getAllInVaultBalance(ethers.constants.AddressZero)).to.equal(0);
      // Check current shares version .
      expect(await equity.getLastSharesVersion(sid)).to.equal(1);

      // Get all shareholder addresses from contract.
      const shareholder_addresses = await equity.getAllShareholders(sid);
      expect(shareholder_addresses.length).to.equal(2);
      expect(shareholder_addresses[0]).to.equal(test_a.address);
      expect(shareholder_addresses[1]).to.equal(test_b.address);

    });

    it("Test construct datas sid = 2.", async function () {
      const { equity, struct, owner, test_a, test_b, test_c, test_d, test_e, test_f, vault0, vault2, vault4, } = await loadFixture(deployFixture);

      const sid = 2
      // Check total shares.
      expect(await equity.getTotalShares(sid)).to.equal(10);
      // Check total dividend amount.
      expect(await vault2.inVaultBalanceList(ethers.constants.AddressZero)).to.equal(0);
      // Check current shares version .
      expect(await equity.getLastSharesVersion(sid)).to.equal(1);

      // Get all shareholder addresses from contract.
      const shareholder_addresses = await equity.getAllShareholders(sid);
      expect(shareholder_addresses.length).to.equal(3);
      expect(shareholder_addresses[0]).to.equal(test_b.address);
      expect(shareholder_addresses[1]).to.equal(test_c.address);
      expect(shareholder_addresses[2]).to.equal(test_d.address);

    });

    it("Test construct datas sid = 4.", async function () {
      const { equity, struct, owner, test_a, test_b, test_c, test_d, test_e, test_f, vault0, vault2, vault4, } = await loadFixture(deployFixture);

      const sid = 4;
      // Check total shares.
      expect(await equity.getTotalShares(sid)).to.equal(3);
      // Check total dividend amount.
      expect(await vault4.inVaultBalanceList(ethers.constants.AddressZero)).to.equal(0);
      // Check current shares version .
      expect(await equity.getLastSharesVersion(sid)).to.equal(1);

      // Get all shareholder addresses from contract.
      const shareholder_addresses = await equity.getAllShareholders(sid);
      expect(shareholder_addresses.length).to.equal(3);
      expect(shareholder_addresses[0]).to.equal(test_d.address);
      expect(shareholder_addresses[1]).to.equal(test_e.address);
      expect(shareholder_addresses[2]).to.equal(test_f.address);

    });

    it("Test deposit mulitable asset.", async function () {
      const { equity, owner, ttk0, ttk1, ttk2, vault0, vault2, vault4, test_b, test_c, test_d } = await loadFixture(deployFixture);

      // deposit 100 TTK0.
      const pay_amount0 = ethers.utils.parseEther("100.0");
      await ttk0.transfer(vault2.address, pay_amount0);

      // await ttk0.approve(vault0.address, pay_amount0);
      // await ttk0.approve(vault2.address, pay_amount0);
      // await vault2.depositErc20(ttk0.address, pay_amount0);
      expect(await vault2.getAllInVaultBalance(ttk0.address)).to.equal(pay_amount0);
      expect(await ethers.provider.getBalance(vault2.address)).to.equal(0);
      expect(await ttk0.balanceOf(vault2.address)).to.equal(pay_amount0);

      await vault2.recordForDividends(ttk0.address);

      // deposit 200 TTK1.
      const pay_amount1 = ethers.utils.parseEther("200.0");
      await ttk1.transfer(vault2.address, pay_amount1);
      // await ttk1.approve(vault2.address, pay_amount1);
      // await vault2.depositErc20(ttk1.address, pay_amount1);
      expect(await vault2.getAllInVaultBalance(ttk1.address)).to.equal(pay_amount1);
      expect(await ethers.provider.getBalance(vault2.address)).to.equal(0);
      expect(await ttk1.balanceOf(vault2.address)).to.equal(pay_amount1);  

      await vault2.recordForDividends(ttk1.address);

      // deposit 300 TTK2.
      const pay_amount2 = ethers.utils.parseEther("300.0");
      await ttk2.transfer(vault2.address, pay_amount2);
      // await ttk2.approve(vault2.address, pay_amount2);
      // await vault2.depositErc20(ttk2.address, pay_amount2);
      expect(await vault2.getAllInVaultBalance(ttk2.address)).to.equal(pay_amount2);
      expect(await ethers.provider.getBalance(vault2.address)).to.equal(0);
      expect(await ttk2.balanceOf(vault2.address)).to.equal(pay_amount2);

      await vault2.recordForDividends(ttk2.address);

      // deposit 400 native token.
      const pay_amount3 = ethers.utils.parseEther("500.0");
      await owner.sendTransaction({
          to: vault2.address,
          value: pay_amount3 
      });
      // Check vault contract balance.
      expect(await ethers.provider.getBalance(vault2.address)).to.equal(pay_amount3);

      await vault2.recordForDividends(ethers.constants.AddressZero);

      // Verify vault contract data.
      expect(await vault2.getAllInVaultBalance(ttk0.address)).to.equal(pay_amount0);
      expect(await vault2.getAllInVaultBalance(ttk1.address)).to.equal(pay_amount1);
      expect(await vault2.getAllInVaultBalance(ttk2.address)).to.equal(pay_amount2);
      expect(await vault2.getAllInVaultBalance(ethers.constants.AddressZero)).to.equal(pay_amount3);

      expect(await vault2.outVaultBalanceList(ttk0.address)).to.equal(0);
      expect(await vault2.outVaultBalanceList(ttk1.address)).to.equal(0);
      expect(await vault2.outVaultBalanceList(ttk2.address)).to.equal(0);
      expect(await vault2.outVaultBalanceList(ethers.constants.AddressZero)).to.equal(0);

      // Verify equity contract dividend amount. getShareholdersList
      // Get sid =2 
      const sid = await equity.balanceSidList(vault2.address);
      expect(sid).to.equal(2);

      const base_amount = ethers.utils.parseEther("10000.0");

      expect(await equity.getShareholdersList(sid, ttk0.address, test_b.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount0) * 2n / 10n]);
      expect(await equity.getShareholdersList(sid, ttk0.address, test_c.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount0) * 2n / 10n]);
      expect(await equity.getShareholdersList(sid, ttk0.address, test_d.address)).to.deep.equal([6n, true, 0n, BigInt(pay_amount0) * 6n / 10n]);
      expect(await ttk0.balanceOf(test_b.address)).to.equal(0);
      expect(await ttk0.balanceOf(test_c.address)).to.equal(0);
      expect(await ttk0.balanceOf(test_d.address)).to.equal(0);

      expect(await equity.getShareholdersList(sid, ttk1.address, test_b.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount1) * 2n / 10n]);
      expect(await equity.getShareholdersList(sid, ttk1.address, test_c.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount1) * 2n / 10n]);
      expect(await equity.getShareholdersList(sid, ttk1.address, test_d.address)).to.deep.equal([6n, true, 0n, BigInt(pay_amount1) * 6n / 10n]);
      expect(await ttk1.balanceOf(test_b.address)).to.equal(0);
      expect(await ttk1.balanceOf(test_c.address)).to.equal(0);
      expect(await ttk1.balanceOf(test_d.address)).to.equal(0);

      expect(await equity.getShareholdersList(sid, ttk2.address, test_b.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount2) * 2n / 10n]);
      expect(await equity.getShareholdersList(sid, ttk2.address, test_c.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount2) * 2n / 10n]);
      expect(await equity.getShareholdersList(sid, ttk2.address, test_d.address)).to.deep.equal([6n, true, 0n, BigInt(pay_amount2) * 6n / 10n]);
      expect(await ttk2.balanceOf(test_b.address)).to.equal(0);
      expect(await ttk2.balanceOf(test_c.address)).to.equal(0);
      expect(await ttk2.balanceOf(test_d.address)).to.equal(0);

      expect(await equity.getShareholdersList(sid, ethers.constants.AddressZero, test_b.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount3) * 2n / 10n]);
      expect(await equity.getShareholdersList(sid, ethers.constants.AddressZero, test_c.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount3) * 2n / 10n]);
      expect(await equity.getShareholdersList(sid, ethers.constants.AddressZero, test_d.address)).to.deep.equal([6n, true, 0n, BigInt(pay_amount3) * 6n / 10n]);
      expect(await ethers.provider.getBalance(test_b.address)).to.equal(base_amount);
      expect(await ethers.provider.getBalance(test_c.address)).to.equal(base_amount);
      expect(await ethers.provider.getBalance(test_d.address)).to.equal(base_amount);

      // Withdraw all tokens.
      await equity.withdrawDividends(sid, ttk0.address, test_b.address);
      await equity.withdrawDividends(sid, ttk0.address, test_c.address);
      await equity.withdrawDividends(sid, ttk0.address, test_d.address);

      await equity.withdrawDividends(sid, ttk1.address, test_b.address);
      await equity.withdrawDividends(sid, ttk1.address, test_c.address);
      await equity.withdrawDividends(sid, ttk1.address, test_d.address);

      await equity.withdrawDividends(sid, ttk2.address, test_b.address);
      await equity.withdrawDividends(sid, ttk2.address, test_c.address);
      await equity.withdrawDividends(sid, ttk2.address, test_d.address);

      await equity.withdrawDividends(sid, ethers.constants.AddressZero, test_b.address);
      await equity.withdrawDividends(sid, ethers.constants.AddressZero, test_c.address);
      await equity.withdrawDividends(sid, ethers.constants.AddressZero, test_d.address);

      // Check vault contract balance.
      expect(await ethers.provider.getBalance(vault2.address)).to.equal(0);
      expect(await ttk0.balanceOf(vault2.address)).to.equal(0);
      expect(await ttk1.balanceOf(vault2.address)).to.equal(0);
      expect(await ttk2.balanceOf(vault2.address)).to.equal(0);

      expect(await equity.getShareholdersList(sid, ttk0.address, test_b.address)).to.deep.equal([2n, true, BigInt(pay_amount0) * 2n / 10n, 0n]);
      expect(await equity.getShareholdersList(sid, ttk0.address, test_c.address)).to.deep.equal([2n, true, BigInt(pay_amount0) * 2n / 10n, 0n]);
      expect(await equity.getShareholdersList(sid, ttk0.address, test_d.address)).to.deep.equal([6n, true, BigInt(pay_amount0) * 6n / 10n, 0n]);
      expect(await ttk0.balanceOf(test_b.address)).to.equal(BigInt(pay_amount0) * 2n / 10n);
      expect(await ttk0.balanceOf(test_c.address)).to.equal(BigInt(pay_amount0) * 2n / 10n);
      expect(await ttk0.balanceOf(test_d.address)).to.equal(BigInt(pay_amount0) * 6n / 10n);

      expect(await equity.getShareholdersList(sid, ttk1.address, test_b.address)).to.deep.equal([2n, true, BigInt(pay_amount1) * 2n / 10n, 0n]);
      expect(await equity.getShareholdersList(sid, ttk1.address, test_c.address)).to.deep.equal([2n, true, BigInt(pay_amount1) * 2n / 10n, 0n]);
      expect(await equity.getShareholdersList(sid, ttk1.address, test_d.address)).to.deep.equal([6n, true, BigInt(pay_amount1) * 6n / 10n, 0n]);
      expect(await ttk1.balanceOf(test_b.address)).to.equal(BigInt(pay_amount1) * 2n / 10n);
      expect(await ttk1.balanceOf(test_c.address)).to.equal(BigInt(pay_amount1) * 2n / 10n);
      expect(await ttk1.balanceOf(test_d.address)).to.equal(BigInt(pay_amount1) * 6n / 10n);

      expect(await equity.getShareholdersList(sid, ttk2.address, test_b.address)).to.deep.equal([2n, true, BigInt(pay_amount2) * 2n / 10n, 0n]);
      expect(await equity.getShareholdersList(sid, ttk2.address, test_c.address)).to.deep.equal([2n, true, BigInt(pay_amount2) * 2n / 10n, 0n]);
      expect(await equity.getShareholdersList(sid, ttk2.address, test_d.address)).to.deep.equal([6n, true, BigInt(pay_amount2) * 6n / 10n, 0n]);
      expect(await ttk2.balanceOf(test_b.address)).to.equal(BigInt(pay_amount2) * 2n / 10n);
      expect(await ttk2.balanceOf(test_c.address)).to.equal(BigInt(pay_amount2) * 2n / 10n);
      expect(await ttk2.balanceOf(test_d.address)).to.equal(BigInt(pay_amount2) * 6n / 10n);

      expect(await equity.getShareholdersList(sid, ethers.constants.AddressZero, test_b.address)).to.deep.equal([2n, true, BigInt(pay_amount3) * 2n / 10n, 0n]);
      expect(await equity.getShareholdersList(sid, ethers.constants.AddressZero, test_c.address)).to.deep.equal([2n, true, BigInt(pay_amount3) * 2n / 10n, 0n]);
      expect(await equity.getShareholdersList(sid, ethers.constants.AddressZero, test_d.address)).to.deep.equal([6n, true, BigInt(pay_amount3) * 6n / 10n, 0n]);
      expect(await ethers.provider.getBalance(test_b.address)).to.equal(BigInt(base_amount) + BigInt(pay_amount3) * 2n / 10n);
      expect(await ethers.provider.getBalance(test_c.address)).to.equal(BigInt(base_amount) + BigInt(pay_amount3) * 2n / 10n);
      expect(await ethers.provider.getBalance(test_d.address)).to.equal(BigInt(base_amount) + BigInt(pay_amount3) * 6n / 10n);

    });

    it("Test assign account shares", async function () {
      const { equity, struct, owner, test_a, test_b, test_c, test_d, test_e, test_f, vault0, vault2, vault4, ttk0, ttk1,} = await loadFixture(deployFixture);

      const pay_amount0 = ethers.utils.parseEther("100.0");
      await ttk0.transfer(vault2.address, pay_amount0);

      expect(await vault2.getAllInVaultBalance(ttk0.address)).to.equal(pay_amount0);
      expect(await ttk0.balanceOf(vault2.address)).to.equal(pay_amount0);

      await vault2.recordForDividends(ttk0.address);

      expect(await equity.getShareholdersList(2, ttk0.address, test_b.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount0) * 2n / 10n]);
      expect(await equity.getShareholdersList(2, ttk0.address, test_c.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount0) * 2n / 10n]);
      expect(await equity.getShareholdersList(2, ttk0.address, test_d.address)).to.deep.equal([6n, true, 0n, BigInt(pay_amount0) * 6n / 10n]);

      // Assign account shares.
      await vault2.setAssignAccount(test_d.address);

      await ttk1.transfer(vault2.address, pay_amount0);
      expect(await ttk1.balanceOf(vault2.address)).to.equal(pay_amount0);

      await vault2.recordForDividends(ttk1.address);

      expect(await equity.getShareholdersList(2, ttk1.address, test_b.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount0) * 2n / 4n]);
      expect(await equity.getShareholdersList(2, ttk1.address, test_c.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount0) * 2n / 4n]);
      expect(await equity.getShareholdersList(2, ttk1.address, test_d.address)).to.deep.equal([6n, true, 0n, 0]);

      // Get total shares.
      expect(await equity.getTotalShares(2)).to.equal(10);
      expect(await equity.getAssignAccountShares(2)).to.equal(6);
      expect(await equity.getAssignAccountBySid(2)).to.equal(test_d.address);

    });
    
  });

});
