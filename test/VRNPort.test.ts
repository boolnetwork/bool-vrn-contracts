import { deployments, ethers, network, web3 } from "hardhat"
import { LOCAL_DEV_NETWORK_NAMES } from "../utils/constants"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

import * as C from "../typechain-types"
import { expect } from "chai"
import { encodeParams, getTargetEvent, getTransactionReceipt } from "../utils/helpers"

let chainId: any
const bId = 123
const eId = 456
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000"
const initialFee = 100
!LOCAL_DEV_NETWORK_NAMES.includes(network.name)
    ? describe.skip
    : describe("VRNPort", () => {
          let deployer: SignerWithAddress
          let feeReceiver: SignerWithAddress
          let committee: SignerWithAddress
          let user: SignerWithAddress
          let attacker: SignerWithAddress
          let portC: C.VRNPort
          let mockConsumerC: C.MockVRNConsumer

          beforeEach(async () => {
              chainId = network.config.chainId

              deployer = (await ethers.getSigners())[0]
              feeReceiver = (await ethers.getSigners())[1]
              committee = (await ethers.getSigners())[2]
              user = (await ethers.getSigners())[3]
              attacker = (await ethers.getSigners())[4]

              const deploymentRes = await deployments.fixture(["test"])

              const portAddress = deploymentRes["VRNPort"].address
              portC = (await ethers.getContractAt("VRNPort", portAddress)) as C.VRNPort

              const mockConsumerAddress = deploymentRes["MockVRNConsumer"].address
              mockConsumerC = (await ethers.getContractAt(
                  "MockVRNConsumer",
                  mockConsumerAddress
              )) as C.MockVRNConsumer

              expect(await mockConsumerC.vrnPort()).to.be.equal(portAddress)
          })

          it("initial states", async () => {
              expect(await portC.initialized()).to.be.equal(false)
              expect(await portC.getRequestId()).to.be.equal(0)
              expect(await portC.fee()).to.be.equal(0)
              expect(await portC.feeReceiver()).to.be.equal(NULL_ADDRESS)

              const info = await portC.info()
              expect(info.chainId).to.be.equal(0)
              expect(info.bId).to.be.equal(0)
              expect(info.eId).to.be.equal(0)
              expect(info.committee).to.be.equal(NULL_ADDRESS)

              await expect(portC.getRandomNumber(0)).to.be.revertedWith("NOT_SET")
          })

          it("initialize()", async () => {
              // onlyOwner
              await expect(
                  portC
                      .connect(attacker)
                      .initialize(
                          chainId,
                          bId,
                          eId,
                          committee.address,
                          initialFee,
                          feeReceiver.address
                      )
              ).to.be.revertedWith("Ownable: caller is not the owner")

              await portC
                  .connect(deployer)
                  .initialize(chainId, bId, eId, committee.address, initialFee, feeReceiver.address)
              expect(await portC.initialized()).to.be.equal(true)

              const info = await portC.info()
              expect(info.chainId).to.be.equal(chainId)
              expect(info.bId).to.be.equal(bId)
              expect(info.eId).to.be.equal(eId)
              expect(info.committee).to.be.equal(committee.address)

              await expect(
                  portC
                      .connect(deployer)
                      .initialize(
                          chainId,
                          bId,
                          eId,
                          committee.address,
                          initialFee,
                          feeReceiver.address
                      )
              ).to.be.revertedWith("INITIALIZED")
          })

          describe("set fee parameters", () => {
              beforeEach(async () => {
                  await portC
                      .connect(deployer)
                      .initialize(
                          chainId,
                          bId,
                          eId,
                          committee.address,
                          initialFee,
                          feeReceiver.address
                      )
              })
              it("set fee", async () => {
                  // onlyOwner
                  await expect(portC.connect(attacker).setFee(0)).to.be.revertedWith(
                      "Ownable: caller is not the owner"
                  )

                  const targetE = await getTargetEvent(
                      await getTransactionReceipt(await portC.connect(deployer).setFee(0), 1),
                      "FeeUpdated"
                  )

                  expect(targetE.args.fee).to.be.equal(0)
                  expect(await portC.fee()).to.be.equal(0)
              })

              it("set fee receiver", async () => {
                  // onlyOwner
                  await expect(
                      portC.connect(attacker).setFeeReceiver(attacker.address)
                  ).to.be.revertedWith("Ownable: caller is not the owner")

                  const targetE = await getTargetEvent(
                      await getTransactionReceipt(
                          await portC.connect(deployer).setFeeReceiver(deployer.address),
                          1
                      ),
                      "FeeReceiverUpdated"
                  )

                  expect(targetE.args.feeReceiver).to.be.equal(deployer.address)
                  expect(await portC.feeReceiver()).to.be.equal(deployer.address)
              })
          })

          describe("request VRNs", () => {
              beforeEach(async () => {
                  // Initialize VRNPort
                  await portC
                      .connect(deployer)
                      .initialize(
                          chainId,
                          bId,
                          eId,
                          committee.address,
                          initialFee,
                          feeReceiver.address
                      )
              })

              it("revert with invalid fee", async () => {
                  const expectedFee = await mockConsumerC.getVRNPortFee()
                  await expect(
                      mockConsumerC.connect(user).startPuzzle({ value: 0 })
                  ).to.be.revertedWith("INVALID_FEE")
                  await expect(
                      mockConsumerC.connect(user).startPuzzle({ value: expectedFee.add(1) })
                  ).to.be.revertedWith("INVALID_FEE")
              })

              it("should request VRNs", async () => {
                  // request one VRN
                  const fee = await mockConsumerC.getVRNPortFee()
                  let preFeeReceiverBalance = await ethers.provider.getBalance(feeReceiver.address)
                  const requestTxReceipt = await getTransactionReceipt(
                      await mockConsumerC.connect(user).startPuzzle({ value: fee }),
                      1
                  )
                  let postFeeReceiverBalance = await ethers.provider.getBalance(feeReceiver.address)
                  const rawPortRequestE = requestTxReceipt.events?.find(
                      (event) => event.address === portC.address
                  )
                  const RNRequestEventABI = [
                      {
                          anonymous: false,
                          inputs: [
                              {
                                  indexed: false,
                                  internalType: "uint256",
                                  name: "requestId",
                                  type: "uint256",
                              },
                              {
                                  indexed: true,
                                  internalType: "address",
                                  name: "requester",
                                  type: "address",
                              },
                              {
                                  indexed: false,
                                  internalType: "uint256",
                                  name: "bId",
                                  type: "uint256",
                              },
                              {
                                  indexed: false,
                                  internalType: "uint256",
                                  name: "eId",
                                  type: "uint256",
                              },
                              {
                                  indexed: false,
                                  internalType: "uint256",
                                  name: "chainId",
                                  type: "uint256",
                              },
                          ],
                          name: "RandomNumberRequested",
                          type: "event",
                      },
                  ]
                  const requestEInterface = new ethers.utils.Interface(RNRequestEventABI)
                  const parsedRequestE = requestEInterface.parseLog(rawPortRequestE!)
                  expect(parsedRequestE.args.requestId).to.be.equal(1)
                  expect(parsedRequestE.args.requester).to.be.equal(mockConsumerC.address)
                  expect(parsedRequestE.args.bId).to.be.equal(bId)
                  expect(parsedRequestE.args.eId).to.be.equal(eId)
                  expect(parsedRequestE.args.chainId).to.be.equal(chainId)

                  expect(postFeeReceiverBalance.sub(preFeeReceiverBalance)).to.be.equal(fee)

                  preFeeReceiverBalance = await ethers.provider.getBalance(feeReceiver.address)
                  // continuous requests
                  const totalRequests = 10
                  for (let i = 0; i < totalRequests; i++) {
                      await mockConsumerC.connect(user).startPuzzle({ value: fee })
                  }
                  postFeeReceiverBalance = await ethers.provider.getBalance(feeReceiver.address)
                  expect(await portC.getRequestId()).to.be.equal(totalRequests + 1)
                  expect(postFeeReceiverBalance.sub(preFeeReceiverBalance)).to.be.equal(fee.mul(10))
              })
          })

          describe("set VRNs", () => {
              let feed: C.IVRNPort.RandomNumberFeedStruct
              let testFeed: C.IVRNPort.RandomNumberFeedStruct
              const randomNumber = 999 // Fixed random number for testing
              beforeEach(async () => {
                  // Initialize VRNPort
                  await portC
                      .connect(deployer)
                      .initialize(
                          chainId,
                          bId,
                          eId,
                          committee.address,
                          initialFee,
                          feeReceiver.address
                      )

                  await mockConsumerC
                      .connect(user)
                      .startPuzzle({ value: await mockConsumerC.getVRNPortFee() })
                  feed = {
                      chainId: chainId,
                      port: portC.address,
                      requester: mockConsumerC.address,
                      requestId: 1,
                      randomNumber: randomNumber,
                  }
              })

              it("should revert with invalid RN feed", async () => {
                  /** 1. invalid chainId */
                  testFeed = { ...feed }
                  testFeed.chainId = 1
                  await expect(
                      portC.connect(attacker).setRandomNumber(testFeed, "0x")
                  ).to.be.revertedWith("INVALID_CHAIN_ID")

                  /** 2. invalid port address */
                  testFeed = { ...feed }
                  testFeed.port = mockConsumerC.address
                  await expect(
                      portC.connect(attacker).setRandomNumber(testFeed, "0x")
                  ).to.be.revertedWith("INVALID_PORT")

                  /** 3. invalid request id */
                  testFeed = { ...feed }
                  testFeed.requestId = 2
                  await expect(
                      portC.connect(attacker).setRandomNumber(testFeed, "0x")
                  ).to.be.revertedWith("INVALID_REQUEST_ID")
              })

              it("should revert with the invalid signature", async () => {
                  const encodedStruct = encodeParams(
                      ["uint256", "address", "address", "uint256", "uint256"],
                      [feed.chainId, feed.port, feed.requester, feed.requestId, feed.randomNumber]
                  )
                  const messageHash = web3.utils.keccak256(encodedStruct)
                  const signature = await attacker.signMessage(ethers.utils.arrayify(messageHash))

                  await expect(
                      portC.connect(attacker).setRandomNumber(feed, signature)
                  ).to.be.revertedWith("INVALID_SIGNATURE")
              })

              it("should set RN with the valid committee's signature", async () => {
                  const encodedStruct = encodeParams(
                      ["uint256", "address", "address", "uint256", "uint256"],
                      [feed.chainId, feed.port, feed.requester, feed.requestId, feed.randomNumber]
                  )
                  const messageHash = web3.utils.keccak256(encodedStruct)
                  const signature = await committee.signMessage(ethers.utils.arrayify(messageHash))

                  const targetSetE = await getTargetEvent(
                      await getTransactionReceipt(
                          await portC.connect(attacker).setRandomNumber(feed, signature),
                          1
                      ),
                      "RandomNumberReceived"
                  )

                  expect(targetSetE.args.requestId).to.be.equal(feed.requestId)
                  expect(targetSetE.args.requester).to.be.equal(feed.requester)
                  expect(await portC.getRandomNumber(feed.requestId)).to.be.equal(feed.randomNumber)
              })

              it("should not set a request ID repeatedly", async () => {
                  const encodedStruct = encodeParams(
                      ["uint256", "address", "address", "uint256", "uint256"],
                      [feed.chainId, feed.port, feed.requester, feed.requestId, feed.randomNumber]
                  )
                  const messageHash = web3.utils.keccak256(encodedStruct)
                  const signature = await committee.signMessage(ethers.utils.arrayify(messageHash))

                  await portC.connect(attacker).setRandomNumber(feed, signature)

                  await expect(
                      portC.connect(attacker).setRandomNumber(feed, signature)
                  ).to.be.revertedWith("ALREADY_SET")
              })
          })

          describe("use VRNs", () => {
              let feed: C.IVRNPort.RandomNumberFeedStruct
              let testFeed: C.IVRNPort.RandomNumberFeedStruct
              const randomNumber = 999 // Fixed random number for testing
              beforeEach(async () => {
                  // Initialize VRNPort
                  await portC
                      .connect(deployer)
                      .initialize(
                          chainId,
                          bId,
                          eId,
                          committee.address,
                          initialFee,
                          feeReceiver.address
                      )

                  await mockConsumerC
                      .connect(user)
                      .startPuzzle({ value: await mockConsumerC.getVRNPortFee() })
                  feed = {
                      chainId: chainId,
                      port: portC.address,
                      requester: mockConsumerC.address,
                      requestId: 1,
                      randomNumber: randomNumber,
                  }
              })

              it("should revert when not set", async () => {
                  await expect(
                      mockConsumerC.connect(deployer).getPuzzleResult()
                  ).to.be.revertedWith("NOT_SET")
              })

              it("should get VRN when set", async () => {
                  /** Set a VRN */
                  const encodedStruct = encodeParams(
                      ["uint256", "address", "address", "uint256", "uint256"],
                      [feed.chainId, feed.port, feed.requester, feed.requestId, feed.randomNumber]
                  )
                  const messageHash = web3.utils.keccak256(encodedStruct)
                  const signature = await committee.signMessage(ethers.utils.arrayify(messageHash))

                  await portC.connect(attacker).setRandomNumber(feed, signature)

                  /** Use a VRN */
                  const targetE = await getTargetEvent(
                      await getTransactionReceipt(
                          await mockConsumerC.connect(deployer).getPuzzleResult(),
                          1
                      ),
                      "PuzzleEnded"
                  )
                  expect(targetE.args.requestId).to.be.equal(feed.requestId)
                  expect(targetE.args.result).to.be.equal(feed.randomNumber)
                  expect(await mockConsumerC.lastPuzzleResult()).to.be.equal(feed.randomNumber)
              })
          })
      })
