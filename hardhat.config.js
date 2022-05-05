require("@nomiclabs/hardhat-waffle");
let su = require("./scripts")

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

extendEnvironment((hre) => {
  hre.su = su;
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.4"
      },
      {
        version: "0.6.6",
        optimizer: {
          enabled: true,
          runs: 1000,
        },
      },
      {
        version: "0.5.16",
        optimizer: {
          enabled: true,
          runs: 1000,
        },
      },
    ]
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    }
  },
};
