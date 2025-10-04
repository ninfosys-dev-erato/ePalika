import { graphql, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

// In-memory counter state
const counters: Record<string, number> = {
  'MUNICIPALITY_DARTA_2082/83': 250,
  'MUNICIPALITY_CHALANI_2082/83': 180,
  'WARD_1_DARTA_2082/83': 45,
  'WARD_1_CHALANI_2082/83': 32,
}

const allocations: any[] = []

const getCounterKey = (scope: string, type: string, fiscalYear: string, wardId?: string) => {
  if (scope === 'WARD' && wardId) {
    return `WARD_${wardId}_${type}_${fiscalYear}`
  }
  return `${scope}_${type}_${fiscalYear}`
}

export const numberingHandlers = [
  // Query: Get counter status
  graphql.query('Counter', ({ variables }) => {
    const key = getCounterKey(
      variables.scope,
      variables.type,
      variables.fiscalYear,
      variables.wardId
    )
    const currentValue = counters[key] || 0

    return HttpResponse.json({
      data: {
        counter: {
          id: faker.string.uuid(),
          scope: variables.scope,
          type: variables.type,
          fiscalYear: variables.fiscalYear,
          currentValue,
          lastIssuedAt: faker.date.recent().toISOString(),
          isLocked: false,
          lockedBy: null,
          lockedReason: null,
          ward: variables.wardId
            ? { id: variables.wardId, number: parseInt(variables.wardId), name: `Ward ${variables.wardId}` }
            : null,
        },
      },
    })
  }),

  // Query: Get number allocation
  graphql.query('NumberAllocation', ({ variables }) => {
    const allocation = allocations.find((a) => a.id === variables.id)
    return HttpResponse.json({ data: { numberAllocation: allocation || null } })
  }),

  // Query: List all counters
  graphql.query('Counters', ({ variables }) => {
    const counterList = Object.entries(counters).map(([key, value]) => {
      const [scope, type, fiscalYear] = key.split('_')
      return {
        id: faker.string.uuid(),
        scope,
        type,
        fiscalYear,
        currentValue: value,
        lastIssuedAt: faker.date.recent().toISOString(),
        isLocked: false,
        lockedBy: null,
        lockedReason: null,
        ward: null,
      }
    })

    return HttpResponse.json({ data: { counters: counterList } })
  }),

  // Query: Check idempotency
  graphql.query('CheckIdempotency', ({ variables }) => {
    const allocation = allocations.find((a) => a.idempotencyKey === variables.idempotencyKey)
    return HttpResponse.json({ data: { checkIdempotency: allocation || null } })
  }),

  // Mutation: Allocate number (provisional)
  graphql.mutation('AllocateNumber', ({ variables }) => {
    const key = getCounterKey(
      variables.input.scope,
      variables.input.type,
      variables.input.fiscalYear,
      variables.input.wardId
    )

    // Check idempotency
    const existing = allocations.find((a) => a.idempotencyKey === variables.input.idempotencyKey)
    if (existing) {
      return HttpResponse.json({ data: { allocateNumber: existing } })
    }

    // Increment counter
    counters[key] = (counters[key] || 0) + 1
    const number = counters[key]

    const allocation = {
      id: faker.string.uuid(),
      number,
      formattedNumber:
        variables.input.scope === 'MUNICIPALITY'
          ? `${variables.input.type}-MUN/${variables.input.fiscalYear}/${number}`
          : `${variables.input.type}-WARD-${variables.input.wardId}/${variables.input.fiscalYear}/${number}`,
      scope: variables.input.scope,
      type: variables.input.type,
      fiscalYear: variables.input.fiscalYear,
      ward: variables.input.wardId
        ? {
            id: variables.input.wardId,
            number: parseInt(variables.input.wardId),
            name: `Ward ${variables.input.wardId}`,
          }
        : null,
      status: 'PROVISIONAL',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      allocatedBy: {
        id: faker.string.uuid(),
        username: 'clerk1',
        fullName: 'Registry Clerk',
        email: 'clerk@example.com',
        roles: [],
      },
      allocatedAt: new Date().toISOString(),
      idempotencyKey: variables.input.idempotencyKey,
    }

    allocations.push(allocation)

    return HttpResponse.json({ data: { allocateNumber: allocation } })
  }),

  // Mutation: Commit number
  graphql.mutation('CommitNumber', ({ variables }) => {
    const allocation = allocations.find((a) => a.id === variables.input.allocationId)
    if (!allocation) {
      return HttpResponse.json({ errors: [{ message: 'Allocation not found' }] })
    }

    allocation.status = 'COMMITTED'
    delete allocation.expiresAt

    return HttpResponse.json({ data: { commitNumber: allocation } })
  }),

  // Mutation: Void number
  graphql.mutation('VoidNumber', ({ variables }) => {
    const allocation = allocations.find((a) => a.id === variables.input.allocationId)
    if (!allocation) {
      return HttpResponse.json({ errors: [{ message: 'Allocation not found' }] })
    }

    allocation.status = 'VOID'

    return HttpResponse.json({ data: { voidNumber: allocation } })
  }),

  // Mutation: Rollover fiscal year
  graphql.mutation('RolloverFiscalYear', ({ variables }) => {
    const key = getCounterKey(
      variables.input.scope,
      'DARTA',
      variables.input.newFiscalYear,
      variables.input.wardId
    )

    // Reset counters for new fiscal year
    counters[key] = 0

    return HttpResponse.json({
      data: {
        rolloverFiscalYear: {
          success: true,
          fiscalYear: variables.input.newFiscalYear,
          scope: variables.input.scope,
          ward: variables.input.wardId
            ? { id: variables.input.wardId, number: parseInt(variables.input.wardId), name: `Ward ${variables.input.wardId}` }
            : null,
          closingCounters: [
            { counterType: 'DARTA', lastValue: 250, fiscalYear: '2082/83' },
            { counterType: 'CHALANI', lastValue: 180, fiscalYear: '2082/83' },
          ],
          openingCounters: [
            {
              id: faker.string.uuid(),
              scope: variables.input.scope,
              type: 'DARTA',
              fiscalYear: variables.input.newFiscalYear,
              currentValue: 0,
              isLocked: false,
            },
          ],
          attestedBy: {
            id: faker.string.uuid(),
            username: 'admin',
            fullName: 'System Admin',
            email: 'admin@example.com',
            roles: [],
          },
          attestedAt: new Date().toISOString(),
        },
      },
    })
  }),
]
