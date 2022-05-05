
function DefaultState() {
    return {
        // contract names
        names: {
            uniswapV2Factory: "UniswapV2Factory",
            faucetToken: "FaucetToken",
            uniswapV2Pair: "UniswapV2Pair",
            uniswapV2Router02: "UniswapV2Router02",
        },
        tokenSymbolList: [
            "WETH",
            "TOKA",
            "TOKB"
        ],
    }
}
module.exports.DefaultState = DefaultState

async function DeployUniswapV2Factory(hre, names, uniswapFactoryFeeOwnerAccount) {
    const UniswapV2FactoryFactory = await hre.ethers.getContractFactory(names.uniswapV2Factory);
    const uniswapV2Factory = await UniswapV2FactoryFactory.deploy(uniswapFactoryFeeOwnerAccount.address);
    await uniswapV2Factory.deployed();
    return uniswapV2Factory
}

async function AutoDeployUniswapV2Factory(hre, state) {
    if (state.factoryFeeOwnerAccount === undefined) {
        let accounts = await hre.ethers.getSigners();
        state.factoryFeeOwnerAccount = accounts[0];
    }
    state.uniswapV2Factory = await DeployUniswapV2Factory(hre, state.names, state.factoryFeeOwnerAccount)
    return state
}
module.exports.AutoDeployUniswapV2Factory = AutoDeployUniswapV2Factory

async function DeployTokens(hre, names, tokenSymbolList) {
    const FakeTokenFactory = await hre.ethers.getContractFactory(names.faucetToken)
    let tokens = {}
    for (let tokenSymbol of tokenSymbolList) {
        let token = await FakeTokenFactory.deploy(tokenSymbol)
        await token.deployed()
        tokens[tokenSymbol] = token
    }
    return tokens
}

async function AutoDeployTokens(hre, state) {
    state.tokens = await DeployTokens(hre, state.names, state.tokenSymbolList)
    return state
}
module.exports.AutoDeployTokens = AutoDeployTokens

async function CreateUniswapV2Pair(hre, names, uniswapV2Factory, tokenA, tokenB) {
    // technically, can use initial addLiquidity to create pair given check is done in that function
    // await uniswapV2Factory.createPair(tokenA.address, tokenB.address)

    // get pair address from event
    const createPairResponse = await uniswapV2Factory.createPair(tokenA.address, tokenB.address)
    const createPairResponseWaited = await createPairResponse.wait()
    const pairAddress = createPairResponseWaited.events[0].args[2]

    // let getPairResponse = await uniswapV2Factory.getPair(tokenA.address, tokenB.address)
    // console.log(getPairResponse)

    const pair = await hre.ethers.getContractAt(names.uniswapV2Pair, pairAddress)
    return pair
}

async function AutoDeployUniswapV2Pairs(hre, state) {
    let pairs = {}
    for(tokenAIndex = 0 ; tokenAIndex < state.tokenSymbolList.length ; tokenAIndex++) {
        let tokenASymbol = state.tokenSymbolList[tokenAIndex]
        let tokenA = state.tokens[tokenASymbol]
        pairs[tokenASymbol] = {}
        for(tokenBIndex = tokenAIndex+1 ; tokenBIndex < state.tokenSymbolList.length ; tokenBIndex++) {
            let tokenBSymbol = state.tokenSymbolList[tokenBIndex]
            let tokenB = state.tokens[tokenBSymbol]
            let pair = await CreateUniswapV2Pair(hre, state.names, state.uniswapV2Factory, tokenA, tokenB)
            pairs[tokenASymbol][tokenBSymbol] = pair
        }
    }
    state.pairs = pairs
    return state
}
module.exports.AutoDeployUniswapV2Pairs = AutoDeployUniswapV2Pairs

async function DeployUniswapV2Router(hre, names, uniswapV2FactoryAddress, wethAddress) {
    const UniswapV2Router02Factory = await hre.ethers.getContractFactory(names.uniswapV2Router02);
    const pairContract = await hre.ethers.getContractFactory(names.uniswapV2Pair)
    // https://ethereum.stackexchange.com/questions/114170/unit-testing-uniswapv2pair-function-call-to-a-non-contract-account#comment137427_114170
    const initCodeHash = hre.ethers.utils.keccak256(pairContract.bytecode)
    const uniswapV2Router02 = await UniswapV2Router02Factory.deploy(uniswapV2FactoryAddress, wethAddress, initCodeHash)
    await uniswapV2Router02.deployed()
    return uniswapV2Router02
}

async function AutoDeployUniswapV2Router(hre, state) {
    state.uniswapV2Router02 = await DeployUniswapV2Router(hre, state.names, state.uniswapV2Factory.address, state.tokens["WETH"].address)
    return state
}
module.exports.AutoDeployUniswapV2Router = AutoDeployUniswapV2Router

async function DripAndInitializePools(hre, initializeAccount, uniswapV2Router02, tokenA, tokenB) {
    // console.log("dripping tokens")
    await tokenA.drip(initializeAccount.address, 2000000)
    await tokenB.drip(initializeAccount.address, 1000000)
    await tokenA.connect(initializeAccount).approve(uniswapV2Router02.address, hre.ethers.constants.MaxUint256)
    await tokenB.connect(initializeAccount).approve(uniswapV2Router02.address, hre.ethers.constants.MaxUint256)

    // console.log("adding liquidity")
    const deadline = Math.floor(new Date().getTime() / 1000) + 60;
    await uniswapV2Router02.connect(initializeAccount).addLiquidity(tokenA.address, tokenB.address, 100000, 10000, 100000, 10000, initializeAccount.address, deadline)
}

async function AutoDripAndInitializePools(hre, state) {
    if (state.poolInitializeAccount === undefined) {
        const accounts = await hre.ethers.getSigners();
        state.poolInitializeAccount = accounts[1];
    }
    for(tokenAIndex = 1 ; tokenAIndex < state.tokenSymbolList.length ; tokenAIndex++) {
        let tokenASymbol = state.tokenSymbolList[tokenAIndex]
        let tokenA = state.tokens[tokenASymbol]
        for(tokenBIndex = tokenAIndex+1 ; tokenBIndex < state.tokenSymbolList.length ; tokenBIndex++) {
            let tokenBSymbol = state.tokenSymbolList[tokenBIndex]
            let tokenB = state.tokens[tokenBSymbol]
            await DripAndInitializePools(hre, state.poolInitializeAccount, state.uniswapV2Router02, tokenA, tokenB)
        }
    }
    return state
}
module.exports.AutoDripAndInitializePools = AutoDripAndInitializePools