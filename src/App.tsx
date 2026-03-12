import { useEffect, useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { ChecklistPage } from './pages/ChecklistPage'
import { SchedulePage } from './pages/SchedulePage'
import { beedieBba2026 } from './data/beedieBba2026'
import { calculateProgress, getCompletedCredits, getSelectedConcentrations } from './lib/progress'
import { generateSchedule, verifySchedule } from './lib/scheduleGenerator'
import { fetchOutlineByCourse } from './lib/sfuApi'
import {
  defaultPlannerState,
  loadPlannerState,
  savePlannerState,
} from './lib/storage'
import type {
  CourseApiData,
  OutlineLookupResult,
  PlannerState,
  RequirementArea,
  TransferCreditEntry,
  TermPlan,
} from './types'

const normalizeCodeParts = (code: string) => {
  const [department, number] = code.trim().split(/\s+/)
  return { department, number }
}

const withApiCache = (
  state: PlannerState,
  updates: Record<string, CourseApiData>
): PlannerState => ({
  ...state,
  apiCourseCache: {
    ...state.apiCourseCache,
    ...updates,
  },
})

const normalizeCourseCode = (value: string) => value.trim().toUpperCase().replace(/\s+/g, ' ')

const hasValidApiCacheEntry = (
  code: string,
  cache: Record<string, CourseApiData>
) => {
  const entry = cache[code]
  return Boolean(entry) && normalizeCourseCode(entry.code) === normalizeCourseCode(code)
}

const clearScheduledCourses = (termPlans: TermPlan[]) =>
  termPlans.map((term) => ({ ...term, courses: [] }))

function App() {
  const [plannerState, setPlannerState] = useState<PlannerState>(() => loadPlannerState())
  const [scheduleMessages, setScheduleMessages] = useState<string[]>([])
  const [verificationMessages, setVerificationMessages] = useState<string[]>([])

  useEffect(() => {
    savePlannerState(plannerState)
  }, [plannerState])

  const prefetchCodes = useMemo(() => {
    const base = [
      ...beedieBba2026.lowerDivision.flatMap((group) => group.courses.map((course) => course.code)),
      ...beedieBba2026.upperDivision.flatMap((group) => group.courses.map((course) => course.code)),
      ...plannerState.customCourses.map((course) => course.code),
      ...getSelectedConcentrations(plannerState).flatMap((definition) =>
        definition.requiredGroups.flatMap((group) => group.courses.map((course) => course.code))
      ),
    ]

    return [...new Set(base)]
  }, [plannerState])

  useEffect(() => {
    let cancelled = false

    const loadMissingApiData = async () => {
      const missingCodes = prefetchCodes.filter(
        (code) => !hasValidApiCacheEntry(code, plannerState.apiCourseCache)
      )

      if (missingCodes.length === 0) {
        return
      }

      const entries = await Promise.all(
        missingCodes.map(async (code) => {
          const { department, number } = normalizeCodeParts(code)

          if (!department || !number) {
            return null
          }

          const outline = await fetchOutlineByCourse(department, number)
          return outline
            ? [
                code,
                {
                  code: outline.code,
                  title: outline.title,
                  units: outline.units,
                  designationText: outline.designationText,
                  designations: outline.designations,
                  prerequisites: outline.prerequisites,
                  corequisites: outline.corequisites,
                  description: outline.description,
                } satisfies CourseApiData,
              ]
            : null
        })
      )

      if (cancelled) {
        return
      }

      const updates = Object.fromEntries(
        entries.filter(
          (entry): entry is [string, CourseApiData] => Array.isArray(entry) && entry.length === 2
        )
      )

      if (Object.keys(updates).length > 0) {
        setPlannerState((current) => withApiCache(current, updates))
      }
    }

    void loadMissingApiData()

    return () => {
      cancelled = true
    }
  }, [plannerState.apiCourseCache, prefetchCodes])

  const toggleCompletedCourse = (code: string) => {
    setPlannerState((current) => ({
      ...current,
      completedCourseCodes: current.completedCourseCodes.includes(code)
        ? current.completedCourseCodes.filter((item) => item !== code)
        : [...current.completedCourseCodes, code],
      inProgressCourseCodes: current.inProgressCourseCodes.filter((item) => item !== code),
    }))
  }

  const toggleInProgressCourse = (code: string) => {
    setPlannerState((current) => ({
      ...current,
      inProgressCourseCodes: current.inProgressCourseCodes.includes(code)
        ? current.inProgressCourseCodes.filter((item) => item !== code)
        : [...current.inProgressCourseCodes, code],
      completedCourseCodes: current.completedCourseCodes.filter((item) => item !== code),
    }))
  }

  const toggleConcentration = (concentrationId: string) => {
    setPlannerState((current) => ({
      ...current,
      selectedConcentrations: current.selectedConcentrations.includes(concentrationId)
        ? current.selectedConcentrations.filter((id) => id !== concentrationId)
        : [...current.selectedConcentrations, concentrationId],
    }))
  }

  const addLookupCourse = (
    result: OutlineLookupResult,
    requirementArea: Extract<RequirementArea, 'custom' | 'groupA' | 'groupB'>
  ) => {
    setPlannerState((current) => {
      if (current.customCourses.some((course) => course.code === result.code)) {
        return withApiCache(current, {
          [result.code]: {
            code: result.code,
            title: result.title,
            units: result.units,
            designationText: result.designationText,
            designations: result.designations,
            prerequisites: result.prerequisites,
            corequisites: result.corequisites,
            description: result.description,
          },
        })
      }

      return withApiCache(
        {
          ...current,
          customCourses: [
            ...current.customCourses,
            {
              id: crypto.randomUUID(),
              code: result.code,
              title: result.title,
              units: result.units,
              completed: false,
              requirementArea,
              designations: result.designations,
              prerequisites: result.prerequisites,
              corequisites: result.corequisites,
            },
          ],
        },
        {
          [result.code]: {
            code: result.code,
            title: result.title,
            units: result.units,
            designationText: result.designationText,
            designations: result.designations,
            prerequisites: result.prerequisites,
            corequisites: result.corequisites,
            description: result.description,
          },
        }
      )
    })
  }

  const toggleCustomCourse = (id: string) => {
    setPlannerState((current) => {
      const targetCourse = current.customCourses.find((course) => course.id === id)

      if (!targetCourse) {
        return current
      }

      return {
        ...current,
        customCourses: current.customCourses.map((course) =>
          course.id === id ? { ...course, completed: !course.completed } : course
        ),
        inProgressCourseCodes: current.inProgressCourseCodes.filter(
          (code) => code !== targetCourse.code
        ),
      }
    })
  }

  const toggleCustomCourseInProgress = (id: string) => {
    setPlannerState((current) => {
      const targetCourse = current.customCourses.find((course) => course.id === id)

      if (!targetCourse) {
        return current
      }

      return {
        ...current,
        inProgressCourseCodes: current.inProgressCourseCodes.includes(targetCourse.code)
          ? current.inProgressCourseCodes.filter((code) => code !== targetCourse.code)
          : [...current.inProgressCourseCodes, targetCourse.code],
        customCourses: current.customCourses.map((course) =>
          course.id === id ? { ...course, completed: false } : course
        ),
      }
    })
  }

  const removeCustomCourse = (id: string) => {
    setPlannerState((current) => ({
      ...current,
      customCourses: current.customCourses.filter((course) => course.id !== id),
    }))
  }

  const addTransferCredit = (entry: Omit<TransferCreditEntry, 'id'>) => {
    setPlannerState((current) => ({
      ...current,
      transferCredits: [...current.transferCredits, { ...entry, id: crypto.randomUUID() }],
    }))
  }

  const toggleTransferCredit = (id: string) => {
    setPlannerState((current) => ({
      ...current,
      transferCredits: current.transferCredits.map((credit) =>
        credit.id === id ? { ...credit, completed: !credit.completed } : credit
      ),
    }))
  }

  const removeTransferCredit = (id: string) => {
    setPlannerState((current) => ({
      ...current,
      transferCredits: current.transferCredits.filter((credit) => credit.id !== id),
    }))
  }

  const ensureApiDataForCodes = async (codes: string[]) => {
    const missingCodes = [...new Set(codes)].filter(
      (code) => !hasValidApiCacheEntry(code, plannerState.apiCourseCache)
    )

    if (missingCodes.length === 0) {
      return plannerState.apiCourseCache
    }

    const entries = await Promise.all(
      missingCodes.map(async (code) => {
        const { department, number } = normalizeCodeParts(code)

        if (!department || !number) {
          return null
        }

        const outline = await fetchOutlineByCourse(department, number)

        if (!outline) {
          return null
        }

        return [
          code,
          {
            code: outline.code,
            title: outline.title,
            units: outline.units,
            designationText: outline.designationText,
            designations: outline.designations,
            prerequisites: outline.prerequisites,
            corequisites: outline.corequisites,
            description: outline.description,
          } satisfies CourseApiData,
        ] as const
      })
    )

    const updates = Object.fromEntries(entries.filter(Boolean) as Array<[string, CourseApiData]>)

    if (Object.keys(updates).length > 0) {
      setPlannerState((current) => withApiCache(current, updates))
      return {
        ...plannerState.apiCourseCache,
        ...updates,
      }
    }

    return plannerState.apiCourseCache
  }

  const handleGenerateSchedule = async () => {
    const requiredCodes = [
      ...beedieBba2026.lowerDivision.flatMap((group) => group.courses.map((course) => course.code)),
      ...beedieBba2026.upperDivision.flatMap((group) => group.courses.map((course) => course.code)),
      ...getSelectedConcentrations(plannerState).flatMap((definition) =>
        definition.requiredGroups.flatMap((group) => group.courses.map((course) => course.code))
      ),
      ...plannerState.customCourses.map((course) => course.code),
    ]

    const cache = await ensureApiDataForCodes(requiredCodes)
    const result = generateSchedule(plannerState, cache)

    setPlannerState((current) => ({
      ...current,
      termPlans: result.termPlans,
    }))
    setVerificationMessages([])
    setScheduleMessages(
      result.warnings.length > 0
        ? result.warnings
        : ['Schedule generated successfully. Use Verify Schedule to double-check order.']
    )
  }

  const handleVerifySchedule = async () => {
    const scheduledCodes = plannerState.termPlans.flatMap((term) =>
      term.courses.map((course) => course.code)
    )
    const cache = await ensureApiDataForCodes(scheduledCodes)
    const issues = verifySchedule(
      plannerState.termPlans,
      plannerState.completedCourseCodes,
      cache,
      getCompletedCredits(plannerState)
    )

    setVerificationMessages(
      issues.length > 0 ? issues : ['No prerequisite ordering issues were found.']
    )
  }

  const handleClearSchedule = () => {
    setPlannerState((current) => ({
      ...current,
      termPlans: clearScheduledCourses(current.termPlans),
    }))
    setScheduleMessages([])
    setVerificationMessages([])
  }

  const toggleCoop = (termId: string) => {
    setPlannerState((current) => ({
      ...current,
      termPlans: current.termPlans.map((term) =>
        term.id === termId
          ? {
              ...term,
              isCoop: !term.isCoop,
              courses: !term.isCoop ? [] : term.courses,
            }
          : term
      ),
    }))
  }

  const moveCourseToTerm = (courseId: string, targetTermId: string) => {
    setPlannerState((current) => {
      const terms = current.termPlans.map((term) => ({ ...term, courses: [...term.courses] }))
      const termIndex = terms.findIndex((term) =>
        term.courses.some((course) => course.id === courseId)
      )

      if (termIndex === -1) {
        return current
      }

      const targetIndex = terms.findIndex((term) => term.id === targetTermId)

      if (targetIndex === -1 || targetIndex === termIndex || terms[targetIndex].isCoop) {
        return current
      }

      const courseIndex = terms[termIndex].courses.findIndex((course) => course.id === courseId)
      const [course] = terms[termIndex].courses.splice(courseIndex, 1)

      if (!course || course.source === 'current') {
        return current
      }

      if (targetIndex === 0) {
        terms[termIndex].courses.splice(courseIndex, 0, course)
        return current
      }

      terms[targetIndex].courses.push(course)

      return {
        ...current,
        termPlans: terms,
      }
    })
  }

  const summary = calculateProgress(plannerState)

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="nav-brand">
          <img
            src={`${import.meta.env.BASE_URL}ormal-logo.png`}
            alt="Ormal Path"
            className="nav-logo"
          />
          <span className="nav-brand-name">Ormal Path</span>
        </div>
        <div className="nav-links">
          <NavLink
            className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
            to="/"
          >
            Degree Checklist
          </NavLink>
          <NavLink
            className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
            to="/schedule"
          >
            Schedule Planner
          </NavLink>
          <button
            className="nav-link reset-button"
            onClick={() => {
              setPlannerState(defaultPlannerState())
              setScheduleMessages([])
              setVerificationMessages([])
            }}
            type="button"
          >
            Reset Planner
          </button>
        </div>
      </nav>

      <Routes>
        <Route
          element={
            <ChecklistPage
              apiCache={plannerState.apiCourseCache}
              onAddLookupCourse={addLookupCourse}
              onAddTransferCredit={addTransferCredit}
              onRemoveCustomCourse={removeCustomCourse}
              onRemoveTransferCredit={removeTransferCredit}
              onToggleCompletedCourse={toggleCompletedCourse}
              onToggleConcentration={toggleConcentration}
              onToggleCustomCourse={toggleCustomCourse}
              onToggleCustomCourseInProgress={toggleCustomCourseInProgress}
              onToggleInProgressCourse={toggleInProgressCourse}
              onToggleTransferCredit={toggleTransferCredit}
              plannerState={plannerState}
              summary={summary}
            />
          }
          path="/"
        />
        <Route
          element={
            <SchedulePage
              apiCache={plannerState.apiCourseCache}
              completedCredits={getCompletedCredits(plannerState)}
              onClearSchedule={handleClearSchedule}
              onGenerateSchedule={() => void handleGenerateSchedule()}
              onMoveCourseToTerm={moveCourseToTerm}
              onToggleCoop={toggleCoop}
              onUnitsTargetChange={(value) =>
                setPlannerState((current) => ({
                  ...current,
                  unitsPerTermTarget: value,
                }))
              }
              onVerifySchedule={() => void handleVerifySchedule()}
              plannerState={plannerState}
              scheduleMessages={scheduleMessages}
              verificationMessages={verificationMessages}
            />
          }
          path="/schedule"
        />
      </Routes>
    </div>
  )
}

export default App
