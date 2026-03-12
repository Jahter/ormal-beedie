import { TermGrid } from '../components/TermGrid'
import type { CourseApiData, PlannerState } from '../types'

interface SchedulePageProps {
  plannerState: PlannerState
  apiCache: Record<string, CourseApiData>
  completedCredits: number
  scheduleMessages: string[]
  verificationMessages: string[]
  onGenerateSchedule: () => void
  onVerifySchedule: () => void
  onClearSchedule: () => void
  onToggleCoop: (termId: string) => void
  onMoveCourseToTerm: (courseId: string, targetTermId: string) => void
  onUnitsTargetChange: (value: number) => void
}

export const SchedulePage = ({
  plannerState,
  apiCache,
  completedCredits,
  scheduleMessages,
  verificationMessages,
  onGenerateSchedule,
  onVerifySchedule,
  onClearSchedule,
  onToggleCoop,
  onMoveCourseToTerm,
  onUnitsTargetChange,
}: SchedulePageProps) => (
  <div className="page-shell">
    <header className="page-header">
      <div>
        <h1>Schedule Generator</h1>
        <p>
          Auto-place incomplete degree requirements into future terms while respecting
          completed courses and Co-op terms.
        </p>
      </div>
    </header>

    <section className="panel">
      <div className="toolbar">
        <button className="primary-button" onClick={onGenerateSchedule} type="button">
          Auto-Generate Schedule
        </button>
        <button onClick={onVerifySchedule} type="button">
          Verify Schedule
        </button>
        <button onClick={onClearSchedule} type="button">
          Clear Schedule
        </button>
        <label className="units-target">
          Units / term
          <input
            min="3"
            onChange={(event) => onUnitsTargetChange(Number(event.target.value))}
            type="number"
            value={plannerState.unitsPerTermTarget}
          />
        </label>
      </div>
      <p className="muted schedule-note">
        The first term is reserved for courses marked as currently in progress on the checklist.
        Auto-generation starts from the following term.
      </p>
    </section>

    {scheduleMessages.length > 0 ? (
      <section className="panel">
        <h3>Generation Notes</h3>
        <ul className="message-list">
          {scheduleMessages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </section>
    ) : null}

    {verificationMessages.length > 0 ? (
      <section className="panel">
        <h3>Verification</h3>
        <ul className="message-list warning">
          {verificationMessages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </section>
    ) : null}

    <TermGrid
      apiCache={apiCache}
      completedCodes={plannerState.completedCourseCodes}
      inProgressCodes={plannerState.inProgressCourseCodes}
      startingCredits={completedCredits}
      onMoveCourseToTerm={onMoveCourseToTerm}
      onToggleCoop={onToggleCoop}
      terms={plannerState.termPlans}
    />
  </div>
)
