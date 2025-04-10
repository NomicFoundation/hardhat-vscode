import { HardhatUserConfig } from 'hardhat/config'

const config: HardhatUserConfig = {
  solidity: {
    profiles: {
      default: {
        version: '0.8.28',
      },
      production: {
        version: '0.8.28',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
    remappings: [
      'local/=contracts/definition/imports/',
      'pkg_without_exports_2_through_remapping/=npm/pkg_without_exports_2@1.0.0/src/',
      'pkg_with_exports_2_through_remapping/=npm/pkg_with_exports_2@1.0.0/',
    ],
  },
}

export default config
