import { expect } from 'chai'
import { test } from 'mocha'
import { DocumentSymbol } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
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

describe('[foundry] documentSymbol - locals', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let blocksPath: string
  let returnsPath: string
  let specialPath: string
  let assemblyPath: string

  before(async () => {
    client = await getInitializedClient()
    blocksPath = getProjectPath('foundry/src/document-symbols/locals/Blocks.sol')
    returnsPath = getProjectPath('foundry/src/document-symbols/locals/Returns.sol')
    specialPath = getProjectPath('foundry/src/document-symbols/locals/Special.sol')
    assemblyPath = getProjectPath('foundry/src/document-symbols/locals/Assembly.sol')

    await client.openDocument(blocksPath)
    await client.openDocument(returnsPath)
    await client.openDocument(specialPath)
    await client.openDocument(assemblyPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('locals declared directly in a function body', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(blocksPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['LcBlocks', 'flat']))).to.deep.equal(
      shape([
        { name: 'doubled', kind: 13, children: [] },
        { name: 'isBig', kind: 13, children: [] },
      ])
    )
  })

  test('locals in nested blocks are children of the function', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(blocksPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['LcBlocks', 'nested']))).to.deep.equal(
      shape([
        { name: 'outer', kind: 13, children: [] },
        { name: 'inner', kind: 13, children: [] },
        { name: 'innermost', kind: 13, children: [] },
      ])
    )
  })

  test('locals in if, else if and else bodies', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(blocksPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['LcBlocks', 'branches']))).to.deep.equal(
      shape([
        { name: 'high', kind: 13, children: [] },
        { name: 'middle', kind: 13, children: [] },
        { name: 'low', kind: 13, children: [] },
      ])
    )
  })

  test('locals in for, while and do-while loops, including the for initializer', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(blocksPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['LcBlocks', 'loops']))).to.deep.equal(
      shape([
        { name: 'sum', kind: 13, children: [] },
        { name: 'i', kind: 13, children: [] },
        { name: 'square', kind: 13, children: [] },
        { name: 'count', kind: 13, children: [] },
        { name: 'step', kind: 13, children: [] },
        { name: 'once', kind: 13, children: [] },
      ])
    )
  })

  test('local in an unchecked block', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(blocksPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['LcBlocks', 'wrapping']))).to.deep.equal(
      shape([{ name: 'wrapped', kind: 13, children: [] }])
    )
  })

  test('same-named locals in sibling blocks are listed twice', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(blocksPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['LcBlocks', 'siblings']))).to.deep.equal(
      shape([
        { name: 'value', kind: 13, children: [] },
        { name: 'value', kind: 13, children: [] },
      ])
    )
  })

  test('named return variables are not listed', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(returnsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['LcReturns', 'named']))).to.deep.equal(shape([{ name: 'base', kind: 13, children: [] }]))
  })

  test('try returns variables are not listed, a local in the success block is', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(returnsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['LcReturns', 'attemptReturns']))).to.deep.equal(
      shape([{ name: 'okLocal', kind: 13, children: [] }])
    )
  })

  test('catch parameters are not listed, locals in catch blocks are', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(returnsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['LcReturns', 'attemptCatches']))).to.deep.equal(
      shape([
        { name: 'reasonLength', kind: 13, children: [] },
        { name: 'dataLength', kind: 13, children: [] },
      ])
    )
  })

  test('locals of a constructor, modifier, fallback and receive', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(specialPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['LcSpecial']))).to.deep.equal(
      shape([
        { name: 'stored', kind: 7, children: [] },
        { name: 'constructor', kind: 9, children: [{ name: 'adjusted', kind: 13, children: [] }] },
        {
          name: 'bounded',
          kind: 12,
          children: [
            { name: 'cap', kind: 13, children: [] },
            { name: 'afterwards', kind: 13, children: [] },
          ],
        },
        { name: 'guarded', kind: 12, children: [] },
        { name: 'fallback', kind: 12, children: [{ name: 'fallbackLocal', kind: 13, children: [] }] },
        { name: 'receive', kind: 12, children: [{ name: 'received', kind: 13, children: [] }] },
      ])
    )
  })

  test('local in a free function', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(specialPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['lcFree']))).to.deep.equal(shape([{ name: 'freeLocal', kind: 13, children: [] }]))
  })

  test('yul let locals are not listed', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(assemblyPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['LcAssembly', 'yulLets']))).to.deep.equal(
      shape([
        { name: 'seed', kind: 13, children: [] },
        { name: 'result', kind: 13, children: [] },
      ])
    )
  })

  test('yul functions are listed without their parameters or let locals', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(assemblyPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['LcAssembly', 'yulFunctions']))).to.deep.equal(
      shape([
        { name: 'result', kind: 13, children: [] },
        { name: 'square', kind: 12, children: [] },
        { name: 'pair', kind: 12, children: [] },
      ])
    )
  })
})
