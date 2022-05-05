const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FaucetToken", function () {
  it("Should drip", async function () {
    const TokenFactory = await ethers.getContractFactory("FaucetToken");
    const tokenA = await TokenFactory.deploy("TOKA");
    await tokenA.deployed();
    let accounts = await hre.ethers.getSigners();
    let account = accounts[0];
    await tokenA.drip(account.address, 99)
    expect(await tokenA.balanceOf(account.address)).to.equal(99);
  });
});
