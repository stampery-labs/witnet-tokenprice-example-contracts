const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

module.exports = {
  compilers: {
    solc: {
      version: "0.6.4",
      settings: { optimizer: { enabled: true, runs: 200 } }
    },
  },
  contracts_directory: "./contracts/flattened/",
  networks: {
    rinkeby: {
      provider: () =>
          new HDWalletProvider(
              process.env.MNENOMIC,
              "https://rinkeby.infura.io/v3/" + process.env.INFURA_API_KEY,
              2
          ),
      network_id: 4,
      gas: 3000000,
      gasPrice: 10000000000
    },
    goerli: {
      provider: () =>
          new HDWalletProvider(
              process.env.MNENOMIC,
              "https://goerli.infura.io/v3/" + process.env.INFURA_API_KEY,
              2
          ),
      network_id: 5,
      gas: 3000000,
      gasPrice: 10000000000
    },
  },
}
