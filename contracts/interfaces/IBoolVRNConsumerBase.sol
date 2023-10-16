// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IVRNPort} from "../interfaces/IVRNPort.sol";

interface IBoolVRNConsumerBase {
    /**
     * @notice Returns the instance of the VRNPort contract.
     */
    function vrnPort() external view returns (IVRNPort);
}
