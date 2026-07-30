---
"@nomicfoundation/solidity-language-server": patch
"hardhat-solidity": patch
"@nomicfoundation/coc-solidity": patch
---

Remember solc versions across restarts so a failed version fetch no longer blocks validation.

The list of available solc versions was rebuilt on every start from a hardcoded list plus a network fetch. When the fetch failed - offline, VPN, proxy, or just a slow response - the server silently fell back to the hardcoded list, which had not been updated since 0.8.16. Any project requiring something newer then failed with "No available solc version satisfying ...".

The bundled list is now up to date (through 0.8.36), versions fetched at least once are persisted and reused, hardhat's own compiler list is used as an additional offline source, and the fetch no longer blocks initialization. The error message when no version matches now reports the deduplicated requirement and which versions were actually available.
