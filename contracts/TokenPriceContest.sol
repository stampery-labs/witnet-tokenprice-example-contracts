pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;
import "witnet-ethereum-bridge/contracts/UsingWitnet.sol";
import "./requests/TokenGradient.sol";

contract TokenPriceContest is UsingWitnet {

  event BetPlaced(uint8, uint8, address, uint256);
  event ResolveTriggered(uint8, uint256, address);
  event ReadResult(bytes);
  event RankingWinner(uint8);
  event ShowMeTheMoneyBitch(uint256);

  // States define the action allowed in the current window
  enum DayState{BET, WAIT, RESOLVE, PAYOUT, FINAL, INVALID}
  struct TokenDay{
    uint256 totalAmount;
    mapping (address => uint256) participations;
    mapping (address => bool) paid;
  }
  Request tokenGradientRequest;
  uint8 tokenLimit;
  // Structure with all the current day bets information
  struct DayInfo{
    // total prize for a day
    uint256 grandPrize;
    // ordered ranking after result has been resolved
    uint8[] ranking;
    // result as given by the data request (floats multiplied by 10000)
    int128[] result;
    // id of the data request inserted in the WBI
    uint256 witnetRequestId;
    // result was read from WBI
    bool witnetReadResult;
  }
  // Mapping containing the day info
  mapping(uint8 => DayInfo) dayInfos;

  // uint16 contains two uint8 refering to day||TokenId
  mapping (uint16 => TokenDay) bets;

  // first day from which start counting to enable certain operations
  uint256 public firstDay;

  // fees to include resquest and report result
  uint256 requestFee;
  uint256 resultFee;

  // Time period for each contest
  uint256 contestPeriod;

  constructor(
    uint256 _firstDay,
    uint256 _contestPeriod,
    uint8 _tokenLimit,
    address _wbi,
    uint256 _requestFee,
    uint256 _resultFee) UsingWitnet(_wbi) public
  {
    // TODO: Verify that firstDay is valid? after block.timestamp?
    firstDay = _firstDay;
    contestPeriod = _contestPeriod;
    tokenLimit = _tokenLimit;
    requestFee = _requestFee;
    resultFee = _resultFee;

    tokenGradientRequest = new TokenGradientRequest();
  }

  function getTimestamp() public view returns (uint256){
    return block.timestamp;
  }

  // Executes data request
  function placeBet(uint8 _tokenId) public payable {
    require(msg.value > 0, "Should insert a positive amount");

    // Calculate the day of the current bet
    uint8 betDay = calculateDay();

    // Check if BET is allowed
    // TODO: change getDayState as below
    require(getDayState(firstDay, betDay) == DayState.BET);

    // Create Bet: u8Concat
    uint16 betId = u8Concat(betDay, _tokenId);

    // Upsert Bets mapping (day||tokenId) with TokenDay
    bets[betId].totalAmount = bets[betId].totalAmount + msg.value;
    bets[betId].participations[msg.sender] += msg.value;
    bets[betId].paid[msg.sender] = false;

    // Upsert DayInfo (day)
    dayInfos[betDay].grandPrize = dayInfos[betDay].grandPrize + msg.value;

    emit BetPlaced(betDay, _tokenId, msg.sender, msg.value);
  }

  // Executes data request
  function resolve(uint8 _day) public payable {
    // Check if BET is allowed
    // TODO: change getDayState as below
    require(msg.value >= requestFee + resultFee, "Not enough value to resolve the data request");
    require(getDayState(firstDay, _day) == DayState.RESOLVE);

    uint256 requestId = witnetPostRequest(tokenGradientRequest, requestFee, resultFee);
    dayInfos[_day].witnetRequestId = requestId;

    emit ResolveTriggered(_day, requestId, msg.sender);
  }

  // Pays out upon data request resolution
  function payout(uint8 _day) public payable {
    require((getDayState(firstDay, _day) == DayState.PAYOUT) || (getDayState(firstDay, _day) == DayState.FINAL));

    // check if result has been read
    if (dayInfos[_day].witnetReadResult == false){
      Witnet.Result memory result = witnetReadResult(dayInfos[_day].witnetRequestId);
      dayInfos[_day].witnetReadResult = true;
      if (result.isOk()) {
        int128[] memory requestResult = result.asInt128Array();
        uint8[] memory ranked = rank(requestResult);
        dayInfos[_day].result = requestResult;
        dayInfos[_day].ranking = ranked;
      }
    }

    if (dayInfos[_day].result.length == 0) {
      uint16 offset = u8Concat(_day, 0);
      for (uint16 i = 0; i<tokenLimit; i++) {
        if(bets[i+offset].paid[msg.sender] == false &&
          bets[i+offset].participations[msg.sender] > 0) {
          bets[i+offset].paid[msg.sender] = true;
          msg.sender.transfer(bets[i+offset].participations[msg.sender]);
        }
      }
    }
    else {
      uint16 dayTokenId = u8Concat(_day, dayInfos[_day].ranking[0]);
      require(bets[dayTokenId].paid[msg.sender] == false, "Address already paid");
      require(bets[dayTokenId].participations[msg.sender] > 0, "Address has no bets in the winning token");
      uint256 grandPrize = dayInfos[_day].grandPrize;
      uint256 winnerAmount = bets[dayTokenId].totalAmount;
      uint256 prize_share = grandPrize / winnerAmount;
      uint256 prize = bets[dayTokenId].participations[msg.sender] * prize_share;

      bets[dayTokenId].paid[msg.sender] = true;
      msg.sender.transfer(prize);
    }
  }

  // TODO: change _firstDay argument for attribute
  // TODO: retrieve _now from block.timestamp
  function getDayState(uint _firstDay, uint8 _day) public returns (DayState) {
    uint256 timestamp = getTimestamp();
    uint256 currentDay = (timestamp - _firstDay) / contestPeriod;
    if (_day == currentDay) {
      return DayState.BET;
    } else if (_day > currentDay) {
      // Bet in the future
      return DayState.INVALID;
    } else if (dayInfos[_day].grandPrize == 0) {
      // BetDay is in the past but there were no bets
      return DayState.FINAL;
    } else if (_day == currentDay - 1){
      // Waiting day
      return DayState.WAIT;
    } else if (dayInfos[_day].witnetRequestId == 0) {
      // BetDay is in the past with prices but no DR yet
      return DayState.RESOLVE;
    } else if (dayInfos[_day].result.length == 0) {
      // BetDay is in the past with prices and DR but no result yet
      return DayState.PAYOUT;
    }  else {
      // BetDay is in the past with prices, DR and the results
      return  DayState.FINAL;
    }
  }

  // Reads totalamount bet for a day||token
  function totalAmountTokenDay(uint8 _day, uint8 _tokenId) public view returns (uint256) {
    return bets[u8Concat(_day, _tokenId)].totalAmount;
  }

  // Reads your participations for a given day
  function readMyBetsDay(uint8 _day) public view returns (uint256[] memory) {
    uint256[] memory results = new uint256[](tokenLimit);
    uint16 offset = u8Concat(_day, 0);
    for (uint16 i = 0; i<tokenLimit; i++){
      results[i] = bets[i+offset].participations[msg.sender];
    }

    return results;
  }

  // Reads information for a given day
  function getDayInfo(uint8 _day) public view returns (DayInfo memory) {
    return dayInfos[_day];
  }

  // Read last block timestamp and calculate difference with firstDay timestamp
  function calculateDay() public returns (uint8) {
    uint256 timestamp = getTimestamp();
    uint256 daysDiff = (timestamp - firstDay) / 86400;

    return uint8(daysDiff);
  }

  // Needs to return l||r
  function u8Concat(uint8 _l, uint8 _r) public pure returns (uint16) {
    return (uint16(_l) << 8) | _r;
  }

  // Ranks a given input array
  function rank(int128[] memory input) public pure returns (uint8[] memory) {
    // Ranks the given input array
    uint8[] memory ranked = new uint8[](input.length);
    uint8[] memory result = new uint8[](input.length);

    for (uint8 i = 0; i < input.length; i++){
      uint8 curRank = 0;
      for (uint8 j = 0; j < i; j++){
        if(input[j] > input[i]){
          curRank++;
        }
        else{
          ranked[j]++;
        }
      }
      ranked[i] = curRank;
    }

    for (uint8 i = 0; i < ranked.length; i++){
      result[ranked[i]] = i;
    }
    return result;
  }
}
