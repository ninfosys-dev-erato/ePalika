import { faker } from '@faker-js/faker'
import { mockUsers, mockRegistryClerk } from './users.fixtures'
import { mockDepartments, mockWards } from './units.fixtures'

const nepaliSubjects = [
  'नागरिकता सिफारिस अनुरोध',
  'व्यवसाय दर्ता',
  'जग्गा प्रमाणीकरण',
  'भवन निर्माण अनुमति',
  'विवाह दर्ता',
  'जन्म दर्ता',
  'मृत्यु दर्ता',
  'आयोजना प्रस्ताव',
  'वित्तीय सहायता अनुरोध',
  'कर छुट आवेदन',
]

export const createMockApplicant = () => ({
  id: faker.string.uuid(),
  type: faker.helpers.arrayElement(['CITIZEN', 'ORGANIZATION', 'GOVERNMENT_OFFICE']),
  fullName: faker.person.fullName(),
  organization: faker.helpers.maybe(() => faker.company.name(), { probability: 0.3 }),
  email: faker.helpers.maybe(() => faker.internet.email(), { probability: 0.7 }),
  phone: faker.phone.number(),
  address: faker.location.streetAddress({ useFullAddress: true }),
  identificationNumber: faker.helpers.maybe(() => faker.string.numeric(10), { probability: 0.8 }),
})

export const createMockAttachment = () => ({
  id: faker.string.uuid(),
  fileName: faker.system.fileName(),
  fileSize: faker.number.int({ min: 1000, max: 5000000 }),
  mimeType: faker.helpers.arrayElement(['application/pdf', 'image/jpeg', 'image/png']),
  url: faker.internet.url(),
  checksum: faker.string.alphanumeric(64),
  uploadedAt: faker.date.recent().toISOString(),
  uploadedBy: faker.helpers.arrayElement(mockUsers),
})

export const createMockDarta = (overrides?: any) => {
  const dartaNumber = faker.number.int({ min: 1, max: 9999 })
  const fiscalYear = '2082/83'
  const scope = faker.helpers.arrayElement(['MUNICIPALITY', 'WARD'])
  const receivedDate = faker.date.recent({ days: 30 })
  const entryDate = faker.date.between({ from: receivedDate, to: new Date() })

  return {
    id: faker.string.uuid(),
    dartaNumber,
    formattedDartaNumber: scope === 'MUNICIPALITY'
      ? `MUN/${fiscalYear}/${dartaNumber}`
      : `WARD-${faker.number.int({ min: 1, max: 12 })}/${fiscalYear}/${dartaNumber}`,
    fiscalYear,
    scope,
    ward: scope === 'WARD' ? faker.helpers.arrayElement(mockWards) : null,

    subject: faker.helpers.arrayElement(nepaliSubjects),
    applicant: createMockApplicant(),
    intakeChannel: faker.helpers.arrayElement(['COUNTER', 'POSTAL', 'EMAIL', 'EDARTA_PORTAL']),
    receivedDate: receivedDate.toISOString(),
    entryDate: entryDate.toISOString(),
    isBackdated: faker.datatype.boolean({ probability: 0.1 }),
    backdateReason: faker.helpers.maybe(() => 'Late arrival due to postal delay', { probability: 0.1 }),
    backdateApprover: faker.helpers.maybe(() => faker.helpers.arrayElement(mockUsers), { probability: 0.1 }),

    primaryDocument: createMockAttachment(),
    annexes: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, createMockAttachment),

    status: faker.helpers.arrayElement(['PENDING_TRIAGE', 'PENDING_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'CLOSED']),
    priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    assignedTo: faker.helpers.arrayElement(mockDepartments),
    currentAssignee: faker.helpers.arrayElement(mockUsers),

    slaDeadline: faker.date.soon({ days: 7 }).toISOString(),
    isOverdue: faker.datatype.boolean({ probability: 0.2 }),

    createdBy: mockRegistryClerk,
    createdAt: entryDate.toISOString(),
    auditTrail: [],

    chalaniResponses: [],
    relatedDarta: [],
    ...overrides,
  }
}

export const mockDartas = Array.from({ length: 50 }, () => createMockDarta())

// Specific test data
export const mockPendingDarta = createMockDarta({
  status: 'PENDING_TRIAGE',
  priority: 'HIGH',
  isOverdue: false,
})

export const mockOverdueDarta = createMockDarta({
  status: 'PENDING_REVIEW',
  isOverdue: true,
  slaDeadline: faker.date.past().toISOString(),
})
