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

describe('[hardhat] documentSymbol - types', () => {
  let fileLevelPath: string
  let membersPath: string
  let nestedPath: string
  let contractPath: string
  let enumsPath: string
  let libIfacePath: string

  before(async () => {
    client = await getInitializedClient()
    fileLevelPath = getProjectPath('hardhat/contracts/document-symbols/types/TyFileLevel.sol')
    membersPath = getProjectPath('hardhat/contracts/document-symbols/types/TyMembers.sol')
    nestedPath = getProjectPath('hardhat/contracts/document-symbols/types/TyNested.sol')
    contractPath = getProjectPath('hardhat/contracts/document-symbols/types/TyContract.sol')
    enumsPath = getProjectPath('hardhat/contracts/document-symbols/types/TyEnums.sol')
    libIfacePath = getProjectPath('hardhat/contracts/document-symbols/types/TyLibIface.sol')

    await client.openDocument(fileLevelPath)
    await client.openDocument(membersPath)
    await client.openDocument(nestedPath)
    await client.openDocument(contractPath)
    await client.openDocument(enumsPath)
    await client.openDocument(libIfacePath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('file-level udvts, enum and structs with struct-typed members', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(fileLevelPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'TyAmount', kind: 26, children: [] },
        { name: 'TyFlag', kind: 26, children: [] },
        { name: 'TyKey', kind: 26, children: [] },
        { name: 'TyMode', kind: 10, children: [] },
        {
          name: 'TyPoint',
          kind: 23,
          children: [
            { name: 'x', kind: 7, children: [] },
            { name: 'y', kind: 7, children: [] },
          ],
        },
        {
          name: 'TyLine',
          kind: 23,
          children: [
            { name: 'head', kind: 7, children: [] },
            { name: 'tail', kind: 7, children: [] },
          ],
        },
      ])
    )
  })

  test('struct members of array, struct, enum, udvt, interface and contract types', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(membersPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['TyComposites']))).to.deep.equal(
      shape([
        { name: 'list', kind: 7, children: [] },
        { name: 'triple', kind: 7, children: [] },
        { name: 'inner', kind: 7, children: [] },
        { name: 'inners', kind: 7, children: [] },
        { name: 'kind', kind: 7, children: [] },
        { name: 'id', kind: 7, children: [] },
        { name: 'token', kind: 7, children: [] },
        { name: 'owner', kind: 7, children: [] },
      ])
    )
  })

  test('struct members of mapping types', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(membersPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['TyMappings']))).to.deep.equal(
      shape([
        { name: 'balances', kind: 7, children: [] },
        { name: 'nested', kind: 7, children: [] },
        { name: 'byUser', kind: 7, children: [] },
      ])
    )
  })

  test('struct members of function types', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(membersPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['TyCallbacks']))).to.deep.equal(
      shape([
        { name: 'onValue', kind: 7, children: [] },
        { name: 'check', kind: 7, children: [] },
      ])
    )
  })

  test('structs declared in a contract', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(nestedPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['TyTree']))).to.deep.equal(
      shape([
        { name: 'TyLeaf', kind: 23, children: [{ name: 'weight', kind: 7, children: [] }] },
        {
          name: 'TyBranch',
          kind: 23,
          children: [
            { name: 'leaf', kind: 7, children: [] },
            { name: 'leaves', kind: 7, children: [] },
            { name: 'byId', kind: 7, children: [] },
          ],
        },
        {
          name: 'TyNode',
          kind: 23,
          children: [
            { name: 'value', kind: 7, children: [] },
            { name: 'kids', kind: 7, children: [] },
          ],
        },
        { name: 'root', kind: 7, children: [] },
      ])
    )
  })

  test('struct members of a sibling struct type', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(nestedPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['TyTree', 'TyBranch']))).to.deep.equal(
      shape([
        { name: 'leaf', kind: 7, children: [] },
        { name: 'leaves', kind: 7, children: [] },
        { name: 'byId', kind: 7, children: [] },
      ])
    )
  })

  test('members of a recursive struct', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(nestedPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['TyTree', 'TyNode']))).to.deep.equal(
      shape([
        { name: 'value', kind: 7, children: [] },
        { name: 'kids', kind: 7, children: [] },
      ])
    )
  })

  test('contract-level udvt, enum and struct', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(contractPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['TyVault']))).to.deep.equal(
      shape([
        { name: 'TyShare', kind: 26, children: [] },
        { name: 'TyStatus', kind: 10, children: [] },
        {
          name: 'TyPosition',
          kind: 23,
          children: [
            { name: 'shares', kind: 7, children: [] },
            { name: 'status', kind: 7, children: [] },
          ],
        },
        { name: 'position', kind: 7, children: [] },
        { name: 'status', kind: 12, children: [] },
      ])
    )
  })

  test('file-level and contract-level enums without values', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(enumsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'TySingle', kind: 10, children: [] },
        { name: 'TyWide', kind: 10, children: [] },
        {
          name: 'TyEnumHost',
          kind: 5,
          children: [
            { name: 'TyLevel', kind: 10, children: [] },
            { name: 'level', kind: 7, children: [] },
          ],
        },
      ])
    )
  })

  test('udvt, enum and struct in a library', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(libIfacePath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['TyMath']))).to.deep.equal(
      shape([
        { name: 'TyFixed', kind: 26, children: [] },
        { name: 'TyRounding', kind: 10, children: [] },
        {
          name: 'TyFraction',
          kind: 23,
          children: [
            { name: 'num', kind: 7, children: [] },
            { name: 'den', kind: 7, children: [] },
          ],
        },
        { name: 'ratio', kind: 12, children: [] },
      ])
    )
  })

  test('udvt, enum and struct in an interface', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(libIfacePath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['ITyOracle']))).to.deep.equal(
      shape([
        { name: 'TyTick', kind: 26, children: [] },
        { name: 'TyFeed', kind: 10, children: [] },
        {
          name: 'TyQuote',
          kind: 23,
          children: [
            { name: 'price', kind: 7, children: [] },
            { name: 'stamp', kind: 7, children: [] },
          ],
        },
        { name: 'quote', kind: 12, children: [] },
      ])
    )
  })

  test('state variables of qualified struct and udvt types', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(libIfacePath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['TyUser']))).to.deep.equal(
      shape([
        { name: 'fraction', kind: 7, children: [] },
        { name: 'last', kind: 7, children: [] },
        { name: 'offset', kind: 7, children: [] },
      ])
    )
  })
})
