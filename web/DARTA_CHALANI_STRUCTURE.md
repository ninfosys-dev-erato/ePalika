# Darta-Chalani System - Complete File Structure

> **Enterprise-grade Darta-Chalani (Registry & Dispatch) system with federated architecture, mobile-first design, and strict performance budgets**

## Performance Budgets (STRICT)
- Initial JS (shell) ≤ 160 KB gzipped
- CSS ≤ 35 KB gzipped
- FCP < 1.2s
- TTI < 1.8s
- Route-to-route < 150ms (cached)
- GraphQL p95 < 200ms (edge-proxied)

## Architecture Principles
1. **Federated Micro-Frontends** - Independently deployable modules
2. **Domain-Driven Design** - Granular domain packages
3. **Mobile-First** - 360px viewport baseline
4. **Offline-First** - PWA with IndexedDB persistence
5. **Type-Safe** - GraphQL Code Generator + TypeScript strict mode

---

## Complete Directory Structure

```
web/
├── README.md
├── DARTA_CHALANI_STRUCTURE.md              # This file
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .size-limit.json                         # Performance budget enforcement
├── .lighthouserc.js                         # Lighthouse CI config
├── vite.config.base.ts                      # Shared Vite config
│
├── apps/                                    # Micro-Frontend Applications
│   │
│   ├── shell/                               # Host Application (exists)
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── index.css
│   │   │   ├── vite-env.d.ts
│   │   │   ├── app/
│   │   │   │   ├── providers.tsx
│   │   │   │   └── routes/
│   │   │   │       └── router.tsx
│   │   │   └── ui/
│   │   │       └── CarbonProviders.tsx
│   │   ├── public/
│   │   │   ├── manifest.json               # PWA manifest
│   │   │   ├── robots.txt
│   │   │   ├── icons/                      # PWA icons (192, 512)
│   │   │   └── sw.js                       # Service Worker
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.app.json
│   │   └── tsconfig.node.json
│   │
│   ├── mfe-darta/                           # Darta (Inbound) MFE
│   │   ├── src/
│   │   │   ├── index.ts                    # Federation entry
│   │   │   ├── bootstrap.tsx
│   │   │   ├── routes/
│   │   │   │   ├── index.tsx               # Route config
│   │   │   │   ├── intake/
│   │   │   │   │   ├── route.tsx           # Intake screen
│   │   │   │   │   ├── CaptureChooser.tsx  # Camera/Upload/Email/Postal
│   │   │   │   │   ├── CameraScanner.tsx   # Live scan with auto-crop
│   │   │   │   │   ├── ScanReview.tsx      # Review pages, reorder
│   │   │   │   │   ├── AttachAnnexes.tsx   # Add more files
│   │   │   │   │   ├── MetadataForm.tsx    # Subject, applicant, channel
│   │   │   │   │   ├── MetadataMinimal.tsx # Fast path
│   │   │   │   │   ├── ReviewCommit.tsx    # Final review
│   │   │   │   │   ├── ReceiptIssued.tsx   # Darta receipt
│   │   │   │   │   └── BackdateRequest.tsx # Backdate flow
│   │   │   │   ├── triage/
│   │   │   │   │   ├── route.tsx
│   │   │   │   │   ├── Inbox.tsx           # Unit/ward inbox
│   │   │   │   │   ├── CardDetail.tsx      # Bottom sheet detail
│   │   │   │   │   ├── AssignOfficer.tsx   # Assignment
│   │   │   │   │   ├── ReRoute.tsx         # Re-routing
│   │   │   │   │   └── ReturnToRegistry.tsx
│   │   │   │   ├── review/
│   │   │   │   │   ├── route.tsx
│   │   │   │   │   ├── CaseWorkspace.tsx   # Notes + attachments
│   │   │   │   │   ├── RequestInfo.tsx     # Request from applicant
│   │   │   │   │   ├── FieldVerification.tsx
│   │   │   │   │   ├── DecisionDraft.tsx
│   │   │   │   │   └── HistoryTimeline.tsx
│   │   │   │   └── exceptions/
│   │   │   │       ├── route.tsx
│   │   │   │       ├── BackdateRequest.tsx
│   │   │   │       ├── CorrectionEntry.tsx
│   │   │   │       └── VoidNumber.tsx
│   │   │   ├── components/
│   │   │   │   ├── DartaCard.tsx           # Vertical card
│   │   │   │   ├── DartaFilters.tsx        # Filter chips
│   │   │   │   ├── QuickActions.tsx        # Bottom sheet actions
│   │   │   │   ├── ScanOverlay.tsx         # Camera overlay
│   │   │   │   └── ReceiptPrint.tsx        # Print template
│   │   │   ├── hooks/
│   │   │   │   ├── useDartaCapture.ts
│   │   │   │   ├── useDartaTriage.ts
│   │   │   │   ├── useDartaReview.ts
│   │   │   │   └── useDartaNumber.ts
│   │   │   └── graphql/
│   │   │       ├── queries.ts
│   │   │       ├── mutations.ts
│   │   │       └── fragments.ts
│   │   ├── public/
│   │   │   └── remoteEntry.js              # Federation manifest
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   ├── mfe-chalani/                         # Chalani (Outbound) MFE
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── bootstrap.tsx
│   │   │   ├── routes/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── compose/
│   │   │   │   │   ├── route.tsx
│   │   │   │   │   ├── ComposeChooser.tsx  # Template library
│   │   │   │   │   ├── EditorMinimal.tsx   # Subject/body editor
│   │   │   │   │   ├── SignatoriesPicker.tsx
│   │   │   │   │   ├── PreviewValidate.tsx
│   │   │   │   │   └── SendForApproval.tsx
│   │   │   │   ├── approvals/
│   │   │   │   │   ├── route.tsx
│   │   │   │   │   ├── MyApprovals.tsx     # Pending approvals
│   │   │   │   │   ├── ApprovalDetail.tsx
│   │   │   │   │   └── DelegationSheet.tsx
│   │   │   │   ├── dispatch/
│   │   │   │   │   ├── route.tsx
│   │   │   │   │   ├── ChannelSelect.tsx   # Postal/courier/email/hand
│   │   │   │   │   ├── AddressLabels.tsx
│   │   │   │   │   ├── HandOver.tsx        # Courier roster + tracking
│   │   │   │   │   ├── TrackingDetail.tsx
│   │   │   │   │   ├── ReDispatch.tsx
│   │   │   │   │   └── PrintSlip.tsx
│   │   │   │   └── acknowledgement/
│   │   │   │       ├── route.tsx
│   │   │   │       ├── RecipientAck.tsx    # QR/short-code
│   │   │   │       ├── ScanAckQR.tsx
│   │   │   │       ├── MarkUndelivered.tsx
│   │   │   │       └── CloseCaseSummary.tsx
│   │   │   ├── components/
│   │   │   │   ├── ChalaniCard.tsx
│   │   │   │   ├── TemplateLibrary.tsx
│   │   │   │   ├── SignatureFlow.tsx
│   │   │   │   └── DispatchLabel.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useChalaniCompose.ts
│   │   │   │   ├── useChalaniApproval.ts
│   │   │   │   ├── useChalaniDispatch.ts
│   │   │   │   └── useChalaniNumber.ts
│   │   │   └── graphql/
│   │   │       ├── queries.ts
│   │   │       ├── mutations.ts
│   │   │       └── fragments.ts
│   │   ├── public/
│   │   │   └── remoteEntry.js
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   ├── mfe-registry/                        # Numbering & Registers MFE
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── bootstrap.tsx
│   │   │   ├── routes/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── counters/
│   │   │   │   │   ├── route.tsx
│   │   │   │   │   ├── RequestDartaNumber.tsx
│   │   │   │   │   ├── RequestChalaniNumber.tsx
│   │   │   │   │   ├── FinalizeDispatch.tsx
│   │   │   │   │   ├── LockNotice.tsx      # Maintenance/freeze
│   │   │   │   │   └── ConflictResolved.tsx
│   │   │   │   └── registers/
│   │   │   │       ├── route.tsx
│   │   │   │       ├── DailyDarta.tsx      # Municipality
│   │   │   │       ├── DailyDartaWard.tsx  # Ward
│   │   │   │       ├── DailyChalani.tsx
│   │   │   │       ├── FiscalSummaries.tsx
│   │   │   │       ├── ExportChooser.tsx   # PDF/CSV
│   │   │   │       └── ExceptionsDashboard.tsx
│   │   │   ├── components/
│   │   │   │   ├── CounterDisplay.tsx
│   │   │   │   ├── RegisterTable.tsx
│   │   │   │   └── ExportButton.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCounterAllocation.ts
│   │   │   │   └── useRegisterData.ts
│   │   │   └── graphql/
│   │   │       ├── queries.ts
│   │   │       └── mutations.ts
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   ├── mfe-audit/                           # Audit & Compliance MFE
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── bootstrap.tsx
│   │   │   ├── routes/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── overview/
│   │   │   │   │   ├── route.tsx
│   │   │   │   │   ├── Overview.tsx        # Counters, gaps, duplicates
│   │   │   │   │   ├── DrillDown.tsx       # By unit/ward
│   │   │   │   │   ├── LockSequence.tsx    # Investigation
│   │   │   │   │   └── RolloverAttestation.tsx
│   │   │   │   └── exceptions/
│   │   │   │       ├── route.tsx
│   │   │   │       ├── WeeklyReview.tsx
│   │   │   │       ├── BackdateLog.tsx
│   │   │   │       ├── VoidLog.tsx
│   │   │   │       └── DuplicateLog.tsx
│   │   │   ├── components/
│   │   │   │   ├── AuditChart.tsx
│   │   │   │   ├── ExceptionCard.tsx
│   │   │   │   └── ComplianceScore.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuditData.ts
│   │   │   └── graphql/
│   │   │       └── queries.ts
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── mfe-fy/                              # Fiscal Year Management MFE
│       ├── src/
│       │   ├── index.ts
│       │   ├── bootstrap.tsx
│       │   ├── routes/
│       │   │   ├── index.tsx
│       │   │   ├── planning/
│       │   │   │   ├── route.tsx
│       │   │   │   ├── PlanCalendar.tsx
│       │   │   │   ├── FreezeToggleMuni.tsx
│       │   │   │   └── FreezeToggleWard.tsx
│       │   │   ├── rollover/
│       │   │   │   ├── route.tsx
│       │   │   │   ├── CutoverRunbook.tsx  # Progress tracker
│       │   │   │   ├── OpenNewFY.tsx       # Confirmation
│       │   │   │   ├── PostValidation.tsx  # Test entries
│       │   │   │   └── ClosingRegisters.tsx
│       │   │   └── carryforward/
│       │   │       ├── route.tsx
│       │   │       └── CarryForwardList.tsx
│       │   ├── components/
│       │   │   ├── FYCalendar.tsx
│       │   │   ├── RolloverProgress.tsx
│       │   │   └── FreezeNotice.tsx
│       │   ├── hooks/
│       │   │   ├── useFYRollover.ts
│       │   │   └── useFreezeWindow.ts
│       │   └── graphql/
│       │       ├── queries.ts
│       │       └── mutations.ts
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
│
├── packages/                                # Domain Packages & Libraries
│   │
│   ├── api-schema/                      # GraphQL Schema & Mocks
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── schema/
│   │   │   │   ├── schema.graphql          # Main schema
│   │   │   │   ├── darta.graphql
│   │   │   │   ├── chalani.graphql
│   │   │   │   ├── numbering.graphql
│   │   │   │   ├── audit.graphql
│   │   │   │   ├── fy.graphql
│   │   │   │   ├── actors.graphql          # Users, roles, permissions
│   │   │   │   └── common.graphql          # Shared types
│   │   │   ├── mocks/
│   │   │   │   ├── index.ts                # MSW setup
│   │   │   │   ├── handlers/
│   │   │   │   │   ├── darta.ts
│   │   │   │   │   ├── chalani.ts
│   │   │   │   │   ├── numbering.ts
│   │   │   │   │   ├── audit.ts
│   │   │   │   │   └── fy.ts
│   │   │   │   └── fixtures/
│   │   │   │       ├── darta.fixtures.ts
│   │   │   │       ├── chalani.fixtures.ts
│   │   │   │       ├── users.fixtures.ts
│   │   │   │       └── units.fixtures.ts
│   │   │   ├── generated/                  # GraphQL Codegen output
│   │   │   │   ├── graphql.ts              # Types
│   │   │   │   ├── hooks.ts                # React hooks
│   │   │   │   └── operations.ts           # Documents
│   │   │   └── config/
│   │   │       └── codegen.ts              # GraphQL Codegen config
│   │   ├── package.json
│   │   ├── codegen.yml
│   │   └── tsconfig.json
│   │
│   ├── domain-darta/                        # Darta Domain Logic
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── entities/
│   │   │   │   ├── Darta.ts                # Darta entity
│   │   │   │   ├── DartaMetadata.ts
│   │   │   │   ├── Applicant.ts
│   │   │   │   └── Attachment.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── DartaNumber.ts
│   │   │   │   ├── Subject.ts
│   │   │   │   ├── Channel.ts              # Counter/Email/Postal
│   │   │   │   └── FiscalYear.ts
│   │   │   ├── services/
│   │   │   │   ├── DartaCaptureService.ts
│   │   │   │   ├── DartaTriageService.ts
│   │   │   │   ├── DartaReviewService.ts
│   │   │   │   └── DartaNumberingService.ts
│   │   │   ├── repositories/
│   │   │   │   └── DartaRepository.ts      # Interface (impl in GraphQL)
│   │   │   ├── events/
│   │   │   │   ├── DartaCreated.ts
│   │   │   │   ├── DartaRouted.ts
│   │   │   │   ├── DartaReviewed.ts
│   │   │   │   └── DartaApproved.ts
│   │   │   └── validators/
│   │   │       ├── DartaValidator.ts
│   │   │       └── BackdateValidator.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── domain-chalani/                      # Chalani Domain Logic
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── entities/
│   │   │   │   ├── Chalani.ts
│   │   │   │   ├── ChalaniDraft.ts
│   │   │   │   ├── Approval.ts
│   │   │   │   └── Dispatch.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── ChalaniNumber.ts
│   │   │   │   ├── DispatchChannel.ts
│   │   │   │   ├── TrackingId.ts
│   │   │   │   └── Signatory.ts
│   │   │   ├── services/
│   │   │   │   ├── ChalaniComposeService.ts
│   │   │   │   ├── ChalaniApprovalService.ts
│   │   │   │   ├── ChalaniDispatchService.ts
│   │   │   │   └── ChalaniNumberingService.ts
│   │   │   ├── repositories/
│   │   │   │   └── ChalaniRepository.ts
│   │   │   ├── events/
│   │   │   │   ├── ChalaniDrafted.ts
│   │   │   │   ├── ChalaniApproved.ts
│   │   │   │   ├── ChalaniDispatched.ts
│   │   │   │   └── ChalaniAcknowledged.ts
│   │   │   └── validators/
│   │   │       ├── ChalaniValidator.ts
│   │   │       └── SignatoryValidator.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── domain-numbering/                    # Numbering Service Client
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── entities/
│   │   │   │   ├── Counter.ts
│   │   │   │   ├── NumberSequence.ts
│   │   │   │   └── IdempotencyKey.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── NumberFormat.ts
│   │   │   │   ├── Scope.ts                # Municipality/Ward
│   │   │   │   └── Partition.ts            # FY namespace
│   │   │   ├── services/
│   │   │   │   ├── NumberAllocator.ts      # Request/commit pattern
│   │   │   │   ├── CounterManager.ts
│   │   │   │   └── RolloverService.ts
│   │   │   ├── repositories/
│   │   │   │   └── CounterRepository.ts
│   │   │   └── validators/
│   │   │       ├── SequenceValidator.ts
│   │   │       └── IdempotencyValidator.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── domain-audit/                        # Audit Domain Logic
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── entities/
│   │   │   │   ├── AuditLog.ts
│   │   │   │   ├── Exception.ts
│   │   │   │   └── ComplianceReport.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── AuditEvent.ts
│   │   │   │   ├── ReasonCode.ts
│   │   │   │   └── Severity.ts
│   │   │   ├── services/
│   │   │   │   ├── AuditService.ts
│   │   │   │   ├── ExceptionTracker.ts
│   │   │   │   └── ComplianceMonitor.ts
│   │   │   ├── repositories/
│   │   │   │   └── AuditRepository.ts
│   │   │   └── validators/
│   │   │       └── AuditValidator.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── domain-fy/                           # Fiscal Year Domain Logic
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── entities/
│   │   │   │   ├── FiscalYear.ts
│   │   │   │   ├── FreezeWindow.ts
│   │   │   │   ├── Rollover.ts
│   │   │   │   └── CarryForward.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── FYLabel.ts              # e.g., "2082/83"
│   │   │   │   ├── CutoverStatus.ts
│   │   │   │   └── ClosingValue.ts
│   │   │   ├── services/
│   │   │   │   ├── FYManager.ts
│   │   │   │   ├── RolloverOrchestrator.ts
│   │   │   │   └── FreezeManager.ts
│   │   │   ├── repositories/
│   │   │   │   └── FYRepository.ts
│   │   │   └── validators/
│   │   │       └── RolloverValidator.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                           # Mobile-First UI Components
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── tokens/
│   │   │   │   ├── colors.ts
│   │   │   │   ├── spacing.ts
│   │   │   │   ├── typography.ts
│   │   │   │   ├── breakpoints.ts
│   │   │   │   └── motion.ts
│   │   │   ├── primitives/
│   │   │   │   ├── Button/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Button.module.scss
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Input/
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Input.module.scss
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Card/
│   │   │   │   ├── Chip/
│   │   │   │   ├── Badge/
│   │   │   │   ├── Tab/
│   │   │   │   └── Toast/
│   │   │   ├── patterns/
│   │   │   │   ├── BottomSheet/
│   │   │   │   │   ├── BottomSheet.tsx
│   │   │   │   │   ├── BottomSheet.module.scss
│   │   │   │   │   └── index.ts
│   │   │   │   ├── VerticalCard/           # TikTok-style
│   │   │   │   ├── SwipeAction/
│   │   │   │   ├── PullToRefresh/
│   │   │   │   └── LongPress/
│   │   │   ├── layouts/
│   │   │   │   ├── MobileLayout/
│   │   │   │   ├── SafeArea/
│   │   │   │   └── StickyFooter/
│   │   │   ├── skeletons/
│   │   │   │   ├── CardSkeleton.tsx
│   │   │   │   ├── ListSkeleton.tsx
│   │   │   │   └── FormSkeleton.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSwipe.ts
│   │   │   │   ├── useLongPress.ts
│   │   │   │   ├── useBottomSheet.ts
│   │   │   │   └── useViewport.ts
│   │   │   └── utils/
│   │   │       ├── touch.ts
│   │   │       └── gestures.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── state-core/                          # State Management Core
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── stores/
│   │   │   │   ├── darta.store.ts          # Zustand store
│   │   │   │   ├── chalani.store.ts
│   │   │   │   ├── ui.store.ts
│   │   │   │   └── auth.store.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useStore.ts
│   │   │   │   ├── usePersist.ts
│   │   │   │   └── useOptimistic.ts
│   │   │   ├── middleware/
│   │   │   │   ├── persist.ts              # IndexedDB persistence
│   │   │   │   ├── devtools.ts
│   │   │   │   └── logger.ts
│   │   │   └── utils/
│   │   │       ├── immer.ts                # Immutable updates
│   │   │       └── sync.ts                 # Cross-tab sync
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── perf-budget/                         # Performance Budget Enforcement
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── analyzers/
│   │   │   │   ├── bundle.ts               # Bundle size analysis
│   │   │   │   ├── lighthouse.ts           # Lighthouse CI
│   │   │   │   └── metrics.ts              # Web Vitals
│   │   │   ├── reporters/
│   │   │   │   ├── console.ts
│   │   │   │   ├── github.ts               # PR comments
│   │   │   │   └── slack.ts
│   │   │   └── config/
│   │   │       ├── budgets.ts              # Budget definitions
│   │   │       └── thresholds.ts
│   │   ├── scripts/
│   │   │   ├── analyze.ts
│   │   │   └── validate.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── auth/                                # Auth Package (exists)
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── apollo/                              # Apollo Package (exists)
│   │   ├── src/
│   │   │   └── client.ts
│   │   └── package.json
│   │
│   ├── query/                               # TanStack Query Package (exists)
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── design-system/                       # Design System Package (exists)
│       ├── src/
│       │   └── styles.scss
│       └── package.json
│
├── tools/                                   # Build & Dev Tools
│   ├── vite-plugins/
│   │   ├── federation-manifest.ts          # Auto-generate federation config
│   │   ├── performance-guard.ts            # Build-time budget enforcement
│   │   └── graphql-loader.ts               # Load .graphql files
│   ├── scripts/
│   │   ├── generate-types.ts               # GraphQL Codegen runner
│   │   ├── bundle-analysis.ts              # Bundle size report
│   │   ├── perf-check.ts                   # Performance validation
│   │   └── mock-server.ts                  # MSW dev server
│   └── templates/
│       ├── mfe-template/                   # MFE scaffolding
│       └── domain-template/                # Domain package scaffolding
│
└── cypress/                                 # E2E Tests
    ├── e2e/
    │   ├── darta/
    │   │   ├── intake.cy.ts
    │   │   ├── triage.cy.ts
    │   │   └── review.cy.ts
    │   ├── chalani/
    │   │   ├── compose.cy.ts
    │   │   ├── approval.cy.ts
    │   │   └── dispatch.cy.ts
    │   ├── numbering/
    │   │   ├── allocation.cy.ts
    │   │   └── rollover.cy.ts
    │   └── audit/
    │       └── exceptions.cy.ts
    ├── fixtures/
    │   ├── darta.json
    │   └── chalani.json
    ├── support/
    │   ├── commands.ts
    │   └── e2e.ts
    └── cypress.config.ts
```

