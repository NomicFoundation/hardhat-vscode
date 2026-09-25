---
"hardhat-solidity": patch
"@nomicfoundation/solidity-language-server": patch
"@nomicfoundation/coc-solidity": patch
---

Prevent a language server crash on Node 24.20 when fetching the latest solc versions fails, by not retrying the request.
