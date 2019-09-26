const TokenPriceContest = artifacts.require("TokenPriceContest")

contract("TokenPriceContest", accounts => {
  let contest
  before(async () => {
    const timestamp = Math.round(new Date().getTime() / 1000 - 100)
    contest = await TokenPriceContest.new(timestamp)
  })
  // describe("Calculate bet day: ", () => {
  //   it("should calculate bet day is 0", async () => {
  //     const result = await contest.calculateDay.call()
  //     assert.equal(result.toNumber(), 0)
  //   })
  // })
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

  describe("Get day states: ", () => {
    const DayState = {
      BET: 0,
      WAIT: 1,
      RESOLVE: 2,
      PAYOUT: 3,
      FINAL: 4,
    }
    const day0 = Math.round(new Date().getTime() / 1000)
    const now0 = day0 + (2 * 60 * 60)
    const now1 = day0 + (26 * 60 * 60)
    it("should get day state BET because its today", async () => {
      const result = await contest.getDayState.call(day0, now0, 0)
      assert.equal(result.toNumber(), DayState.BET)
    })
    it("should get day state FINAL because (for yesterday and no bets)", async () => {
      const result = await contest.getDayState.call(day0, now1, 0)
      assert.equal(result.toNumber(), DayState.FINAL)
    })
    it("should get day state WAIT because is for tomorrow", async () => {
      const result = await contest.getDayState.call(day0, now0, 1)
      assert.equal(result.toNumber(), DayState.WAIT)
    })
  })

  describe("Place bets: ", () => {
    it("should read that there is no bet", async () => {
      const result = await contest.totalAmountTokenDay(0, 0)
      assert.equal(result, web3.utils.toWei("0", "ether"))
    })
    it("should be able to place bet", async () => {
      const tx = contest.placeBet(0, { from: accounts[0], value: web3.utils.toWei("1", "ether") })
      waitForHash(tx)
    })
    it("should read the total amount of previous bet", async () => {
      const result = await contest.totalAmountTokenDay(0, 0)
      assert.equal(result, web3.utils.toWei("1", "ether"))
    })
    it("should be able to place a second bet", async () => {
      const tx = contest.placeBet(1, { from: accounts[0], value: web3.utils.toWei("1", "ether") })
      waitForHash(tx)
    })
    it("should read the total amount of the day", async () => {
      const result = await contest.getDayInfo.call(0)
      assert.equal(result[0], web3.utils.toWei("2", "ether"))
    })
  })
})

const waitForHash = txQ =>
  new Promise((resolve, reject) =>
    txQ.on("transactionHash", resolve).catch(reject)
  )
