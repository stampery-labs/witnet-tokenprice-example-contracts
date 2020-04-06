pragma solidity >=0.5.3 <0.7.0;
pragma experimental ABIEncoderV2;

import "../contracts/TokenPriceContest.sol";

contract TokenPriceContestTestHelper is TokenPriceContest {
  uint256 timestamp;

  constructor (uint256 _firstDay, uint256 _contestPeriod, uint8 _tokenLimit, address _wbi, uint256 _requestFee, uint256 _resultFee) TokenPriceContest(_firstDay, _contestPeriod, _tokenLimit, _wbi, _requestFee,_resultFee) public {}

  function setTimestamp(uint256 _timestamp) public returns (uint256){
    timestamp = _timestamp;
  }

  function getTimestamp() public view override returns (uint256){
    return timestamp;
  }

  function u8ConcatPub(uint8 _l, uint8 _r) public pure returns (uint16) {
    return u8Concat(_l, _r);
  }

  function rankPub(int128[] memory input) public pure returns (uint8[] memory) {
    return rank(input);
  }
}