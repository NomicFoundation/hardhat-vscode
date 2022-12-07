import { test } from 'mocha'
import { expect } from 'chai'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makeRange } from '../../../helpers'
import { toUri } from '../../../../src/helpers'

let client!: TestLanguageClient

describe('[hardhat][codeAction]', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    client.closeAllDocuments()
  })

  test('add license identifier', async () => {
    const documentPath = getProjectPath('hardhat/contracts/codeAction/NoLicense.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    const diagnostic = await client.getDiagnostic(documentPath, { message: 'SPDX license identifier not provided' })

    const codeActions = await client.getCodeActions(documentUri, diagnostic)

    const expected = [
      {
        title: 'Add license identifier: MIT',
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/NoLicense.sol':
              [
                {
                  range: {
                    start: {
                      character: 0,
                      line: 0,
                    },
                    end: {
                      character: 0,
                      line: 0,
                    },
                  },
                  newText: '// SPDX-License-Identifier: MIT\n',
                },
              ],
          },
        },
      },
      {
        title: 'Add license identifier: GPL-2.0-or-later',
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/NoLicense.sol':
              [
                {
                  range: {
                    start: {
                      character: 0,
                      line: 0,
                    },
                    end: {
                      character: 0,
                      line: 0,
                    },
                  },
                  newText: '// SPDX-License-Identifier: GPL-2.0-or-later\n',
                },
              ],
          },
        },
      },
      {
        title: 'Add license identifier: GPL-3.0-or-later',
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/NoLicense.sol':
              [
                {
                  range: {
                    start: {
                      character: 0,
                      line: 0,
                    },
                    end: {
                      character: 0,
                      line: 0,
                    },
                  },
                  newText: '// SPDX-License-Identifier: GPL-3.0-or-later\n',
                },
              ],
          },
        },
      },
      {
        title: 'Add license identifier: Unlicense',
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/NoLicense.sol':
              [
                {
                  range: {
                    start: {
                      character: 0,
                      line: 0,
                    },
                    end: {
                      character: 0,
                      line: 0,
                    },
                  },
                  newText: '// SPDX-License-Identifier: Unlicense\n',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)
  })

  test('add multi override specifier', async () => {
    const documentPath = getProjectPath('hardhat/contracts/codeAction/AddMultioverrideSpecifier.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    let diagnostic = await client.getDiagnostic(documentPath, {
      message: 'needs to specify overridden contracts',
      range: makeRange(20, 11, 20, 14),
    })

    let codeActions = await client.getCodeActions(documentUri, diagnostic)

    let expected = [
      {
        title: 'Add override(...) specifier to function definition',
        kind: 'quickfix',
        isPreferred: true,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/AddMultioverrideSpecifier.sol':
              [
                {
                  newText: ' override(Alpha, Gamma)',
                  range: {
                    start: {
                      line: 20,
                      character: 23,
                    },
                    end: {
                      line: 20,
                      character: 23,
                    },
                  },
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)

    diagnostic = await client.getDiagnostic(documentPath, {
      message: 'needs to specify overridden contracts',
      range: makeRange(22, 32, 22, 47),
    })

    codeActions = await client.getCodeActions(documentUri, diagnostic)

    expected = [
      {
        title: 'Add missing contracts to specifier',
        kind: 'quickfix',
        isPreferred: true,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/AddMultioverrideSpecifier.sol':
              [
                {
                  range: {
                    start: {
                      line: 22,
                      character: 32,
                    },
                    end: {
                      line: 22,
                      character: 47,
                    },
                  },
                  newText: 'override(Alpha, Beta, Gamma)',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)
  })

  test('add override specifier', async () => {
    const documentPath = getProjectPath('hardhat/contracts/codeAction/AddOverrideSpecifier.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    const diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(20, 11, 20, 25),
    })

    const codeActions = await client.getCodeActions(documentUri, diagnostic)

    const expected = [
      {
        title: 'Add override specifier to function definition',
        kind: 'quickfix',
        isPreferred: true,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/AddOverrideSpecifier.sol':
              [
                {
                  newText: '    override\n',
                  range: {
                    start: {
                      line: 22,
                      character: 0,
                    },
                    end: {
                      line: 22,
                      character: 0,
                    },
                  },
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)
  })

  test('add pragma version', async () => {
    const documentPath = getProjectPath('hardhat/contracts/codeAction/NoPragma.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    const diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(0, 0, 0, 0),
    })

    const codeActions = await client.getCodeActions(documentUri, diagnostic)

    const expected = [
      {
        title: 'Add version specification',
        kind: 'quickfix',
        isPreferred: true,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/NoPragma.sol':
              [
                {
                  range: {
                    start: {
                      character: 0,
                      line: 1,
                    },
                    end: {
                      character: 0,
                      line: 1,
                    },
                  },
                  newText: 'pragma solidity ^0.8.8;\n',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)
  })

  test('add virtual specifier', async () => {
    const documentPath = getProjectPath('hardhat/contracts/codeAction/AddVirtualSpecifier.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    const diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(4, 11, 4, 15),
    })

    const codeActions = await client.getCodeActions(documentUri, diagnostic)

    const expected = [
      {
        title: 'Add virtual specifier to function definition',
        kind: 'quickfix',
        isPreferred: true,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/AddVirtualSpecifier.sol':
              [
                {
                  newText: ' virtual',
                  range: {
                    start: {
                      line: 4,
                      character: 29,
                    },
                    end: {
                      line: 4,
                      character: 29,
                    },
                  },
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)
  })

  test('constrain mutability - view', async () => {
    const documentPath = getProjectPath('hardhat/contracts/codeAction/ConstrainMutabilityView.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    const diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(6, 11, 6, 21),
    })

    const codeActions = await client.getCodeActions(documentUri, diagnostic)

    const expected = [
      {
        title: 'Add view modifier to function declaration',
        kind: 'quickfix',
        isPreferred: true,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/ConstrainMutabilityView.sol':
              [
                {
                  range: {
                    start: {
                      line: 6,
                      character: 32,
                    },
                    end: {
                      line: 6,
                      character: 32,
                    },
                  },
                  newText: 'view ',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)
  })

  test('constrain mutability - pure', async () => {
    const documentPath = getProjectPath('hardhat/contracts/codeAction/ConstrainMutabilityPure.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    const diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(4, 11, 4, 18),
    })

    const codeActions = await client.getCodeActions(documentUri, diagnostic)

    const expected = [
      {
        title: 'Add pure modifier to function declaration',
        kind: 'quickfix',
        isPreferred: true,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/ConstrainMutabilityPure.sol':
              [
                {
                  range: {
                    start: {
                      line: 4,
                      character: 29,
                    },
                    end: {
                      line: 4,
                      character: 29,
                    },
                  },
                  newText: 'pure ',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)
  })

  test('constrain mutability - modify to pure', async () => {
    const documentPath = getProjectPath('hardhat/contracts/codeAction/ConstrainMutabilityModifyToPure.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    const diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(4, 11, 4, 21),
    })

    const codeActions = await client.getCodeActions(documentUri, diagnostic)

    const expected = [
      {
        title: 'Change view modifier to pure in function declaration',
        kind: 'quickfix',
        isPreferred: true,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/ConstrainMutabilityModifyToPure.sol':
              [
                {
                  range: {
                    start: {
                      line: 4,
                      character: 32,
                    },
                    end: {
                      line: 4,
                      character: 36,
                    },
                  },
                  newText: 'pure',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)
  })

  test('mark contract as abstract or implement interface', async () => {
    const documentPath = getProjectPath('hardhat/contracts/codeAction/MarkAbstract.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    const diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(7, 9, 7, 16),
    })

    const codeActions = await client.getCodeActions(documentUri, diagnostic)

    const expected = [
      {
        title: 'Add missing functions from interfaces',
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/MarkAbstract.sol':
              [
                {
                  range: {
                    start: {
                      line: 7,
                      character: 0,
                    },
                    end: {
                      line: 7,
                      character: 31,
                    },
                  },
                  newText: 'contract Counter is ICounter {\n  function increment() external pure override {}\n}',
                },
              ],
          },
        },
      },
      {
        title: 'Add abstract to contract declaration',
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/MarkAbstract.sol':
              [
                {
                  range: {
                    start: {
                      line: 7,
                      character: 0,
                    },
                    end: {
                      line: 7,
                      character: 0,
                    },
                  },
                  newText: 'abstract ',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)
  })

  test('specify data location', async () => {
    const documentPath = getProjectPath('hardhat/contracts/codeAction/SpecifyDataLocation.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    let diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(5, 14, 5, 26),
    })

    let codeActions = await client.getCodeActions(documentUri, diagnostic)

    let expected = [
      {
        title: "Specify 'memory' as data location",
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyDataLocation.sol':
              [
                {
                  range: {
                    start: {
                      line: 5,
                      character: 14,
                    },
                    end: {
                      line: 5,
                      character: 26,
                    },
                  },
                  newText: 'uint256[] memory p1',
                },
              ],
          },
        },
      },
      {
        title: "Specify 'storage' as data location",
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyDataLocation.sol':
              [
                {
                  range: {
                    start: {
                      line: 5,
                      character: 14,
                    },
                    end: {
                      line: 5,
                      character: 26,
                    },
                  },
                  newText: 'uint256[] storage p1',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)

    diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(5, 28, 5, 46),
    })

    codeActions = await client.getCodeActions(documentUri, diagnostic)

    expected = [
      {
        title: "Specify 'memory' as data location",
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyDataLocation.sol':
              [
                {
                  range: {
                    start: {
                      line: 5,
                      character: 28,
                    },
                    end: {
                      line: 5,
                      character: 46,
                    },
                  },
                  newText: 'string memory p2',
                },
              ],
          },
        },
      },
      {
        title: "Specify 'storage' as data location",
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyDataLocation.sol':
              [
                {
                  range: {
                    start: {
                      line: 5,
                      character: 28,
                    },
                    end: {
                      line: 5,
                      character: 46,
                    },
                  },
                  newText: 'string storage p2',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)

    diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(8, 15, 8, 35),
    })

    codeActions = await client.getCodeActions(documentUri, diagnostic)

    expected = [
      {
        title: "Specify 'memory' as data location",
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyDataLocation.sol':
              [
                {
                  range: {
                    start: {
                      line: 8,
                      character: 15,
                    },
                    end: {
                      line: 8,
                      character: 35,
                    },
                  },
                  newText: 'uint256[] memory p3',
                },
              ],
          },
        },
      },
      {
        title: "Specify 'calldata' as data location",
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyDataLocation.sol':
              [
                {
                  range: {
                    start: {
                      line: 8,
                      character: 15,
                    },
                    end: {
                      line: 8,
                      character: 35,
                    },
                  },
                  newText: 'uint256[] calldata p3',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)

    diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(8, 37, 8, 46),
    })

    codeActions = await client.getCodeActions(documentUri, diagnostic)

    expected = [
      {
        title: "Specify 'memory' as data location",
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyDataLocation.sol':
              [
                {
                  range: {
                    start: {
                      line: 8,
                      character: 37,
                    },
                    end: {
                      line: 8,
                      character: 46,
                    },
                  },
                  newText: 'string memory p4',
                },
              ],
          },
        },
      },
      {
        title: "Specify 'calldata' as data location",
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyDataLocation.sol':
              [
                {
                  range: {
                    start: {
                      line: 8,
                      character: 37,
                    },
                    end: {
                      line: 8,
                      character: 46,
                    },
                  },
                  newText: 'string calldata p4',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)

    diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(10, 13, 10, 18),
    })

    codeActions = await client.getCodeActions(documentUri, diagnostic)

    expected = [
      {
        title: "Specify 'memory' as data location",
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyDataLocation.sol':
              [
                {
                  range: {
                    start: {
                      line: 10,
                      character: 13,
                    },
                    end: {
                      line: 10,
                      character: 18,
                    },
                  },
                  newText: 'bytes memory',
                },
              ],
          },
        },
      },
      {
        title: "Specify 'calldata' as data location",
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyDataLocation.sol':
              [
                {
                  range: {
                    start: {
                      line: 10,
                      character: 13,
                    },
                    end: {
                      line: 10,
                      character: 18,
                    },
                  },
                  newText: 'bytes calldata',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)

    diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(10, 20, 10, 34),
    })

    codeActions = await client.getCodeActions(documentUri, diagnostic)

    expected = [
      {
        title: "Specify 'memory' as data location",
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyDataLocation.sol':
              [
                {
                  range: {
                    start: {
                      line: 10,
                      character: 20,
                    },
                    end: {
                      line: 10,
                      character: 34,
                    },
                  },
                  newText: 'string memory ',
                },
              ],
          },
        },
      },
      {
        title: "Specify 'calldata' as data location",
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyDataLocation.sol':
              [
                {
                  range: {
                    start: {
                      line: 10,
                      character: 20,
                    },
                    end: {
                      line: 10,
                      character: 34,
                    },
                  },
                  newText: 'string calldata ',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)

    diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(13, 4, 13, 29),
    })

    codeActions = await client.getCodeActions(documentUri, diagnostic)

    expected = [
      {
        title: 'Remove specified data location',
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyDataLocation.sol':
              [
                {
                  range: {
                    start: {
                      line: 13,
                      character: 4,
                    },
                    end: {
                      line: 13,
                      character: 29,
                    },
                  },
                  newText: 'uint256 singleUint',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)
  })

  test('specify visibility', async () => {
    const documentPath = getProjectPath('hardhat/contracts/codeAction/SpecifyVisibility.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    const diagnostic = await client.getDiagnostic(documentPath, {
      range: makeRange(4, 11, 4, 14),
    })

    const codeActions = await client.getCodeActions(documentUri, diagnostic)

    const expected = [
      {
        title: 'Add public visibilty to function declaration',
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyVisibility.sol':
              [
                {
                  range: {
                    start: {
                      line: 4,
                      character: 16,
                    },
                    end: {
                      line: 4,
                      character: 16,
                    },
                  },
                  newText: ' public',
                },
              ],
          },
        },
      },
      {
        title: 'Add private visibilty to function declaration',
        kind: 'quickfix',
        isPreferred: false,
        edit: {
          changes: {
            'file:///home/antico/webapps/vscode/hh-vscode/test/protocol/projects/hardhat/contracts/codeAction/SpecifyVisibility.sol':
              [
                {
                  range: {
                    start: {
                      line: 4,
                      character: 16,
                    },
                    end: {
                      line: 4,
                      character: 16,
                    },
                  },
                  newText: ' private',
                },
              ],
          },
        },
      },
    ]

    expect(codeActions).to.have.deep.members(expected)
  })
})
