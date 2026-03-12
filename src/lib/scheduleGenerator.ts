import { beedieBba2026 } from '../data/beedieBba2026'
import { arePrerequisitesMet, getPlannerPrerequisiteText } from './prereqParser'
import { getCompletedCredits } from './progress'
import type {
  CourseApiData,
  CourseReference,
  CustomCourseEntry,
  PlannerState,
  ScheduleGenerationResult,
  StoredScheduleCourse,
  TermPlan,
  WqbTag,
} from '../types'

const concentrationMap = new Map(
  beedieBba2026.concentrations.map((definition) => [definition.id, definition])
)

interface PlaceholderCourse {
  id: string
  code: string
  title: string
  units: number
  prerequisites: string
  source: 'placeholder'
  placeholderKind:
    | 'writing'
    | 'quantitative'
    | 'breadthHum'
    | 'breadthSoc'
    | 'breadthSci'
    | 'groupA'
    | 'groupB'
    | 'open'
}

type ScheduleCandidate = CourseReference | CustomCourseEntry | PlaceholderCourse

const allStaticCourses = [
  ...beedieBba2026.lowerDivision.flatMap((group) => group.courses),
  ...beedieBba2026.upperDivision.flatMap((group) => group.courses),
  ...beedieBba2026.groupAOptions,
  ...beedieBba2026.groupBOptions,
  ...beedieBba2026.concentrations.flatMap((definition) =>
    definition.requiredGroups.flatMap((group) => group.courses)
  ),
]

const staticCourseMap = new Map(allStaticCourses.map((course) => [course.code, course]))

const sumUnits = (courses: Array<{ units: number }>) =>
  courses.reduce((total, course) => total + course.units, 0)

const includesTag = (designations: WqbTag[] | undefined, tag: WqbTag) =>
  designations?.includes(tag) ?? false

const isPlaceholderCourse = (course: ScheduleCandidate): course is PlaceholderCourse =>
  'source' in course && course.source === 'placeholder'

const isCustomCourse = (course: ScheduleCandidate): course is CustomCourseEntry =>
  'id' in course && !isPlaceholderCourse(course)

const getMaximumStartingUnits = (courseCode: string) => {
  if (courseCode === 'BUS 360W') {
    return 74
  }

  return null
}

const uniqueCourses = (courses: CourseReference[]) => {
  const seen = new Set<string>()

  return courses.filter((course) => {
    if (seen.has(course.code)) {
      return false
    }

    seen.add(course.code)
    return true
  })
}

const collectRequiredCourses = (state: PlannerState): CourseReference[] => {
  const requiredCourses: CourseReference[] = []
  const unavailableCodes = new Set([
    ...state.completedCourseCodes,
    ...state.inProgressCourseCodes,
  ])

  for (const group of [...beedieBba2026.lowerDivision, ...beedieBba2026.upperDivision]) {
    if (group.minRequired && group.minRequired > 0) {
      const completedInGroup = group.courses.filter((course) =>
        unavailableCodes.has(course.code)
      )

      if (completedInGroup.length < group.minRequired) {
        const firstIncomplete = group.courses.find(
          (course) => !unavailableCodes.has(course.code)
        )

        if (firstIncomplete) {
          requiredCourses.push(firstIncomplete)
        }
      }
      continue
    }

    requiredCourses.push(
      ...group.courses.filter((course) => !unavailableCodes.has(course.code))
    )
  }

  for (const concentrationId of state.selectedConcentrations) {
    const definition = concentrationMap.get(concentrationId)

    if (!definition) {
      continue
    }

    for (const group of definition.requiredGroups) {
      if (group.minRequired && group.minRequired > 0) {
        const selected = group.courses.filter((course) =>
          unavailableCodes.has(course.code)
        )
        const remainingNeeded = Math.max(group.minRequired - selected.length, 0)
        const incomplete = group.courses.filter(
          (course) => !unavailableCodes.has(course.code)
        )

        requiredCourses.push(...incomplete.slice(0, remainingNeeded))
      } else {
        requiredCourses.push(
          ...group.courses.filter(
            (course) => !unavailableCodes.has(course.code)
          )
        )
      }
    }
  }

  return uniqueCourses(requiredCourses)
}

