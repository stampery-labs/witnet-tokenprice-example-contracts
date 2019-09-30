pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "witnet-ethereum-bridge/contracts/WitnetBridgeInterface.sol";


contract WitnetBridgeInterfaceHelper is WitnetBridgeInterface {
  event PostedResult(bytes, uint256 _id);
  constructor (address _blockRelayAddress) WitnetBridgeInterface(_blockRelayAddress) public {}

  function setDrResult(bytes memory _result, uint256 _id) public returns(uint256) {
    requests[_id].result = _result;
    emit PostedResult(_result, _id);
  }
}