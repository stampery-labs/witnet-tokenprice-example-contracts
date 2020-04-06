/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like truffle-hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura API
 * keys are available for free at: infura.io/register
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

const HDWalletProvider = require("@truffle/hdwallet-provider")
require("dotenv").config()

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "5777"
    },
    ropsten: {
      provider: () =>
        new HDWalletProvider(
          process.env.MNENOMIC,
          "https://ropsten.infura.io/v3/" + process.env.INFURA_API_KEY,
          0
        ),
      network_id: 3,
      gas: 3000000,
      gasPrice: 10000000000
    },
    kovan: {
      provider: () =>
        new HDWalletProvider(
          process.env.MNENOMIC,
          "https://kovan.infura.io/v3/" + process.env.INFURA_API_KEY,
          0
        ),
      network_id: 42,
      gas: 3000000,
      gasPrice: 10000000000
    },
    rinkeby: {
      provider: () =>
        new HDWalletProvider(
          process.env.MNENOMIC,
          "https://rinkeby.infura.io/v3/" + process.env.INFURA_API_KEY,
          0
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
          0
        ),
      network_id: 5,
      gas: 3000000,
      gasPrice: 10000000000
    },

    // main ethereum network(mainnet)
    main: {
      provider: () =>
        new HDWalletProvider(
          process.env.MNENOMIC,
          "https://mainnet.infura.io/v3/" + process.env.INFURA_API_KEY,
          0
        ),
      network_id: 1,
      gas: 3000000,
      gasPrice: 10000000000
    }
  },

  // The `solc` compiler is set to optimize output bytecode with 200 runs, which is the standard these days
  compilers: {
    solc: {
      version: "0.6.4",
      settings: { optimizer: { enabled: true, runs: 200 } },
    },
  },

  // This plugin allows to verify the source code of your contracts on Etherscan with this command:
  // ETHERSCAN_API_KEY=<your_etherscan_api_key> truffle run verify <contract_name> --network <network_name>
  plugins: ["truffle-plugin-verify"],

  // This is just for the `truffle-plugin-verify` to catch the API key
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY,
  },
}
