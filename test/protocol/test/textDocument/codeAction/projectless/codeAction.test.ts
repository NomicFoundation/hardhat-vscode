import { test } from 'mocha'
import { expect } from 'chai'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makeCodeAction, makeRange } from '../../../helpers'
import { toUri } from '../../../../src/helpers'

let client!: TestLanguageClient

describe('[projectless][codeAction]', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  test('add license identifier', async () => {
    const documentPath = getProjectPath('projectless/src/codeAction/NoLicense.sol')
    const documentUri = toUri(documentPath)

    client.openDocument(documentPath)

    const diagnostic = await client.assertDiagnostic(documentPath, { message: 'SPDX license identifier not provided' })

    const codeActions = await client.getCodeActions(documentUri, diagnostic)

    const expected = [
      makeCodeAction(
        documentUri,
        'Add license identifier: MIT',
        makeRange(0, 0, 0, 0),
        '// SPDX-License-Identifier: MIT\n'
      ),
      makeCodeAction(
        documentUri,
        'Add license identifier: GPL-2.0-or-later',
        makeRange(0, 0, 0, 0),
        '// SPDX-License-Identifier: GPL-2.0-or-later\n'
      ),
      makeCodeAction(
        documentUri,
        'Add license identifier: GPL-3.0-or-later',
        makeRange(0, 0, 0, 0),
        '// SPDX-License-Identifier: GPL-3.0-or-later\n'
      ),
      makeCodeAction(
        documentUri,
        'Add license identifier: Unlicense',
        makeRange(0, 0, 0, 0),
        '// SPDX-License-Identifier: Unlicense\n'
      ),
    ]

    expect(codeActions).to.have.deep.members(expected)
  })
})