---

## Key Files Count Summary

### Applications (5 MFEs)
- **Shell**: 12 files
- **MFE Darta**: ~45 files
- **MFE Chalani**: ~40 files
- **MFE Registry**: ~20 files
- **MFE Audit**: ~18 files
- **MFE FY**: ~18 files

### Domain Packages (5)
- **domain-darta**: ~20 files
- **domain-chalani**: ~20 files
- **domain-numbering**: ~15 files
- **domain-audit**: ~12 files
- **domain-fy**: ~15 files

### Infrastructure Packages (3)
- **api-schema**: ~25 files (schema + mocks + codegen)
- **ui**: ~40 files (tokens + components + hooks)
- **state-core**: ~12 files
- **perf-budget**: ~12 files

### Existing Packages (4)
- **auth**: 2 files
- **apollo**: 2 files
- **query**: 2 files
- **design-system**: 2 files

### Tooling & Tests
- **tools**: ~10 files
- **cypress**: ~15 files

---

## Total File Count: ~350 files

This structure ensures:
- ✅ **Granular separation** (DDD principles)
- ✅ **Federated deployment** (independent MFEs)
- ✅ **Mobile-first** (dedicated ui package)
- ✅ **Performance budgets** (perf-budget tooling)
- ✅ **Type safety** (GraphQL Codegen + strict TS)
- ✅ **Offline-first** (state-core persistence)
- ✅ **Mock development** (MSW handlers + fixtures)

---

## Next Steps
1. Set up performance budget tooling
2. Create GraphQL schema with MSW mocks
3. Build mobile-first UI foundation
4. Implement domain packages
5. Build MFEs with federation
6. Optimize & validate budgets
