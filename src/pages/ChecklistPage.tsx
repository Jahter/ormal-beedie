import { beedieBba2026 } from '../data/beedieBba2026'
import { AddCoursesPanel } from '../components/AddCoursesPanel'
import { CourseChecklistSection } from '../components/CourseChecklistSection'
import { ProgressSummary } from '../components/ProgressSummary'
import { getSelectedConcentrations } from '../lib/progress'
import type {
  CourseApiData,
  OutlineLookupResult,
  PlannerState,
  ProgressSummaryData,
  RequirementArea,
  TransferCreditEntry,
} from '../types'

interface ChecklistPageProps {
  plannerState: PlannerState
  summary: ProgressSummaryData
  onToggleCompletedCourse: (code: string) => void
  onToggleInProgressCourse: (code: string) => void
  onToggleConcentration: (concentrationId: string) => void
  onAddLookupCourse: (
    result: OutlineLookupResult,
    requirementArea: Extract<RequirementArea, 'custom' | 'groupA' | 'groupB'>
  ) => void
  onToggleCustomCourse: (id: string) => void
  onToggleCustomCourseInProgress: (id: string) => void
  onRemoveCustomCourse: (id: string) => void
  onAddTransferCredit: (entry: Omit<TransferCreditEntry, 'id'>) => void
  onToggleTransferCredit: (id: string) => void
  onRemoveTransferCredit: (id: string) => void
  apiCache: Record<string, CourseApiData>
}

export const ChecklistPage = ({
  plannerState,
  summary,
  onToggleCompletedCourse,
  onToggleInProgressCourse,
  onToggleConcentration,
  onAddLookupCourse,
  onToggleCustomCourse,
  onToggleCustomCourseInProgress,
  onRemoveCustomCourse,
  onAddTransferCredit,
  onToggleTransferCredit,
  onRemoveTransferCredit,
  apiCache,
}: ChecklistPageProps) => {
  const selectedConcentrations = getSelectedConcentrations(plannerState)

  return (
    <div className="page-shell checklist-page">

      <ProgressSummary
        concentrations={beedieBba2026.concentrations}
        onToggleConcentration={onToggleConcentration}
        selectedConcentrations={plannerState.selectedConcentrations}
        summary={summary}
      />

      <AddCoursesPanel
        customCourses={plannerState.customCourses}
        inProgressCodes={plannerState.inProgressCourseCodes}
        onAddLookupCourse={onAddLookupCourse}
        onAddTransferCredit={onAddTransferCredit}
        onRemoveCustomCourse={onRemoveCustomCourse}
        onRemoveTransferCredit={onRemoveTransferCredit}
        onToggleCustomCourse={onToggleCustomCourse}
        onToggleCustomCourseInProgress={onToggleCustomCourseInProgress}
        onToggleTransferCredit={onToggleTransferCredit}
        transferCredits={plannerState.transferCredits}
      />

      <div className="stack">
        {beedieBba2026.lowerDivision.map((group) => (
          <CourseChecklistSection
            apiCache={apiCache}
            completedCodes={plannerState.completedCourseCodes}
            group={group}
            inProgressCodes={plannerState.inProgressCourseCodes}
            key={group.id}
            onToggleCompleted={onToggleCompletedCourse}
            onToggleInProgress={onToggleInProgressCourse}
          />
        ))}

        {beedieBba2026.upperDivision.map((group) => (
          <CourseChecklistSection
            apiCache={apiCache}
            completedCodes={plannerState.completedCourseCodes}
            group={group}
            inProgressCodes={plannerState.inProgressCourseCodes}
            key={group.id}
            onToggleCompleted={onToggleCompletedCourse}
            onToggleInProgress={onToggleInProgressCourse}
          />
        ))}

        {selectedConcentrations.map((definition) => (
          <section className="panel concentration-panel" key={definition.id}>
            <div className="checklist-section-heading">
              <div>
                <h3>{definition.name}</h3>
                <p>Concentration-specific checklist</p>
              </div>
            </div>

            <div className="stack compact">
              {definition.requiredGroups.map((group) => (
                <CourseChecklistSection
                  apiCache={apiCache}
                  completedCodes={plannerState.completedCourseCodes}
                  group={group}
                  inProgressCodes={plannerState.inProgressCourseCodes}
                  key={group.id}
                  onToggleCompleted={onToggleCompletedCourse}
                  onToggleInProgress={onToggleInProgressCourse}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
