import { readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * `src/domain` holds pure logic: no Payload import, no React, no I/O. This test is what
 * enforces that — the boundary is a failing test rather than a convention someone has to
 * remember. See docs/agents/build-conventions.md.
 *
 * A module here may import its siblings and nothing else. Test modules may additionally
 * import Vitest and Node builtins, which is how this file reads the directory at all.
 */

// Resolved from the Vitest root rather than `import.meta.url`, which the transform rewrites.
const domainDir = resolve(process.cwd(), 'src/domain')

const testFileAllowlist = new Set(['vitest'])

const sourceExtensions = new Set(['.ts', '.tsx'])

const isNodeBuiltin = (specifier: string): boolean => specifier.startsWith('node:')

const isTestFile = (name: string): boolean => /\.test\.tsx?$/.test(name)

/**
 * Whether an import stays inside the boundary. Being relative is not enough:
 * `../collections/Users` is relative, and is exactly what this has to catch.
 */
const staysInsideDomain = (fromFile: string, specifier: string): boolean => {
  if (!specifier.startsWith('.')) {
    return false
  }

  const resolved = resolve(dirname(fromFile), specifier)

  return resolved === domainDir || resolved.startsWith(domainDir + sep)
}

const listSourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)

    if (entry.isDirectory()) {
      return listSourceFiles(full)
    }

    return sourceExtensions.has(extname(entry.name)) ? [full] : []
  })

/**
 * Static imports, side-effect imports, `export ... from`, and dynamic `import()`.
 *
 * Text matching rather than a real parse, so the patterns are anchored to a line-initial
 * `import`/`export` — otherwise the word "import" inside a string counts as one, which is
 * a mistake this file made and its own tests caught. Good enough for a directory of small
 * hand-written modules; if it ever is not, the answer is an AST walk, not a looser regex.
 */
const importSpecifiers = (source: string): string[] => {
  const patterns = [
    /^\s*(?:import|export)\b[^'"]*?\bfrom\s*['"]([^'"]+)['"]/gm,
    /^\s*import\s*['"]([^'"]+)['"]/gm,
    /\bimport\(\s*['"]([^'"]+)['"]/g,
  ]

  return patterns.flatMap((pattern) =>
    [...source.matchAll(pattern)].flatMap((match) => (match[1] ? [match[1]] : [])),
  )
}

const offendingImports = (file: string): string[] => {
  const source = readFileSync(file, 'utf8')
  const allowNodeAndVitest = isTestFile(file)

  return importSpecifiers(source).filter((specifier) => {
    if (staysInsideDomain(file, specifier)) {
      return false
    }

    return !(allowNodeAndVitest && (testFileAllowlist.has(specifier) || isNodeBuiltin(specifier)))
  })
}

const files = listSourceFiles(domainDir)

describe('src/domain boundary', () => {
  it('finds the domain modules it is meant to be guarding', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map((file) => relative(domainDir, file)))(
    '%s imports nothing outside the boundary',
    (name) => {
      expect(offendingImports(join(domainDir, name))).toEqual([])
    },
  )

  // The guard is only worth having if it fails on the things it is meant to catch.
  it.each([
    ['payload', 'a Payload import'],
    ['react', 'a React import'],
    ['@/collections/Users', 'an alias import'],
    ['../collections/Users', 'a relative import that escapes the directory'],
    ['../payload-types', 'the generated Payload types'],
    ['node:fs', 'I/O from a non-test module'],
  ])('rejects %s (%s)', (specifier) => {
    const pretendModule = join(domainDir, 'pretend.ts')

    expect(staysInsideDomain(pretendModule, specifier)).toBe(false)
  })

  it('finds every import form it needs to see', () => {
    const sample = [
      "import thing from 'payload'",
      "import 'react'",
      "export { other } from './sibling'",
      "const lazy = await import('node:fs')",
      "import {\n  spread,\n  overLines,\n} from '../escape'",
    ].join('\n')

    expect(importSpecifiers(sample).sort()).toEqual([
      '../escape',
      './sibling',
      'node:fs',
      'payload',
      'react',
    ])
  })

  it('accepts a sibling module', () => {
    expect(staysInsideDomain(join(domainDir, 'pretend.ts'), './lead-time')).toBe(true)
  })
})
