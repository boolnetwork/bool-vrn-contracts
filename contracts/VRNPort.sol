// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import {IVRNPort} from "./interfaces/IVRNPort.sol";

contract VRNPort is Ownable, IVRNPort {
    /** General State Variables */
    // signifies whether the contract has been initialized
    bool public initialized;
    // records the Bool-specific information
    BoolInfo private _info;

    /** Fee */
    // amount in GAS token to cover the cost of the VRN generation
    uint256 public override fee;
    // address to receive the fee
    address public feeReceiver;

    /** Random Number */
    uint256 private _lastRequestId;
    // requestId => random number
    mapping(uint256 => uint256) private _randomNumbers;
    // requestId => set status
    mapping(uint256 => bool) private _randomNumberIsSet;

    /** Initialization */
    function initialize(
        uint256 chainId_,
        uint256 bId_,
        uint256 eId_,
        address committee_,
        uint256 fee_,
        address feeReceiver_
    ) public onlyOwner {
        require(!initialized, "INITIALIZED");
        _info = BoolInfo(chainId_, bId_, eId_, committee_);
        fee = fee_;
        feeReceiver = feeReceiver_;
        initialized = true;
    }

    /** Core Functions */
    function requestRandomNumber() public payable override returns (uint256 requestId) {
        // Check if the service fee is sufficient
        require(msg.value == fee, "INVALID_FEE");

        // Get the corresponding request ID
        requestId = ++_lastRequestId;

        // Emit the event
        BoolInfo memory info_ = _info;
        emit RandomNumberRequested(requestId, msg.sender, info_.bId, info_.eId, info_.chainId);

        _transferFee(fee);
    }

    function setRandomNumber(
        RandomNumberFeed calldata feed,
        bytes calldata signature
    ) public override {
        require(!_randomNumberIsSet[feed.requestId], "ALREADY_SET");
        // Validate the feed
        validateFeed(feed);
        // Verify the signature
        require(verifySignature(feed, signature), "INVALID_SIGNATURE");
        // Set the random number and the status of the request ID
        _randomNumbers[feed.requestId] = feed.randomNumber;
        _randomNumberIsSet[feed.requestId] = true;
        emit RandomNumberReceived(feed.requestId, feed.requester);
    }

    /** Set Fee Parameters */
    function setFee(uint256 fee_) public onlyOwner {
        fee = fee_;
        emit FeeUpdated(fee);
    }

    function setFeeReceiver(address feeReceiver_) public onlyOwner {
        feeReceiver = feeReceiver_;
        emit FeeReceiverUpdated(feeReceiver_);
    }

    /** Internal/Private Functions */
    function _transferFee(uint256 amount) internal {
        (bool success, ) = payable(feeReceiver).call{value: amount}("");
        require(success, "FEE_TRANSFER_FAILED");
    }

    /** View/Pure Functions */
    function info() public view override returns (BoolInfo memory) {
        return _info;
    }

    function getRequestId() public view override returns (uint256) {
        return _lastRequestId;
    }

    function getRandomNumber(uint256 requestId) public view override returns (uint256) {
        require(_randomNumberIsSet[requestId], "NOT_SET");
        return _randomNumbers[requestId];
    }

    function validateFeed(RandomNumberFeed calldata feed) public view override {
        BoolInfo memory info_ = _info;
        require(feed.chainId == info_.chainId, "INVALID_CHAIN_ID");
        require(feed.port == address(this), "INVALID_PORT");
        require(feed.requestId <= _lastRequestId, "INVALID_REQUEST_ID");
    }

    function verifySignature(
        RandomNumberFeed calldata feed,
        bytes calldata signature
    ) public view override returns (bool) {
        bytes32 signedHash = ECDSA.toEthSignedMessageHash(keccak256(abi.encode(feed)));
        return ECDSA.recover(signedHash, signature) == _info.committee;
    }
}
