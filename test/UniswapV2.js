const { expect } = require("chai");
const { ethers } = require("hardhat");
const univ2 = require("../scripts");

describe("UniswapV2Factory", function () {
  it("Should work with auto functions", async function() {
    state = univ2.DefaultState()
    state = await univ2.AutoDeployUniswapV2Factory(hre, state)
    state = await univ2.AutoDeployTokens(hre, state)
    state = await univ2.AutoDeployUniswapV2Pairs(hre, state)
    state = await univ2.AutoDeployUniswapV2Router(hre, state)
    state = await univ2.AutoDripAndInitializePools(hre, state)

    const amountAIn = 10000
    const tokenA = state.tokens["TOKA"]
    const tokenB = state.tokens["TOKB"]
    let amounts = await state.uniswapV2Router02.getAmountsOut(amountAIn, [tokenA.address, tokenB.address])
    const amountA = amounts[0]
    const amountB = amounts[1]
    // console.log(amountB)
    expect(amountA.toString()).to.equal(`${amountAIn}`)
    expect(amountB.toString()).to.equal("906")
  })
});