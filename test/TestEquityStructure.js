const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { json } = require("hardhat/internal/core/params/argumentTypes");

describe("TestEquityStructure", function () {
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

    const EquityStructre = await ethers.getContractFactory("TestEquityStructure");
    const equity = await EquityStructre.deploy([test_a.address, test_b.address], [2, 3]);

    return { equity, owner, test_a, test_b, test_c };
  }

  describe("Test Datas", function () {
    it("Test construct datas.", async function () {
      const { equity, owner, test_a, test_b, test_c } = await loadFixture(deployFixture);

      expect(await equity.getEquityVersion()).to.equal(1);
      const [payees, shares] = await equity.getEquityStructure()

      expect(payees.length).to.equal(2);
      expect(payees[0]).to.equal(test_a.address);
      expect(payees[1]).to.equal(test_b.address);
      expect(shares.length).to.equal(2);
      expect(shares[0]).to.equal(2);
      expect(shares[1]).to.equal(3);

    });

    it("Test update datas.", async function () {
      const { equity, owner, test_a, test_b, test_c } = await loadFixture(deployFixture);
      await equity.updateEquityStructure([test_a.address, test_b.address, test_c.address], [1, 2, 3])
      expect(await equity.getEquityVersion()).to.equal(2);
      const [payees, shares] = await equity.getEquityStructure()

      expect(payees.length).to.equal(3);
      expect(payees[0]).to.equal(test_a.address);
      expect(payees[1]).to.equal(test_b.address);
      expect(payees[2]).to.equal(test_c.address);
      expect(shares.length).to.equal(3);
      expect(shares[0]).to.equal(1);
      expect(shares[1]).to.equal(2);
      expect(shares[2]).to.equal(3);

    });

  });

});
