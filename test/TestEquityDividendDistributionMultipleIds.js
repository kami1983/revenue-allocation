const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat")

describe("TestEquityDividendDistribution", function () {

  async function deployFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, test_a, test_b, test_c, test_d, test_e, test_f] = await ethers.getSigners();

    const Structre = await ethers.getContractFactory("TestEquityStructure");
    const struct = await Structre.deploy(0, [test_a.address, test_b.address], [2, 3]);
    struct.updateEquityStructure(2, [test_b.address, test_c.address, test_d.address], [2,2,6]);
    struct.updateEquityStructure(4, [test_d.address, test_e.address, test_f.address], [1,1,1]);

    const Equity = await ethers.getContractFactory("EquityDividendDistribution");
    const equity = await Equity.deploy(struct.target);
    await equity.registerSid(0, test_c.address);
    await equity.registerSid(2, test_c.address);
    await equity.registerSid(4, test_c.address);

    return { equity, struct, owner, test_a, test_b, test_c, test_d, test_e, test_f };
  }

  describe("Test Dividend Distribution", function () {

    it("Test construct datas sid = 0.", async function () {
      const { equity, struct, owner, test_a, test_b, test_c, test_d, test_e, test_f } = await loadFixture(deployFixture);

      const sid = 0;
      // Check total shares.
      expect(await equity.getTotalShares(sid)).to.equal(5);
      // Check total dividend amount.
      expect(await equity.getTotalDividend(sid)).to.equal(0);
      // Check current shares version .
      expect(await equity.getLastSharesVersion(sid)).to.equal(1);

      // Get all shareholder addresses from contract.
      const shareholder_addresses = await equity.getAllShareholders(sid);
      expect(shareholder_addresses.length).to.equal(2);
      expect(shareholder_addresses[0]).to.equal(test_a.address);
      expect(shareholder_addresses[1]).to.equal(test_b.address);

    });

    it("Test construct datas sid = 2.", async function () {
      const { equity, struct, owner, test_a, test_b, test_c, test_d, test_e, test_f } = await loadFixture(deployFixture);

      const sid = 2
      // Check total shares.
      expect(await equity.getTotalShares(sid)).to.equal(10);
      // Check total dividend amount.
      expect(await equity.getTotalDividend(sid)).to.equal(0);
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
      const { equity, struct, owner, test_a, test_b, test_c, test_d, test_e, test_f } = await loadFixture(deployFixture);

      const sid = 4;
      // Check total shares.
      expect(await equity.getTotalShares(sid)).to.equal(3);
      // Check total dividend amount.
      expect(await equity.getTotalDividend(sid)).to.equal(0);
      // Check current shares version .
      expect(await equity.getLastSharesVersion(sid)).to.equal(1);

      // Get all shareholder addresses from contract.
      const shareholder_addresses = await equity.getAllShareholders(sid);
      expect(shareholder_addresses.length).to.equal(3);
      expect(shareholder_addresses[0]).to.equal(test_d.address);
      expect(shareholder_addresses[1]).to.equal(test_e.address);
      expect(shareholder_addresses[2]).to.equal(test_f.address);

    });

    // 

  });

});
