import { ethers, web3 } from "hardhat"
import type { ContractTransaction, ContractReceipt } from "@ethersproject/contracts"
export const getTransactionReceipt = async (
    txResponse: ContractTransaction,
    waitConfirmations: number
): Promise<ContractReceipt> => {
    const txReceipt = await txResponse.wait(waitConfirmations)
    return txReceipt
}

export const getTargetEvent = async (
    txReceipt: ContractReceipt,
    targetEventName: string
): Promise<any> => {
    const targetEvent = txReceipt.events?.find((event) => event.event === targetEventName)
    return targetEvent
}

export const encodeParams = (types: string[], values: any[], packed = false): string => {
    if (!packed) {
        return web3.eth.abi.encodeParameters(types, values)
    } else {
        return ethers.utils.solidityPack(types, values)
    }
}
