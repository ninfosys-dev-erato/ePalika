import { graphql, HttpResponse } from 'msw'
import { mockDartas, createMockDarta, createMockAttachment } from '../fixtures/darta.fixtures'
import { faker } from '@faker-js/faker'

let dartas = [...mockDartas]
let dartaCounter = 100

export const dartaHandlers = [
  // Query: Get Darta by ID
  graphql.query('Darta', ({ variables }) => {
    const darta = dartas.find((d) => d.id === variables.id)
    if (!darta) {
      return HttpResponse.json({ errors: [{ message: 'Darta not found' }] })
    }
    return HttpResponse.json({ data: { darta } })
  }),

  // Query: Get Darta by number
  graphql.query('DartaByNumber', ({ variables }) => {
    const darta = dartas.find(
      (d) =>
        d.dartaNumber === variables.dartaNumber &&
        d.fiscalYear === variables.fiscalYear &&
        d.scope === variables.scope
    )
    return HttpResponse.json({ data: { dartaByNumber: darta || null } })
  }),

  // Query: List Dartas with filters
  graphql.query('Dartas', ({ variables }) => {
    let filtered = [...dartas]

    const filter = variables.filter || {}
    if (filter.scope) filtered = filtered.filter((d) => d.scope === filter.scope)
    if (filter.status) filtered = filtered.filter((d) => d.status === filter.status)
    if (filter.priority) filtered = filtered.filter((d) => d.priority === filter.priority)
    if (filter.isOverdue !== undefined) filtered = filtered.filter((d) => d.isOverdue === filter.isOverdue)
    if (filter.search) {
      filtered = filtered.filter((d) =>
        d.subject.toLowerCase().includes(filter.search.toLowerCase())
      )
    }

    const pagination = variables.pagination || { page: 1, limit: 20 }
    const start = (pagination.page - 1) * pagination.limit
    const end = start + pagination.limit
    const paginatedDartas = filtered.slice(start, end)

    return HttpResponse.json({
      data: {
        dartas: {
          edges: paginatedDartas.map((node) => ({ cursor: node.id, node })),
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

  // Query: My assigned Dartas
  graphql.query('MyDartas', ({ variables }) => {
    const filtered = dartas.filter((d) =>
      variables.status ? d.status === variables.status : true
    )

    const pagination = variables.pagination || { page: 1, limit: 20 }
    const start = (pagination.page - 1) * pagination.limit
    const end = start + pagination.limit
    const paginatedDartas = filtered.slice(start, end)

    return HttpResponse.json({
      data: {
        myDartas: {
          edges: paginatedDartas.map((node) => ({ cursor: node.id, node })),
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

  // Query: Darta statistics
  graphql.query('DartaStats', ({ variables }) => {
    const filtered = dartas.filter((d) => {
      if (variables.scope && d.scope !== variables.scope) return false
      if (variables.fiscalYear && d.fiscalYear !== variables.fiscalYear) return false
      return true
    })

    const byStatus = Object.entries(
      filtered.reduce((acc: any, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1
        return acc
      }, {})
    ).map(([status, count]) => ({ status, count }))

    const byChannel = Object.entries(
      filtered.reduce((acc: any, d) => {
        acc[d.intakeChannel] = (acc[d.intakeChannel] || 0) + 1
        return acc
      }, {})
    ).map(([channel, count]) => ({ channel, count }))

    return HttpResponse.json({
      data: {
        dartaStats: {
          total: filtered.length,
          byStatus,
          byChannel,
          overdueCount: filtered.filter((d) => d.isOverdue).length,
          avgProcessingTime: faker.number.float({ min: 24, max: 120, fractionDigits: 1 }),
        },
      },
    })
  }),

  // Mutation: Create Darta
  graphql.mutation('CreateDarta', ({ variables }) => {
    dartaCounter++
    const primaryDocumentId = variables.input.primaryDocumentId
    const annexIds: string[] = variables.input.annexIds ?? []
    const primaryDocument = (() => {
      const attachment = createMockAttachment()
      const isPhoto = primaryDocumentId.startsWith('photo-')
      return {
        ...attachment,
        id: primaryDocumentId,
        mimeType: isPhoto ? 'image/jpeg' : attachment.mimeType,
        fileName: isPhoto ? `${primaryDocumentId}.jpg` : `document-${primaryDocumentId}.pdf`,
      }
    })()
    const annexAttachments = annexIds.map((id: string, index: number) => {
      const attachment = createMockAttachment()
      const isPhoto = id.startsWith('photo-')
      return {
        ...attachment,
        id,
        mimeType: isPhoto ? 'image/jpeg' : attachment.mimeType,
        fileName: isPhoto ? `${id}.jpg` : `annex-${index + 1}.pdf`,
      }
    })
    const newDarta = createMockDarta({
      dartaNumber: dartaCounter,
      scope: variables.input.scope,
      wardId: variables.input.wardId,
      subject: variables.input.subject,
      applicant: variables.input.applicant,
      intakeChannel: variables.input.intakeChannel,
      receivedDate: variables.input.receivedDate,
      priority: variables.input.priority || 'MEDIUM',
      status: 'PENDING_TRIAGE',
      primaryDocument,
      annexes: annexAttachments,
    })
    dartas.push(newDarta)

    return HttpResponse.json({ data: { createDarta: newDarta } })
  }),

  // Mutation: Route Darta
  graphql.mutation('RouteDarta', ({ variables }) => {
    const darta = dartas.find((d) => d.id === variables.input.dartaId)
    if (!darta) {
      return HttpResponse.json({ errors: [{ message: 'Darta not found' }] })
    }

    darta.status = 'PENDING_REVIEW'
    darta.priority = variables.input.priority || darta.priority

    return HttpResponse.json({ data: { routeDarta: darta } })
  }),

  // Mutation: Review Darta
  graphql.mutation('ReviewDarta', ({ variables }) => {
    const darta = dartas.find((d) => d.id === variables.input.dartaId)
    if (!darta) {
      return HttpResponse.json({ errors: [{ message: 'Darta not found' }] })
    }

    if (variables.input.decision === 'APPROVE') {
      darta.status = 'APPROVED'
    } else if (variables.input.decision === 'REQUEST_INFO') {
      darta.status = 'PENDING_REVIEW'
    }

    return HttpResponse.json({ data: { reviewDarta: darta } })
  }),

  // Mutation: Void Darta
  graphql.mutation('VoidDarta', ({ variables }) => {
    const darta = dartas.find((d) => d.id === variables.dartaId)
    if (!darta) {
      return HttpResponse.json({ errors: [{ message: 'Darta not found' }] })
    }

    darta.status = 'VOID'

    return HttpResponse.json({ data: { voidDarta: darta } })
  }),
]
