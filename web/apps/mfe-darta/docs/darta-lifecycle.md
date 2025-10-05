# **Darta Lifecycle Specification**

**Document Version:** 1.0
**Owner:** Platform Engineering – e-Palika Core
**Last Updated:** 2025-10-05

---

## 1. Purpose

This document defines the **end-to-end life cycle** of a *Darta* (official **incoming** correspondence) inside the **Digital e-Palika System**.
It standardizes states, transitions, user actions, and UI expectations for:

* Internal **control and auditability** of incoming records
* **Separation of duties** across intake, review, registration, archival, assignment, and action
* **Legal traceability** and retention aligned to Palika O&M and audit needs
* A **consistent developer contract** for back-end services and micro-frontends

---

## 2. Scope

Applies to:

* **Darta microservice (`darta-svc`)** and its GraphQL contract
* **MFE Darta UI** (web and responsive mobile shell)
* Integration with **Identity / Authorization** (Keycloak + OpenFGA)
* **Scanning/e-Archive** and **Section assignment/tracking** subsystems

---

## 3. Terminology

| Term                | Definition                                                          |
| ------------------- | ------------------------------------------------------------------- |
| **Darta**           | Incoming official record/letter received by Palika or Ward          |
| **State**           | Discrete stage of Darta life cycle (e.g., `REGISTERED`, `ASSIGNED`) |
| **Transition**      | Authorized action that moves a Darta between states                 |
| **Actor**           | User role capable of performing transitions                         |
| **Register Number** | Unique **incoming** serial (fiscal-year scoped)                     |
| **Classification**  | Coding to section/category (e.g., Finance/Legal/Citizen Request)    |
| **Digital Archive** | Scanned/metadata-enriched copy stored for retrieval and audit       |

---

## 4. Actors & Responsibilities

| Actor                                 | Typical Titles (Nepali & English)                                                     | Core Permissions                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Intake Clerk**                      | **दफ्तरी / दर्ता सहायक (Daftari / Darta Sahayak)**, **शाखा अधिकृत (Section Officer)** | Create/edit **DRAFT**, submit for review, capture basic metadata & attachments              |
| **Reviewer**                          | **वडा सचिव / शाखा प्रमुख (Ward Secretary / Section Head)**                            | Review intake, request edits, approve for classification                                    |
| **Registrar**                         | **प्रमुख प्रशासकीय अधिकृत / अभिलेख अधिकृत (CAO / Records Officer)**                   | Classify, **reserve register no.**, **direct register**, **finalize**, void invalid entries |
| **Archivist / Scanner**               | **स्क्यान/अभिलेख सहायक**                                                              | Scan documents, store digital copy, enrich metadata, finalize digital archive               |
| **Section Assignee / Action Officer** | **शाखा प्रमुख / कार्यान्वयन अधिकृत**                                                  | Accept assigned darta, request clarification, record action taken, issue response           |
| **External Sender (Ack)**             | **नागरिक/अन्य कार्यालय/पोर्टल प्रयोगकर्ता**                                           | Receive ack request, send digital acknowledgment                                            |

---

## 5. State Model

[Darta State Machine](./darta-model.pu)

---

### 5.1 State Definitions & Controls

