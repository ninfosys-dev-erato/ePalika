# **Chalani Lifecycle Specification**

**Document Version:** 1.0
**Owner:** Platform Engineering – e-Palika Core
**Last Updated:** 2025-10-05

---

## 1. Purpose

This document defines the **end-to-end life cycle** of a *Chalani* (official outgoing communication) inside the **Digital e-Palika System**.
It standardizes states, transitions, user actions, and UI expectations for:

* Internal **control and auditability** of official correspondence
* **Separation of duties** between clerk, secretary, CAO, signatory, and dispatch officers
* **Legal traceability** required by local government and auditors
* A **consistent developer contract** for back-end services and micro-frontends

---

## 2. Scope

Applies to:

* **Chalani microservice (`chalani-svc`)** and its GraphQL contract
* **MFE Chalani UI** (web and responsive mobile shell)
* Integration with **Identity / Authorization** (Keycloak + OpenFGA)
* Dispatch (physical & digital) tracking subsystems

---

## 3. Terminology

| Term                | Definition                                                             |
| ------------------- | ---------------------------------------------------------------------- |
| **Chalani**         | Outgoing official record / letter from Palika or Ward                  |
| **State**           | Discrete stage of a Chalani’s life cycle (e.g., `DRAFT`, `REGISTERED`) |
| **Transition**      | Authorized action that moves a Chalani between states                  |
| **Actor**           | A user role capable of performing transitions                          |
| **Register Number** | Unique serial identifier, fiscal year scoped                           |

---

| Actor                 | Typical Titles (Nepali & English)                                                                                                                                                                              | Core Permissions                                                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Clerk**             | **दफ्तरी (Daftari)**, **लेखापाल (Lekhapal)**, **सहायक लेखापाल (Sahayak Lekhapal)**, **शाखा अधिकृत (Shakha Adhikrit / Section Officer)**                                                                        | Create/edit **DRAFT** chalani, attach supporting docs, classify department/ward, submit for review                                              |
| **Reviewer**          | **वडा सचिव (Wada Sachiv / Ward Secretary)**, **शाखा प्रमुख (Shakha Pramukh / Section Head)**                                                                                                                   | Review content, request changes (`editRequired`), validate completeness & compliance, forward to approver                                       |
| **Approver**          | **प्रमुख प्रशासकीय अधिकृत (Pramukh Prashasanik Adhikrit / CAO)**, **नगर प्रमुख (Nagar Pramukh / Mayor)**, **उप–प्रमुख (Upa–Pramukh / Deputy Mayor)**, **प्रमुख कार्यकारी अधिकृत (Pramukh Karyakari Adhikrit)** | Approve chalani, allocate or reserve register number (`reserveNo`, `directRegister`), reject back to draft                                      |
| **Signatory**         | **प्रमाणित अधिकारी (Pramanit Adhikari / Authorized Signatory)**, **कानुनी अधिकृत (Kanuni Adhikari / Legal Officer)**, **प्रमुख वा उप–प्रमुख (Mayor/Deputy Mayor when mandated)**                               | Digitally or physically sign (`sign`), apply seal (`seal`), supersede (`supersede`), void (`void`) before dispatch                              |
| **Dispatch Officer**  | **दूत (Doot / Messenger)**, **हुलाक सहायक (Hulak Sahayak / Postal Assistant)**, **हुलाक शाखा / Dispatch Desk**                                                                                                 | Dispatch physical or digital documents (`dispatch`), update tracking status (`IN_TRANSIT`, `RETURNED_UNDELIVERED`, `DELIVERED`), trigger resend |
| **Digital Recipient** | **अन्य सरकारी कार्यालय (Other Government Office)**, **बाह्य संस्था (External Agency)**, **नागरिक पोर्टल प्रयोगकर्ता (Citizen Portal User)**                                                                    | Receive digital chalani, acknowledge (`digitalAck`), confirm delivery (`confirm`)                                                               |


---

## 5. State Model

[Chalani State Machine](./chalani-lifecycle.pu)

---

### 5.1 State Definitions & Controls

