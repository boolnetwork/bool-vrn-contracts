import * as fs from "fs"
import { ethers } from "hardhat"
import { Contract } from "ethers"
import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

/** 1. Define your preamble */
const tag = "test"
const contractName = "MockVRNConsumer"
let targetC: Contract
let whetherLog = true
let deployer: SignerWithAddress

const deployMockVRNConsumer: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, network } = hre
    const { deploy, log } = deployments
    const chainId = network.config.chainId as any
    deployer = (await ethers.getSigners())[0]

    /** 2. Define where to store your deployment results */
    const deploymentDataPath = `./configs/contract-address.json`
    let deploymentData = JSON.parse(fs.readFileSync(deploymentDataPath, "utf8"))

    /** 3. Define your deployment args */
    let deploymentArgs: any
    deploymentArgs = [deploymentData[chainId]["VRNPort"]]

    /** 4. Start the contract Deployment */
    log("  --------------------<CONTRACT>-Deployment-Start--------------------")
    log(`******Deploying <${contractName}> to ${network.name}-${chainId} network******`)

    const deploymentReceipt = await deploy(contractName, {
        from: deployer.address,
        args: deploymentArgs,
        log: whetherLog,
    })

    targetC = await ethers.getContractAt(contractName, deploymentReceipt.address)
}

export default deployMockVRNConsumer
deployMockVRNConsumer.tags = [tag, contractName.toLowerCase()]
deployMockVRNConsumer.dependencies = ["vrnport"]
