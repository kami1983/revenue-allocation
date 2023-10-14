const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect, assert } = require("chai");
  const { json } = require("hardhat/internal/core/params/argumentTypes");
  
  describe("TestEquityVault", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployFixture() {
      // Contracts are deployed using the first signer/account by default
      const [owner, test_a, test_b, test_c] = await ethers.getSigners();

      // Create a ERC20 token named TestToken with symbol TT.
      const TestToken = await ethers.getContractFactory("TestToken");
      const ttk = await TestToken.deploy("TestToken", "TT");

      const TestEquityDividendDistribution = await ethers.getContractFactory("TestEquityDividendDistribution");
      const equity = await TestEquityDividendDistribution.deploy();
  
      const EquityVault = await ethers.getContractFactory("EquityVault");
      const vault = await EquityVault.deploy(equity.target);
  
      return { vault, equity, ttk, owner, test_a, test_b, test_c };
    }
  
    describe("Test Equity", function () {
      
      it("Send native coins to vault contract to test whether the IEquityDividendDistribution interface is correctly.", async function () {

        const { vault, equity, owner, test_a, test_b, test_c } = await loadFixture(deployFixture);
        
        const test_a_balance = await ethers.provider.getBalance(test_a.address);
        console.log("test_a_balance: ", test_a_balance.toString());

        const pay_amount = ethers.parseEther("100.0");
        const tx = await test_a.sendTransaction({
            to: vault.target,
            value: pay_amount // ethers.parseEther("100.0"), // Sends exactly 1.0 ether
        });
        const receipt = await tx.wait();
        const gas_fee = receipt.gasUsed * tx.gasPrice;

        console.log("tx - gas fee: ",gas_fee, pay_amount);

        // Check vault contract balance.
        expect(await ethers.provider.getBalance(vault.target)).to.equal(pay_amount);

        // Check equity contract balance.
        expect(await equity.inVaultBalanceList(ethers.ZeroAddress)).to.equal(pay_amount);

        // Get after test_a balance.
        const after_test_a_balance = await ethers.provider.getBalance(test_a.address);

        // 
        expect(after_test_a_balance).to.equal(test_a_balance - BigInt(pay_amount) - gas_fee);
  
      });

      it("Send ERC20 coins to vault contract to test whether the IEquityDividendDistribution interface is correctly.", async function () {

        const { vault, owner, equity, ttk } = await loadFixture(deployFixture);
        
        const pay_amount = ethers.parseEther("100.0");;

        // Get ERC20 token balance of owner.
        const owner_balance = await ttk.balanceOf(owner.address);

        // approve vault contract to transfer ERC20 coins.
        await ttk.approve(vault.target, pay_amount);
        await vault.depositErc20(ttk.target, pay_amount);

        // Check equity contract balance.
        expect(await equity.inVaultBalanceList(ttk.target)).to.equal(pay_amount);

        // Check ERC20 token balance of vault.
        expect(await ttk.balanceOf(vault.target)).to.equal(pay_amount);

        // after test owner balance.
        expect(await ttk.balanceOf(owner.address)).to.equal(owner_balance - pay_amount);
  
      });


      it("Take native token form vault contract.", async function () {

        const { vault, owner, equity, ttk, test_a, test_b } = await loadFixture(deployFixture);
        
        const pay_amount = ethers.parseEther("100.0");;

        // Send native token to vault contract.
        await test_a.sendTransaction({
            to: vault.target,
            value: pay_amount
        });

        // Check test_b balance.
        const test_b_balance = await ethers.provider.getBalance(test_b.address);

        // Check vault contract balance.
        expect(await ethers.provider.getBalance(vault.target)).to.equal(pay_amount);

        // Widthdraw native token from vault contract.
        await equity.withdraw(vault.target, ethers.ZeroAddress, test_b.address, pay_amount);

        // Check test_b balance after withdraw.
        expect(await ethers.provider.getBalance(test_b.address)).to.equal(test_b_balance+pay_amount);

        // Check equity contract balance.
        expect(await equity.inVaultBalanceList(ethers.ZeroAddress)).to.equal(0);

        // Check vault contract balance.
        expect(await ethers.provider.getBalance(vault.target)).to.equal(0);
  
      });

    
      it("Take ERC20 token form vault contract.", async function () {

        const { vault, owner, equity, ttk, test_a } = await loadFixture(deployFixture);
        
        const pay_amount = ethers.parseEther("100.0");

        // Approve vault contract to transfer ERC20 coins.
        await ttk.approve(vault.target, pay_amount);
        await vault.depositErc20(ttk.target, pay_amount);

        // Check vault ERC20 token balance.
        expect(await ttk.balanceOf(vault.target)).to.equal(pay_amount);

        // Check test_a ERC20 token balance.
        expect(await ttk.balanceOf(test_a.address)).to.equal(0);

        // Widthdraw ERC20 token from vault contract.
        await equity.withdraw(vault.target, ttk.target, test_a.address, pay_amount);

        // Check vault ERC20 token balance.
        expect(await ttk.balanceOf(vault.target)).to.equal(0);

        // Check test_a ERC20 token balance.
        expect(await ttk.balanceOf(test_a.address)).to.equal(pay_amount);
  
      });
  
    });
  
  });
  