const TokenPriceContest = artifacts.require("TokenPriceContest")

contract("TokenPriceContest", accounts => {

  let contest
  before(async () => {
    const timestamp = Math.round(new Date().getTime() / 1000)
    contest = await TokenPriceContest.new(timestamp)
  })

  // describe("Calculate bet day: ", () => {
  //   it(`should calculate bet day is 0`, async () => {
  //     const result = await contest.calculateDay.call()
  //     assert.equal(result.toNumber(), 0)
  //   })
  // })

  describe("Concatenate uint8 into uint16: ", () => {
    it(`should concat 0xff 0xee`, async () => {
      const result = await contest.u8Concat.call(web3.utils.hexToBytes("0xff"), web3.utils.hexToBytes("0xee"))
      assert.equal(web3.utils.toHex(result), "0xffee")
    })
    it(`should concat 0x00 0xee`, async () => {
      const result = await contest.u8Concat.call(web3.utils.hexToBytes("0x00"), web3.utils.hexToBytes("0xee"))
      assert.equal(web3.utils.toHex(result), 0xee)
    })
    it(`should concat 0xff 0x00`, async () => {
      const result = await contest.u8Concat.call(web3.utils.hexToBytes("0xff"), web3.utils.hexToBytes("0x00"))
      assert.equal(web3.utils.toHex(result), "0xff00")
    })
  })
})
