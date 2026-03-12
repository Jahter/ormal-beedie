export type WqbTag = 'W' | 'Q' | 'B-Hum' | 'B-Soc' | 'B-Sci'

export type RequirementArea =
  | 'lowerCore'
  | 'upperCore'
  | 'groupA'
  | 'groupB'
  | 'concentration'
  | 'custom'
  | 'transfer'

export type TermSeason = 'Spring' | 'Summer' | 'Fall'

export interface CourseReference {
  code: string
  title: string
  units: number
  department: string
  number: string
  requirementArea: RequirementArea
  optionGroupId?: string
  optionLabel?: string
  designations?: WqbTag[]
}

export interface RequirementGroup {
  id: string
  title: string
  description?: string
  minRequired?: number
  courses: CourseReference[]
}

export interface ConcentrationDefinition {
  id: string
  name: string
  requiredGroups: RequirementGroup[]
}

export interface GenericRequirementOption {
  id: string
  label: string
  unitsRequired: number
}

export interface DegreeRules {
  degreeName: string
  totalUnitsRequired: number
  lowerDivision: RequirementGroup[]
  upperDivision: RequirementGroup[]
  groupAOptions: CourseReference[]
  groupBOptions: CourseReference[]
  concentrations: ConcentrationDefinition[]
}

export interface CourseApiData {
  code: string
  title: string
  units: number
  designationText: string
  designations: WqbTag[]
  prerequisites: string
  corequisites: string
  description: string
}

export interface CustomCourseEntry {
  id: string
  code: string
  title: string
  units: number
  completed: boolean
  requirementArea: Exclude<RequirementArea, 'lowerCore' | 'upperCore' | 'concentration'>
  designations: WqbTag[]
  prerequisites?: string
  corequisites?: string
}

export interface TransferCreditEntry {
  id: string
  title: string
  units: number
  completed: boolean
  designations: WqbTag[]
  requirementArea: 'transfer' | 'groupA' | 'groupB'
}

export interface StoredScheduleCourse {
  id: string
  code: string
  title: string
  units: number
  prerequisites?: string
  source: 'required' | 'custom' | 'current' | 'placeholder'
}

export interface TermPlan {
  id: string
  season: TermSeason
  year: number
  isCoop: boolean
  courses: StoredScheduleCourse[]
}

export interface PlannerState {
  completedCourseCodes: string[]
  inProgressCourseCodes: string[]
  selectedConcentrations: string[]
  customCourses: CustomCourseEntry[]
  transferCredits: TransferCreditEntry[]
  apiCourseCache: Record<string, CourseApiData>
  termPlans: TermPlan[]
  unitsPerTermTarget: number
}

export interface OutlineLookupResult {
  code: string
  title: string
  units: number
  designationText: string
  designations: WqbTag[]
  prerequisites: string
  corequisites: string
  description: string
}

export interface ProgressSummaryData {
  totalCredits: number
  totalCreditsRequired: number
  wCredits: number
  qCredits: number
  breadthHumCredits: number
  breadthSocCredits: number
  breadthSciCredits: number
  groupAUnits: number
  groupBUnits: number
}

export interface ScheduleGenerationResult {
  termPlans: TermPlan[]
  warnings: string[]
}