const buildScheduleCourse = (
  course: ScheduleCandidate,
  courseApiData?: CourseApiData,
  source: StoredScheduleCourse['source'] = 'required'
): StoredScheduleCourse => ({
  id: 'id' in course ? course.id : `${source}-${course.code}`,
  code: course.code,
  title: course.title,
  units: course.units,
  prerequisites:
    courseApiData?.prerequisites ??
    ('prerequisites' in course ? course.prerequisites ?? '' : ''),
  source,
})

export const clearPlannedCourses = (terms: TermPlan[]): TermPlan[] =>
  terms.map((term) => ({
    ...term,
    courses: [],
  }))

const buildUnitPlaceholders = (
  prefix: string,
  title: string,
  totalUnits: number,
  kind: PlaceholderCourse['placeholderKind']
) => {
  const placeholders: PlaceholderCourse[] = []
  let remainingUnits = totalUnits
  let index = 1

  while (remainingUnits > 0) {
    const nextUnits = remainingUnits >= 3 ? 3 : remainingUnits
    placeholders.push({
      id: `placeholder-${kind}-${index}`,
      code: `${prefix} ${index}`,
      title,
      units: nextUnits,
      prerequisites: '',
      source: 'placeholder',
      placeholderKind: kind,
    })
    remainingUnits -= nextUnits
    index += 1
  }

  return placeholders
}

const collectCurrentCourses = (state: PlannerState): Array<CourseReference | CustomCourseEntry> =>
  [
    ...allStaticCourses.filter((course) => state.inProgressCourseCodes.includes(course.code)),
    ...state.customCourses.filter((course) => state.inProgressCourseCodes.includes(course.code)),
  ].filter(
    (course, index, array) =>
      array.findIndex((candidate) => candidate.code === course.code) === index
  )

