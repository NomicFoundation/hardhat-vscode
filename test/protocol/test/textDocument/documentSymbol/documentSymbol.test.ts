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
    client.closeAllDocuments()
  })

  test('provides all the document symbols', async function () {
    const symbols = await client.getDocumentSymbols(toUri(testPath))

    expect(symbols).to.deep.equal([
      {
        kind: 26,
        children: [],
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
            line: 4,
            character: 5,
          },
          end: {
            line: 4,
            character: 15,
          },
        },
        name: 'CustomType',
      },
      {
        kind: 11,
        children: [
          {
            kind: 12,
            children: [],
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
                character: 13,
              },
              end: {
                line: 7,
                character: 30,
              },
            },
            name: 'interfaceFunction',
          },
        ],
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
            line: 6,
            character: 10,
          },
          end: {
            line: 6,
            character: 23,
          },
        },
        name: 'TestInterface',
      },
      {
        kind: 23,
        children: [
          {
            kind: 7,
            children: [],
            range: {
              start: {
                line: 11,
                character: 4,
              },
              end: {
                line: 12,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 11,
                character: 12,
              },
              end: {
                line: 11,
                character: 19,
              },
            },
            name: 'aNumber',
          },
          {
            kind: 7,
            children: [],
            range: {
              start: {
                line: 12,
                character: 4,
              },
              end: {
                line: 13,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 12,
                character: 11,
              },
              end: {
                line: 12,
                character: 18,
              },
            },
            name: 'aString',
          },
          {
            kind: 7,
            children: [],
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
                character: 12,
              },
              end: {
                line: 13,
                character: 21,
              },
            },
            name: 'anAddress',
          },
        ],
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
            line: 10,
            character: 7,
          },
          end: {
            line: 10,
            character: 17,
          },
        },
        name: 'TestStruct',
      },
      {
        kind: 23,
        children: [
          {
            kind: 7,
            children: [],
            range: {
              start: {
                line: 17,
                character: 4,
              },
              end: {
                line: 18,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 17,
                character: 12,
              },
              end: {
                line: 17,
                character: 19,
              },
            },
            name: 'aNumber',
          },
          {
            kind: 7,
            children: [],
            range: {
              start: {
                line: 18,
                character: 4,
              },
              end: {
                line: 19,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 18,
                character: 11,
              },
              end: {
                line: 18,
                character: 18,
              },
            },
            name: 'aString',
          },
          {
            kind: 7,
            children: [],
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
                character: 12,
              },
              end: {
                line: 19,
                character: 21,
              },
            },
            name: 'anAddress',
          },
        ],
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
            line: 16,
            character: 7,
          },
          end: {
            line: 16,
            character: 18,
          },
        },
        name: 'TestStruct2',
      },
      {
        kind: 14,
        children: [],
        range: {
          start: {
            line: 22,
            character: 0,
          },
          end: {
            line: 23,
            character: 0,
          },
        },
        selectionRange: {
          start: {
            line: 22,
            character: 17,
          },
          end: {
            line: 22,
            character: 26,
          },
        },
        name: 'aConstant',
      },
      {
        kind: 10,
        children: [],
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
            line: 24,
            character: 5,
          },
          end: {
            line: 24,
            character: 9,
          },
        },
        name: 'Name',
      },
      {
        kind: 24,
        children: [],
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
            line: 29,
            character: 6,
          },
          end: {
            line: 29,
            character: 17,
          },
        },
        name: 'CustomError',
      },
      {
        kind: 5,
        children: [],
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
            line: 31,
            character: 8,
          },
          end: {
            line: 31,
            character: 19,
          },
        },
        name: 'TestLibrary',
      },
      {
        kind: 5,
        children: [
          {
            kind: 9,
            children: [
              {
                kind: 13,
                children: [],
                range: {
                  start: {
                    line: 35,
                    character: 8,
                  },
                  end: {
                    line: 36,
                    character: 0,
                  },
                },
                selectionRange: {
                  start: {
                    line: 35,
                    character: 16,
                  },
                  end: {
                    line: 35,
                    character: 21,
                  },
                },
                name: 'local',
              },
            ],
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
            kind: 12,
            children: [],
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
                line: 39,
                character: 13,
              },
              end: {
                line: 39,
                character: 25,
              },
            },
            name: 'testModifier',
          },
          {
            kind: 24,
            children: [],
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
                line: 43,
                character: 10,
              },
              end: {
                line: 43,
                character: 19,
              },
            },
            name: 'TestEvent',
          },
          {
            kind: 7,
            children: [],
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
                line: 47,
                character: 17,
              },
              end: {
                line: 47,
                character: 33,
              },
            },
            name: 'contractAsMember',
          },
          {
            kind: 7,
            children: [],
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
                line: 49,
                character: 18,
              },
              end: {
                line: 49,
                character: 35,
              },
            },
            name: 'interfaceAsMember',
          },
          {
            kind: 7,
            children: [],
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
                line: 51,
                character: 15,
              },
              end: {
                line: 51,
                character: 29,
              },
            },
            name: 'structAsMember',
          },
          {
            kind: 7,
            children: [],
            range: {
              start: {
                line: 53,
                character: 4,
              },
              end: {
                line: 54,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 53,
                character: 12,
              },
              end: {
                line: 53,
                character: 19,
              },
            },
            name: 'aNumber',
          },
          {
            kind: 7,
            children: [],
            range: {
              start: {
                line: 55,
                character: 4,
              },
              end: {
                line: 56,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 55,
                character: 11,
              },
              end: {
                line: 55,
                character: 18,
              },
            },
            name: 'aString',
          },
          {
            kind: 12,
            children: [
              {
                kind: 13,
                children: [],
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
                    character: 21,
                  },
                  end: {
                    line: 62,
                    character: 39,
                  },
                },
                name: 'contractAsLocalVar',
              },
              {
                kind: 13,
                children: [],
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
                    line: 64,
                    character: 22,
                  },
                  end: {
                    line: 64,
                    character: 41,
                  },
                },
                name: 'interfaceAsLocalVar',
              },
              {
                kind: 13,
                children: [],
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
                    character: 26,
                  },
                  end: {
                    line: 65,
                    character: 42,
                  },
                },
                name: 'structAsLocalVar',
              },
              {
                kind: 13,
                children: [],
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
                    line: 77,
                    character: 26,
                  },
                  end: {
                    line: 77,
                    character: 35,
                  },
                },
                name: 'afterUTF8',
              },
            ],
            range: {
              start: {
                line: 56,
                character: 0,
              },
              end: {
                line: 81,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 57,
                character: 13,
              },
              end: {
                line: 57,
                character: 25,
              },
            },
            name: 'testFunction',
          },
          {
            kind: 12,
            children: [],
            range: {
              start: {
                line: 81,
                character: 0,
              },
              end: {
                line: 83,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 82,
                character: 13,
              },
              end: {
                line: 82,
                character: 28,
              },
            },
            name: 'anotherFunction',
          },
          {
            kind: 12,
            children: [],
            name: 'fallback',
            range: {
              start: {
                line: 83,
                character: 0,
              },
              end: {
                line: 85,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 83,
                character: 0,
              },
              end: {
                line: 85,
                character: 0,
              },
            },
          },
          {
            kind: 12,
            children: [],
            name: 'receive',
            range: {
              start: {
                line: 85,
                character: 0,
              },
              end: {
                line: 87,
                character: 0,
              },
            },
            selectionRange: {
              start: {
                line: 85,
                character: 0,
              },
              end: {
                line: 87,
                character: 0,
              },
            },
          },
        ],
        range: {
          start: {
            line: 32,
            character: 0,
          },
          end: {
            line: 88,
            character: 0,
          },
        },
        selectionRange: {
          start: {
            line: 33,
            character: 9,
          },
          end: {
            line: 33,
            character: 21,
          },
        },
        name: 'testContract',
      },
    ])
  })
})
