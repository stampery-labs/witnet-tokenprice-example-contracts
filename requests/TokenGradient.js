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

const billboard = new Witnet.Source("https://billboard.service.cryptowat.ch/assets?quote=usd&limit=300&sort=volume")
  .parseJSON()
  .asMap()
  .get("result")
  .asMap()
  .get("rows")
  .asArray()
  .filter(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("symbol")
    .asString()
    .match({
      "algo": true,
      "btc": true,
      "eos": true,
      "etc": true,
      "eth": true,
      "link": true,
      "mkr": true,
      "rep": true,
      "xtz": true,
      "zec": true,
    }, false)
  ).sort(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("symbol")
    .asString()
  ).map(new Witnet.Script([Witnet.TYPES.MAP, Witnet.TYPES.BYTES])
    .get("performance")
    .asMap()
    .get("24h")
    .asFloat()
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

const aggregator = new Witnet.Aggregator([coincap, coinlore, paprika, billboard])
  .filter(new Witnet.Script([Witnet.TYPES.ARRAY, Witnet.TYPES.ARRAY])
    .count()
    .greaterThan(9))
  .filter(new Witnet.Script([Witnet.TYPES.ARRAY, Witnet.TYPES.ARRAY])
    .count()
    .lessThan(11))
  .filter(Witnet.Types.FILTERS.deviationStandard, 2.1)
  .reduce(Witnet.Types.REDUCERS.averageMean)

const tally = new Witnet.Tally(aggregator)
  .filter(new Witnet.Script([Witnet.TYPES.ARRAY, Witnet.TYPES.ARRAY])
    .count()
    .greaterThan(9))
  .filter(new Witnet.Script([Witnet.TYPES.ARRAY, Witnet.TYPES.ARRAY])
    .count()
    .lessThan(11))
  .filter(Witnet.Types.FILTERS.deviationStandard, 1.5)
  .reduce(Witnet.Types.REDUCERS.averageMean)
  .map(new Witnet.Script([Witnet.TYPES.FLOAT])
    .multiply(10000)
    .round()
  )

const request = new Witnet.Request() // Create a new request
  .addSource(coinlore)
  .addSource(coincap)
  .addSource(paprika)
  .addSource(billboard)
  //.addSource(cryptocompare)
  .setAggregator(aggregator) // Set aggregation function
  .setTally(tally) // Set tally function
  .setQuorum(2, 2) // Require between 4 and 6 witnessing nodes
  .setFees(1003, 1, 1, 1)

export { request as default } // IMPORTANT: export the request as an ES6 module