const createPlaceholderCourses = (
  state: PlannerState,
  requiredCourses: CourseReference[],
  customCourses: CustomCourseEntry[],
  currentCourses: Array<CourseReference | CustomCourseEntry>
) => {
  const completedStaticCourses = state.completedCourseCodes
    .map((code) => staticCourseMap.get(code))
    .filter((course): course is CourseReference => Boolean(course))

  const completedCustomCourses = state.customCourses.filter((course) => course.completed)
  const completedTransferCredits = state.transferCredits.filter((credit) => credit.completed)

  const knownRequirementCourses = [
    ...completedStaticCourses,
    ...completedCustomCourses,
    ...completedTransferCredits,
    ...currentCourses,
    ...requiredCourses,
    ...customCourses,
  ]

  const countRequirementUnits = (
    predicate: (course: CourseReference | CustomCourseEntry | (typeof completedTransferCredits)[number]) => boolean
  ) => sumUnits(knownRequirementCourses.filter(predicate))

  const countTaggedUnits = (tag: WqbTag) =>
    sumUnits(knownRequirementCourses.filter((course) => includesTag(course.designations, tag)))

  const remainingWritingUnits = Math.max(6 - countTaggedUnits('W'), 0)
  const remainingQuantitativeUnits = Math.max(6 - countTaggedUnits('Q'), 0)
  let remainingBreadthHumUnits = Math.max(6 - countTaggedUnits('B-Hum'), 0)
  let remainingBreadthSocUnits = Math.max(6 - countTaggedUnits('B-Soc'), 0)
  let remainingBreadthSciUnits = Math.max(6 - countTaggedUnits('B-Sci'), 0)
  const remainingGroupAUnits = Math.max(
    6 - countRequirementUnits((course) => course.requirementArea === 'groupA'),
    0
  )
  const remainingGroupBUnits = Math.max(
    3 - countRequirementUnits((course) => course.requirementArea === 'groupB'),
    0
  )

  const requirementPlaceholders: PlaceholderCourse[] = []

  const breadthQueue: Array<{
    key: 'breadthHum' | 'breadthSoc' | 'breadthSci'
    prefix: string
    title: string
  }> = [
    { key: 'breadthHum', prefix: 'B-HUM', title: 'Generic breadth humanities elective' },
    { key: 'breadthSoc', prefix: 'B-SOC', title: 'Generic breadth social sciences elective' },
    { key: 'breadthSci', prefix: 'B-SCI', title: 'Generic breadth sciences elective' },
  ]

  const consumeBreadthBucket = () => {
    const bucket = breadthQueue.find(({ key }) => {
      if (key === 'breadthHum') {
        return remainingBreadthHumUnits > 0
      }

      if (key === 'breadthSoc') {
        return remainingBreadthSocUnits > 0
      }

      return remainingBreadthSciUnits > 0
    })

    if (!bucket) {
      return null
    }

    if (bucket.key === 'breadthHum') {
      remainingBreadthHumUnits = Math.max(remainingBreadthHumUnits - 3, 0)
    } else if (bucket.key === 'breadthSoc') {
      remainingBreadthSocUnits = Math.max(remainingBreadthSocUnits - 3, 0)
    } else {
      remainingBreadthSciUnits = Math.max(remainingBreadthSciUnits - 3, 0)
    }

    return bucket
  }

  for (const placeholder of buildUnitPlaceholders(
    'GROUP A',
    'Generic Group A elective',
    remainingGroupAUnits,
    'groupA'
  )) {
    const breadthBucket = consumeBreadthBucket()
    requirementPlaceholders.push({
      ...placeholder,
      title: breadthBucket
        ? `${placeholder.title} (${breadthBucket.title.replace('Generic ', '')})`
        : placeholder.title,
    })
  }

  for (const placeholder of buildUnitPlaceholders(
    'GROUP B',
    'Generic Group B elective',
    remainingGroupBUnits,
    'groupB'
  )) {
    const breadthBucket = consumeBreadthBucket()
    requirementPlaceholders.push({
      ...placeholder,
      title: breadthBucket
        ? `${placeholder.title} (${breadthBucket.title.replace('Generic ', '')})`
        : placeholder.title,
    })
  }

  requirementPlaceholders.push(
    ...buildUnitPlaceholders(
      'WRITING',
      'Generic writing requirement elective',
      remainingWritingUnits,
      'writing'
    ),
    ...buildUnitPlaceholders(
      'QUANT',
      'Generic quantitative requirement elective',
      remainingQuantitativeUnits,
      'quantitative'
    ),
    ...buildUnitPlaceholders(
      'B-HUM',
      'Generic breadth humanities elective',
      remainingBreadthHumUnits,
      'breadthHum'
    ),
    ...buildUnitPlaceholders(
      'B-SOC',
      'Generic breadth social sciences elective',
      remainingBreadthSocUnits,
      'breadthSoc'
    ),
    ...buildUnitPlaceholders(
      'B-SCI',
      'Generic breadth sciences elective',
      remainingBreadthSciUnits,
      'breadthSci'
    )
  )

  const knownUnits =
    getCompletedCredits(state) +
    sumUnits(currentCourses) +
    sumUnits(requiredCourses) +
    sumUnits(customCourses) +
    sumUnits(requirementPlaceholders)

  const remainingOpenUnits = Math.max(beedieBba2026.totalUnitsRequired - knownUnits, 0)
  const openPlaceholders = buildUnitPlaceholders(
    'OPEN',
    'Open elective placeholder',
    remainingOpenUnits,
    'open'
  )

  return [...requirementPlaceholders, ...openPlaceholders]
}

