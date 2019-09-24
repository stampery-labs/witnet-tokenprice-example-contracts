// This file was auto-generated by the Witnet compiler, any manual changes will be overwritten except
// each contracts' constructor arguments (you can freely edit those and the compiler will respect them).
const Witnet = artifacts.require("Witnet")
const WitnetBridgeInterface = artifacts.require("WitnetBridgeInterface")
const PriceFeed = artifacts.require("PriceFeed")
const QuantumDice = artifacts.require("QuantumDice")
const WeatherContest = artifacts.require("WeatherContest")

module.exports = function (deployer) {
  deployer.link(Witnet, [PriceFeed, QuantumDice, WeatherContest])
  deployer.deploy(PriceFeed, WitnetBridgeInterface.address, 0)
  deployer.deploy(QuantumDice, WitnetBridgeInterface.address, 0)
  deployer.deploy(WeatherContest, WitnetBridgeInterface.address)
}