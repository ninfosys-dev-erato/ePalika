import { graphql, HttpResponse } from 'msw'
import { mockChalanis, createMockChalani } from '../fixtures/chalani.fixtures'

let chalanis = [...mockChalanis]
let chalaniCounter = 200

export const chalaniHandlers = [
  // Query: Get Chalani by ID
  graphql.query('Chalani', ({ variables }) => {
    const chalani = chalanis.find((c) => c.id === variables.id)
    if (!chalani) {
      return HttpResponse.json({ errors: [{ message: 'Chalani not found' }] })
    }
    return HttpResponse.json({ data: { chalani } })
  }),

  // Query: List Chalanis with filters
  graphql.query('Chalanis', ({ variables }) => {
    let filtered = [...chalanis]

    const filter = variables.filter || {}
    if (filter.scope) filtered = filtered.filter((c) => c.scope === filter.scope)
    if (filter.status) filtered = filtered.filter((c) => c.status === filter.status)
    if (filter.isAcknowledged !== undefined) filtered = filtered.filter((c) => c.isAcknowledged === filter.isAcknowledged)

    const pagination = variables.pagination || { page: 1, limit: 20 }
    const start = (pagination.page - 1) * pagination.limit
    const end = start + pagination.limit
    const paginatedChalanis = filtered.slice(start, end)

    return HttpResponse.json({
      data: {
        chalanis: {
          edges: paginatedChalanis.map((node) => ({ cursor: node.id, node })),
          pageInfo: {
            page: pagination.page,
            limit: pagination.limit,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / pagination.limit),
            hasNextPage: end < filtered.length,
            hasPreviousPage: pagination.page > 1,
          },
        },
      },
    })
  }),

  // Query: My pending approvals
  graphql.query('MyPendingApprovals', ({ variables }) => {
    const filtered = chalanis.filter((c) => c.status === 'PENDING_APPROVAL')

    const pagination = variables.pagination || { page: 1, limit: 20 }
    const start = (pagination.page - 1) * pagination.limit
    const end = start + pagination.limit
    const paginatedChalanis = filtered.slice(start, end)

    return HttpResponse.json({
      data: {
        myPendingApprovals: {
          edges: paginatedChalanis.map((node) => ({ cursor: node.id, node })),
          pageInfo: {
            page: pagination.page,
            limit: pagination.limit,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / pagination.limit),
            hasNextPage: end < filtered.length,
            hasPreviousPage: pagination.page > 1,
          },
        },
      },
    })
  }),

  // Query: Chalani templates
  graphql.query('ChalaniTemplates', ({ variables }) => {
    const templates = [
      {
        id: '1',
        name: 'नागरिकता सिफारिस पत्र',
        category: 'सिफारिस',
        subject: 'नागरिकता सिफारिस सम्बन्धमा',
        body: 'यो कार्यालयको {dartaNumber} मिति {dartaDate} को दर्ता अनुसार...',
        requiredSignatories: [{ id: '1', name: 'Section Head' }],
        isActive: true,
      },
      {
        id: '2',
        name: 'व्यवसाय दर्ता प्रमाण पत्र',
        category: 'प्रमाण पत्र',
        subject: 'व्यवसाय दर्ता प्रमाण पत्र',
        body: 'यो व्यवसाय दर्ता प्रमाणित गरिएको छ...',
        requiredSignatories: [{ id: '2', name: 'CAO' }],
        isActive: true,
      },
    ]

    return HttpResponse.json({ data: { chalaniTemplates: templates } })
  }),

  // Mutation: Create Chalani
  graphql.mutation('CreateChalani', ({ variables }) => {
    chalaniCounter++
    const newChalani = createMockChalani({
      chalaniNumber: chalaniCounter,
      scope: variables.input.scope,
      wardId: variables.input.wardId,
      subject: variables.input.subject,
      body: variables.input.body,
      templateId: variables.input.templateId,
      linkedDartaId: variables.input.linkedDartaId,
      recipient: variables.input.recipient,
      status: 'PENDING_APPROVAL',
      isFullyApproved: false,
    })
    chalanis.push(newChalani)

    return HttpResponse.json({ data: { createChalani: newChalani } })
  }),

  // Mutation: Approve Chalani
  graphql.mutation('ApproveChalani', ({ variables }) => {
    const chalani = chalanis.find((c) => c.id === variables.input.chalaniId)
    if (!chalani) {
      return HttpResponse.json({ errors: [{ message: 'Chalani not found' }] })
    }

    if (variables.input.decision === 'APPROVED') {
      chalani.isFullyApproved = true
      chalani.status = 'APPROVED'
    } else {
      chalani.status = 'REJECTED'
    }

    return HttpResponse.json({ data: { approveChalani: chalani } })
  }),

  // Mutation: Dispatch Chalani
  graphql.mutation('DispatchChalani', ({ variables }) => {
    const chalani = chalanis.find((c) => c.id === variables.input.chalaniId)
    if (!chalani) {
      return HttpResponse.json({ errors: [{ message: 'Chalani not found' }] })
    }

    chalani.status = 'DISPATCHED'
    chalani.dispatchChannel = variables.input.dispatchChannel
    chalani.trackingId = variables.input.trackingId
    chalani.dispatchedAt = new Date().toISOString()

    return HttpResponse.json({ data: { dispatchChalani: chalani } })
  }),

  // Mutation: Acknowledge Chalani
  graphql.mutation('AcknowledgeChalani', ({ variables }) => {
    const chalani = chalanis.find((c) => c.id === variables.input.chalaniId)
    if (!chalani) {
      return HttpResponse.json({ errors: [{ message: 'Chalani not found' }] })
    }

    chalani.isAcknowledged = true
    chalani.acknowledgedAt = new Date().toISOString()
    chalani.acknowledgedBy = variables.input.acknowledgedBy
    chalani.status = 'ACKNOWLEDGED'

    return HttpResponse.json({ data: { acknowledgeChalani: chalani } })
  }),
]
