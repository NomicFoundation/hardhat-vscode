import { test } from 'mocha'
import { expect } from 'chai'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'
import { toUri } from '../../../../src/helpers'

let client!: TestLanguageClient

describe('[truffle][codeAction]', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    await client.closeAllDocuments()
  })

  test('add license identifier', async () => {
    const documentPath = getProjectPath('truffle/my_contracts/codeAction/NoLicense.sol')
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
            [toUri(getProjectPath('truffle/my_contracts/codeAction/NoLicense.sol'))]: [
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
            [toUri(getProjectPath('truffle/my_contracts/codeAction/NoLicense.sol'))]: [
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
            [toUri(getProjectPath('truffle/my_contracts/codeAction/NoLicense.sol'))]: [
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
            [toUri(getProjectPath('truffle/my_contracts/codeAction/NoLicense.sol'))]: [
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
})
