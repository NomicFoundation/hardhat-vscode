import { expect } from 'chai'
import { test } from 'mocha'
import { DocumentSymbol } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'

let client!: TestLanguageClient

interface SymbolShape {
  name: string
  kind: number
  children: SymbolShape[]
}

// Name, kind and hierarchy only, with siblings compared as a multiset: overloads share a name,
// so their children break the tie.
function shape(symbols: Array<DocumentSymbol | SymbolShape>): SymbolShape[] {
  return symbols
    .map((s) => ({ name: s.name, kind: s.kind, children: shape(s.children ?? []) }))
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name) ||
        a.kind - b.kind ||
        JSON.stringify(a.children).localeCompare(JSON.stringify(b.children))
    )
}

// The children of the symbol at `path`, or the top-level symbols for []. A name that isn't there
// fails the test rather than reading as no symbols.
function at(symbols: DocumentSymbol[] | null, path: string[]): DocumentSymbol[] {
  expect(symbols, 'no symbols returned').to.be.an('array')
  let level = symbols ?? []
  for (const name of path) {
    const symbol = level.find((s) => s.name === name)
    expect(symbol, `no symbol ${name}`).to.not.equal(undefined)
    level = symbol?.children ?? []
  }
  return level
}

describe('[hardhat] documentSymbol - new-syntax', () => {
  let layoutAtPath: string
  let layoutErc7201Path: string
  let operatorsPath: string
  let transientPath: string
  let namedMappingPath: string
  let requireErrorPath: string
  let qualifiedEmitPath: string

  before(async () => {
    client = await getInitializedClient()
    layoutAtPath = getProjectPath('hardhat/contracts/document-symbols/new-syntax/NsLayoutAt.sol')
    layoutErc7201Path = getProjectPath('hardhat/contracts/document-symbols/new-syntax/NsLayoutErc7201.sol')
    operatorsPath = getProjectPath('hardhat/contracts/document-symbols/new-syntax/NsOperators.sol')
    transientPath = getProjectPath('hardhat/contracts/document-symbols/new-syntax/NsTransient.sol')
    namedMappingPath = getProjectPath('hardhat/contracts/document-symbols/new-syntax/NsNamedMapping.sol')
    requireErrorPath = getProjectPath('hardhat/contracts/document-symbols/new-syntax/NsRequireError.sol')
    qualifiedEmitPath = getProjectPath('hardhat/contracts/document-symbols/new-syntax/NsQualifiedEmit.sol')

    await client.openDocument(layoutAtPath)
    await client.openDocument(layoutErc7201Path)
    await client.openDocument(operatorsPath)
    await client.openDocument(transientPath)
    await client.openDocument(namedMappingPath)
    await client.openDocument(requireErrorPath)
    await client.openDocument(qualifiedEmitPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('contracts with layout at, and no symbol for the layout', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(layoutAtPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'NsLayoutBase', kind: 5, children: [{ name: 'baseValue', kind: 7, children: [] }] },
        {
          name: 'NsLayout',
          kind: 5,
          children: [
            { name: 'counter', kind: 7, children: [] },
            { name: 'balances', kind: 7, children: [] },
            { name: 'Bumped', kind: 24, children: [] },
            { name: 'bump', kind: 12, children: [{ name: 'next', kind: 13, children: [] }] },
          ],
        },
        {
          name: 'NsLayoutChild',
          kind: 5,
          children: [
            { name: 'childValue', kind: 7, children: [] },
            { name: 'constructor', kind: 9, children: [{ name: 'start', kind: 13, children: [] }] },
          ],
        },
      ])
    )
  })

  test('members of a contract with layout at', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(layoutAtPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['NsLayout']))).to.deep.equal(
      shape([
        { name: 'counter', kind: 7, children: [] },
        { name: 'balances', kind: 7, children: [] },
        { name: 'Bumped', kind: 24, children: [] },
        { name: 'bump', kind: 12, children: [{ name: 'next', kind: 13, children: [] }] },
      ])
    )
  })

  test('members of an inheriting contract with layout at', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(layoutAtPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['NsLayoutChild']))).to.deep.equal(
      shape([
        { name: 'childValue', kind: 7, children: [] },
        { name: 'constructor', kind: 9, children: [{ name: 'start', kind: 13, children: [] }] },
      ])
    )
  })

  test('layout at a constant expression and erc7201, contract constant listed as a property', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(layoutErc7201Path))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'NS_BASE_SLOT', kind: 14, children: [] },
        { name: 'NS_NAMESPACE', kind: 14, children: [] },
        {
          name: 'NsAtConstant',
          kind: 5,
          children: [
            { name: 'a', kind: 7, children: [] },
            { name: 'OFFSET', kind: 7, children: [] },
            { name: 'read', kind: 12, children: [{ name: 'value', kind: 13, children: [] }] },
          ],
        },
        {
          name: 'NsAtErc7201',
          kind: 5,
          children: [
            { name: 'b', kind: 7, children: [] },
            { name: 'owner', kind: 7, children: [] },
          ],
        },
      ])
    )
  })

  test('user-defined operators and their free functions, no symbol for using', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(operatorsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'NsFixed', kind: 26, children: [] },
        { name: 'nsAdd', kind: 12, children: [{ name: 'sum', kind: 13, children: [] }] },
        { name: 'nsEq', kind: 12, children: [] },
        { name: 'nsNeg', kind: 12, children: [] },
        { name: 'NsFixedLib', kind: 5, children: [{ name: 'isZero', kind: 12, children: [] }] },
        {
          name: 'NsFixedUser',
          kind: 5,
          children: [
            { name: 'total', kind: 7, children: [] },
            {
              name: 'add',
              kind: 12,
              children: [
                { name: 'next', kind: 13, children: [] },
                { name: 'flipped', kind: 13, children: [] },
              ],
            },
          ],
        },
      ])
    )
  })

  test('contract with a using directive and operator locals', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(operatorsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['NsFixedUser']))).to.deep.equal(
      shape([
        { name: 'total', kind: 7, children: [] },
        {
          name: 'add',
          kind: 12,
          children: [
            { name: 'next', kind: 13, children: [] },
            { name: 'flipped', kind: 13, children: [] },
          ],
        },
      ])
    )
  })

  test('locals of an operator free function', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(operatorsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['nsAdd']))).to.deep.equal(shape([{ name: 'sum', kind: 13, children: [] }]))
  })

  test('transient state variables, contract constant listed as a property', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(transientPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['NsTransient']))).to.deep.equal(
      shape([
        { name: 'locked', kind: 7, children: [] },
        { name: 'depth', kind: 7, children: [] },
        { name: 'caller', kind: 7, children: [] },
        { name: 'stored', kind: 7, children: [] },
        { name: 'LIMIT', kind: 7, children: [] },
        { name: 'createdAt', kind: 7, children: [] },
        { name: 'constructor', kind: 9, children: [] },
        { name: 'nonReentrant', kind: 12, children: [] },
        { name: 'enter', kind: 12, children: [{ name: 'current', kind: 13, children: [] }] },
      ])
    )
  })

  test('struct member of a named mapping type', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(namedMappingPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['NsAccount']))).to.deep.equal(
      shape([
        { name: 'id', kind: 7, children: [] },
        { name: 'allowance', kind: 7, children: [] },
      ])
    )
  })

  test('state variables and a local of named mapping types', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(namedMappingPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['NsNamedMapping']))).to.deep.equal(
      shape([
        { name: 'balanceOf', kind: 7, children: [] },
        { name: 'allowances', kind: 7, children: [] },
        { name: 'accounts', kind: 7, children: [] },
        { name: 'approve', kind: 12, children: [{ name: 'mine', kind: 13, children: [] }] },
      ])
    )
  })

  test('contract error used in require', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(requireErrorPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['NsRequire']))).to.deep.equal(
      shape([
        { name: 'NsEmpty', kind: 24, children: [] },
        { name: 'owner', kind: 7, children: [] },
        { name: 'minimum', kind: 7, children: [] },
        { name: 'check', kind: 12, children: [{ name: 'floor', kind: 13, children: [] }] },
      ])
    )
  })

  test('file-level, interface and contract errors used in require', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(requireErrorPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'NsTooSmall', kind: 24, children: [] },
        { name: 'NsRequireErrors', kind: 11, children: [{ name: 'NsNotOwner', kind: 24, children: [] }] },
        {
          name: 'NsRequire',
          kind: 5,
          children: [
            { name: 'NsEmpty', kind: 24, children: [] },
            { name: 'owner', kind: 7, children: [] },
            { name: 'minimum', kind: 7, children: [] },
            { name: 'check', kind: 12, children: [{ name: 'floor', kind: 13, children: [] }] },
          ],
        },
      ])
    )
  })

  test('events emitted through an interface and a library', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(qualifiedEmitPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'NsFileLevelPing', kind: 24, children: [] },
        {
          name: 'NsEvents',
          kind: 11,
          children: [
            { name: 'NsPinged', kind: 24, children: [] },
            { name: 'NsPingFailed', kind: 24, children: [] },
          ],
        },
        { name: 'NsEventLib', kind: 5, children: [{ name: 'NsLibPinged', kind: 24, children: [] }] },
        {
          name: 'NsEmitter',
          kind: 5,
          children: [
            { name: 'count', kind: 7, children: [] },
            { name: 'ping', kind: 12, children: [{ name: 'id', kind: 13, children: [] }] },
          ],
        },
      ])
    )
  })
})