| State                    | Description                                  | Entry Conditions              | Exit Transitions                                                                                                                                                    |
| ------------------------ | -------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DRAFT**                | Intake stub; minimal fields captured         | Clerk created record          | `submitForReview` → PENDING_REVIEW                                                                                                                                  |
| **PENDING_REVIEW**       | Reviewer verifies completeness & correctness | Submitted draft               | `editRequired` → DRAFT, `approveReview` → CLASSIFICATION                                                                                                            |
| **CLASSIFICATION**       | Categorize and code to section/topic         | Approved for classification   | `reserveNo` → NUMBER_RESERVED, `directRegister` → REGISTERED                                                                                                        |
| **NUMBER_RESERVED**      | Incoming serial held; pending finalize       | Number reserved by Registrar  | `finalizeRegistration` → REGISTERED                                                                                                                                 |
| **REGISTERED**           | Official incoming entry committed            | Number finalized              | `voidInvalid` → VOIDED, `scanDocuments` → SCANNED, `assignSection` → ASSIGNED, `requestAck` → ACK_REQUESTED, `supersedeRecord` → SUPERSEDED, `manualClose` → CLOSED |
| **VOIDED**               | Nullified due to invalid/duplicate           | Registrar voids with reason   | —                                                                                                                                                                   |
| **SCANNED**              | Physical letter scanned                      | Scan captured                 | `storeDigitalCopy` → DIGITALLY_ARCHIVED, `enrichMetadata` → METADATA_ENRICHED                                                                                       |
| **METADATA_ENRICHED**    | OCR/indexing/keywords added                  | Post-scan enrichment          | `finalizeArchive` → DIGITALLY_ARCHIVED                                                                                                                              |
| **DIGITALLY_ARCHIVED**   | Durable e-archive complete                   | Scan stored + meta finalized  | — (continues parallel with assignment/response)                                                                                                                     |
| **ASSIGNED**             | Routed to responsible section                | Registrar/automation assigned | `sectionReview` → IN_REVIEW_BY_SECTION                                                                                                                              |
| **IN_REVIEW_BY_SECTION** | Section initial review                       | Assignment acknowledged       | `clarificationRequested` → NEEDS_CLARIFICATION, `sectionAccept` → ACCEPTED                                                                                          |
| **NEEDS_CLARIFICATION**  | Clarification requested from intake/external | Section raised query          | `provideClarification` → ASSIGNED                                                                                                                                   |
| **ACCEPTED**             | Section takes ownership                      | Section accepted              | `markAction` → ACTION_TAKEN                                                                                                                                         |
| **ACTION_TAKEN**         | Action recorded (e.g., investigation/order)  | Section completed action      | `issueResponse` → RESPONSE_ISSUED                                                                                                                                   |
| **RESPONSE_ISSUED**      | Formal response sent                         | Action compiled               | `archive` → CLOSED                                                                                                                                                  |
| **ACK_REQUESTED**        | External sender asked to acknowledge         | Registrar requested ack       | `ackReceived` → ACK_RECEIVED                                                                                                                                        |
| **ACK_RECEIVED**         | Digital acknowledgment received              | Sender acknowledged           | `archive` → CLOSED                                                                                                                                                  |
| **SUPERSEDED**           | Replaced by new corrected entry              | New record linked             | —                                                                                                                                                                   |
| **CLOSED**               | Archived & immutable                         | Delivery/response/ack done    | —                                                                                                                                                                   |

---

## 6. Representative User Stories

### Intake Clerk — दर्ता तयार, समीक्षा र पठाउने

म Intake Clerk हुँ। म कच्चा विवरण **DRAFT** मा भर्छु, स्क्यान/संलग्न कागजात जोड्छु, र **submitForReview** गरेर **PENDING_REVIEW** मा पठाउँछु। Reviewer ले **editRequired** गरेमा म सुधार गरेर पुनः पठाउँछु। स्वीकृत भएपछि Darta **CLASSIFICATION** मा पुग्छ।

### Registrar — वर्गीकरण, नम्बर आरक्षण/दर्ता, र अभिलेख

म Registrar हुँ। **CLASSIFICATION** मा श्रेणी/सेक्सन कोड गर्छु। आवश्यक परे **reserveNo** (क्रम नटुटोस) अथवा **directRegister** गरेर **REGISTERED** बनाउँछु। डुप्लिकेट/अमान्य भए **voidInvalid** गर्छु। आवश्यकता अनुसार **scanDocuments**/e-archive ट्रिगर गर्छु र **assignSection** द्वारा जिम्मेवार शाखामा पठाउँछु। बाह्य स्रोतलाई **requestAck** पनि पठाउन सक्छु।

### Archivist/Scanner — स्क्यान, मेटाडाटा, e-Archive

