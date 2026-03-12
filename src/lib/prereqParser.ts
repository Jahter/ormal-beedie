const courseCodePattern = /\b[A-Z]{2,5}\s?\d{3}[A-Z]?\b/g

const normalizeCourseCode = (value: string) => {
  const compact = value.replace(/\s+/g, '')
  const match = compact.match(/^([A-Z]{2,5})(\d{3}[A-Z]?)$/)

  return match ? `${match[1]} ${match[2]}` : value.trim().toUpperCase()
}

const stripGradeLanguage = (value: string) =>
  value
    .replace(/all with a minimum grade of [A-Z][+-]?/gi, '')
    .replace(/with a minimum grade of [A-Z][+-]?/gi, '')
    .replace(/minimum grade of [A-Z][+-]?/gi, '')
    .replace(/grade of [A-Z][+-]?/gi, '')

const normalizePrerequisiteText = (text: string) =>
  stripGradeLanguage(text)
    .replace(/\b\d+\s+units?\b/gi, ' ')
    .replace(/\b(and\/or|and or)\b/gi, ' or ')
    .replace(/\b(either|one of|two of|three of|any of|all of|both)\b/gi, ' ')
    .replace(/([A-Z]{2,5}\s*\d{3}[A-Z]?)\s*\(\s*or\b/gi, '($1 or')
    .replace(/[.;:]/g, ' , ')
    .replace(/\s+/g, ' ')
    .trim()

type Token =
  | { type: 'course'; value: string }
  | { type: 'and' | 'or' | 'comma' | 'lparen' | 'rparen' }

const isValueToken = (token?: Token) => token?.type === 'course' || token?.type === 'rparen'

const isPrefixToken = (token?: Token) => token?.type === 'course' || token?.type === 'lparen'

const plannerPrerequisiteOverrides: Record<string, string> = {
  'BUS 201': '',
  'BUS 202': '',
  'BUS 203': '',
  'BUS 217W': '15 units AND (BUS 201 OR BUS 202)',
  'BUS 207':
    '15 units AND (ECON 103 OR ECON 113) AND (ECON 105 OR ECON 115) AND (MATH 150 OR MATH 151 OR MATH 154 OR MATH 157)',
  'BUS 300': '45 units AND BUS 203 AND BUS 217W',
  'BUS 303': '45 units',
  'BUS 312': '45 units AND BUS 254 AND (BUS 232 OR ECON 233 OR STAT 270)',
  'BUS 343': '45 units',
  'BUS 360W': '45 units AND BUS 217W AND (BUS 201 OR BUS 202)',
  'BUS 373': '45 units AND (BUS 232 OR ECON 233 OR STAT 270)',
  'BUS 374': '45 units AND BUS 272',
  'BUS 393': '45 units',
  'BUS 346': '45 units',
  'BUS 478':
    '90 units AND (BUS 207 OR ECON 201) AND BUS 312 AND BUS 343 AND BUS 360W AND (BUS 374 OR BUS 381)',
  'BUS 496': '95 units AND BUS 300 AND BUS 360W',
}

const plannerCorequisiteOverrides: Record<string, string> = {
  'BUS 300': 'BUS 360W may be taken in the same term.',
  'BUS 360W': 'BUS 300 may be taken in the same term.',
}

export const getPlannerPrerequisiteText = (courseCode: string, rawText: string) =>
  plannerPrerequisiteOverrides[normalizeCourseCode(courseCode)] ?? rawText

export const getPlannerCorequisiteText = (courseCode: string, rawText: string) =>
  plannerCorequisiteOverrides[normalizeCourseCode(courseCode)] ?? rawText

const tokenizePrerequisites = (text: string): Token[] => {
  const normalized = normalizePrerequisiteText(text).toUpperCase()
  const tokens: Token[] = []
  let currentDepartment: string | null = null
  let index = 0

  while (index < normalized.length) {
    const remaining = normalized.slice(index)

    if (/^\s+/.test(remaining)) {
      index += remaining.match(/^\s+/)?.[0].length ?? 1
      continue
    }

    if (remaining.startsWith('(')) {
      tokens.push({ type: 'lparen' })
      index += 1
      continue
    }

    if (remaining.startsWith(')')) {
      tokens.push({ type: 'rparen' })
      index += 1
      continue
    }

    if (remaining.startsWith(',')) {
      if (tokens[tokens.length - 1]?.type !== 'comma') {
        tokens.push({ type: 'comma' })
      }
      index += 1
      continue
    }

    const conjunctionMatch = remaining.match(/^(AND|OR)\b/)

    if (conjunctionMatch) {
      const tokenType = conjunctionMatch[1].toLowerCase() as 'and' | 'or'

      if (tokens[tokens.length - 1]?.type !== tokenType) {
        tokens.push({ type: tokenType })
      }

      index += conjunctionMatch[0].length
      continue
    }

    const fullCourseMatch = remaining.match(/^([A-Z]{2,5})\s*(\d{3}[A-Z]?)\b/)

    if (fullCourseMatch) {
      currentDepartment = fullCourseMatch[1]
      tokens.push({
        type: 'course',
        value: `${currentDepartment} ${fullCourseMatch[2]}`,
      })
      index += fullCourseMatch[0].length
      continue
    }

    const shortCourseMatch = remaining.match(/^(\d{3}[A-Z]?)\b/)

    if (shortCourseMatch && currentDepartment && isValueToken(tokens[tokens.length - 1])) {
      tokens.push({
        type: 'course',
        value: `${currentDepartment} ${shortCourseMatch[1]}`,
      })
      index += shortCourseMatch[0].length
      continue
    }

    const wordMatch = remaining.match(/^[A-Z]+/)

    if (wordMatch) {
      currentDepartment = null
      index += wordMatch[0].length
      continue
    }

    const numberMatch = remaining.match(/^\d+\b/)

    if (numberMatch) {
      currentDepartment = null
      index += numberMatch[0].length
      continue
    }

    index += 1
  }

  return tokens.filter((token, tokenIndex, allTokens) => {
    if (token.type === 'comma' || token.type === 'and' || token.type === 'or') {
      const previous = allTokens[tokenIndex - 1]
      const next = allTokens[tokenIndex + 1]

      return isValueToken(previous) && isPrefixToken(next)
    }

    return true
  })
}

export interface ParsedPrerequisite {
  kind: 'and' | 'or' | 'course'
  children?: ParsedPrerequisite[]
  courseCode?: string
}

export const extractMinimumUnits = (text: string): number => {
  const matches = [...text.matchAll(/(\d+)\s+units/gi)]

  if (matches.length === 0) {
    return 0
  }

  return Math.max(...matches.map((match) => Number(match[1]) || 0))
}

export const extractCourseCodes = (text: string): string[] => {
  const directMatches = stripGradeLanguage(text).toUpperCase().match(courseCodePattern) ?? []
  const tokenMatches = tokenizePrerequisites(text)
    .filter((token): token is Extract<Token, { type: 'course' }> => token.type === 'course')
    .map((token) => token.value)

  return [...new Set([...directMatches.map(normalizeCourseCode), ...tokenMatches])]
}

const combineNodes = (
  kind: Exclude<ParsedPrerequisite['kind'], 'course'>,
  nodes: ParsedPrerequisite[]
): ParsedPrerequisite => {
  const flattened = nodes.flatMap((node) =>
    node.kind === kind && node.children ? node.children : [node]
  )

  return flattened.length === 1 ? flattened[0] : { kind, children: flattened }
}

export const parsePrerequisites = (text: string): ParsedPrerequisite | null => {
  const tokens = tokenizePrerequisites(text)

  if (tokens.every((token) => token.type !== 'course')) {
    return null
  }

  let index = 0

  const currentToken = () => tokens[index]

  const parsePrimary = (): ParsedPrerequisite | null => {
    const token = currentToken()

    if (!token) {
      return null
    }

    if (token.type === 'course') {
      index += 1
      return {
        kind: 'course',
        courseCode: token.value,
      }
    }

    if (token.type === 'lparen') {
      index += 1
      const expression = parseAndExpression()

      if (currentToken()?.type === 'rparen') {
        index += 1
      }

      return expression
    }

    return null
  }

  const parseOrExpression = (): ParsedPrerequisite | null => {
    const first = parsePrimary()

    if (!first) {
      return null
    }

    const nodes = [first]

    while (currentToken()?.type === 'or') {
      index += 1
      const next = parsePrimary()

      if (!next) {
        break
      }

      nodes.push(next)
    }

    return combineNodes('or', nodes)
  }

  function parseAndExpression(): ParsedPrerequisite | null {
    const first = parseOrExpression()

    if (!first) {
      return null
    }

    const nodes = [first]

    while (currentToken()?.type === 'and' || currentToken()?.type === 'comma') {
      index += 1
      const next = parseOrExpression()

      if (!next) {
        break
      }

      nodes.push(next)
    }

    return combineNodes('and', nodes)
  }

  return parseAndExpression()
}

export const arePrerequisitesMet = (
  prerequisiteText: string,
  completedCourseCodes: Set<string>,
  completedUnits = 0
): boolean => {
  const tree = parsePrerequisites(prerequisiteText)
  const minimumUnits = extractMinimumUnits(prerequisiteText)

  if (minimumUnits > 0 && completedUnits < minimumUnits) {
    return false
  }

  if (!tree) {
    return true
  }

  const visit = (node: ParsedPrerequisite): boolean => {
    if (node.kind === 'course') {
      return node.courseCode ? completedCourseCodes.has(node.courseCode) : true
    }

    if (!node.children || node.children.length === 0) {
      return true
    }

    if (node.kind === 'and') {
      return node.children.every(visit)
    }

    return node.children.some(visit)
  }

  return visit(tree)
}
