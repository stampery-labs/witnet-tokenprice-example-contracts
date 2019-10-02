pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "witnet-ethereum-bridge/contracts/UsingWitnet.sol";
import "./requests/TokenGradient.sol";


/**
 * @title Token Price Contest
 * @notice Contract for creating a contest in which one can bet on token prices
 * @author Stampery Labs
 */
contract TokenPriceContest is UsingWitnet {

  // Event emitted when a bet is placed by a contest participant
  event BetPlaced(uint8 day, uint8 tokenId, address sender, uint256 value);

  // Event emitted when a contest resolve is triggered (i.e. Data Request is sent out)
  event ResolveTriggered(uint8 day, uint256 requestId, address sender);

  // Event is emitted when a contest result is read (i.e. Data Request is resolved and its result read)
  event ResultRead(uint8 day, uint256 requestId, bool result, address sender);

  // Timestamp (as seconds since unix epoch) from which the constest starts counting (to enable certain operations)
  uint256 public firstDay;

  // Fees to include for the data request
  uint256 public requestFee;

  // Fees to include for the report result
  uint256 public resultFee;

  // Time period for each contest
  uint256 public contestPeriod;

  // Number of tokens in the contest
  uint8 public tokenLimit;

  // Witnet Data Request for tokens
  Request tokenGradientRequest;

  // States define the action allowed in the current contest window
  enum DayState{BET, WAIT, RESOLVE, WAIT_RESULT, PAYOUT, INVALID}

  // Structure with token participations in a contest period (e.g. day)
  struct TokenDay {
    uint256 totalAmount;
    mapping (address => uint256) participations;
    mapping (address => bool) paid;
  }

  // Mapping of token participations
  // Key: `uint16` contains two uint8 refering to day||TokenId
  mapping (uint16 => TokenDay) bets;

  // Structure with all the current bets information in a contest period (e.g. day)
  struct DayInfo {
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

  // Mapping of day infos
  mapping(uint8 => DayInfo) dayInfos;

  /// @dev Creates a Token Prize Contest
  /// @param _firstDay timestamp of contest start time
  /// @param _contestPeriod time period (in seconds) of each contest window (e.g. a day)
  /// @param _tokenLimit Number of tokens in the contest
  /// @param _wbi address of Witnet Bridge Interface
  /// @param _requestFee fee for data request forward
  /// @param _resultFee fee for data request result
  constructor(
    uint256 _firstDay,
    uint256 _contestPeriod,
    uint8 _tokenLimit,
    address _wbi,
    uint256 _requestFee,
    uint256 _resultFee) UsingWitnet(_wbi) public
  {
    firstDay = _firstDay;
    contestPeriod = _contestPeriod;
    tokenLimit = _tokenLimit;
    requestFee = _requestFee;
    resultFee = _resultFee;
    tokenGradientRequest = new TokenGradientRequest();
  }

  /// @dev Gets the timestamp of the current block as seconds since unix epoch
  /// @return timestamp
  function getTimestamp() public view returns (uint256) {
    return block.timestamp;
  }

  /// @dev Places a bet on a token identifier
  /// @param _tokenId token identifier
  function placeBet(uint8 _tokenId) public payable {
    require(msg.value > 0, "Should insert a positive amount");
    require(_tokenId < tokenLimit, "Should insert a valid token identifier");

    // Calculate the day of the current bet
    uint8 betDay = getCurrentDay();
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

  /// @dev Resolves a contest day if it is in RESOLVE state
  /// @param _day contest day to be resolved
  function resolve(uint8 _day) public payable {
    // Check if BET is allowed
    require(msg.value >= requestFee + resultFee, "Not enough value to resolve the data request");
    require(getDayState(_day) == DayState.RESOLVE, "Should be in RESOLVE state");

    // Post Witnet data request
    uint256 requestId = witnetPostRequest(tokenGradientRequest, requestFee, resultFee);
    dayInfos[_day].witnetRequestId = requestId;

    emit ResolveTriggered(_day, requestId, msg.sender);
  }

  /// @dev Pays out upon data request resolution (i.e. state should be `WAIT_RESULT` or `PAYOUT`)
  /// @param _day contest day of the payout
  function payout(uint8 _day) public payable {
    require(
      (getDayState(_day) == DayState.WAIT_RESULT) || (getDayState(_day) == DayState.PAYOUT),
      "Should be in WAIT_RESULT or PAYOUT state"
    );

    // Result has not been read yet (first time)
    if (dayInfos[_day].witnetReadResult == false) {
      Witnet.Result memory result = witnetReadResult(dayInfos[_day].witnetRequestId);
      dayInfos[_day].witnetReadResult = true;
      emit ResultRead(_day, dayInfos[_day].witnetRequestId, result.isOk(), msg.sender);
      if (result.isOk()) {
        int128[] memory requestResult = result.asInt128Array();
        uint8[] memory ranked = rank(requestResult);
        dayInfos[_day].result = requestResult;
        dayInfos[_day].ranking = ranked;
      }
    }

    // Result was read but with an error (payout participations)
    if (dayInfos[_day].result.length == 0) {
      uint16 offset = u8Concat(_day, 0);
      for (uint16 i = 0; i<tokenLimit; i++) {
        if (bets[i+offset].paid[msg.sender] == false &&
          bets[i+offset].participations[msg.sender] > 0) {
          bets[i+offset].paid[msg.sender] = true;
          msg.sender.transfer(bets[i+offset].participations[msg.sender]);
        }
      }
    } else { // Result is Ok (payout to winners)
      // Check legit payout
      uint16 dayTokenId = u8Concat(_day, dayInfos[_day].ranking[0]);
      require(bets[dayTokenId].paid[msg.sender] == false, "Address already paid");
      require(bets[dayTokenId].participations[msg.sender] > 0, "Address has no bets in the winning token");
      // Prize calculation
      uint256 grandPrize = dayInfos[_day].grandPrize;
      uint256 winnerAmount = bets[dayTokenId].totalAmount;
      uint256 prize_share = grandPrize / winnerAmount;
      uint256 prize = bets[dayTokenId].participations[msg.sender] * prize_share;
      // Set paid flag and Transfer
      bets[dayTokenId].paid[msg.sender] = true;
      msg.sender.transfer(prize);
    }
  }

  /// @dev Gets a contest day state
  /// @param _day contest day
  /// @return day state
  function getDayState(uint8 _day) public returns (DayState) {
    uint8 currentDay = getCurrentDay();
    if (_day == currentDay) {
      return DayState.BET;
    } else if (_day > currentDay) {
      // Bet in the future
      return DayState.INVALID;
    } else if (dayInfos[_day].grandPrize == 0) {
      // BetDay is in the past but there were no bets
      return DayState.PAYOUT;
    } else if (_day == currentDay - 1) {
      // Waiting day
      return DayState.WAIT;
    } else if (dayInfos[_day].witnetRequestId == 0) {
      // BetDay is in the past with bets but no DR yet
      return DayState.RESOLVE;
    } else if (!dayInfos[_day].witnetReadResult) {
      // BetDay is in the past with bets and DR but no result yet
      return DayState.WAIT_RESULT;
    }  else {
      // BetDay is in the past with bets, DR and the results
      return DayState.PAYOUT;
    }
  }

  /// @dev Checks if the day contest result is ready to be read
  /// @param _day contest day
  /// @return true, if result is ready
  function isResultReady(uint8 _day) public view returns(bool) {
    (,,,bytes memory result,,,) = wbi.requests(dayInfos[_day].witnetRequestId);
    return result.length > 0;
  }

  /// @dev Reads the total amount bet for a day and a token identifier
  /// @param _day contest day
  /// @param _tokenId token identifier
  /// @return total amount of bets
  function getTotalAmountTokenDay(uint8 _day, uint8 _tokenId) public view returns (uint256) {
    return bets[u8Concat(_day, _tokenId)].totalAmount;
  }

  /// @dev Reads the participations of the sender for a given day
  /// @param _day contest day
  /// @return array with the participations for each token
  function getMyBetsDay(uint8 _day) public view returns (uint256[] memory) {
    uint256[] memory results = new uint256[](tokenLimit);
    uint16 offset = u8Concat(_day, 0);
    for (uint16 i = 0; i<tokenLimit; i++) {
      results[i] = bets[i+offset].participations[msg.sender];
    }

    return results;
  }

  /// @dev Reads day information
  /// @param _day contest day
  /// @return day info structure
  function getDayInfo(uint8 _day) public view returns (DayInfo memory) {
    return dayInfos[_day];
  }

  /// @dev Read last block timestamp and calculate difference with firstDay timestamp
  /// @return index of current day
  function getCurrentDay() public returns (uint8) {
    uint256 timestamp = getTimestamp();
    uint256 daysDiff = (timestamp - firstDay) / contestPeriod;

    return uint8(daysDiff);
  }

  /// @dev Concatenates two `uint8`
  /// @param _l left component
  /// @param _r right component
  /// @return _l||_r
  function u8Concat(uint8 _l, uint8 _r) internal pure returns (uint16) {
    return (uint16(_l) << 8) | _r;
  }

  /// @dev Ranks a given input array
  /// @param input array to be ordered
  /// @return ordered array
  function rank(int128[] memory input) internal pure returns (uint8[] memory) {
    // Ranks the given input array
    uint8[] memory ranked = new uint8[](input.length);
    uint8[] memory result = new uint8[](input.length);

    for (uint8 i = 0; i < input.length; i++) {
      uint8 curRank = 0;
      for (uint8 j = 0; j < i; j++) {
        if (input[j] > input[i]) {
          curRank++;
        } else {
          ranked[j]++;
        }
      }
      ranked[i] = curRank;
    }

    for (uint8 i = 0; i < ranked.length; i++) {
      result[ranked[i]] = i;
    }
    return result;
  }
}
