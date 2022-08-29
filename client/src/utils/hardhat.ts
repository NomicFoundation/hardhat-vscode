export function isHardhatInstalled(configPath: string): boolean {
  try {
    require.resolve("hardhat", { paths: [configPath] });
    return true;
  } catch (e) {
    return false;
  }
}

export function getHardhatCLIPath(configPath: string): string {
  try {
    return require.resolve("hardhat/internal/cli/cli", {
      paths: [configPath],
    });
  } catch (e) {
    throw new Error("Hardhat CLI not found");
  }
}
