import { beedieBba2026 } from '../data/beedieBba2026'
import type {
  ConcentrationDefinition,
  CourseReference,
  CustomCourseEntry,
  PlannerState,
  ProgressSummaryData,
  RequirementGroup,
  TransferCreditEntry,
  WqbTag,
} from '../types'

const sumUnits = (courses: Array<{ units: number }>) =>
  courses.reduce((sum, course) => sum + course.units, 0)

const includesTag = (designations: WqbTag[] | undefined, tag: WqbTag) =>
  designations?.includes(tag) ?? false

export const getSelectedConcentrations = (state: PlannerState): ConcentrationDefinition[] =>
  beedieBba2026.concentrations.filter((definition) =>
    state.selectedConcentrations.includes(definition.id)
  )

export const getCompletedStaticCourses = (state: PlannerState): CourseReference[] => {
  const concentrationCourses = getSelectedConcentrations(state).flatMap((definition) =>
    definition.requiredGroups.flatMap((group) => group.courses)
  )

  const allStaticCourses = [
    ...beedieBba2026.lowerDivision.flatMap((group) => group.courses),
    ...beedieBba2026.upperDivision.flatMap((group) => group.courses),
    ...beedieBba2026.groupAOptions,
    ...beedieBba2026.groupBOptions,
    ...concentrationCourses,
  ]

  const uniqueByCode = new Map(allStaticCourses.map((course) => [course.code, course]))

  return state.completedCourseCodes
    .map((code) => uniqueByCode.get(code))
    .filter((course): course is CourseReference => Boolean(course))
}

export const getCompletedCoursesForCredits = (
  state: PlannerState
): Array<CourseReference | CustomCourseEntry | TransferCreditEntry> => [
  ...getCompletedStaticCourses(state),
  ...state.customCourses.filter((course) => course.completed),
  ...state.transferCredits.filter((credit) => credit.completed),
]

export const getCompletedCredits = (state: PlannerState) =>
  sumUnits(getCompletedCoursesForCredits(state))

export const calculateProgress = (state: PlannerState): ProgressSummaryData => {
  const completedItems = getCompletedCoursesForCredits(state)

  return {
    totalCredits: sumUnits(completedItems),
    totalCreditsRequired: beedieBba2026.totalUnitsRequired,
    wCredits: sumUnits(completedItems.filter((item) => includesTag(item.designations, 'W'))),
    qCredits: sumUnits(completedItems.filter((item) => includesTag(item.designations, 'Q'))),
    breadthHumCredits: sumUnits(
      completedItems.filter((item) => includesTag(item.designations, 'B-Hum'))
    ),
    breadthSocCredits: sumUnits(
      completedItems.filter((item) => includesTag(item.designations, 'B-Soc'))
    ),
    breadthSciCredits: sumUnits(
      completedItems.filter((item) => includesTag(item.designations, 'B-Sci'))
    ),
    groupAUnits: sumUnits(
      completedItems.filter((item) => item.requirementArea === 'groupA')
    ),
    groupBUnits: sumUnits(
      completedItems.filter((item) => item.requirementArea === 'groupB')
    ),
  }
}

export const isCourseCompleted = (state: PlannerState, code: string) =>
  state.completedCourseCodes.includes(code)

export const getGroupCompletionCount = (group: RequirementGroup, completedCodes: string[]) => {
  if (group.minRequired) {
    return group.courses.filter((course) => completedCodes.includes(course.code)).length
  }

  return group.courses.filter((course) => completedCodes.includes(course.code)).length
}

export const isRequirementGroupSatisfied = (
  group: RequirementGroup,
  completedCodes: string[]
) => {
  const completedCount = getGroupCompletionCount(group, completedCodes)
  return completedCount >= (group.minRequired ?? group.courses.length)
}
