/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] hover — edge cases', () => {
  let docPath: string

  before(async () => {
    client = await getInitializedClient()

    docPath = getProjectPath('hardhat/contracts/hover/HoverEdgeCases.sol')

    await client.openDocument(docPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('state variable with string initializer containing `{` and `=` is not truncated mid-literal', async () => {
    // Line 8 (0-indexed 7): `    string public templateName = "user_{id}=ok";`
    // `templateName` starts at character 18
    const result = await client.hover(toUri(docPath), makePosition(7, 18))

    expect(result).to.not.be.null
    const text = (result!.contents as { value: string }).value

    // Must contain the type and name
    expect(text).to.include('string')
    expect(text).to.include('templateName')

    // Must NOT contain the malformed mid-literal substring that
    // the old string-based truncation produces. With the bug, we'd
    // see `string public templateName = "user_` (truncated at first `{`).
    expect(text).to.not.include('"user_')
    expect(text).to.not.include('"user_{')
  })

  test('function with parentheses inside natspec is unaffected', async () => {
    // Line 12 (0-indexed 11): `    function withCommentParens(uint256 amount) public pure returns (uint256) {`
    // `withCommentParens` starts at character 13
    const result = await client.hover(toUri(docPath), makePosition(11, 13))

    expect(result).to.not.be.null
    const text = (result!.contents as { value: string }).value

    // Must contain the function name + clean signature.
    expect(text).to.include('withCommentParens')
    expect(text).to.include('uint256')
    expect(text).to.include('amount')

    // The natspec parens above the function must NOT appear in the hover
    // (the body / comments should be stripped from displayed signature).
    expect(text).to.not.include('(special)')
    expect(text).to.not.include('@param')
    expect(text).to.not.include('@notice')
  })
})
