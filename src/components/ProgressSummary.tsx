import { useState } from 'react'
import type { ConcentrationDefinition, ProgressSummaryData } from '../types'

interface ProgressSummaryProps {
  summary: ProgressSummaryData
  concentrations: ConcentrationDefinition[]
  selectedConcentrations: string[]
  onToggleConcentration: (id: string) => void
}

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="progress-metric">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
)

export const ProgressSummary = ({
  summary,
  concentrations,
  selectedConcentrations,
  onToggleConcentration,
}: ProgressSummaryProps) => {
  const completionPercent = Math.min(
    100,
    Math.round((summary.totalCredits / summary.totalCreditsRequired) * 100)
  )
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const selectedNames = concentrations
    .filter((c) => selectedConcentrations.includes(c.id))
    .map((c) => c.name)

  return (
    <section className="planner-summary-layout">
      <article className="planner-summary-card planner-summary-progress">
        <span className="planner-summary-label">Degree Progress</span>
        <div className="planner-progress-track">
          <div
            className="planner-progress-fill"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <strong className="planner-progress-text">
          {summary.totalCredits} / {summary.totalCreditsRequired} Units
        </strong>
        <div className="planner-summary-metrics planner-summary-4col">
          <Metric label="Writing" value={`${summary.wCredits} / 6`} />
          <Metric label="Quantitative" value={`${summary.qCredits} / 6`} />
          <Metric label="Group A" value={`${summary.groupAUnits} / 6`} />
          <Metric label="Group B" value={`${summary.groupBUnits} / 3`} />
        </div>
        <div className="breadth-section">
          <span className="breadth-heading">Breadth</span>
          <div className="planner-summary-metrics breadth-metrics">
            <Metric label="Humanities" value={`${summary.breadthHumCredits} / 6`} />
            <Metric label="Social Sci." value={`${summary.breadthSocCredits} / 6`} />
            <Metric label="Sciences" value={`${summary.breadthSciCredits} / 6`} />
          </div>
        </div>
      </article>

      <article className="planner-summary-card concentration-card">
        <span className="planner-summary-label">Concentration(s)</span>
        <div className="concentration-dropdown-wrapper">
          <button
            className="concentration-dropdown-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            type="button"
          >
            <span className="concentration-dropdown-text">
              {selectedNames.length > 0
                ? selectedNames.join(', ')
                : 'Select concentrations...'}
            </span>
            <span className="concentration-dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
          </button>
          {dropdownOpen ? (
            <div className="concentration-dropdown-menu">
              {concentrations.map((c) => {
                const isSelected = selectedConcentrations.includes(c.id)
                return (
                  <button
                    className={`concentration-dropdown-item ${isSelected ? 'concentration-dropdown-item-active' : ''}`}
                    key={c.id}
                    onClick={() => onToggleConcentration(c.id)}
                    type="button"
                  >
                    <span className="concentration-dropdown-check">{isSelected ? '✓' : ''}</span>
                    {c.name}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
        {selectedNames.length > 0 ? (
          <div className="concentration-selected-tags">
            {selectedNames.map((name) => (
              <span className="concentration-selected-tag" key={name}>{name}</span>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            No concentrations selected. Choose from the dropdown above.
          </p>
        )}
      </article>
    </section>
  )
}
