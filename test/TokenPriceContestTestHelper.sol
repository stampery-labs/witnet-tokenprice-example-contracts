pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "../contracts/TokenPriceContest.sol";


contract TokenPriceContestTestHelper is TokenPriceContest {
  uint256 timestamp;

  constructor (uint256 _firstDay, uint8 _tokenLimit, address _wbi, uint256 _requestFee, uint256 _resultFee) TokenPriceContest(_firstDay, _tokenLimit, _wbi, _requestFee,_resultFee) public {}

  function setTimestamp(uint256 _timestamp) public returns (uint256){
    timestamp = _timestamp;
  }

  function getTimestamp() public view returns (uint256){
    return timestamp;
  }
}