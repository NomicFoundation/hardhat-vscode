# Foundry example workspace

A small Foundry project for the language server harness, made with `forge init --no-git` on foundry 1.7.1. It adds these on top of the generated project:

- `solc = "0.8.30"` in `foundry.toml`, so the compiler doesn't depend on which versions are cached;
- `remappings.txt`, with `@counter/` pointing at `src/`;
- `src/CounterGroup.sol` and its test, which import `Counter` through that remapping, so definition and references have a cross-file target.

`lib/` is gitignored. `node scripts/harness/main.ts init` installs forge-std into it:

```shell
forge install --no-git foundry-rs/forge-std@v1.16.2
```

Build and test with `forge build` and `forge test`.
