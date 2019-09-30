const TokenPriceContestTestHelper = artifacts.require("TokenPriceContestTestHelper")
const Witnet = artifacts.require("Witnet")
const WBIHelper = artifacts.require("WitnetBridgeInterfaceHelper")
const truffleAssert = require("truffle-assertions")
const BlockRelay = artifacts.require("BlockRelay")
const jsonrpc = "2.0"

const id = 0
const send = (method, params = []) =>
  web3.currentProvider.send({ id, jsonrpc, method, params })
const timeTravel = async seconds => {
  await send("evm_increaseTime", [seconds])
  await send("evm_mine")
}
module.exports = timeTravel

contract("TokenPriceContestTestHelper", accounts => {
  let contest
  let witnet
  let wbi
  let blockRelay
  let id1
  before(async () => {
    blockRelay = await BlockRelay.deployed({
      from: accounts[0],
    })
    const drBytes = web3.utils.fromAscii("This is a DR")
    witnet = await Witnet.new()
    await TokenPriceContestTestHelper.link("Witnet", witnet.address)
    wbi = await WBIHelper.new(blockRelay.address)
    const tx1 = wbi.postDataRequest(drBytes, web3.utils.toWei("1", "wei"), {
      from: accounts[0],
      value: web3.utils.toWei("1", "wei"),
    })
    let txHash1 = await waitForHash(tx1)
    let txReceipt1 = await web3.eth.getTransactionReceipt(txHash1)
    id1 = txReceipt1.logs[0].data
    const timestamp = Math.round(new Date().getTime() / 1000 - 100)
    contest = await TokenPriceContestTestHelper.new(timestamp, 10, wbi.address, web3.utils.toWei("1", "wei"), web3.utils.toWei("1", "wei"))
  })
  describe("Concatenate uint8 into uint16: ", () => {
    it("should concat 0xff 0xee", async () => {
      const result = await contest.u8Concat.call(web3.utils.hexToBytes("0xff"), web3.utils.hexToBytes("0xee"))
      assert.equal(web3.utils.toHex(result), "0xffee")
    })
    it("should concat 0x00 0xee", async () => {
      const result = await contest.u8Concat.call(web3.utils.hexToBytes("0x00"), web3.utils.hexToBytes("0xee"))
      assert.equal(web3.utils.toHex(result), 0xee)
    })
    it("should concat 0xff 0x00", async () => {
      const result = await contest.u8Concat.call(web3.utils.hexToBytes("0xff"), web3.utils.hexToBytes("0x00"))
      assert.equal(web3.utils.toHex(result), "0xff00")
    })
  })

  describe("Rank int128 array: ", () => {
    it("should rank [3, 0, 15, 5, 6, 8, 6, 1]", async () => {
      const result = await contest.rank.call([3, 0, 15, 5, 6, 8, 6, 1])
      const expected = [2, 5, 6, 4, 3, 0, 7, 1]
      var i
      for (i = 0; i < result.length; i++) {
        assert.equal(web3.utils.toHex(result[i]), expected[i])
      }
    })
    it("should rank [1, 4, 16, 12, 0, 7, 3]", async () => {
      const result = await contest.rank.call([1, 4, 16, 12, 0, 7, 3])
      const expected = [2, 3, 5, 1, 6, 0, 4]
      var i
      for (i = 0; i < result.length; i++) {
        assert.equal(web3.utils.toHex(result[i]), expected[i])
      }
    })
  })

  describe("Get day states: ", () => {
    const DayState = {
      BET: 0,
      WAIT: 1,
      RESOLVE: 2,
      PAYOUT: 3,
      FINAL: 4,
      INVALID: 5,
    }
    const day0 = Math.round(new Date().getTime() / 1000)
    const now0 = day0 + (2 * 60 * 60)
    const now1 = day0 + (26 * 60 * 60)

    it("should get day state BET because its today", async () => {
      const tx = contest.setTimestamp(now0)
      waitForHash(tx)
      const result = await contest.getDayState.call(day0, 0)
      assert.equal(result.toNumber(), DayState.BET)
    })
    it("should get day state FINAL because (for yesterday and no bets)", async () => {
      const tx = contest.setTimestamp(now1)
      waitForHash(tx)
      const result = await contest.getDayState.call(day0, 0)
      assert.equal(result.toNumber(), DayState.FINAL)
    })
    it("should get day state INVALID because is for tomorrow", async () => {
      const tx = contest.setTimestamp(now0)
      waitForHash(tx)
      const result = await contest.getDayState.call(day0, 1)
      assert.equal(result.toNumber(), DayState.INVALID)
    })
  })

  describe("Place bets: ", () => {
    const DayState = {
      BET: 0,
      WAIT: 1,
      RESOLVE: 2,
      PAYOUT: 3,
      FINAL: 4,
      INVALID: 5,
    }
    const day0 = Math.round(new Date().getTime() / 1000)
    const now1 = day0 + (26 * 60 * 60)
    const now2 = day0 + (52 * 60 * 60)
    const now3 = day0 + (74 * 60 * 60)

    it("Should set timestamp to now", async () => {
      const tx = contest.setTimestamp(day0, {
        "from" : accounts[1],
      })
      waitForHash(tx)
      const result = await contest.getTimestamp.call()
      assert.equal(day0, result)
    })
    it("should read that there is no bet", async () => {
      const result = await contest.totalAmountTokenDay.call(0, 0)
      assert.equal(result, web3.utils.toWei("0", "ether"))
    })
    it("should be able to place bet", async () => {
      const tx = contest.placeBet(0, { from: accounts[0], value: web3.utils.toWei("1000", "wei") })
      waitForHash(tx)
    })
    it("should read the total amount of previous bet", async () => {
      const result = await contest.totalAmountTokenDay.call(0, 0)
      assert.equal(result, web3.utils.toWei("1000", "wei"))
    })
    it("should be able to place a second bet", async () => {
      const tx = contest.placeBet(1, { from: accounts[0], value: web3.utils.toWei("1000", "wei") })
      waitForHash(tx)
    })
    it("should read the total amount of the day", async () => {
      const result = await contest.getDayInfo.call(0)
      assert.equal(result[0], web3.utils.toWei("2000", "wei"))
    })
    it("should read my total bets of the day", async () => {
      const result = await contest.readMyBetsDay.call(0)
      assert.equal(result[0], web3.utils.toWei("1000", "wei"))
      assert.equal(result[1], web3.utils.toWei("1000", "wei"))
      assert.equal(result[6], web3.utils.toWei("0", "wei"))
    })
    it("should be able to place a third bet from another address", async () => {
      const tx = contest.placeBet(6, { from: accounts[1], value: web3.utils.toWei("1000", "wei") })
      waitForHash(tx)
    })
    it("should read bets from another address", async () => {
      const result = await contest.readMyBetsDay.call(0, { from: accounts[1] })
      assert.equal(result[0], web3.utils.toWei("0", "wei"))
      assert.equal(result[1], web3.utils.toWei("0", "wei"))
      assert.equal(result[6], web3.utils.toWei("1000", "wei"))
    })
    it("should get day state WAIT because (for yesterday and we have bets)", async () => {
      const tx = contest.setTimestamp(now1, {
        "from" : accounts[1],
      })
      waitForHash(tx)
      const result = await contest.getDayState.call(day0, 0)
      assert.equal(result.toNumber(), DayState.WAIT)
    })
    it("should be able to place a bet in the second day", async () => {
      const tx = contest.placeBet(6, { from: accounts[1], value: web3.utils.toWei("1000", "wei") })
      waitForHash(tx)
    })
    it("should be able to place a second bet in the second day", async () => {
      const tx = contest.placeBet(3, { from: accounts[2], value: web3.utils.toWei("1000", "wei") })
      waitForHash(tx)
    })
    it("should get day state RESOLVE because (for 2 days ago with bets)", async () => {
      const tx = contest.setTimestamp(now2, {
        "from" : accounts[1],
      })
      waitForHash(tx)
      const result = await contest.getDayState.call(day0, 0)
      assert.equal(result.toNumber(), DayState.RESOLVE)
    })
    it("should get day state PAYOUT after calling resolve)", async () => {
      const tx = contest.setTimestamp(now2, {
        "from" : accounts[1],
      })
      waitForHash(tx)
      const resolveTx = contest.resolve(0, {
        "from" : accounts[1],
        "value" : 4,
      })
      waitForHash(resolveTx)
      const result = await contest.getDayState.call(day0, 0, {
        "from" : accounts[1],
      })
      assert.equal(result.toNumber(), DayState.PAYOUT)
    })
    it("should revert when trying to read a result that is not ready", async () => {
      await truffleAssert.reverts(contest.payout.call(0, {
        from: accounts[0],
      }))
    })
    it("should call payout with succesful result and refund winnet", async () => {
      const resBytes = web3.utils.hexToBytes("0x8A1A0001869F02030405060708090A")
      let balanceBefore = await web3.eth.getBalance(contest.address)
      await wbi.setDrResult(resBytes, 1, {
        "from": accounts[1],
      })
      await contest.payout(0, {
        "from": accounts[0],
      })

      let balanceAfter = await web3.eth.getBalance(contest.address)
      assert.equal(parseInt(balanceAfter), parseInt(balanceBefore) - 3000)
    })
    it("should revert because contestant already paid", async () => {
      await truffleAssert.reverts(contest.payout(0, {
        "from": accounts[0],
      }), "Address already paid")
    })
    it("should revert because contestant already paid", async () => {
      await truffleAssert.reverts(contest.payout(0, {
        "from": accounts[2],
      }), "Address has no bets in the winning token")
    })
    it("should get day state PAYOUT after calling resolve the second day)", async () => {
      const tx = contest.setTimestamp(now3, {
        "from" : accounts[1],
      })
      waitForHash(tx)
      const resolveTx = contest.resolve(1, {
        "from" : accounts[1],
        "value" : 4,
      })
      waitForHash(resolveTx)
      const result = await contest.getDayState.call(day0, 1, {
        "from" : accounts[1],
      })
      assert.equal(result.toNumber(), DayState.PAYOUT)
    })
    /*it("should call payout with unsuccesful result and pay each one their bet", async () => {
      const resBytes = web3.utils.hexToBytes("0xD8270001869F02030405060708090A")
      let balanceBefore = await web3.eth.getBalance(contest.address)
      await wbi.setDrResult(resBytes, 2, {
        "from": accounts[1],
      })
      await contest.payout(1, {
        "from": accounts[1],
      })

      let balanceAfter = await web3.eth.getBalance(contest.address)
      assert.equal(parseInt(balanceAfter), parseInt(balanceBefore) - 1000)
    })*/
  })
})

const waitForHash = txQ =>
  new Promise((resolve, reject) =>
    txQ.on("transactionHash", resolve).catch(reject)
  )