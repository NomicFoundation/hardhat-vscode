export function isHardhatInstalled(configPath: string): boolean {
  try {
    require.resolve("hardhat", { paths: [configPath] });
    return true;
  } catch (e) {
    return false;
  }
}
