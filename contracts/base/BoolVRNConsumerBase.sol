// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IBoolVRNConsumerBase} from "../interfaces/IBoolVRNConsumerBase.sol";
import {IVRNPort} from "../interfaces/IVRNPort.sol";

abstract contract BoolVRNConsumerBase is IBoolVRNConsumerBase {
    /** State Variables */
    // Address of the VRNPort contract.
    IVRNPort public override vrnPort;

    constructor(IVRNPort vrnPort_) {
        vrnPort = vrnPort_;
    }

    /** Core Function */
    /**
     * @notice Requests a random number from the VRNPort contract.
     * @param fee Service fee per request.  Call 'getVRNPortFee' function to get the value.
     * @param requestId The ID of the request.
     */
    function _requestRandomNumber(uint256 fee) internal returns (uint256 requestId) {
        requestId = vrnPort.requestRandomNumber{value: fee}();
    }

    /**
     * @notice Returns a random number for a given requestId when the VRNPort has fulfilled the request.
     * @param requestId The ID of the request.
     */
    function _getRandomNumber(uint256 requestId) internal view returns (uint256 randomNumber) {
        randomNumber = vrnPort.getRandomNumber(requestId);
    }

    /**
     * @notice Returns the fee required to request a random number.
     * @return fee The fee required to request a random number.
     */
    function getVRNPortFee() public view returns (uint256 fee) {
        fee = vrnPort.fee();
    }
}
