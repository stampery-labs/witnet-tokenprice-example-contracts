pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract TokenPriceContest {

  // states define the action allowed in the current window
  enum DayState{BET, WAIT, RESOLVE, PAYOUT, FINAL}
  struct TokenDay{
    uint256 totalAmount;
    mapping (address => uint256) participations;
  }

  struct DayInfo{
    // total prize for a day
    uint256 grandPrize;
    // state of the day
    DayState state;
    // ordered ranking after result has been resolved
    uint8[] ranking;
    // result as given by the data request (floats multiplied by 10000)
    int128[] result;
    // id of the data request inserted in the WBI
    uint256 witnetRequestId;
  }

  // mapping containing the day info
  mapping(uint8 => DayInfo) dayInfos;
  // uint16 contains two uint8 refering to day||TokenId
  mapping (uint16 => TokenDay[]) bets;
  // first day from which start counting to enable certain operations
  uint256 public firstDay;

  constructor (uint256 _firstDay) public {
    // TODO: Verify that firstDay is valid? after block.timestamp?
    firstDay = _firstDay;
  }

  // Executes data request
  function placeBet(uint8 _tokenId) public {
    // calculateDay
    // if previous day keeps been in BET state, put it in WAIT
    // u8Concat
    // bets upsert (TokenDay and DayInfo)
  }

  // Executes data request
  function resolve(uint8 _day) public payable {
    // This method should check that day is at most current_day - 2
    // This method should "only" be callable if state is WAIT or BET
    // Post result into WBI and set the state (PAYOUT) and request ID in DayInfo
  }

  // Pays out upon data request resolution
  function payout(uint8 _day) public payable {
    // This method should only be callable once a day
    // This method should only be callable if the data request has been resolved
    // Read result from WBI and set the result, ranking and state (FINAL) in DayInfo
    // If result successful pay participants that bet on the winning asset
    // Else refund participants
  }

  // Reads totalamount bet for a day||token
  function totalAmountTokenDay(uint8 _day, uint8 _tokenId) public view returns (uint256) {
    // read totalAmount from bets[u8Concat]
  }

  // Reads your participations for a given day
  function readMyBetsDay(uint8 _day) public view returns (uint256[] memory) {
    // uint256[] result
    // offset = u8Concat for first tokenId
    // Iterate from 0 to tokens.length()
      // result[i] = bets[i+offset].participations[msg.address]
   // Result contains participations ordered by token
  }

  // Reads information for a given day
  function getDayInfo(uint8 _day) public view returns (DayInfo memory) {
    // return dayInfos[_day]
  }

  // Read last block timestamp and calculate difference with firstDay timestamp
  function calculateDay() public view returns (uint8) {
    uint256 daysDiff = (block.timestamp - firstDay) / 86400;

    return uint8(daysDiff);
  }

  // Needs to return l||r
  function u8Concat(uint8 _l, uint8 _r) public pure returns (uint16) {
    return (uint16(_l) << 8) | _r;
  }

  // Ranks a given input array
  function rank(int128[] memory input) public pure returns (uint8[] memory){
    // Ranks the given input array
  }

}