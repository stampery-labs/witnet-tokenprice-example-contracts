import * as Witnet from "witnet-requests"

const coincap = new Witnet.Source("https://api.coincap.io/v2/assets")
  .parseMapJSON()
  .getArray("data")
  .filter(
    new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES]).getString("symbol").match(
      {
        ALGO: true,
        BTC: true,
        EOS: true,
        ETC: true,
        ETH: true,
        LINK: true,
        MKR: true,
        REP: true,
        XTZ: true,
        ZEC: true,
      },
      false
    )
  )
  .sort(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES]).getString("symbol"))
  .map(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES]).getFloat("changePercent24Hr"))

const coinlore = new Witnet.Source("https://api.coinlore.com/api/tickers/")
  .parseMapJSON()
  .getArray("data")
  .filter(
    new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES]).getString("symbol").match(
      {
        ALGO: true,
        BTC: true,
        EOS: true,
        ETC: true,
        ETH: true,
        LINK: true,
        MKR: true,
        REP: true,
        XTZ: true,
        ZEC: true,
      },
      false
    )
  )
  .sort(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES]).getString("symbol"))
  .map(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES]).getFloat("percent_change_24h"))

const paprika = new Witnet.Source("https://api.coinpaprika.com/v1/tickers")
  .parseArrayJSON()
  .filter(
    new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES]).getString("symbol").match(
      {
        ALGO: true,
        BTC: true,
        EOS: true,
        ETC: true,
        ETH: true,
        LINK: true,
        MKR: true,
        REP: true,
        XTZ: true,
        ZEC: true,
      },
      false
    )
  )
  .sort(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES]).getString("symbol"))
  .map(
    new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
      .getMap("quotes")
      .getMap("USD")
      .getFloat("percent_change_24h")
  )

const billboard = new Witnet.Source("https://billboard.service.cryptowat.ch/assets?quote=usd&limit=300&sort=volume")
  .parseMapJSON()
  .getMap("result")
  .getArray("rows")
  .filter(
    new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES]).getString("symbol").match(
      {
        algo: true,
        btc: true,
        eos: true,
        etc: true,
        eth: true,
        link: true,
        mkr: true,
        rep: true,
        xtz: true,
        zec: true,
      },
      false
    )
  )
  .sort(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES]).getString("symbol"))
  .map(
    new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
      .getMap("performance")
      .getFloat("24h")
      .multiply(100)
  )
/*
const cryptocompare = new Witnet.Source("https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ALGO,BTC,EOS,ETC,ETH,LINK,MKR,REP,XTZ,ZEC,&tsyms=USD")
  .parseJSON()
  .asMap()
  .get("RAW")
  .asMap()
  .values()
    .filter(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
        .get("USD")
        .asMap()
        .get("FROMSYMBOL")
        .asString()
        .match({
            "ALGO": true,
            "BTC": true,
            "EOS": true,
            "ETC": true,
            "ETH": true,
            "LINK": true,
            "MKR": true,
            "REP": true,
            "XTZ": true,
            "ZEC": true,
        }, false)
    ).sort(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("USD")
    .asMap()
    .get("FROMSYMBOL")
    .asString()
  ).map(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("USD")
    .asMap()
    .get("CHANGEPCT24HOUR")
    .asFloat()
  )
*/

// const aggregator = new Witnet.Aggregator([coincap, coinlore, paprika, billboard])
//   .filter(new Witnet.Script([Witnet.TYPES.ARRAY, Witnet.TYPES.ARRAY])
//     .count()
//     .greaterThan(9))
//   .filter(new Witnet.Script([Witnet.TYPES.ARRAY, Witnet.TYPES.ARRAY])
//     .count()
//     .lessThan(11))
//   .filter(Witnet.Types.FILTERS.deviationStandard, 2.1)
//   .reduce(Witnet.Types.REDUCERS.averageMean)

const aggregator = new Witnet.Aggregator({
  filters: [
    // .filter(new Witnet.Script([Witnet.TYPES.ARRAY, Witnet.TYPES.ARRAY]).count().greaterThan(9))
    // .filter(new Witnet.Script([Witnet.TYPES.ARRAY, Witnet.TYPES.ARRAY]).count().lessThan(11))

    [Witnet.Types.FILTERS.deviationStandard, 2.1],
  ],
  reducer: Witnet.Types.REDUCERS.averageMean,
})

// const tally = new Witnet.Tally(aggregator)
//   .filter(new Witnet.Script([Witnet.TYPES.ARRAY, Witnet.TYPES.ARRAY]).count().greaterThan(9))
//   .filter(new Witnet.Script([Witnet.TYPES.ARRAY, Witnet.TYPES.ARRAY]).count().lessThan(11))
//   .filter(Witnet.Types.FILTERS.deviationStandard, 1.5)
//   .reduce(Witnet.Types.REDUCERS.averageMean)
//   .map(new Witnet.Script([Witnet.TYPES.FLOAT]).multiply(10000).round())

const tally = new Witnet.Tally({
  filters: [[Witnet.Types.FILTERS.deviationStandard, 1.0]],
  reducer: Witnet.Types.REDUCERS.averageMean,
})

// const request = new Witnet.Request() // Create a new request
//   // .addSource(coinlore)
//   .addSource(coincap)
//   // .addSource(paprika)
//   // .addSource(billboard)
//   // .addSource(cryptocompare)
//   .setAggregator(aggregator) // Set aggregation function
//   .setTally(tally) // Set tally function
//   .setQuorum(2, 2) // Require between 4 and 6 witnessing nodes
//   .setFees(1003, 1, 1, 1)

const request = new Witnet.Request()
  .addSource(coinlore)
  .addSource(coincap)
  .addSource(paprika)
  .addSource(billboard)
  // .addSource(cryptocompare)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(4, 1, 2, 5, 70) // Set witness count
  .setFees(10, 1, 1, 1) // Set economic incentives
  .schedule(0) // Make this request immediately solvable

export { request as default } // IMPORTANT: export the request as an ES6 module
