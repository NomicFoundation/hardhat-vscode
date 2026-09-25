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

describe('[hardhat] documentSymbol - file-level', () => {
  let errorsEventsPath: string
  let functionsPath: string
  let freeLocalsPath: string
  let usingPath: string
  let importsPath: string
  let mixedPath: string
  let defsPath: string

  before(async () => {
    client = await getInitializedClient()
    errorsEventsPath = getProjectPath('hardhat/contracts/document-symbols/file-level/FlErrorsEvents.sol')
    functionsPath = getProjectPath('hardhat/contracts/document-symbols/file-level/FlFunctions.sol')
    freeLocalsPath = getProjectPath('hardhat/contracts/document-symbols/file-level/FlFreeLocals.sol')
    usingPath = getProjectPath('hardhat/contracts/document-symbols/file-level/FlUsing.sol')
    importsPath = getProjectPath('hardhat/contracts/document-symbols/file-level/FlImports.sol')
    mixedPath = getProjectPath('hardhat/contracts/document-symbols/file-level/FlMixed.sol')
    defsPath = getProjectPath('hardhat/contracts/definition/file-level/FileLevelDefs.sol')

    await client.openDocument(errorsEventsPath)
    await client.openDocument(functionsPath)
    await client.openDocument(freeLocalsPath)
    await client.openDocument(usingPath)
    await client.openDocument(importsPath)
    await client.openDocument(mixedPath)
    await client.openDocument(defsPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('file-level errors and events without their parameters', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(errorsEventsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'FlTooLarge', kind: 24, children: [] },
        { name: 'FlEmpty', kind: 24, children: [] },
        { name: 'FlLogged', kind: 24, children: [] },
        { name: 'FlPinged', kind: 24, children: [] },
        { name: 'FlAnon', kind: 24, children: [] },
      ])
    )
  })

  test('free functions, with each overload listed', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(functionsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'flAdd', kind: 12, children: [] },
        { name: 'flAdd', kind: 12, children: [] },
        { name: 'flNoop', kind: 12, children: [] },
        { name: 'flIsZero', kind: 12, children: [] },
      ])
    )
  })

  test('free function locals in nested blocks, for and unchecked', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(freeLocalsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['flClamp']))).to.deep.equal(
      shape([
        { name: 'result', kind: 13, children: [] },
        { name: 'excess', kind: 13, children: [] },
        { name: 'i', kind: 13, children: [] },
        { name: 'step', kind: 13, children: [] },
        { name: 'wrapped', kind: 13, children: [] },
      ])
    )
  })

  test('free function local without its named returns', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(freeLocalsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['flSplit']))).to.deep.equal(shape([{ name: 'mid', kind: 13, children: [] }]))
  })

  test('file-level using directives are not symbols', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(usingPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'FlCount', kind: 26, children: [] },
        { name: 'flInc', kind: 12, children: [] },
        { name: 'flIsSet', kind: 12, children: [] },
        { name: 'FlMath', kind: 5, children: [{ name: 'flHalf', kind: 12, children: [] }] },
        {
          name: 'FlCounter',
          kind: 5,
          children: [
            { name: 'count', kind: 7, children: [] },
            { name: 'bump', kind: 12, children: [{ name: 'half', kind: 13, children: [] }] },
          ],
        },
      ])
    )
  })

  test('pragmas and imports only give no symbols', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(importsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(shape([]))
  })

  test('file-level declarations between and after contracts', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(mixedPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'FL_MAX', kind: 14, children: [] },
        { name: 'IFlSource', kind: 11, children: [{ name: 'flValue', kind: 12, children: [] }] },
        { name: 'FlId', kind: 26, children: [] },
        { name: 'FlOutOfRange', kind: 24, children: [] },
        {
          name: 'FlBase',
          kind: 5,
          children: [
            { name: 'stored', kind: 7, children: [] },
            { name: 'flValue', kind: 12, children: [] },
          ],
        },
        { name: 'FlChanged', kind: 24, children: [] },
        { name: 'flCap', kind: 12, children: [] },
        {
          name: 'FlMixedImpl',
          kind: 5,
          children: [
            { name: 'limit', kind: 7, children: [] },
            { name: 'flValue', kind: 12, children: [{ name: 'capped', kind: 13, children: [] }] },
          ],
        },
        {
          name: 'FlRecord',
          kind: 23,
          children: [
            { name: 'id', kind: 7, children: [] },
            { name: 'pair', kind: 7, children: [] },
          ],
        },
        { name: 'FlMode', kind: 10, children: [] },
        { name: 'FlLib', kind: 5, children: [] },
      ])
    )
  })

  test('free functions, a library and a contract around a using directive', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(defsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'MAX_ITEMS', kind: 14, children: [] },
        {
          name: 'Point',
          kind: 23,
          children: [
            { name: 'x', kind: 7, children: [] },
            { name: 'y', kind: 7, children: [] },
          ],
        },
        { name: 'Color', kind: 10, children: [] },
        { name: 'TooMany', kind: 24, children: [] },
        { name: 'Moved', kind: 24, children: [] },
        { name: 'twice', kind: 12, children: [] },
        { name: 'quadruple', kind: 12, children: [] },
        { name: 'shift', kind: 12, children: [] },
        { name: 'sum', kind: 12, children: [] },
        { name: 'PointLib', kind: 5, children: [{ name: 'manhattan', kind: 12, children: [] }] },
        {
          name: 'FileLevelLocal',
          kind: 5,
          children: [
            { name: 'capped', kind: 12, children: [] },
            { name: 'total', kind: 12, children: [] },
          ],
        },
      ])
    )
  })
})
