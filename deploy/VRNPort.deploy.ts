import * as fs from "fs"
import { ethers } from "hardhat"
import { Contract } from "ethers"
import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { DEPLOYMENT_RECORD_FRAMEWORK } from "../utils/constants"

/** 1. Define your preamble */
const tag = "all"
const contractName = "VRNPort"
let targetC: Contract
let whetherLog = true
let deployer: SignerWithAddress

const deployVRNPort: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, network } = hre
    const { deploy, log } = deployments
    const chainId = network.config.chainId as any
    deployer = (await ethers.getSigners())[0]

    /** 2. Define where to store your deployment results */
    const deploymentDataPath = `./configs/contract-address.json`
    let deploymentData = JSON.parse(fs.readFileSync(deploymentDataPath, "utf8"))

    /** 3. Define your deployment args */
    let deploymentArgs: any
    deploymentArgs = []

    /** 4. Start the contract Deployment */
    log("  --------------------<CONTRACT>-Deployment-Start--------------------")
    log(`******Deploying <${contractName}> to ${network.name}-${chainId} network******`)

    const deploymentReceipt = await deploy(contractName, {
        from: deployer.address,
        args: deploymentArgs,
        log: whetherLog,
    })

    targetC = await ethers.getContractAt(contractName, deploymentReceipt.address)

    /** 5. Define how to save your deployment results */
    let nullRecord = DEPLOYMENT_RECORD_FRAMEWORK
    let isInRecord = false

    for (let id in deploymentData) {
        if (id === chainId.toString()) {
            deploymentData[id][contractName] = targetC.address
            isInRecord = true
        }
    }
    // Initialize the record if it is not in the record
    if (!isInRecord) {
        deploymentData[chainId] = nullRecord
        deploymentData[chainId][contractName] = targetC.address
    }

    fs.writeFileSync(deploymentDataPath, JSON.stringify(deploymentData))
}

export default deployVRNPort
deployVRNPort.tags = ["test", tag, contractName.toLowerCase()]
deployVRNPort.dependencies = []
