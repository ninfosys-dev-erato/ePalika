import { faker } from '@faker-js/faker'
import { mockUsers, mockSectionHead, mockCAO } from './users.fixtures'
import { mockWards } from './units.fixtures'
import { createMockAttachment } from './darta.fixtures'

const nepaliChalaniSubjects = [
  'नागरिकता सिफारिस',
  'व्यवसाय दर्ता प्रमाण पत्र',
  'भवन निर्माण स्वीकृत पत्र',
  'विवाह दर्ता प्रमाण पत्र',
  'आयोजना स्वीकृति पत्र',
  'बजेट निकासा स्वीकृति',
  'कर छुट स्वीकृति पत्र',
]

export const createMockRecipient = () => ({
  id: faker.string.uuid(),
  type: faker.helpers.arrayElement(['CITIZEN', 'ORGANIZATION', 'GOVERNMENT_OFFICE']),
  name: faker.person.fullName(),
  organization: faker.helpers.maybe(() => faker.company.name(), { probability: 0.3 }),
  email: faker.helpers.maybe(() => faker.internet.email(), { probability: 0.7 }),
  phone: faker.phone.number(),
  address: faker.location.streetAddress({ useFullAddress: true }),
})

export const createMockSignatory = (user?: any) => ({
  id: faker.string.uuid(),
  user: user || faker.helpers.arrayElement(mockUsers),
  role: {
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(['Section Head', 'CAO', 'Mayor']),
    permissions: [],
  },
  order: faker.number.int({ min: 1, max: 3 }),
  isRequired: true,
})

export const createMockApproval = (signatory: any) => ({
  id: faker.string.uuid(),
  signatory,
  decision: faker.helpers.arrayElement(['APPROVED', 'REJECTED']),
  notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.5 }),
  approvedAt: faker.date.recent().toISOString(),
})

export const createMockChalani = (overrides?: any) => {
  const chalaniNumber = faker.number.int({ min: 1, max: 9999 })
  const fiscalYear = '2082/83'
  const scope = faker.helpers.arrayElement(['MUNICIPALITY', 'WARD'])
  const signatories = [createMockSignatory(mockSectionHead), createMockSignatory(mockCAO)]
  const isApproved = faker.datatype.boolean({ probability: 0.6 })

  return {
    id: faker.string.uuid(),
    chalaniNumber,
    formattedChalaniNumber: scope === 'MUNICIPALITY'
      ? `CHAL-MUN/${fiscalYear}/${chalaniNumber}`
      : `CHAL-WARD-${faker.number.int({ min: 1, max: 12 })}/${fiscalYear}/${chalaniNumber}`,
    fiscalYear,
    scope,
    ward: scope === 'WARD' ? faker.helpers.arrayElement(mockWards) : null,

    subject: faker.helpers.arrayElement(nepaliChalaniSubjects),
    body: faker.lorem.paragraphs(2),
    templateId: faker.helpers.maybe(() => faker.string.uuid(), { probability: 0.4 }),
    attachments: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, createMockAttachment),

    linkedDarta: null,

    status: isApproved
      ? faker.helpers.arrayElement(['APPROVED', 'DISPATCHED', 'ACKNOWLEDGED'])
      : 'PENDING_APPROVAL',
    requiredSignatories: signatories,
    approvals: isApproved ? signatories.map(createMockApproval) : [],
    isFullyApproved: isApproved,

    dispatchChannel: isApproved ? faker.helpers.arrayElement(['POSTAL', 'COURIER', 'EMAIL', 'HAND_DELIVERY']) : null,
    recipient: createMockRecipient(),
    dispatchedAt: isApproved ? faker.date.recent().toISOString() : null,
    dispatchedBy: isApproved ? faker.helpers.arrayElement(mockUsers) : null,
    trackingId: isApproved ? faker.helpers.maybe(() => faker.string.alphanumeric(12).toUpperCase(), { probability: 0.7 }) : null,

    isAcknowledged: isApproved && faker.datatype.boolean({ probability: 0.5 }),
    acknowledgedAt: isApproved && faker.datatype.boolean({ probability: 0.5 }) ? faker.date.recent().toISOString() : null,
    acknowledgedBy: isApproved && faker.datatype.boolean({ probability: 0.5 }) ? faker.person.fullName() : null,
    acknowledgementProof: null,

    createdBy: faker.helpers.arrayElement(mockUsers),
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
    auditTrail: [],
    ...overrides,
  }
}

export const mockChalanis = Array.from({ length: 40 }, () => createMockChalani())

export const mockPendingChalani = createMockChalani({
  status: 'PENDING_APPROVAL',
  isFullyApproved: false,
  approvals: [],
})

export const mockDispatchedChalani = createMockChalani({
  status: 'DISPATCHED',
  isFullyApproved: true,
  isAcknowledged: false,
  dispatchChannel: 'COURIER',
  trackingId: 'TRK' + faker.string.alphanumeric(10).toUpperCase(),
})
