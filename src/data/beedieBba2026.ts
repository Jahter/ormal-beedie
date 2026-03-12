import type {
  ConcentrationDefinition,
  CourseReference,
  DegreeRules,
  RequirementArea,
  RequirementGroup,
  WqbTag,
} from '../types'

const course = (
  code: string,
  title: string,
  units: number,
  requirementArea: RequirementArea,
  designations: WqbTag[] = [],
  optionGroupId?: string,
  optionLabel?: string
): CourseReference => {
  const [department, number] = code.split(' ')

  return {
    code,
    title,
    units,
    department,
    number,
    requirementArea,
    designations,
    optionGroupId,
    optionLabel,
  }
}

const createGroup = (
  id: string,
  title: string,
  courses: CourseReference[],
  description?: string,
  minRequired?: number
): RequirementGroup => ({
  id,
  title,
  courses,
  description,
  minRequired,
})

const concentration = (
  id: string,
  name: string,
  requiredGroups: RequirementGroup[]
): ConcentrationDefinition => ({
  id,
  name,
  requiredGroups,
})

export const beedieBba2026: DegreeRules = {
  degreeName: 'SFU Beedie BBA - Summer 2026 Calendar',
  totalUnitsRequired: 120,
  lowerDivision: [
    createGroup(
      'foundation-pathway',
      'Business Foundation Pathway',
      [
        course('BUS 201', 'Introduction to Business', 3, 'lowerCore', [], 'foundation-pathway', 'Choose one'),
        course('BUS 202', 'Foundations of Business', 3, 'lowerCore', [], 'foundation-pathway', 'Choose one'),
      ],
      'Choose the pathway course that matches your admission stream.',
      1
    ),
    createGroup('lower-core-required', 'Lower Division Core', [
      course('BUS 203', 'Professional Development - Launch', 1, 'lowerCore'),
      course('BUS 217W', 'Critical Thinking in Business', 3, 'lowerCore', ['W']),
      course('BUS 237', 'Introduction to Business Technology Management', 3, 'lowerCore'),
      course('BUS 240', 'Introduction to Innovation', 3, 'lowerCore'),
      course('BUS 251', 'Financial Accounting I', 3, 'lowerCore', ['Q']),
      course('BUS 254', 'Managerial Accounting I', 3, 'lowerCore', ['Q']),
      course('BUS 272', 'Behaviour in Organizations', 3, 'lowerCore'),
      course('BUS 275', 'Business in a Sustainable Society', 3, 'lowerCore'),
    ]),
    createGroup(
      'statistics-requirement',
      'Statistics Requirement',
      [
        course('BUS 232', 'Business Statistics', 3, 'lowerCore', ['Q'], 'statistics-requirement', 'Choose one'),
        course(
          'ECON 233',
          'Introduction to Economic Data and Statistics',
          3,
          'lowerCore',
          ['Q'],
          'statistics-requirement',
          'Choose one'
        ),
        course(
          'STAT 270',
          'Introduction to Probability and Statistics',
          3,
          'lowerCore',
          ['Q'],
          'statistics-requirement',
          'Choose one'
        ),
      ],
      'Complete one statistics course.',
      1
    ),
    createGroup(
      'economics-managerial',
      'Managerial Economics Requirement',
      [
        course('BUS 207', 'Managerial Economics', 3, 'lowerCore', ['Q'], 'economics-managerial', 'Choose one'),
        course(
          'ECON 201',
          'Microeconomic Theory I: Competitive Behavior',
          4,
          'lowerCore',
          ['Q'],
          'economics-managerial',
          'Choose one'
        ),
      ],
      'Complete one managerial economics option.',
      1
    ),
    createGroup(
      'microeconomics',
      'Microeconomics Requirement',
      [
        course('ECON 103', 'Principles of Microeconomics', 4, 'lowerCore', ['Q', 'B-Soc'], 'microeconomics', 'Choose one'),
        course('ECON 113', 'Introduction to Microeconomics', 3, 'lowerCore', ['Q', 'B-Soc'], 'microeconomics', 'Choose one'),
      ],
      'Complete one introductory microeconomics course.',
      1
    ),
    createGroup(
      'macroeconomics',
      'Macroeconomics Requirement',
      [
        course('ECON 105', 'Principles of Macroeconomics', 4, 'lowerCore', ['Q', 'B-Soc'], 'macroeconomics', 'Choose one'),
        course('ECON 115', 'Introduction to Macroeconomics', 3, 'lowerCore', ['Q', 'B-Soc'], 'macroeconomics', 'Choose one'),
      ],
      'Complete one introductory macroeconomics course.',
      1
    ),
    createGroup(
      'calculus',
      'Calculus Requirement',
      [
        course('MATH 150', 'Calculus I with Review', 4, 'lowerCore', ['Q'], 'calculus', 'Choose one'),
        course('MATH 151', 'Calculus I', 3, 'lowerCore', ['Q'], 'calculus', 'Choose one'),
        course('MATH 154', 'Mathematics for the Life Sciences I', 3, 'lowerCore', ['Q'], 'calculus', 'Choose one'),
        course('MATH 157', 'Calculus I for the Social Sciences', 3, 'lowerCore', ['Q'], 'calculus', 'Choose one'),
      ],
      'Complete one calculus course.',
      1
    ),
    createGroup(
      'writing-lower',
      'Lower Division Writing Requirement',
      [
        course('ENGL 112W', 'Literature Now', 3, 'lowerCore', ['W', 'B-Hum'], 'writing-lower', 'Choose one'),
        course('ENGL 114W', 'Language and Purpose', 3, 'lowerCore', ['W', 'B-Hum'], 'writing-lower', 'Choose one'),
        course('ENGL 199W', 'Writing to Persuade', 3, 'lowerCore', ['W'], 'writing-lower', 'Choose one'),
        course('PHIL 100W', 'Knowledge and Reality', 3, 'lowerCore', ['W', 'B-Hum'], 'writing-lower', 'Choose one'),
        course('PHIL 120W', 'Moral and Legal Problems', 3, 'lowerCore', ['W', 'B-Hum'], 'writing-lower', 'Choose one'),
        course('WL 103W', 'Early World Literatures', 3, 'lowerCore', ['W', 'B-Hum'], 'writing-lower', 'Choose one'),
      ],
      'Choose a lower division writing course from the approved list.',
      1
    ),
  ],
  upperDivision: [
    createGroup('upper-core-required', 'Upper Division Core', [
      course('BUS 300', 'Professional Development - Planning', 1, 'upperCore'),
      course('BUS 303', 'Business, Society and Ethics', 3, 'upperCore'),
      course('BUS 312', 'Introduction to Finance', 3, 'upperCore', ['Q']),
      course('BUS 343', 'Introduction to Marketing', 3, 'upperCore'),
      course('BUS 360W', 'Business Communication', 4, 'upperCore', ['W']),
      course('BUS 373', 'Operations and Supply Chain Management', 3, 'upperCore'),
      course('BUS 393', 'Commercial Law', 3, 'upperCore'),
      course('BUS 478', 'Strategy', 3, 'upperCore'),
      course('BUS 496', 'Professional Development - Summit', 1, 'upperCore'),
    ]),
    createGroup(
      'organization-stream',
      'Organization / HR Requirement',
      [
        course('BUS 374', 'Organization Theory', 3, 'upperCore', [], 'organization-stream', 'Choose one'),
        course(
          'BUS 381',
          'Introduction to Human Resource Management',
          3,
          'upperCore',
          [],
          'organization-stream',
          'Choose one'
        ),
      ],
      'Complete one organization or HR course.',
      1
    ),
    createGroup(
      'global-business',
      'Global Business Requirement',
      [
        course('BUS 346', 'Global Business Environment', 3, 'upperCore', [], 'global-business', 'Choose one'),
      ],
      'The calendar allows an approved exchange/field school substitution; BUS 346 is included as the standard option.',
      1
    ),
  ],
  groupAOptions: [
    course('GA 101', 'Introduction to Global Asia', 3, 'groupA', ['B-Hum', 'B-Soc']),
    course('GEOG 100', 'Our World: Introducing Human Geography', 3, 'groupA', ['B-Hum', 'B-Soc']),
    course('HUM 101W', 'Introduction to Global Humanities', 3, 'groupA', ['W', 'B-Hum']),
    course('IS 101', 'Global Challenges of the 21st Century', 3, 'groupA', ['B-Hum', 'B-Soc']),
    course('IS 220', 'Wealth and Poverty of Nations', 3, 'groupA', ['B-Soc']),
    course('POL 141', 'International Relations', 3, 'groupA', ['B-Soc']),
    course('WL 100', 'What is World Literature?', 3, 'groupA', ['B-Hum']),
    course('CMNS 110', 'Introduction to Communication Studies', 3, 'groupA', ['B-Soc']),
    course('IAT 210', 'Introduction to Game Studies: Theory and Design', 3, 'groupA', ['B-Hum', 'B-Soc']),
    course('POL 253', 'Introduction to Public Policy', 3, 'groupA', ['B-Soc']),
    course('SA 150', 'Introduction to Sociology', 4, 'groupA', ['B-Soc']),
    course('TEKX 101', 'Introduction to 3D Printing and Laser Scanning Technologies', 3, 'groupA', ['Q', 'B-Sci']),
    course('INDG 305', 'Treaties in Canada', 1, 'groupA'),
    course('LBST 100', 'Equality and Inequality at Work', 3, 'groupA', ['B-Soc']),
    course('REM 100', 'Global Change', 3, 'groupA', ['B-Soc']),
    course('ARCH 101', 'Reconstructing the Human Past', 3, 'groupA', ['B-Soc']),
    course('BPK 140', 'Contemporary Health Issues', 3, 'groupA', ['B-Sci']),
    course('EASC 104', 'Geohazards - Earth in Turmoil', 3, 'groupA', ['B-Sci']),
    course('GEOG 104', 'Climate Change, Water, and Society', 3, 'groupA', ['B-Soc', 'B-Sci']),
    course('PLAN 100', 'Introduction to Planning', 3, 'groupA', ['B-Soc']),
  ],
  groupBOptions: [
    course('INDG 101', 'Introduction to Indigenous Studies', 3, 'groupB', ['B-Hum', 'B-Soc']),
    course('INDG 110W', 'International Indigenous Lifewriting', 4, 'groupB', ['W', 'B-Hum']),
    course('INDG 111', 'Introduction to Indigenous Research Methods', 3, 'groupB'),
    course('INDG 201W', "Indigenous Peoples' Perspectives on History", 3, 'groupB', ['W', 'B-Soc']),
    course('INDG 360', 'Popular Writing by Indigenous Authors', 4, 'groupB'),
    course('REM 207', 'Indigenous Peoples and Resource Management', 3, 'groupB', ['B-Soc']),
    course('SA 216', 'Sociology of Indigenous-Settler Relations', 4, 'groupB', ['B-Soc']),
  ],
  concentrations: [
    concentration('accounting', 'Accounting', [
      createGroup('accounting-required', 'Accounting Required Courses', [
        course('BUS 320', 'Financial Accounting: Assets', 3, 'concentration'),
        course('BUS 321', 'Financial Accounting: Equities', 3, 'concentration'),
        course('BUS 322', 'Intermediate Managerial Accounting', 3, 'concentration'),
        course('BUS 421', 'Accounting Theory', 3, 'concentration'),
      ]),
      createGroup(
        'accounting-advanced',
        'Accounting Advanced Option',
        [
          course('BUS 420', 'Advanced Accounting', 3, 'concentration', [], 'accounting-advanced', 'Choose at least one'),
          course('BUS 424', 'Advanced Managerial Accounting', 3, 'concentration', [], 'accounting-advanced', 'Choose at least one'),
          course(
            'BUS 426',
            'Auditing and Assurance: Concepts and Methods',
            3,
            'concentration',
            [],
            'accounting-advanced',
            'Choose at least one'
          ),
          course(
            'BUS 428',
            'Forensic Accounting and Data Analytics',
            3,
            'concentration',
            [],
            'accounting-advanced',
            'Choose at least one'
          ),
        ],
        undefined,
        1
      ),
    ]),
    concentration('innovation', 'Innovation and Entrepreneurship', [
      createGroup('innovation-required', 'Innovation Required Courses', [
        course('BUS 314', 'Financial Foundations for Entrepreneurs', 3, 'concentration'),
        course('BUS 338', 'Foundations of Innovation', 3, 'concentration'),
        course('BUS 361', 'Project Management', 3, 'concentration'),
        course('BUS 477', 'Startup Experience', 4, 'concentration'),
      ]),
      createGroup(
        'innovation-option',
        'Innovation Elective Option',
        [
          course('BUS 339', 'Make Change Studio II - Iteration and Prototyping', 4, 'concentration', [], 'innovation-option', 'Choose one'),
          course('BUS 406', 'Startup Accelerator', 3, 'concentration', [], 'innovation-option', 'Choose one'),
          course('BUS 443', 'New Product Development and Design', 3, 'concentration', [], 'innovation-option', 'Choose one'),
          course('BUS 450', 'Managing Emerging Opportunities', 3, 'concentration', [], 'innovation-option', 'Choose one'),
          course('BUS 453', 'Sustainable Innovation', 3, 'concentration', [], 'innovation-option', 'Choose one'),
        ],
        undefined,
        1
      ),
    ]),
    concentration('finance', 'Finance', [
      createGroup('finance-required', 'Finance Required Courses', [
        course('BUS 313', 'Corporate Finance', 3, 'concentration'),
        course('BUS 315', 'Investments', 3, 'concentration', ['Q']),
      ]),
      createGroup(
        'finance-option',
        'Finance Advanced Courses',
        [
          course('BUS 410', 'Financial Institutions', 3, 'concentration', [], 'finance-option', 'Choose three'),
          course('BUS 411', 'Fixed Income Security Analysis and Valuation', 3, 'concentration', [], 'finance-option', 'Choose three'),
          course('BUS 412', 'Advanced Corporate Finance', 3, 'concentration', [], 'finance-option', 'Choose three'),
          course('BUS 414', 'Real Estate Investments', 3, 'concentration', [], 'finance-option', 'Choose three'),
          course('BUS 417', 'Equity Security Analysis', 3, 'concentration', [], 'finance-option', 'Choose three'),
          course('BUS 418', 'International Financial Management', 3, 'concentration', [], 'finance-option', 'Choose three'),
          course('BUS 419', 'Derivative Securities', 3, 'concentration', [], 'finance-option', 'Choose three'),
        ],
        undefined,
        3
      ),
    ]),
    concentration('hr', 'Human Resource Management', [
      createGroup('hr-required', 'HR Required Courses', [
        course('BUS 374', 'Organization Theory', 3, 'concentration'),
        course('BUS 381', 'Introduction to Human Resource Management', 3, 'concentration'),
      ]),
      createGroup(
        'hr-option',
        'HR Advanced Courses',
        [
          course('BUS 481', 'Recruitment and Selection', 3, 'concentration', [], 'hr-option', 'Choose three'),
          course('BUS 482', 'Performance Management', 3, 'concentration', [], 'hr-option', 'Choose three'),
          course('BUS 483', 'Introduction to Employment Law For Business', 3, 'concentration', [], 'hr-option', 'Choose three'),
          course('BUS 484', 'Employment Systems', 3, 'concentration', [], 'hr-option', 'Choose three'),
          course('BUS 485', 'Negotiations and Conflict Management', 3, 'concentration', [], 'hr-option', 'Choose three'),
          course('BUS 486', 'Leadership', 3, 'concentration', [], 'hr-option', 'Choose three'),
          course('BUS 487', 'Organizational Development and Change Management', 3, 'concentration', [], 'hr-option', 'Choose three'),
          course('BUS 488', 'Group Dynamics and Teamwork', 3, 'concentration', [], 'hr-option', 'Choose three'),
          course('BUS 489', 'Management Practices for Sustainability', 3, 'concentration', [], 'hr-option', 'Choose three'),
        ],
        undefined,
        3
      ),
    ]),
    concentration('international-business', 'International Business', [
      createGroup('intl-required', 'International Business Required Courses', [
        course('BUS 346', 'Global Business Environment', 3, 'concentration'),
      ]),
      createGroup(
        'intl-option',
        'International Business Advanced Courses',
        [
          course('BUS 418', 'International Financial Management', 3, 'concentration', [], 'intl-option', 'Choose three'),
          course('BUS 430', 'Cross-Cultural Management', 3, 'concentration', [], 'intl-option', 'Choose three'),
          course('BUS 431', 'Business with East Asian Countries', 3, 'concentration', [], 'intl-option', 'Choose three'),
          course('BUS 432', 'International Human Resource Management', 3, 'concentration', [], 'intl-option', 'Choose three'),
          course('BUS 434', 'Foreign Market Entry', 3, 'concentration', [], 'intl-option', 'Choose three'),
          course('BUS 435', 'Management of International Firms', 3, 'concentration', [], 'intl-option', 'Choose three'),
          course('BUS 447', 'Global Marketing Management', 3, 'concentration', [], 'intl-option', 'Choose three'),
        ],
        undefined,
        3
      ),
    ]),
    concentration('mis', 'Management Information Systems', [
      createGroup('mis-required', 'MIS Required Courses', [
        course('BUS 361', 'Project Management', 3, 'concentration'),
        course('BUS 362', 'Business Process Analysis', 4, 'concentration'),
        course('BUS 468', 'Managing Information Technology for Business Value', 3, 'concentration'),
      ]),
      createGroup(
        'mis-option',
        'MIS Advanced Courses',
        [
          course('BUS 462', 'Business Analytics', 3, 'concentration', [], 'mis-option', 'Choose two'),
          course('BUS 464', 'Business Data Management', 3, 'concentration', [], 'mis-option', 'Choose two'),
          course('BUS 465', 'Business Systems Development', 3, 'concentration', [], 'mis-option', 'Choose two'),
          course('BUS 466', 'Web-Enabled Business and Emerging Technologies', 3, 'concentration', [], 'mis-option', 'Choose two'),
        ],
        undefined,
        2
      ),
    ]),
    concentration('operations', 'Operations Management', [
      createGroup('operations-required', 'Operations Required Courses', [
        course('BUS 336', 'Data Analytics and Visualization', 3, 'concentration', ['Q']),
        course('BUS 473', 'Advanced Operations Management', 3, 'concentration'),
      ]),
      createGroup(
        'operations-option',
        'Operations Advanced Courses',
        [
          course('BUS 437', 'Decision Analysis in Business', 3, 'concentration', [], 'operations-option', 'Choose two'),
          course('BUS 440', 'Simulation in Management Decision-making', 4, 'concentration', [], 'operations-option', 'Choose two'),
          course('BUS 445', 'Customer Analytics', 3, 'concentration', [], 'operations-option', 'Choose two'),
          course('BUS 474', 'Supply Chain Management', 3, 'concentration', [], 'operations-option', 'Choose two'),
          course('BUS 475', 'Sustainable Operations', 3, 'concentration', [], 'operations-option', 'Choose two'),
        ],
        undefined,
        2
      ),
    ]),
    concentration('marketing', 'Marketing', [
      createGroup('marketing-required', 'Marketing Required Courses', [
        course('BUS 345', 'Marketing Research', 3, 'concentration'),
        course('BUS 347', 'Consumer Behaviour', 3, 'concentration'),
      ]),
      createGroup(
        'marketing-option',
        'Marketing Advanced Courses',
        [
          course('BUS 441', 'Web Analytics', 3, 'concentration', [], 'marketing-option', 'Choose three'),
          course('BUS 443', 'New Product Development and Design', 3, 'concentration', [], 'marketing-option', 'Choose three'),
          course('BUS 444', 'Business to Business Marketing', 3, 'concentration', [], 'marketing-option', 'Choose three'),
          course('BUS 445', 'Customer Analytics', 3, 'concentration', [], 'marketing-option', 'Choose three'),
          course('BUS 446', 'Marketing Strategy in Sports, Entertainment and Other Creative Industries', 3, 'concentration', [], 'marketing-option', 'Choose three'),
          course('BUS 447', 'Global Marketing Management', 3, 'concentration', [], 'marketing-option', 'Choose three'),
          course('BUS 448', 'Integrated Marketing Communications', 3, 'concentration', [], 'marketing-option', 'Choose three'),
          course('BUS 449', 'Ethical Issues in Marketing', 3, 'concentration', [], 'marketing-option', 'Choose three'),
          course('BUS 455', 'Product & Brand Management', 3, 'concentration', [], 'marketing-option', 'Choose three'),
        ],
        undefined,
        3
      ),
    ]),
    concentration('strategic-analysis', 'Strategic Analysis', [
      createGroup(
        'strategic-option',
        'Strategic Analysis Courses',
        [
          course('BUS 307', 'Business Applications of Game Theory', 3, 'concentration', [], 'strategic-option', 'Choose three'),
          course('BUS 371', 'Critical Thinking Through Business Case Analysis', 3, 'concentration', [], 'strategic-option', 'Choose three'),
          course('BUS 471', 'Strategic Decision Making', 3, 'concentration', [], 'strategic-option', 'Choose three'),
          course('BUS 479', 'Strategy Analysis Practicum', 3, 'concentration', [], 'strategic-option', 'Choose three'),
        ],
        undefined,
        3
      ),
    ]),
  ],
}

export const coreCourseCatalog = [
  ...beedieBba2026.lowerDivision.flatMap((group) => group.courses),
  ...beedieBba2026.upperDivision.flatMap((group) => group.courses),
]

export const groupACourseMap = new Map(
  beedieBba2026.groupAOptions.map((item) => [item.code, item])
)

export const groupBCourseMap = new Map(
  beedieBba2026.groupBOptions.map((item) => [item.code, item])
)
