import { expect } from 'chai'
import { test } from 'mocha'
import { TestLanguageClient } from '../../../src/TestLanguageClient'
import { getInitializedClient } from '../../client'
import { getProjectPath } from '../../helpers'
import { toUri } from '../../../src/helpers'

let client!: TestLanguageClient

describe('[hardhat] documentSymbol', () => {
  let testPath: string

  before(async () => {
    client = await getInitializedClient()

    testPath = getProjectPath('hardhat/contracts/documentSymbol/DocumentSymbols.sol')

    await client.openDocument(testPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('provides all the document symbols', async function () {
    const symbols = await client.getDocumentSymbols(toUri(testPath))

    expect(symbols).to.deep.equal([
      {
        children: [],
        kind: 26,
        name: 'CustomType',
        range: {
          start: {
            line: 3,
            character: 0,
          },
          end: {
            line: 5,
            character: 0,
          },
        },
        selectionRange: {
          start: {
            line: 3,
            character: 0,
          },
          end: {
            line: 5,
            character: 0,
          },
        },
      },
      {
        children: [
          {
            children: [],
            kind: 12,
            name: 'interfaceFunction',
            range: {
              start: {
                line: 7,
                character: 0,
              },
              end: {
                line: 8,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 7,
                character: 0,
              },
              end: {
                line: 8,
                character: 0,
              },
            },
          },
        ],
        kind: 11,
        name: 'TestInterface',
        range: {
          start: {
            line: 5,
            character: 0,
          },
          end: {
            line: 9,
            character: 0,
          },
        },
        selectionRange: {
          start: {
            line: 5,
            character: 0,
          },
          end: {
            line: 9,
            character: 0,
          },
        },
      },
      {
        children: [
          {
            children: [],
            kind: 7,
            name: 'aNumber',
            range: {
              start: {
                line: 11,
                character: 0,
              },
              end: {
                line: 12,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 11,
                character: 0,
              },
              end: {
                line: 12,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 7,
            name: 'aString',
            range: {
              start: {
                line: 12,
                character: 0,
              },
              end: {
                line: 13,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 12,
                character: 0,
              },
              end: {
                line: 13,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 7,
            name: 'anAddress',
            range: {
              start: {
                line: 13,
                character: 0,
              },
              end: {
                line: 14,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 13,
                character: 0,
              },
              end: {
                line: 14,
                character: 0,
              },
            },
          },
        ],
        kind: 23,
        name: 'TestStruct',
        range: {
          start: {
            line: 9,
            character: 0,
          },
          end: {
            line: 15,
            character: 0,
          },
        },
        selectionRange: {
          start: {
            line: 9,
            character: 0,
          },
          end: {
            line: 15,
            character: 0,
          },
        },
      },
      {
        children: [
          {
            children: [],
            kind: 7,
            name: 'aNumber',
            range: {
              start: {
                line: 17,
                character: 0,
              },
              end: {
                line: 18,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 17,
                character: 0,
              },
              end: {
                line: 18,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 7,
            name: 'aString',
            range: {
              start: {
                line: 18,
                character: 0,
              },
              end: {
                line: 19,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 18,
                character: 0,
              },
              end: {
                line: 19,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 7,
            name: 'anAddress',
            range: {
              start: {
                line: 19,
                character: 0,
              },
              end: {
                line: 20,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 19,
                character: 0,
              },
              end: {
                line: 20,
                character: 0,
              },
            },
          },
        ],
        kind: 23,
        name: 'TestStruct2',
        range: {
          start: {
            line: 15,
            character: 0,
          },
          end: {
            line: 21,
            character: 0,
          },
        },
        selectionRange: {
          start: {
            line: 15,
            character: 0,
          },
          end: {
            line: 21,
            character: 0,
          },
        },
      },
      {
        children: [],
        kind: 14,
        name: 'aConstant',
        range: {
          start: {
            line: 21,
            character: 0,
          },
          end: {
            line: 23,
            character: 0,
          },
        },
        selectionRange: {
          start: {
            line: 21,
            character: 0,
          },
          end: {
            line: 23,
            character: 0,
          },
        },
      },
      {
        children: [],
        kind: 10,
        name: 'Name',
        range: {
          start: {
            line: 23,
            character: 0,
          },
          end: {
            line: 28,
            character: 0,
          },
        },
        selectionRange: {
          start: {
            line: 23,
            character: 0,
          },
          end: {
            line: 28,
            character: 0,
          },
        },
      },
      {
        children: [],
        kind: 24,
        name: 'CustomError',
        range: {
          start: {
            line: 28,
            character: 0,
          },
          end: {
            line: 30,
            character: 0,
          },
        },
        selectionRange: {
          start: {
            line: 28,
            character: 0,
          },
          end: {
            line: 30,
            character: 0,
          },
        },
      },
      {
        children: [],
        kind: 5,
        name: 'TestLibrary',
        range: {
          start: {
            line: 30,
            character: 0,
          },
          end: {
            line: 32,
            character: 0,
          },
        },
        selectionRange: {
          start: {
            line: 30,
            character: 0,
          },
          end: {
            line: 32,
            character: 0,
          },
        },
      },
      {
        children: [
          {
            children: [
              {
                children: [],
                kind: 13,
                name: 'local',
                range: {
                  start: {
                    line: 35,
                    character: 0,
                  },
                  end: {
                    line: 36,
                    character: 0,
                  },
                },
                selectionRange: {
                  start: {
                    line: 35,
                    character: 0,
                  },
                  end: {
                    line: 36,
                    character: 0,
                  },
                },
              },
            ],
            kind: 9,
            name: 'constructor',
            range: {
              start: {
                line: 34,
                character: 0,
              },
              end: {
                line: 38,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 34,
                character: 0,
              },
              end: {
                line: 38,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 12,
            name: 'testModifier',
            range: {
              start: {
                line: 38,
                character: 0,
              },
              end: {
                line: 42,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 38,
                character: 0,
              },
              end: {
                line: 42,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 24,
            name: 'TestEvent',
            range: {
              start: {
                line: 42,
                character: 0,
              },
              end: {
                line: 46,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 42,
                character: 0,
              },
              end: {
                line: 46,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 7,
            name: 'contractAsMember',
            range: {
              start: {
                line: 46,
                character: 0,
              },
              end: {
                line: 48,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 46,
                character: 0,
              },
              end: {
                line: 48,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 7,
            name: 'interfaceAsMember',
            range: {
              start: {
                line: 48,
                character: 0,
              },
              end: {
                line: 50,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 48,
                character: 0,
              },
              end: {
                line: 50,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 7,
            name: 'structAsMember',
            range: {
              start: {
                line: 50,
                character: 0,
              },
              end: {
                line: 52,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 50,
                character: 0,
              },
              end: {
                line: 52,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 7,
            name: 'aNumber',
            range: {
              start: {
                line: 52,
                character: 0,
              },
              end: {
                line: 54,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 52,
                character: 0,
              },
              end: {
                line: 54,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 7,
            name: 'aString',
            range: {
              start: {
                line: 54,
                character: 0,
              },
              end: {
                line: 56,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 54,
                character: 0,
              },
              end: {
                line: 56,
                character: 0,
              },
            },
          },
          {
            children: [
              {
                children: [],
                kind: 13,
                name: 'contractAsLocalVar',
                range: {
                  start: {
                    line: 62,
                    character: 0,
                  },
                  end: {
                    line: 63,
                    character: 0,
                  },
                },
                selectionRange: {
                  start: {
                    line: 62,
                    character: 0,
                  },
                  end: {
                    line: 63,
                    character: 0,
                  },
                },
              },
              {
                children: [],
                kind: 13,
                name: 'interfaceAsLocalVar',
                range: {
                  start: {
                    line: 63,
                    character: 0,
                  },
                  end: {
                    line: 65,
                    character: 0,
                  },
                },
                selectionRange: {
                  start: {
                    line: 63,
                    character: 0,
                  },
                  end: {
                    line: 65,
                    character: 0,
                  },
                },
              },
              {
                children: [],
                kind: 13,
                name: 'structAsLocalVar',
                range: {
                  start: {
                    line: 65,
                    character: 0,
                  },
                  end: {
                    line: 66,
                    character: 0,
                  },
                },
                selectionRange: {
                  start: {
                    line: 65,
                    character: 0,
                  },
                  end: {
                    line: 66,
                    character: 0,
                  },
                },
              },
              {
                children: [],
                kind: 13,
                name: 'afterUTF8',
                range: {
                  start: {
                    line: 74,
                    character: 0,
                  },
                  end: {
                    line: 78,
                    character: 0,
                  },
                },
                selectionRange: {
                  start: {
                    line: 74,
                    character: 0,
                  },
                  end: {
                    line: 78,
                    character: 0,
                  },
                },
              },
              {
                children: [],
                kind: 12,
                name: 'mult',
                range: {
                  start: {
                    line: 82,
                    character: 0,
                  },
                  end: {
                    line: 85,
                    character: 0,
                  },
                },
                selectionRange: {
                  start: {
                    line: 82,
                    character: 0,
                  },
                  end: {
                    line: 85,
                    character: 0,
                  },
                },
              },
            ],
            kind: 12,
            name: 'testFunction',
            range: {
              start: {
                line: 56,
                character: 0,
              },
              end: {
                line: 87,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 56,
                character: 0,
              },
              end: {
                line: 87,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 12,
            name: 'anotherFunction',
            range: {
              start: {
                line: 87,
                character: 0,
              },
              end: {
                line: 89,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 87,
                character: 0,
              },
              end: {
                line: 89,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 12,
            name: 'fallback',
            range: {
              start: {
                line: 89,
                character: 0,
              },
              end: {
                line: 91,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 89,
                character: 0,
              },
              end: {
                line: 91,
                character: 0,
              },
            },
          },
          {
            children: [],
            kind: 12,
            name: 'receive',
            range: {
              start: {
                line: 91,
                character: 0,
              },
              end: {
                line: 93,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 91,
                character: 0,
              },
              end: {
                line: 93,
                character: 0,
              },
            },
          },
        ],
        kind: 5,
        name: 'testContract',
        range: {
          start: {
            line: 32,
            character: 0,
          },
          end: {
            line: 94,
            character: 0,
          },
        },
        selectionRange: {
          start: {
            line: 32,
            character: 0,
          },
          end: {
            line: 94,
            character: 0,
          },
        },
      },
    ])
  })
})

describe('[projectless] documentSymbol', () => {
  let testPath: string

  before(async () => {
    client = await getInitializedClient()

    testPath = getProjectPath('projectless/src/documentSymbol/UnnamedFunction.sol')

    await client.openDocument(testPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('supports unnamed function definition', async function () {
    const symbols = await client.getDocumentSymbols(toUri(testPath))

    expect(symbols).to.deep.equal([
      {
        children: [
          {
            children: [],
            kind: 12,
            name: 'function',
            range: {
              start: {
                line: 5,
                character: 0,
              },
              end: {
                line: 6,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 5,
                character: 0,
              },
              end: {
                line: 6,
                character: 0,
              },
            },
          },
        ],
        kind: 5,
        name: 'UnnamedTest',
        range: {
          start: {
            line: 3,
            character: 0,
          },
          end: {
            line: 7,
            character: 0,
          },
        },
        selectionRange: {
          start: {
            line: 3,
            character: 0,
          },
          end: {
            line: 7,
            character: 0,
          },
        },
      },
    ])
  })
})
