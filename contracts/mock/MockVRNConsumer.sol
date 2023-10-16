// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IVRNPort} from "../interfaces/IVRNPort.sol";

import {BoolVRNConsumerBase} from "../base/BoolVRNConsumerBase.sol";

/**
 * @title MockVRNConsumer
 * @notice A testing instance inheriting from BoolVRNConsumerBase.sol
 */
contract MockVRNConsumer is Ownable, BoolVRNConsumerBase {
    /** Events */
    event PuzzleStarted(uint256 time, uint256 requestId);
    event PuzzleEnded(uint256 time, uint256 requestId, uint256 result);

    /** State Variables */
    uint256 public lastRequestId;
    uint256 public lastPuzzleResult;

    /** Constructor */
    constructor(address port) BoolVRNConsumerBase(IVRNPort(port)) {}

    /** Mock Utility Function */
    // Request a RN
    function startPuzzle() external payable {
        uint256 requestId = _requestRandomNumber(msg.value);
        lastRequestId = requestId;
        emit PuzzleStarted(block.timestamp, requestId);
    }

    // Execute with a generated RN
    function getPuzzleResult() external onlyOwner {
        lastPuzzleResult = _getRandomNumber(lastRequestId);
        emit PuzzleEnded(block.timestamp, lastRequestId, lastPuzzleResult);
    }
}