| State                    | Description                        | Entry Conditions                 | Exit Transitions                                                                               |
| ------------------------ | ---------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| **DRAFT**                | Temporary working copy             | Clerk created record             | `submit` → PENDING_REVIEW                                                                      |
| **PENDING_REVIEW**       | Under review                       | Submitted draft                  | `editRequired` → DRAFT, `approveReview` → PENDING_APPROVAL                                     |
| **PENDING_APPROVAL**     | Awaiting senior approval           | Reviewed                         | `approve` → APPROVED, `reject` → DRAFT                                                         |
| **APPROVED**             | Cleared for registration           | Approver sign-off                | `reserveNo` → NUMBER_RESERVED, `directRegister` → REGISTERED                                   |
| **NUMBER_RESERVED**      | Serial number held but uncommitted | Approver reserved                | `finalize` → REGISTERED                                                                        |
| **REGISTERED**           | Official entry in ledger           | Registration complete            | `sign` → SIGNED, `void` → VOIDED, `quickDispatch` → DISPATCHED, `supersede` → SUPERSEDED       |
| **SIGNED**               | Signed but not sealed              | Signature recorded               | `seal` → SEALED, `dispatch` → DISPATCHED                                                       |
| **SEALED**               | Fully authorized                   | Seal applied                     | `dispatch` → DISPATCHED                                                                        |
| **DISPATCHED**           | Sent to recipient                  | Signed/Sealed or direct dispatch | `physicalSent` → IN_TRANSIT, `digitalAck` → ACKNOWLEDGED, `undelivered` → RETURNED_UNDELIVERED |
| **IN_TRANSIT**           | Physical delivery ongoing          | Courier accepted                 | `delivered` → DELIVERED                                                                        |
| **ACKNOWLEDGED**         | Digital receipt                    | Recipient acknowledged           | `confirm` → DELIVERED                                                                          |
| **RETURNED_UNDELIVERED** | Delivery failed                    | Courier returned                 | `resend` → DISPATCHED                                                                          |
| **DELIVERED**            | Recipient received                 | Delivery proof                   | `archive` → CLOSED                                                                             |
| **VOIDED**               | Annulled                           | Wrong info/legal issue           | —                                                                                              |
| **SUPERSEDED**           | Replaced                           | New chalani created              | —                                                                                              |
| **CLOSED**               | Archived and immutable             | Delivered and archived           | —                                                                                              |

---

## 6. Representative User Stories

### Clerk — ड्राफ्ट सुरक्षित राख्ने र समीक्षा पठाउने

म वडा दफ्तरी (Clerk) वा शाखा अधिकृत हुँ, मेरो मुख्य जिम्मेवारी पालिकाको नाउँमा जाने पत्र, सिफारिस, प्रमाणपत्र वा अन्य आधिकारिक कागजात तयार गर्नु हो। जब नागरिक, अन्य कार्यालय वा आन्तरिक शाखाबाट कुनै पत्र पठाउने माग आउँछ, म सबै विवरण संकलन गर्न थाल्छु। उदाहरणका लागि, नागरिकले घर नक्सा पास भएको प्रमाणपत्र माग गरेको छ भने म पहिलो चरणमा पत्रको शीर्षक, पत्र पठाउने निकाय (जस्तै महानगरपालिका वा अर्को सरकारी कार्यालय), पत्र सम्बन्धित निर्णय नम्बर, पत्रसँग जोडिनुपर्ने दस्तावेज (नक्सा, स्वीकृति कागजात) डिजिटल रूपमा अपलोड गर्छु। कहिलेकाहीँ सबै प्रमाणपत्र एकैचोटि उपलब्ध नहुन सक्छ, वा प्रमुख/सचिवसँग सल्लाह गर्नुपर्छ। त्यसैले मैले तयार गरेको चलानीलाई DRAFT अवस्थामा सुरक्षित राख्नुपर्छ, ताकि म बीचमै काम रोके पनि डाटा नहराओस्। पछि जब सबै प्रमाणपत्र जुट्छन्, म तयार पारिएको चलानीलाई अन्तिम जाँचका लागि समीक्षा (Review) मा पठाउँछु। यसरी ड्राफ्ट सुरक्षित राख्न पाउनु मेरो कामलाई सजिलो बनाउँछ, फाइल मिस नहुने बनाउँछ, र कानुनी हिसाबले सही विवरण मात्र माथिल्लो तहमा पुग्छ।

### Reviewer — समीक्षा गर्ने र सुधार पठाउने

