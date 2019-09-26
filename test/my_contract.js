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

})
