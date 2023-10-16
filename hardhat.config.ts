import { HardhatUserConfig } from "hardhat/config"

import "@typechain/hardhat"
import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-web3"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-etherscan"
import "dotenv/config"
import "hardhat-deploy"
import "hardhat-gas-reporter"
import "solidity-coverage"

// zkSync specific plugins
import "@matterlabs/hardhat-zksync-deploy"
import "@matterlabs/hardhat-zksync-solc"
import "@matterlabs/hardhat-zksync-verify"

import "./tasks"

/**####MAINNET CONFIGS##### */
const ETHEREUM_MAINNET_RPC_URL = process.env.ETHEREUM_MAINNET_RPC_URL || "https://rpc.ankr.com/eth"

/**####TESTNET CONFIGS##### */
const ETHEREUM_GOERLI_RPC_URL =
    process.env.ETHEREUM_GOERLI_RPC_URL || "https://rpc.ankr.com/eth_goerli"

function accounts() {
    return { mnemonic: getMnemonic() }
}

function getMnemonic() {
    const mnemonic = process.env.MNEMONIC
    if (!mnemonic || mnemonic === "") {
        return "test test test test test test test test test test test test"
    }

    return mnemonic
}

// Hardhat user-specific configs
const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            // // If you want to do some forking, uncomment this
            // forking: {
            //     url: process.env.ZKSYNC_GOERLI_RPC_URL || "https://testnet.era.zksync.dev",
            // },
            chainId: 31337,
            zksync: false,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
            saveDeployments: true,
            zksync: false,
        },
        /** TestNets */
        ethereum_goerli: {
            url: ETHEREUM_GOERLI_RPC_URL,
            accounts: accounts(),
            saveDeployments: true,
            chainId: 5,
            zksync: false,
        },
        linea_goerli: {
            url: "https://rpc.goerli.linea.build",
            accounts: accounts(),
            saveDeployments: true,
            chainId: 59140,
            zksync: false,
        },
        zksync_goerli: {
            url: process.env.ZKSYNC_GOERLI_RPC_URL || "https://testnet.era.zksync.dev",
            accounts: accounts(),
            ethNetwork: ETHEREUM_GOERLI_RPC_URL,
            saveDeployments: true,
            chainId: 280,
            zksync: true,
        },
        zksync_local: {
            url: "http://localhost:3050",
            ethNetwork: "http://localhost:8545",
            zksync: true,
        },
        /** MainNets */
        ethereum_mainnet: {
            url: ETHEREUM_MAINNET_RPC_URL,
            accounts: accounts(),
            saveDeployments: true,
            chainId: 1,
            zksync: false,
        },
        linea_mainnet: {
            url: "https://rpc.linea.build",
            accounts: accounts(),
            saveDeployments: true,
            chainId: 59144,
            zksync: false,
        },
        zksync_era: {
            url: process.env.ZKSYNC_MAINNET_RPC_URL || "https://mainnet.era.zksync.io",
            accounts: accounts(),
            ethNetwork: ETHEREUM_MAINNET_RPC_URL,
            saveDeployments: true,
            chainId: 324,
            zksync: true,
        },
    },
    gasReporter: {
        enabled: false,
        //process.env.REPORT_GAS !== undefined ? true : false,
        token: "ETH",
        currency: "USD",
        outputFile: "./gas-reports.txt",
        noColors: true,
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        gasPrice: 30,
        gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.18",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 50,
                    },
                },
            },
        ],
    },
    zksolc: {
        version: "latest",
        compilerSource: "binary",
        settings: {},
    },
    mocha: {
        timeout: 200000,
    },
}

export default config
