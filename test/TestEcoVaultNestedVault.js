const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, assert } = require("chai");
const { json } = require("hardhat/internal/core/params/argumentTypes");

describe("TestEcoVault", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, test_a, test_b, test_c, test_d, test_e, test_f] = await ethers.getSigners();

    const Structre = await ethers.getContractFactory("TestEquityStructure");
    const struct = await Structre.deploy(0, [test_a.address, test_b.address], [2, 3]);

    // Create erc20 token for test.
    const TestToken = await ethers.getContractFactory("TestToken");
    const ttk0 = await TestToken.deploy(TestToken, "TTK0");

    const Equity = await ethers.getContractFactory("EcoDividendDistribution");
    const equity_proxy = await upgrades.deployProxy(Equity, [struct.address], { initializer: 'initialize' });
    await equity_proxy.deployed();


    const EcoVault = await ethers.getContractFactory("EcoVault");

    const vault0 = await upgrades.deployProxy(EcoVault, [equity_proxy.address, owner.address], { initializer: 'initialize' });
    await vault0.deployed();
    await equity_proxy.registerSid(0, vault0.address);

    const vault2 = await upgrades.deployProxy(EcoVault, [equity_proxy.address, owner.address], { initializer: 'initialize' });
    await vault2.deployed();
    await equity_proxy.registerSid(1, vault2.address);

    // The vault0 catch some shares of sid=1, so the vault0 will get some token when sid=1 distribute.
    // This struct is a tree struct, the vault1 is the root node, the vault0 is the sub node.
    // So you can try to transfer some token to vault1, and then distribute the token, the vault0 will get some token when distribute.
    struct.updateEquityStructure(1, [test_c.address, test_d.address, vault0.address], [2, 2, 6]);

    // Test1155NFT
    const Test1155NFT = await ethers.getContractFactory("Test1155NFT");
    const nft1155 = await Test1155NFT.deploy();

    return { vault0, vault2, equity: equity_proxy, struct, owner, test_a, test_b, test_c, test_d, test_e, test_f, ttk0, nft1155};
  }

  describe("Test Equity", function () {

    it("Test nested vault tree.", async function () {

      const { vault0, vault2, equity, struct, owner, test_a, test_b, test_c, test_d, test_e, test_f, ttk0, } = await loadFixture(deployFixture);

      // deposit 100 TTK0.
      const sid = 1;
      const pay_amount0 = ethers.utils.parseEther("100.0");
      await ttk0.transfer(vault2.address, pay_amount0);

      // await ttk0.approve(vault0.address, pay_amount0);
      // await ttk0.approve(vault2.address, pay_amount0);
      // await vault2.depositErc20(ttk0.address, pay_amount0);
      expect(await vault0.getAllInVaultBalance(ttk0.address)).to.equal(0);
      expect(await vault2.getAllInVaultBalance(ttk0.address)).to.equal(pay_amount0);
      expect(await ethers.provider.getBalance(vault2.address)).to.equal(0);

      expect(await ttk0.balanceOf(vault2.address)).to.equal(pay_amount0);
      expect(await ttk0.balanceOf(test_a.address)).to.equal(0);
      expect(await ttk0.balanceOf(test_b.address)).to.equal(0);
      expect(await ttk0.balanceOf(test_c.address)).to.equal(0);
      expect(await ttk0.balanceOf(test_d.address)).to.equal(0);
      expect(await ttk0.balanceOf(vault0.address)).to.equal(0);

      expect(await equity.getShareholdersList(0, ttk0.address, test_a.address)).to.deep.equal([2, true, 0n, BigInt(0)]);
      expect(await equity.getShareholdersList(0, ttk0.address, test_b.address)).to.deep.equal([3, true, 0n, BigInt(0)]);
      expect(await equity.getShareholdersList(1, ttk0.address, test_c.address)).to.deep.equal([0, false, 0n, BigInt(0)]);
      expect(await equity.getShareholdersList(1, ttk0.address, test_d.address)).to.deep.equal([0, false, 0n, BigInt(0)]);
      expect(await equity.getShareholdersList(1, ttk0.address, vault0.address)).to.deep.equal([0, false, 0n, BigInt(0)]);

      await vault2.recordForDividends(ttk0.address);

      expect(await equity.getShareholdersList(0, ttk0.address, test_a.address)).to.deep.equal([2, true, 0n, BigInt(0)]);
      expect(await equity.getShareholdersList(0, ttk0.address, test_b.address)).to.deep.equal([3, true, 0n, BigInt(0)]);
      expect(await equity.getShareholdersList(1, ttk0.address, test_c.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount0) * 2n / 10n]);
      expect(await equity.getShareholdersList(1, ttk0.address, test_d.address)).to.deep.equal([2n, true, 0n, BigInt(pay_amount0) * 2n / 10n]);
      expect(await equity.getShareholdersList(1, ttk0.address, vault0.address)).to.deep.equal([6n, true, 0n, BigInt(pay_amount0) * 6n / 10n]);

      expect(await ttk0.balanceOf(vault0.address)).to.equal(0);
      // Widthdraw vault0 token
      await equity.withdrawDividends(sid, ttk0.address, vault0.address);
      const vault0_withdraw_balance = BigInt(pay_amount0) * 6n / 10n;
      expect(await ttk0.balanceOf(vault0.address)).to.equal(vault0_withdraw_balance);

      await vault0.recordForDividends(ttk0.address);

      expect(await equity.getShareholdersList(0, ttk0.address, test_a.address)).to.deep.equal([2, true, 0n, BigInt(vault0_withdraw_balance) * 2n / 5n]);
      expect(await equity.getShareholdersList(0, ttk0.address, test_b.address)).to.deep.equal([3, true, 0n, BigInt(vault0_withdraw_balance) * 3n / 5n]);
      expect(await equity.getShareholdersList(1, ttk0.address, test_c.address)).to.deep.equal([2, true, 0n, BigInt(pay_amount0) * 2n / 10n]);
      expect(await equity.getShareholdersList(1, ttk0.address, test_d.address)).to.deep.equal([2, true, 0n, BigInt(pay_amount0) * 2n / 10n]);
      expect(await equity.getShareholdersList(1, ttk0.address, vault0.address)).to.deep.equal([6, true, vault0_withdraw_balance, 0n]);

    });

    it("Test transfer more nft from sid-1 to sid-0", async function () {

      const { vault0, vault2, equity, struct, owner, test_a, test_b, test_c, test_d, test_e, test_f, ttk0, nft1155, } = await loadFixture(deployFixture);

      // before check vault2 has 0 nft.
      expect(await nft1155.balanceOf(vault2.address, 0)).to.equal(0);

      await nft1155.safeTransferFrom(owner.address, vault2.address, 0, 10, "0x");

      // after check vault2 has 10 nft.
      expect(await nft1155.balanceOf(vault2.address, 0)).to.equal(10);

      // set vault assign account
      await vault2.setAssignAccount(test_a.address);
      
      // Use assign account to transfer nft to testb.
      await vault2.connect(test_a).transferERC1155(nft1155.address, test_b.address, 0, 5, "0x");

      // Check after transfer nft, vault2 has 5 nft.
      expect(await nft1155.balanceOf(vault2.address, 0)).to.equal(5);
      expect(await nft1155.balanceOf(test_b.address, 0)).to.equal(5);

      // set vault assign account to test_d
      await vault2.connect(test_a).setAssignAccount(test_d.address);

      // Use assign account to transfer nft to test_e.
      await vault2.connect(test_d).transferERC1155(nft1155.address, test_e.address, 0, 2, "0x");

      // Check after transfer nft, vault2 has 3 nft.
      expect(await nft1155.balanceOf(vault2.address, 0)).to.equal(3);
      expect(await nft1155.balanceOf(test_e.address, 0)).to.equal(2);
      expect(await nft1155.balanceOf(test_b.address, 0)).to.equal(5);

    });

    

  });

});