म वडा सचिव (Reviewer) हुँ, म मेरो ड्यासबोर्डमा आएका PENDING_REVIEW चलानीहरू हेर्छु। दफ्तरीले पठाएको सामग्री पढेर म प्राप्तकर्ताको नाम, ठेगाना, कानुनी आधार, निर्णय नम्बर, सम्बद्ध कागजात र पत्रको भाषा/फर्म्याट सबै जाँच्छु। यदि कतै त्रुटि पाउँछु भने, जस्तै प्राविधिक शब्द गलत छ वा सम्बद्ध निर्णय नम्बर मिलेको छैन भने, म प्रणालीभित्रै टिप्पणी राख्छु — किन सुधार चाहिन्छ भनेर स्पष्ट लेख्छु। त्यसपछि म त्यो चलानीलाई editRequired कार्य प्रयोग गरी पुनः DRAFT मा फर्काउँछु। यसरी गर्नाले दफ्तरीले तुरुन्तै फिडब्याक पाउँछ र आवश्यक सम्पादन गरेर पुनः पठाउन सक्छ। जब सबै ठीक हुन्छ र कानुनी हिसाबले पनि ठिक लाग्छ, म चलानीलाई approveReview कार्य प्रयोग गरेर अगाडि पठाउँछु, जसले चलानीलाई PENDING_APPROVAL अवस्थामा पुर्याउँछ। मेरो भूमिकाले गलत विवरणसहित पत्र बाहिर नजाओस् भनेर सुनिश्चित गर्छ र भविष्यमा अडिटमा समस्या नआउने बनाउँछ।

### Approver — स्वीकृति दिने र दर्ता नम्बर आरक्षित वा दर्ता गर्ने

म प्रमुख प्रशासकीय अधिकृत (CAO) वा कहिलेकाहीँ नगर प्रमुख/उप–प्रमुख (Approver) हुँ। मेरो ड्यासबोर्डमा आउने सबै PENDING_APPROVAL चलानीहरू प्रणालीले देखाउँछ। म प्रत्येक चलानी हेरेर कानुनी आधार, निर्णय नम्बर, कार्यालयको आधिकारिक मुहर र आवश्यक हस्ताक्षर प्राधिकरण जाँच्छु। कहिलेकाहीँ चलानीलाई तुरुन्तै दर्ता गर्न सकिन्छ — त्यस अवस्थामा म directRegister कार्य प्रयोग गरेर सीधा REGISTERED अवस्थामा पुर्याउँछु। तर कतिपय अवस्थामा अन्तिम हस्ताक्षर वा छाप (seal) अझै पर्खनुपर्ने हुन्छ, तर यो बीचमा दर्ता नम्बर चाहिन्छ ताकि लेखा तथा अडिटका लागि चलानी नम्बर क्रम नबिग्रियोस्। त्यस्तो अवस्थामा म reserveNo प्रयोग गरेर दर्ता नम्बर आरक्षित गर्छु। यसले लेखा प्रणालीमा नम्बर राख्छ तर चलानीलाई पूर्ण दर्ता नगरी राख्छ। पछि हस्ताक्षर भएपछि म finalize गरी पूर्ण दर्ता गराउँछु। यस्तो प्रणालीले स्थानीय शासन सञ्चालन ऐन २०७४ को प्रावधानअनुसार प्रमुख प्रशासकीय अधिकृत वा नगर प्रमुखको भूमिकालाई कानुनी र पारदर्शी बनाउँछ।

### Signatory — हस्ताक्षर, छाप र कानुनी प्रामाणिकता दिने

म प्रमाणित अधिकारी (Signatory) हुँ, कहिलेकाहीँ कानुनी अधिकृत वा नगर प्रमुख स्वयं पनि यो भूमिका लिन्छन्। मेरो मुख्य काम भनेको दर्ता भइसकेका चलानीमा कानुनी प्रमाणिकता थप्नु हो। जब चलानी REGISTERED हुन्छ, म पहिलो चरणमा त्यसमा sign कार्य प्रयोग गरेर मेरो डिजिटल वा शारीरिक हस्ताक्षर गर्छु। यो हस्ताक्षरले कागजातलाई कानुनी मान्यता दिन्छ। यदि आवश्यक छ भने म त्यसपछि seal कार्य प्रयोग गरी पालिकाको आधिकारिक छाप/सिल थप्छु। कतिपय अवस्थामा यदि दर्ता पछि कागजातमा गम्भीर त्रुटि पत्ता लाग्यो भने म supersede गरेर नयाँ चलानी जारी गर्न सक्छु र पुरानो चलानीलाई प्रतिस्थापित (SUPERSEDED) बनाउँछु। यसले अडिट ट्रेल कायम राख्दै गल्ती सच्याउने बाटो दिन्छ।

### Dispatch Officer — पठाउने, ट्र्याक गर्ने र पुनःपठाउने

