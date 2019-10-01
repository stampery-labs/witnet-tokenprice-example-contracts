import * as Witnet from "witnet-requests"

const coincap = new Witnet.Source("https://api.coincap.io/v2/assets")
  .parseJSON()
  .asMap()
  .get("data")
  .asArray()
  .filter(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("symbol")
    .asString()
    .match({
      "ATOM": true,
      "BTC": true,
      "ETC": true,
      "ETH": true,
      "GNT": true,
      "LINK": true,
      "MKR": true,
      "REP": true,
      "XTZ": true,
      "ZEC": true,
    }, false)
  ).sort(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("symbol")
    .asString()
  ).map(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("changePercent24Hr")
    .asFloat()
  )

const coinlore = new Witnet.Source("https://api.coinlore.com/api/tickers/")
  .parseJSON()
  .asMap()
  .get("data")
  .asArray()
  .filter(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("symbol")
    .asString()
    .match({
      "ATOM": true,
      "BTC": true,
      "ETC": true,
      "ETH": true,
      "GNT": true,
      "LINK": true,
      "MKR": true,
      "REP": true,
      "XTZ": true,
      "ZEC": true,
    }, false)
  ).sort(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("symbol")
    .asString()
  ).map(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("percent_change_24h")
    .asFloat()
  )

const paprika = new Witnet.Source("https://api.coinpaprika.com/v1/tickers")
  .parseJSON()
  .asArray()
  .filter(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("symbol")
    .asString()
    .match({
      "ATOM": true,
      "BTC": true,
      "ETC": true,
      "ETH": true,
      "GNT": true,
      "LINK": true,
      "MKR": true,
      "REP": true,
      "XTZ": true,
      "ZEC": true,
    }, false)
  ).sort(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("symbol")
    .asString()
  ).map(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("quotes")
    .asMap()
    .get("USD")
    .asMap()
    .get("percent_change_24h")
    .asFloat()
  )

const aggregator = new Witnet.Aggregator([coincap, coinlore, paprika])
  // .filter(Witnet.Types.FILTERS.deviationStandard, 2)
  .reduce(Witnet.Types.REDUCERS.averageMean)

const tally = new Witnet.Tally(aggregator)
  // .filter(Witnet.Types.FILTERS.deviationStandard, 1.5)
  .reduce(Witnet.Types.REDUCERS.averageMean)
  .map(new Witnet.Script([Witnet.TYPES.FLOAT])
    .multiply(10000)
    .round()
  )

const request = new Witnet.Request() // Create a new request
  .addSource(coinlore)
  .addSource(coincap)
  .addSource(paprika)
  .setAggregator(aggregator) // Set aggregation function
  .setTally(tally) // Set tally function
  .setQuorum(2, 2) // Require between 4 and 6 witnessing nodes
  .setFees(1003, 1, 1, 1)

export { request as default } // IMPORTANT: export the request as an ES6 module