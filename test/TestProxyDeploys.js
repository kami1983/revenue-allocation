const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { ethers, upgrades } = require("hardhat");

describe("Proxy", function () {



    async function deployOneYearLockFixture() {

        const [owner, otherAccount] = await ethers.getSigners();

        Box = await ethers.getContractFactory("Box");
        box = await upgrades.deployProxy(Box, [42], { initializer: 'store' });

        let proxyAddress = box.address
        let implementationAddress = await upgrades.erc1967.getImplementationAddress(box.address)
        let adminAddress = await upgrades.erc1967.getAdminAddress(box.address)

        console.log(`proxyAddress: ${proxyAddress}`)
        console.log(`implementationAddress: ${implementationAddress}`)
        console.log(`adminAddress: ${adminAddress}`)
        console.log(`owner: ${owner.address} otherAccount: ${otherAccount.address}`)

        // trasnfer ownership
        // await upgrades.admin.transferProxyAdminOwnership(otherAccount.address)

        // proxyAddress = box.address
        // implementationAddress = await upgrades.erc1967.getImplementationAddress(box.address)
        // adminAddress = await upgrades.erc1967.getAdminAddress(box.address)

        // console.log('-------------------------------')

        // console.log(`proxyAddress: ${proxyAddress}`)
        // console.log(`implementationAddress: ${implementationAddress}`)
        // console.log(`adminAddress: ${adminAddress}`)
        // console.log(`owner: ${owner.address} otherAccount: ${otherAccount.address}`)

        return { box, owner, otherAccount };
    }

    describe("Test Proxy", function () {
        // it("Test initial status", async function () {
        //     const { box, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);
        //     // Store a value
        //     await box.store(42);
        //     expect((await box.retrieve()).toString()).to.equal('42');
        // });

        it("Test upgrade", async function () {
            const { box, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);

            expect((await box.retrieve()).toString()).to.equal('42');

            BoxV2 = await ethers.getContractFactory("BoxV2");
            boxV2 = await upgrades.upgradeProxy(box.address, BoxV2);

            await boxV2.increment();
            expect((await boxV2.retrieve()).toString()).to.equal('43');
            expect((await boxV2.getBoxValue2()).toString()).to.equal('100');
            
        });


    });

});
