import type { CourseApiData, PlannerState, TermPlan } from '../types'
import { parseDesignationText } from './sfuApi'

const STORAGE_KEY = 'beedie-degree-planner'

const createDefaultTerms = (): TermPlan[] => [
  { id: 'Spring-2026', season: 'Spring', year: 2026, isCoop: false, courses: [] },
  { id: 'Summer-2026', season: 'Summer', year: 2026, isCoop: false, courses: [] },
  { id: 'Fall-2026', season: 'Fall', year: 2026, isCoop: false, courses: [] },
  { id: 'Spring-2027', season: 'Spring', year: 2027, isCoop: false, courses: [] },
  { id: 'Summer-2027', season: 'Summer', year: 2027, isCoop: false, courses: [] },
  { id: 'Fall-2027', season: 'Fall', year: 2027, isCoop: false, courses: [] },
  { id: 'Spring-2028', season: 'Spring', year: 2028, isCoop: false, courses: [] },
  { id: 'Summer-2028', season: 'Summer', year: 2028, isCoop: false, courses: [] },
  { id: 'Fall-2028', season: 'Fall', year: 2028, isCoop: false, courses: [] },
  { id: 'Spring-2029', season: 'Spring', year: 2029, isCoop: false, courses: [] },
]

const normalizeCourseCode = (value: string) => value.trim().toUpperCase().replace(/\s+/g, ' ')

const isValidCachedCourse = (cacheKey: string, course: CourseApiData | undefined) =>
  Boolean(course?.code) && normalizeCourseCode(course?.code ?? '') === normalizeCourseCode(cacheKey)

export const defaultPlannerState = (): PlannerState => ({
  completedCourseCodes: [],
  inProgressCourseCodes: [],
  selectedConcentrations: [],
  customCourses: [],
  transferCredits: [],
  apiCourseCache: {},
  termPlans: createDefaultTerms(),
  unitsPerTermTarget: 15,
})

export const loadPlannerState = (): PlannerState => {
  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return defaultPlannerState()
  }

  try {
    const parsed = JSON.parse(raw) as PlannerState
    const normalizedCache = Object.fromEntries(
      Object.entries(parsed.apiCourseCache ?? {}).flatMap(([code, course]) =>
        isValidCachedCourse(code, course)
          ? [
              [
                code,
                {
                  ...course,
                  designations: parseDesignationText(course.designationText),
                },
              ],
            ]
          : []
      )
    )

    const normalizedCustomCourses = (parsed.customCourses ?? []).map((course) => {
      const designationText = normalizedCache[course.code]?.designationText ?? ''

      return designationText
        ? {
            ...course,
            designations: parseDesignationText(designationText),
          }
        : course
    })

    return {
      ...defaultPlannerState(),
      ...parsed,
      apiCourseCache: normalizedCache,
      customCourses: normalizedCustomCourses,
      termPlans:
        parsed.termPlans && parsed.termPlans.length > 0
          ? parsed.termPlans
          : createDefaultTerms(),
    }
  } catch {
    return defaultPlannerState()
  }
}

export const savePlannerState = (state: PlannerState) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
