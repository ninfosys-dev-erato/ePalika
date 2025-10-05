import { faker } from '@faker-js/faker'

export const mockDepartments = [
  { id: '1', name: 'शिक्षा विभाग', code: 'EDU', type: 'DEPARTMENT' as const },
  { id: '2', name: 'स्वास्थ्य विभाग', code: 'HEALTH', type: 'DEPARTMENT' as const },
  { id: '3', name: 'योजना तथा विकास विभाग', code: 'PLANNING', type: 'DEPARTMENT' as const },
  { id: '4', name: 'वित्त विभाग', code: 'FINANCE', type: 'DEPARTMENT' as const },
  { id: '5', name: 'कृषि विभाग', code: 'AGRI', type: 'DEPARTMENT' as const },
]

export const mockSections = [
  { id: '11', name: 'प्राथमिक शिक्षा शाखा', code: 'EDU-PRIMARY', type: 'SECTION' as const, parent: mockDepartments[0] },
  { id: '12', name: 'माध्यमिक शिक्षा शाखा', code: 'EDU-SECONDARY', type: 'SECTION' as const, parent: mockDepartments[0] },
  { id: '21', name: 'स्वास्थ्य केन्द्र शाखा', code: 'HEALTH-CENTER', type: 'SECTION' as const, parent: mockDepartments[1] },
  { id: '22', name: 'खोप तथा रोकथाम शाखा', code: 'HEALTH-VACCINE', type: 'SECTION' as const, parent: mockDepartments[1] },
  { id: '31', name: 'भौतिक पूर्वाधार शाखा', code: 'PLAN-INFRA', type: 'SECTION' as const, parent: mockDepartments[2] },
]

export const mockWards = Array.from({ length: 12 }, (_, i) => ({
  id: `W${i + 1}`,
  number: i + 1,
  name: `वडा नम्बर ${i + 1}`,
}))

export const createMockOrganizationalUnit = (overrides?: any) => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  code: faker.string.alpha({ length: 3, casing: 'upper' }),
  type: faker.helpers.arrayElement(['DEPARTMENT', 'SECTION', 'UNIT']),
  parent: null,
  children: [],
  ...overrides,
})
