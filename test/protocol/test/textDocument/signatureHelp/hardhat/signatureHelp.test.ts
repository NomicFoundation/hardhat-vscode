import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] signatureHelp', () => {
  let sigHelpDocPath: string

  before(async () => {
    client = await getInitializedClient()

    sigHelpDocPath = getProjectPath('hardhat/contracts/signatureHelp/SignatureHelp.sol')

    await client.openDocument(sigHelpDocPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('[two params] trigger after ( shows signature with activeParameter 0', async () => {
    // Line 28 (0-indexed 27): "        uint256 result = twoParams(1, 2);"
    // '(' at char 34, cursor at 35 (after '(')
    const result = await client.signatureHelp(toUri(sigHelpDocPath), makePosition(27, 35))

    expect(result).to.not.be.null
    expect(result!.signatures).to.have.length(1)
    expect(result!.signatures[0].label).to.include('twoParams')
    expect(result!.signatures[0].parameters).to.have.length(2)
    expect(result!.activeParameter).to.equal(0)
  })

  test('[two params] trigger after , shows activeParameter 1', async () => {
    // Line 28 (0-indexed 27): "        uint256 result = twoParams(1, 2);"
    // ',' at char 36, cursor at 38 (on '2')
    const result = await client.signatureHelp(toUri(sigHelpDocPath), makePosition(27, 38))

    expect(result).to.not.be.null
    expect(result!.signatures).to.have.length(1)
    expect(result!.signatures[0].label).to.include('twoParams')
    expect(result!.activeParameter).to.equal(1)
  })

  test('[one param] trigger after ( shows signature', async () => {
    // Line 29 (0-indexed 28): "        uint256 single = oneParam(3);"
    // '(' at char 33, cursor at 34
    const result = await client.signatureHelp(toUri(sigHelpDocPath), makePosition(28, 34))

    expect(result).to.not.be.null
    expect(result!.signatures).to.have.length(1)
    expect(result!.signatures[0].label).to.include('oneParam')
    expect(result!.signatures[0].parameters).to.have.length(1)
    expect(result!.activeParameter).to.equal(0)
  })

  test('[no params] trigger after ( shows signature with empty parameter list', async () => {
    // Line 30 (0-indexed 29): "        uint256 none = noParams();"
    // '(' at char 31, cursor at 32
    const result = await client.signatureHelp(toUri(sigHelpDocPath), makePosition(29, 32))

    expect(result).to.not.be.null
    expect(result!.signatures).to.have.length(1)
    expect(result!.signatures[0].label).to.include('noParams')
    expect(result!.signatures[0].parameters).to.have.length(0)
  })

  test('[event emit] trigger after ( shows event signature', async () => {
    // Line 35 (0-indexed 34): "        emit Transfer(msg.sender, address(0), 100);"
    // '(' at char 21, cursor at 22
    const result = await client.signatureHelp(toUri(sigHelpDocPath), makePosition(34, 22))

    expect(result).to.not.be.null
    expect(result!.signatures).to.have.length(1)
    expect(result!.signatures[0].label).to.include('Transfer')
  })

  test('[constructor call] trigger after ( in new expression shows constructor params', async () => {
    // Line 39 (0-indexed 38): "        return new SignatureHelpTest(42);"
    // '(' at char 36, cursor at 37 (after '(')
    const result = await client.signatureHelp(toUri(sigHelpDocPath), makePosition(38, 37))

    expect(result).to.not.be.null
    expect(result!.signatures).to.have.length(1)
    expect(result!.signatures[0].parameters).to.have.length(1)
    expect(result!.activeParameter).to.equal(0)
  })
})
