pragma solidity >=0.5.3 <0.7.0;
pragma experimental ABIEncoderV2;

import "witnet-ethereum-bridge/contracts/WitnetRequestsBoard.sol";

contract WitnetRequestsBoardTestHelper is WitnetRequestsBoard {
  event PostedResult(bytes, uint256 _id);
  constructor (address _blockRelayAddress, uint8 _repFactor) WitnetRequestsBoard(_blockRelayAddress, _repFactor) public {}

  function setDrResult(bytes memory _result, uint256 _id) public returns(uint256) {
    requests[_id].result = _result;
    emit PostedResult(_result, _id);
  }
}