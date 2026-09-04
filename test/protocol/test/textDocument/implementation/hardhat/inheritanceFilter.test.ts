/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

interface Location {
  uri: string
  range: { start: { line: number; character: number }; end: { line: number; character: number } }
}

let client!: TestLanguageClient

describe('[hardhat] implementation — inheritance filter', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    await client.closeAllDocuments()
  })

  it('includes only contracts that inherit from the parent', async () => {
    const documentPath = getProjectPath('hardhat/contracts/implementation/InheritanceFilter.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    // Cursor on `foo` in `abstract contract Parent { function foo() public virtual; }`
    // 0-indexed: line 4, character 13 (after "    function ")
    const locations = (await client.findImplementations(documentUri, makePosition(4, 13))) as Location[]

    expect(locations).to.be.an('array')

    // MUST include direct and transitive inheritors
    const inheritorRange = makeRange(8, 13, 8, 16) // Inheritor.foo
    const grandInheritorRange = makeRange(12, 13, 12, 16) // GrandInheritor.foo

    const hasInheritor = locations.some(
      (l) =>
        l.uri === documentUri &&
        l.range.start.line === inheritorRange.start.line &&
        l.range.start.character === inheritorRange.start.character
    )
    const hasGrandInheritor = locations.some(
      (l) =>
        l.uri === documentUri &&
        l.range.start.line === grandInheritorRange.start.line &&
        l.range.start.character === grandInheritorRange.start.character
    )

    expect(hasInheritor, 'should include Inheritor.foo (direct inheritor)').to.be.true
    expect(hasGrandInheritor, 'should include GrandInheritor.foo (transitive inheritor)').to.be.true
  })

  it('does NOT include contracts that merely use Parent as a type', async () => {
    const documentPath = getProjectPath('hardhat/contracts/implementation/InheritanceFilter.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    const locations = (await client.findImplementations(documentUri, makePosition(4, 13))) as Location[]

    // NonInheritor.foo is on line 22 (0-indexed). It has a same-named function but does not inherit.
    const nonInheritorFooLine = 22
    const hasNonInheritor = locations.some((l) => l.uri === documentUri && l.range.start.line === nonInheritorFooLine)

    expect(hasNonInheritor, 'NonInheritor uses Parent as a type but does not inherit — must not be reported').to.be
      .false
  })

  it('does NOT include contracts that use Parent via `using ... for ...`', async () => {
    const documentPath = getProjectPath('hardhat/contracts/implementation/InheritanceFilter.sol')
    const documentUri = toUri(documentPath)

    await client.openDocument(documentPath)

    const locations = (await client.findImplementations(documentUri, makePosition(4, 13))) as Location[]

    // UsingForUser.foo is on line 32 (0-indexed). It applies a library to Parent but does not inherit.
    const usingForUserFooLine = 32
    const hasUsingForUser = locations.some((l) => l.uri === documentUri && l.range.start.line === usingForUserFooLine)

    expect(hasUsingForUser, 'UsingForUser uses ParentLib for Parent but does not inherit — must not be reported').to.be
      .false
  })
})
