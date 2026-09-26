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

describe('[hardhat3] documentSymbol - errors-events', () => {
  let errorsEventsPath: string
  let fileErrorsPath: string
  let fileEventsPath: string
  let fileEventOverloadsPath: string

  before(async () => {
    client = await getInitializedClient()
    errorsEventsPath = getProjectPath('hardhat3/contracts/document-symbols/errors-events/ErrorsEvents.sol')
    fileErrorsPath = getProjectPath('hardhat3/contracts/document-symbols/errors-events/FileErrors.sol')
    fileEventsPath = getProjectPath('hardhat3/contracts/document-symbols/errors-events/FileEvents.sol')
    fileEventOverloadsPath = getProjectPath('hardhat3/contracts/document-symbols/errors-events/FileEventOverloads.sol')

    await client.openDocument(errorsEventsPath)
    await client.openDocument(fileErrorsPath)
    await client.openDocument(fileEventsPath)
    await client.openDocument(fileEventOverloadsPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('errors declared in a contract', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(errorsEventsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['EEErrors']))).to.deep.equal(
      shape([
        { name: 'Empty', kind: 24, children: [] },
        { name: 'Failed', kind: 24, children: [] },
      ])
    )
  })

  test('events declared in a contract', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(errorsEventsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['EEEvents']))).to.deep.equal(
      shape([
        { name: 'Ping', kind: 24, children: [] },
        { name: 'Transfer', kind: 24, children: [] },
      ])
    )
  })

  test('anonymous events', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(errorsEventsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['EEAnonymous']))).to.deep.equal(
      shape([
        { name: 'Raw', kind: 24, children: [] },
        { name: 'RawEmpty', kind: 24, children: [] },
      ])
    )
  })

  test('overloaded events, one symbol each', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(errorsEventsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['EEOverloads']))).to.deep.equal(
      shape([
        { name: 'Log', kind: 24, children: [] },
        { name: 'Log', kind: 24, children: [] },
        { name: 'Log', kind: 24, children: [] },
      ])
    )
  })

  test('error and event with unnamed parameters', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(errorsEventsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['EEUnnamed']))).to.deep.equal(
      shape([
        { name: 'Coded', kind: 24, children: [] },
        { name: 'Signal', kind: 24, children: [] },
      ])
    )
  })

  test('error and event declared in an interface', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(errorsEventsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['IEESource']))).to.deep.equal(
      shape([
        { name: 'SourceFailed', kind: 24, children: [] },
        { name: 'SourceUpdated', kind: 24, children: [] },
        { name: 'read', kind: 12, children: [] },
      ])
    )
  })

  test('error and event declared in a library', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(errorsEventsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['EELib']))).to.deep.equal(
      shape([
        { name: 'LibOverflow', kind: 24, children: [] },
        { name: 'LibUsed', kind: 24, children: [] },
        { name: 'check', kind: 12, children: [] },
      ])
    )
  })

  test('inherited error and event not listed in the derived contract', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(errorsEventsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['EEDerived']))).to.deep.equal(
      shape([
        { name: 'Refreshed', kind: 24, children: [] },
        { name: 'read', kind: 12, children: [] },
      ])
    )
  })

  test('emit and revert add no symbols to the function', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(errorsEventsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['EEUser', 'fire']))).to.deep.equal(shape([{ name: 'doubled', kind: 13, children: [] }]))
  })

  test('errors and events beside a state variable and a function', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(errorsEventsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['EEUser']))).to.deep.equal(
      shape([
        { name: 'Rejected', kind: 24, children: [] },
        { name: 'Moved', kind: 24, children: [] },
        { name: 'total', kind: 7, children: [] },
        { name: 'fire', kind: 12, children: [{ name: 'doubled', kind: 13, children: [] }] },
      ])
    )
  })

  test('file-level errors', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(fileErrorsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'EEFileError', kind: 24, children: [] },
        { name: 'EEFileErrorWithArgs', kind: 24, children: [] },
        { name: 'EEFileErrorUser', kind: 5, children: [{ name: 'check', kind: 12, children: [] }] },
      ])
    )
  })

  test('file-level events and an anonymous one', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(fileEventsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'EEFileEvent', kind: 24, children: [] },
        { name: 'EEFileAnon', kind: 24, children: [] },
        { name: 'EEFileEventError', kind: 24, children: [] },
        { name: 'EEFileEventUser', kind: 5, children: [{ name: 'go', kind: 12, children: [] }] },
      ])
    )
  })

  test('file-level event overloads and a contract event shadowing them', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(fileEventOverloadsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'EEOverloaded', kind: 24, children: [] },
        { name: 'EEOverloaded', kind: 24, children: [] },
        {
          name: 'EEShadow',
          kind: 5,
          children: [
            { name: 'EEOverloaded', kind: 24, children: [] },
            { name: 'go', kind: 12, children: [] },
          ],
        },
      ])
    )
  })

  test('shadowing event listed only in its contract', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(fileEventOverloadsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['EEShadow']))).to.deep.equal(
      shape([
        { name: 'EEOverloaded', kind: 24, children: [] },
        { name: 'go', kind: 12, children: [] },
      ])
    )
  })
})
