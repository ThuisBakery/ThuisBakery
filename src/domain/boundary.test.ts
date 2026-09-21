import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * `src/domain` holds pure logic: no Payload import, no React, no I/O. This test is what
 * enforces that — the boundary is a failing test rather than a convention someone has to
 * remember. See docs/agents/build-conventions.md.
 *
 * Production modules may import nothing but their siblings. Test modules may additionally
 * import Vitest and Node builtins, which is how this file reads the directory at all.
 */

// Resolved from the Vitest root rather than `import.meta.url`, which the transform rewrites.
const domainDir = resolve(process.cwd(), 'src/domain')

const testFileAllowlist = new Set(['vitest'])

const sourceExtensions = new Set(['.ts', '.tsx'])

const isRelative = (specifier: string): boolean => specifier.startsWith('.')

const isNodeBuiltin = (specifier: string): boolean => specifier.startsWith('node:')

const listSourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)

    if (entry.isDirectory()) {
      return listSourceFiles(full)
    }

    return sourceExtensions.has(extname(entry.name)) ? [full] : []
  })

/** Static imports, `export ... from`, and dynamic `import()`. */
const importSpecifiers = (source: string): string[] => {
  const pattern = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g

  return [...source.matchAll(pattern)].flatMap((match) => (match[1] ? [match[1]] : []))
}

const files = listSourceFiles(domainDir)

describe('src/domain boundary', () => {
  it('finds the domain modules it is meant to be guarding', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map((file) => relative(domainDir, file)))(
    '%s imports nothing outside the boundary',
    (name) => {
      const source = readFileSync(join(domainDir, name), 'utf8')
      const isTestFile = name.endsWith('.test.ts') || name.endsWith('.test.tsx')

      const offenders = importSpecifiers(source).filter((specifier) => {
        if (isRelative(specifier)) {
          return false
        }

        return !(isTestFile && (testFileAllowlist.has(specifier) || isNodeBuiltin(specifier)))
      })

      expect(offenders).toEqual([])
    },
  )
})