म Archivist हुँ। **SCANNED** मा स्क्यान पुरा गर्छु, **enrichMetadata** द्वारा OCR/किवर्ड थप्छु, र **DIGITALLY_ARCHIVED** मा सुरक्षित राख्छु (दिगो अभिलेख/खोजयोग्य)।

### Section Assignee — स्वीकृति, स्पष्टिकरण, कार्यान्वयन र प्रतिक्रिया

म Section Head/Action Officer हुँ। **ASSIGNED** बाट **IN_REVIEW_BY_SECTION** मा समीक्षा गर्छु; आवश्यक परे **clarificationRequested** द्वारा स्पष्टिकरण माग्छु (फिर्ता **ASSIGNED**), ठीक भए **ACCEPTED** गर्छु। काम गरिसकेपछि **markAction** र अन्ततः **issueResponse** गरेर **RESPONSE_ISSUED → CLOSED** पुर्याउँछु।

### External Sender (Ack) — डिजिटल स्वीकृति

म बाह्य प्रेषक हुँ। Palika ले **ACK_REQUESTED** पठाएपछि, म डिजिटल रूपमा स्वीकारोक्ति पठाउँछु (**ACK_RECEIVED**) र दर्ता **CLOSED** हुन्छ।

---

## 7. UI & Interaction Guidelines (MFE)

* **Shell Responsibilities**

  * Authentication (Keycloak), role chip (e.g., `Ward 5 · Intake`)
  * Global search across darta no., subject, sender, section
  * Notifications (e.g., “Clarification pending,” “Ack overdue”)

* **MFE Darta**

  * **Intake Wizard**: Carbon `TextInput`, `FileUploader`, OCR preview, validation banners
  * **Review Console**: Diff/annotations, approve/reject paths
  * **Classification & Registering**: number reservation dialog, FY ledger check, duplicate detection
  * **Archive Workbench**: Scan queue, metadata pane, finalize archive
  * **Assignment Board**: Kanban (Assigned/Review/Accepted/Action), filters by section/priority
  * **Response Desk**: template picker, link to outgoing chalani if needed, close/retain controls

---

## 8. Audit & Compliance

* Immutable **transition logs** (actor, role, time, IP/device), reasons for `editRequired`, `voidInvalid`, `supersedeRecord`.
* **FY-scoped incoming register**; prevention of gaps/duplicates; reservation expiry policy.
* **e-Archive integrity** (hashing), OCR metadata retained; retention schedules by category.
* Full chain for **clarification** and **response** preserved for audit.

---

## 9. Integration Contracts

* **GraphQL (examples)**

  * `mutation createDartaDraft(input)` → `DRAFT`
  * `submitDartaForReview(id)` → `PENDING_REVIEW`
  * `approveDartaReview(id)` → `CLASSIFICATION`
  * `reserveDartaNo(id)` / `finalizeDartaRegistration(id)` / `directRegisterDarta(id)`
  * `voidDarta(id, reason)`
  * `scanDarta(id)` / `archiveDartaDigital(id)` / `enrichDartaMetadata(id, meta)`
  * `assignDartaSection(id, sectionId)` / `sectionReviewDarta(id)` / `requestClarification(id)` / `provideClarification(id, note)`
  * `acceptDarta(id)` / `markDartaAction(id, action)` / `issueDartaResponse(id, docRef)`
  * `requestDartaAck(id)` / `receiveDartaAck(id)`
  * `supersedeDartaRecord(id, newId)` / `closeDarta(id)`

* **Events**

  * Kafka topic: `darta.state.changed` (CDC to BI/retention/notification)

* **AuthZ**

  * OpenFGA tuples (examples): `darta:123#register@user:456`, `darta:123#assign@role:section_head`, `darta:123#archive@role:archivist`

---

## 10. Future Considerations

* **Auto-classification** (ML on OCR text), duplicate detection across wards.
* **SLA timers** for review/clarification/response; breach alerts.
* **Barcode/QR intake slips** for physical desk; kiosk capture.
* **Cross-link** to **Chalani** when a response generates outgoing correspondence automatically.