export const generateSchedule = (
  state: PlannerState,
  apiCache: Record<string, CourseApiData>
): ScheduleGenerationResult => {
  const requiredCourses = collectRequiredCourses(state)
  const customCourses = state.customCourses.filter(
    (course) => !course.completed && !state.inProgressCourseCodes.includes(course.code)
  )
  const currentCourses = collectCurrentCourses(state)
  const placeholderCourses = createPlaceholderCourses(
    state,
    requiredCourses,
    customCourses,
    currentCourses
  )
  const termPlans = clearPlannedCourses(state.termPlans)
  const warnings: string[] = []
  const completed = new Set(state.completedCourseCodes)
  let completedUnits = getCompletedCredits(state)
  const pendingCore: ScheduleCandidate[] = [...requiredCourses, ...customCourses]
  const pendingPlaceholders: ScheduleCandidate[] = [...placeholderCourses]
  const [firstTerm, ...futureTerms] = termPlans

  if (firstTerm) {
    if (firstTerm.isCoop && currentCourses.length > 0) {
      firstTerm.isCoop = false
      warnings.push('The first term was switched off Co-op so in-progress courses could be placed there.')
    }

    firstTerm.courses = currentCourses.map((course) =>
      buildScheduleCourse(course, apiCache[course.code], 'current')
    )
  }

  const applyFinishedTerm = (courses: StoredScheduleCourse[]) => {
    for (const course of courses) {
      completed.add(course.code)
      completedUnits += course.units
    }
  }

  if (firstTerm) {
    applyFinishedTerm(firstTerm.courses)
  }

  const schedulableFutureTerms = futureTerms.filter((term) => !term.isCoop).length

  const canTakeCourseInTerm = (
    course: ScheduleCandidate,
    completedCourseCodes: Set<string>,
    completedUnitsAtTermStart: number
  ) => {
    const rawPrerequisiteText = isPlaceholderCourse(course)
      ? course.prerequisites
      : apiCache[course.code]?.prerequisites ??
        ('prerequisites' in course ? course.prerequisites ?? '' : '')
    const prerequisiteText = getPlannerPrerequisiteText(course.code, rawPrerequisiteText)
    const maximumStartingUnits = getMaximumStartingUnits(course.code)

    if (
      maximumStartingUnits !== null &&
      completedUnitsAtTermStart > maximumStartingUnits
    ) {
      return false
    }

    return arePrerequisitesMet(prerequisiteText, completedCourseCodes, completedUnitsAtTermStart)
  }

  const schedulePreferredBus300And360wPair = (
    term: TermPlan,
    remainingCapacity: number,
    completedUnitsAtTermStart: number
  ) => {
    const bus300Index = pendingCore.findIndex((course) => course.code === 'BUS 300')
    const bus360wIndex = pendingCore.findIndex((course) => course.code === 'BUS 360W')

    if (bus300Index === -1 || bus360wIndex === -1) {
      return remainingCapacity
    }

    const bus300 = pendingCore[bus300Index]
    const bus360w = pendingCore[bus360wIndex]
    const pairUnits = bus300.units + bus360w.units

    if (pairUnits > remainingCapacity + 1) {
      return remainingCapacity
    }

    if (
      !canTakeCourseInTerm(bus300, completed, completedUnitsAtTermStart) ||
      !canTakeCourseInTerm(bus360w, completed, completedUnitsAtTermStart)
    ) {
      return remainingCapacity
    }

    const [firstIndex, secondIndex] =
      bus300Index > bus360wIndex ? [bus300Index, bus360wIndex] : [bus360wIndex, bus300Index]

    pendingCore.splice(firstIndex, 1)
    pendingCore.splice(secondIndex, 1)

    term.courses.push(
      buildScheduleCourse(bus300, apiCache[bus300.code], isCustomCourse(bus300) ? 'custom' : 'required'),
      buildScheduleCourse(
        bus360w,
        apiCache[bus360w.code],
        isCustomCourse(bus360w) ? 'custom' : 'required'
      )
    )

    return remainingCapacity - pairUnits
  }

  const scheduleFromPending = (
    pool: ScheduleCandidate[],
    term: TermPlan,
    remainingCapacity: number,
    capacityTarget = remainingCapacity
  ) => {
    let reservedCapacity = Math.max(capacityTarget, 0)
    const stillPending: ScheduleCandidate[] = []

    for (const nextCourse of pool) {
      const fitsReservedBudget = nextCourse.units <= reservedCapacity + 1
      const fitsTermCapacity = nextCourse.units <= remainingCapacity + 1
      const canTakeCourse =
        fitsReservedBudget &&
        fitsTermCapacity &&
        canTakeCourseInTerm(nextCourse, completed, completedUnits)

      if (canTakeCourse) {
        term.courses.push(
          buildScheduleCourse(
            nextCourse,
            apiCache[nextCourse.code],
            isPlaceholderCourse(nextCourse)
              ? 'placeholder'
              : isCustomCourse(nextCourse)
                ? 'custom'
                : 'required'
          )
        )
        remainingCapacity -= nextCourse.units
        reservedCapacity -= nextCourse.units
      } else {
        stillPending.push(nextCourse)
      }
    }

    pool.length = 0
    pool.push(...stillPending)

    return remainingCapacity
  }

  for (const [termIndex, term] of futureTerms.entries()) {
    if (term.isCoop) {
      continue
    }

    let remainingCapacity = state.unitsPerTermTarget
    remainingCapacity = schedulePreferredBus300And360wPair(term, remainingCapacity, completedUnits)
    const termsRemaining =
      schedulableFutureTerms -
      futureTerms.slice(0, termIndex).filter((candidate) => !candidate.isCoop).length
    const remainingPlaceholderUnits = sumUnits(pendingPlaceholders)
    const placeholderBudget =
      remainingPlaceholderUnits > 0 && termsRemaining > 0
        ? Math.min(
            remainingCapacity,
            Math.max(
              Math.min(3, remainingPlaceholderUnits),
              Math.ceil(remainingPlaceholderUnits / termsRemaining)
            )
          )
        : 0

    remainingCapacity = scheduleFromPending(
      pendingCore,
      term,
      remainingCapacity,
      Math.max(remainingCapacity - placeholderBudget, 0)
    )
    remainingCapacity = scheduleFromPending(
      pendingPlaceholders,
      term,
      remainingCapacity,
      placeholderBudget
    )
    remainingCapacity = scheduleFromPending(pendingCore, term, remainingCapacity)
    remainingCapacity = scheduleFromPending(pendingPlaceholders, term, remainingCapacity)

    applyFinishedTerm(term.courses)
  }

  for (const course of [...pendingCore, ...pendingPlaceholders]) {
    if (isPlaceholderCourse(course)) {
      warnings.push(`Could not fit all remaining ${course.title.toLowerCase()} units into the plan.`)
      continue
    }

    warnings.push(`Could not place ${course.code}; prerequisites or unit requirements blocked it.`)
  }

  return { termPlans, warnings }
}

export const verifySchedule = (
  termPlans: TermPlan[],
  completedCourseCodes: string[],
  apiCache: Record<string, CourseApiData>,
  completedUnits = 0
) => {
  const errors: string[] = []
  const completed = new Set(completedCourseCodes)
  let earnedUnits = completedUnits

  for (const term of termPlans) {
    for (const course of term.courses) {
      const rawPrerequisites = apiCache[course.code]?.prerequisites ?? course.prerequisites ?? ''
      const prerequisites = getPlannerPrerequisiteText(course.code, rawPrerequisites)

      const maximumStartingUnits = getMaximumStartingUnits(course.code)

      if (
        maximumStartingUnits !== null &&
        earnedUnits > maximumStartingUnits
      ) {
        errors.push(`${course.code} is scheduled too late in ${term.id}; it must start before 75 units.`)
        continue
      }

      if (prerequisites && !arePrerequisitesMet(prerequisites, completed, earnedUnits)) {
        errors.push(`${course.code} is scheduled before its prerequisites are met in ${term.id}.`)
      }
    }

    for (const course of term.courses) {
      completed.add(course.code)
      earnedUnits += course.units
    }
  }

  return errors
}
