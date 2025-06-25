import { HardhatUserConfig } from 'hardhat/config'

const config: HardhatUserConfig = {
  solidity: {
    profiles: {
      default: {
        compilers: [{ version: '0.8.28' }, { version: '0.7.0' }],
      },
    },
  },
}

export default config
