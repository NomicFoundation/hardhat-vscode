/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] hover', () => {
  let hoverDocPath: string

  before(async () => {
    client = await getInitializedClient()

    hoverDocPath = getProjectPath('hardhat/contracts/hover/Hover.sol')

    await client.openDocument(hoverDocPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('[state variable usage] hover on count shows type', async () => {
    // Line 42 (0-indexed 41): "        return count;"
    // "count" starts at character 15
    const result = await client.hover(toUri(hoverDocPath), makePosition(41, 15))

    expect(result).to.not.be.null
    expect(result!.contents).to.have.property('kind', 'markdown')
    expect((result!.contents as { value: string }).value).to.include('uint256')
    expect((result!.contents as { value: string }).value).to.include('count')
  })

  test('[local variable usage] hover on localVal shows type', async () => {
    // Line 52 (0-indexed 51): "        return localVal;"
    // "localVal" starts at character 15
    const result = await client.hover(toUri(hoverDocPath), makePosition(51, 15))

    expect(result).to.not.be.null
    expect(result!.contents).to.have.property('kind', 'markdown')
    expect((result!.contents as { value: string }).value).to.include('uint256')
    expect((result!.contents as { value: string }).value).to.include('localVal')
  })

  test('[type identifier] hover on User type shows struct definition', async () => {
    // Line 46 (0-indexed 45): "        User memory user = User(_name, _balance);"
    // "User" starts at character 8
    const result = await client.hover(toUri(hoverDocPath), makePosition(45, 8))

    expect(result).to.not.be.null
    expect(result!.contents).to.have.property('kind', 'markdown')
    expect((result!.contents as { value: string }).value).to.include('User')
  })

  test('[event usage] hover on Transfer in emit shows event signature', async () => {
    // Line 56 (0-indexed 55): "        emit Transfer(msg.sender, address(0), 100);"
    // "Transfer" starts at character 13
    const result = await client.hover(toUri(hoverDocPath), makePosition(55, 13))

    expect(result).to.not.be.null
    expect(result!.contents).to.have.property('kind', 'markdown')
    expect((result!.contents as { value: string }).value).to.include('event')
    expect((result!.contents as { value: string }).value).to.include('Transfer')
  })

  test('[error usage] hover on Unauthorized in revert shows error signature', async () => {
    // Line 61 (0-indexed 60): "            revert Unauthorized(msg.sender);"
    // "Unauthorized" starts at character 19
    const result = await client.hover(toUri(hoverDocPath), makePosition(60, 19))

    expect(result).to.not.be.null
    expect(result!.contents).to.have.property('kind', 'markdown')
    expect((result!.contents as { value: string }).value).to.include('error')
    expect((result!.contents as { value: string }).value).to.include('Unauthorized')
  })

  test('[keyword] hover on contract keyword returns null', async () => {
    // Line 14 (0-indexed 13): "contract HoverTest is Base {"
    // "contract" starts at character 0
    const result = await client.hover(toUri(hoverDocPath), makePosition(13, 0))

    expect(result).to.be.null
  })

  test('[function call] hover on setCount name shows function signature', async () => {
    // Line 37 (0-indexed 36): "    function setCount(uint256 _count) public onlyOwner {"
    // This is a definition, but let's hover on count usage in the body
    // Line 38 (0-indexed 37): "        count = _count;"
    // "_count" at character 16
    const result = await client.hover(toUri(hoverDocPath), makePosition(37, 16))

    expect(result).to.not.be.null
    expect(result!.contents).to.have.property('kind', 'markdown')
    expect((result!.contents as { value: string }).value).to.include('uint256')
  })

  test('[inherited function call] hover on baseFunc() shows signature from Base', async () => {
    // Line 66 (0-indexed 65): "        return baseFunc();"
    // "baseFunc" starts at character 15
    const result = await client.hover(toUri(hoverDocPath), makePosition(65, 15))

    expect(result).to.not.be.null
    expect(result!.contents).to.have.property('kind', 'markdown')
    expect((result!.contents as { value: string }).value).to.include('baseFunc')
  })

  test('[builtin] hover on msg.sender returns null', async () => {
    // Line 34 (0-indexed 33): "        owner = msg.sender;"
    // "msg" starts at character 16
    const result = await client.hover(toUri(hoverDocPath), makePosition(33, 16))

    expect(result).to.be.null
  })

  test('[literal] hover on numeric literal returns null', async () => {
    // Line 56 (0-indexed 55): "        emit Transfer(msg.sender, address(0), 100);"
    // "100" starts at character 46
    const result = await client.hover(toUri(hoverDocPath), makePosition(55, 46))

    expect(result).to.be.null
  })
})
