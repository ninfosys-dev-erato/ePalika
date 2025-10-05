import { faker } from '@faker-js/faker'

export const createMockUser = (overrides?: any) => ({
  id: faker.string.uuid(),
  username: faker.internet.username(),
  fullName: faker.person.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  actorType: faker.helpers.arrayElement([
    'CENTRAL_REGISTRY_CLERK',
    'SECTION_OFFICER',
    'SECTION_HEAD',
    'CAO',
    'WARD_SECRETARY',
    'WARD_OFFICER',
  ]),
  isActive: true,
  lastLogin: faker.date.recent().toISOString(),
  roles: [
    {
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement(['Clerk', 'Officer', 'Admin', 'Approver']),
      permissions: ['read:darta', 'write:darta', 'approve:chalani'],
    },
  ],
  organizationalUnit: null,
  ward: null,
  delegates: [],
  delegatedBy: [],
  activeDelegations: [],
  ...overrides,
})

export const mockUsers = Array.from({ length: 20 }, () => createMockUser())

// Specific role users
export const mockRegistryClerk = createMockUser({
  actorType: 'CENTRAL_REGISTRY_CLERK',
  fullName: 'राम बहादुर क्षेत्री',
  roles: [{ id: '1', name: 'Registry Clerk', permissions: ['create:darta', 'read:darta'] }],
})

export const mockSectionOfficer = createMockUser({
  actorType: 'SECTION_OFFICER',
  fullName: 'सीता कुमारी शर्मा',
  roles: [{ id: '2', name: 'Section Officer', permissions: ['read:darta', 'review:darta'] }],
})

export const mockSectionHead = createMockUser({
  actorType: 'SECTION_HEAD',
  fullName: 'गणेश प्रसाद पौडेल',
  roles: [{ id: '3', name: 'Section Head', permissions: ['approve:darta', 'approve:chalani'] }],
})

export const mockCAO = createMockUser({
  actorType: 'CAO',
  fullName: 'कृष्ण प्रसाद अधिकारी',
  roles: [{ id: '4', name: 'CAO', permissions: ['*:*'] }],
})

export const mockWardSecretary = createMockUser({
  actorType: 'WARD_SECRETARY',
  fullName: 'लक्ष्मी थापा',
  ward: { id: '1', number: 1, name: 'Ward 1' },
  roles: [{ id: '5', name: 'Ward Secretary', permissions: ['create:darta:ward', 'approve:chalani:ward'] }],
})
