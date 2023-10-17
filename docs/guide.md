# Introduction

This guide elucidates the process of generating random numbers through Bool Network's VRN module, involving interactions such as users paying fees to request random numbers and users proactively invoking calls to consume these random values.

## Configure Your Contract

Configure your contract as follows:

1. Your contract, e.g. `MockVRNConsumer`, must inherit from `BoolVRNConsumerBase`.
2. Pass the address of the `VRNPort` contract to the constructor of `MockVRNConsumer`.

## Request a Random Number

1. Submit a random number request by invoking `_requestRandomNumber` function defined in `BoolVRNConsumerBase`.
2. Include the following parameters in your request:
    - `fee`: Indicates the fee required for the current request. One can call `getVRNPortFee` function to fetch the value before initiating the request transaction.
3. The `VRNPort` contract returns a unique `requestId` for each request and triggers the event `RandomNumberRequested`.

## Consume a fulfilled VRN request

Once a request has been initiated, you must wait for the random number to be generated and then invokes `VRNPort` to fetch it:

1. `Bool Network` will submit the generated random number with the corresponding signature to `VRNPort`.
2. `VRNPort` triggers the event `RandomNumberReceived` including the unique `requestId`.
3. Developers listen to events from `VRNPort` for a specific `requestId` where a filter based on the `requester` parameter is recommended.
4. Users call the consumer contract to retrieve the random number for the given `requestId` from `VRNPort` and proceed with subsequent logic.

## Example

## Requirements

This guide assumes that you are familiar with how to create and deploy smart contracts on EVM-compatible networks using the following tools:

[Remix IDE](https://remix.ethereum.org/)

[MetaMask](https://metamask.io/)

### Deploying

This tutorial utilizes the `MockVRNConsumer.sol` contract as an example. The contract inherits from the `BoolVRNConsumerBase.sol` contract and imports the `IVRNProt.sol` interface. To deploy a `MockVRNConsumer` instance, you need to pass the contract address of a `VRNPort` to the constructor, which is deployed on different chains by the Bool Network team.

Compile and deploy the contract on Linea goerli.

1. Open the `MockVRNConsumer.sol` contract in Remix.
2. Click the `Compile` button to compile the `MockVRNConsumer.sol` contract.
3. On the deployment page, select the `MockVRNConsumer` contract from the contract list, click `Deploy`, and confirm the transaction in MetaMask.
4. After deploying the contract, you can find an instance of `MockVRNConsumer` contract in the deployment list.

### Requesting

The deployed contract can request a random number from `VRNPort`. One can initiate a request by executing the `startPuzzle` function. This transaction requires a fee in the local GAS token, e.g. ETH, which can be obtained by calling the `getVRNPortFee` function.

1. In the list of deployed contracts, select the `MockVRNConsumer` contract, and click on the `getVRNPortFee` function to query the fee, denoted as **Fee**, for a single random number request.
2. Input the value **Fee** in the `VALUE` field of the transaction, click the `startPuzzle` function, and the contract will request a random number from `VRNPort`.
3. Confirm and sign the transaction via MetaMask.

### Consuming

When the request has been sent, it may take several minutes to generate a random number. Once the random number for a specific `requestId` has been set in `VRNPort`, one trigger a transaction to consume it.

1. To obtain the `requestId`, call the `lastRequestId()` function.
2. The status and the random number associated with the `requestId` will be updated by the system once the random number has been generated.
3. Invoke the `getPuzzleResult` function with the corresponding `requestId`.