म हुलाक सहायक / दूत (Dispatch Officer) हुँ। जब चलानी पूर्ण रूपमा हस्ताक्षरित र सिलबन्द हुन्छ, त्यो मेरो कार्यक्षेत्रमा आउँछ। यदि कागजातलाई शारीरिक रूपमा पठाउनुपर्छ भने म कुरियर/दूत विवरण प्रविष्ट गर्छु, गन्तव्य कार्यालय, डाक नम्बर वा ट्र्याकिङ कोड प्रणालीमा हाल्छु र चलानीलाई DISPATCHED → IN_TRANSIT मा पुर्याउँछु। यदि कागजात गलत ठेगानामा गयो वा कसैले बुझेन भने पोस्ट अफिस वा कुरियरले फिर्ता ल्याउँछ, म त्यसलाई RETURNED_UNDELIVERED मा बदल्छु। त्यसपछि आवश्यक परेमा सोही कागजात पुनः पठाउन resend गर्न सक्छु। डिजिटल चलानी भएमा पठाएको साथसाथै स्टाटस DISPATCHED मा पुग्छ र डिजिटल प्राप्तकर्ताले पुष्टि गरेपछि मात्रै अर्को चरणमा जान्छ। मेरो भूमिकाले डाक/दूत व्यवस्थालाई प्रणालीभित्रै पारदर्शी बनाउँछ, अडिटका लागि प्रमाण देखाउन सजिलो बनाउँछ।

### Digital Recipient — डिजिटल रूपमा प्राप्त गर्ने र स्वीकृति दिने

म डिजिटल प्राप्तकर्ता (Digital Recipient) हुँ — यो अर्को सरकारी कार्यालय, कुनै संघ संस्था वा नागरिक पोर्टल प्रयोगकर्ता हुन सक्छ। जब म डिजिटल रूपमा चलानी पाउँछु, प्रणालीले मलाई सुरक्षित लिंक वा पोर्टलमा सूचना दिन्छ। म त्यहाँ गएर कागजात हेर्छु, क्यूआर कोड/डिजिटल हस्ताक्षर मार्फत सत्यापन गर्छु। जब मलाई पक्का हुन्छ कि यो सही र आधिकारिक कागजात हो, म digitalAck गरेर पठाउने निकायलाई स्वीकृति दिन्छु। कहिलेकाहीँ म थप रूपमा confirm गरेर डेलिभरी पक्का गर्छु। यसरी डिजिटल स्वीकृति दिँदा पठाउने पालिकालाई तत्काल सूचना पुग्छ कि पत्र प्राप्त भयो र कानुनी हिसाबले प्रमाण रहन्छ।

---

## 7. UI & Interaction Guidelines (MFE)

* **Shell Responsibilities**

  * Authentication (Keycloak), role chip (e.g., `Ward 5 · Clerk`)
  * Global nav & search
  * Notification center (e.g., “Reserved number expiring”)

* **MFE Chalani**

  * Draft editor with Carbon `TextInput`, `TextArea`, `DocumentUpload`
  * Review console with status chips & overflow menu actions
  * Approval screen with “Reserve No” & “Direct Register” flows
  * Dispatch console (digital & physical tabs, tracking timeline)
  * State-based filters (Inbox, My Drafts, Need My Action)

---

## 8. Audit & Compliance

* Immutable **state transition logs** with actor, timestamp, IP/device
* Mandatory reason field for `reject`, `void`, `supersede`
* Fiscal year reset for numbering but with full historical ledger
* Digital signature & seal meta stored in secure store (PKI integration ready)

---

## 9. Integration Contracts

* **GraphQL**:

  * `mutation submitChalani(id)` → moves DRAFT → PENDING_REVIEW
  * `mutation approveReview(id)` → PENDING_REVIEW → PENDING_APPROVAL
  * … all state changes exposed as strongly typed mutations
* **Events**:

  * Kafka topic `chalani.state.changed` for analytics & downstream sync
* **AuthZ**:

  * OpenFGA tuples: `chalani:123#approve@user:456` etc.

---

## 11. Implementation Planning

```
/chalani
  ├── dashboard           # Overview: counts, quick actions
  ├── create              # New Chalani wizard
  ├── review              # PENDING_REVIEW queue (Clerk/Reviewer)
/chalani/approval         # PENDING_APPROVAL queue (Approvers)
/chalani/registry         # NUMBER_RESERVED, REGISTERED list, void/supersede
/chalani/dispatch         # DISPATCHED, IN_TRANSIT, ACKNOWLEDGED board
/chalani/search           # global search/filter/audit
/chalani/:id              # details + timeline of one chalani
```

## 10. Future Considerations

* SLA timers for review & approval
* Auto-expiry of NUMBER_RESERVED after X days
* Integration with Nepal Post tracking API
* Smart QR for physical dispatch verification

---
