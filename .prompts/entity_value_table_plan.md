**Technical Specification: Entity Value Table Refactoring**

### **Overview**
This document outlines the technical details for refactoring WealthSphere’s data model to store all financial values (accounts, assets, insurance, income, expenses) in a new **Entity Value Table**. This approach eliminates the need to keep a `current_balance` or `current_value` on the entities themselves. Instead, each entity’s value is captured in the **Entity Value Table**, referencing a **scenario** and a **date**.

---

## **1. Rationale**
- **Data Consistency**: Centralizing values in a single table ensures consistent handling of historical/confirmed values, making it simpler to manage updates over time.
- **Scenario Support**: Because each record links to a `scenario_id`, we can simultaneously store actual values and multiple what-if scenario values for the same entity.
- **Projections**: Projections will pull from the **most recent** confirmed value (or scenario value) as a starting point.

---

## **2. Database Changes**

### 2.1 New Table: `entity_values`
**Proposed Schema**:
- `id` (Primary Key, Auto-Increment)
- `entity_type` (VARCHAR or Enum) – e.g., `INVESTMENT_ACCOUNT`, `ASSET`, `INSURANCE_POLICY`, `INCOME_SOURCE`, `EXPENSE`.
- `entity_id` (INTEGER) – References the primary key of the entity (e.g., `investment_accounts.id`).
- `scenario_id` (INTEGER, Foreign Key) – References `scenarios.id`.
- `recorded_at` (DATE or DATETIME) – The date/time this value applies.
- `value` (FLOAT) – The **confirmed** value.
- `created_at` (DATETIME, default=NOW)

### 2.2 Entity Tables
- Remove value-related fields:
  - **InvestmentAccount**: remove `current_balance`.
  - **Asset**: remove `current_value`.
  - **InsurancePolicy**: remove coverage-related fields if we want coverage to come from `entity_values`. (Alternatively, coverage could remain if coverage is static. This is flexible.)
  - **IncomeSource** & **Expense**: These are recurring amounts, so we might store each year’s ‘confirmed amount’ in `entity_values` or keep it in the existing model. **(Needs final decision)**

**Example**: For an `investment_account` previously storing `current_balance`, we remove that field. Whenever a user enters or updates a balance, we create a record in `entity_values` with `entity_type='INVESTMENT_ACCOUNT'`, `entity_id=account.id`, `scenario_id` set to the appropriate scenario, and `value` set to the new balance.

---

## **3. Migration Strategy**
1. **Create the `entity_values` table** via Alembic or the appropriate migration process.
2. **Add foreign key constraints** for scenario references.
3. **Update existing code**:
   - Where the application references `current_balance`, update it to fetch from the `entity_values` table.
   - Implement a helper function (e.g., `get_latest_value(entity_type, entity_id, scenario_id)`) that retrieves the most recent `value` from the `entity_values` table.
4. **Data Migration**:
   - For each existing entity with a `current_balance` (or similar field), generate a `entity_values` row with `scenario_id` referencing the default "Actual" scenario.
   - Populate `recorded_at` with the current date.
5. **Remove the old columns** (`current_balance`, etc.) after confirming data migration.

---

## **4. API & Application Logic Adjustments**
### 4.1 Creating a New Entity
- When a user **creates** a new entity (e.g., `InvestmentAccount`), the user will specify an **initial value**.
- That initial value is saved as a **record** in `entity_values` with `scenario_id` = "Actual" by default.
- The entity itself no longer has a direct `current_balance`. Instead, it references the `entity_values` table to show its latest confirmed value.

### 4.2 Updating an Entity’s Value
- Rather than doing `PUT /investment-accounts/{id}` with a `current_balance`, the system will have a new endpoint or approach:
  - For example, `POST /entity-values` with body `{ entity_type, entity_id, scenario_id, value, recorded_at }`
  - The system can then fetch the new record for projections.

### 4.3 Displaying Values in the UI
- The UI, whenever it needs to display an entity’s value, calls a function like `get_latest_value(...)` or an endpoint that returns the latest confirmed value from `entity_values`.

### 4.4 Scenarios
- If a user wants to store scenario-specific data, they choose a **scenario** and create additional `entity_values` records with that `scenario_id`. This ensures that scenario-based projections are using the correct values.

---

## **5. Edge Cases & Considerations**
1. **Default Scenario**: The locked "Actual" scenario ensures we always have a place to store real data.
2. **Multiple Confirmations**: If there are multiple entries for the same `recorded_at`, we can decide which to keep or allow duplicates. Possibly enforce a unique constraint on `(entity_type, entity_id, scenario_id, recorded_at)`.
3. **Data Integrity**: Avoid accidental deletion of historical records. We might keep a user-facing "archive" approach, or a `deleted_at` column.
4. **Performance**: Queries must efficiently fetch the most recent value (e.g., by sorting on `recorded_at` DESC or with a specialized index).

---

## **6. Implementation Plan**
1. **Schema & Migration**:
   1. Alembic migration script to create `entity_values`.
   2. Populate `entity_values` from existing entity fields.
2. **Refactor Models & Services**:
   1. Remove `current_balance` and similar fields from investment accounts, assets, etc.
   2. Add or update service layer functions to fetch and store values in `entity_values`.
3. **Update API Endpoints**:
   1. `PUT /investment-accounts/{id}` no longer updates `current_balance`; direct the user to a separate endpoint for setting an entity’s value.
   2. Possibly create `POST /entity-values/` for adding new manual entries.
4. **UI Changes**:
   1. Remove "Current Balance" fields from entity forms; replace with a value input that saves to the new `entity_values` system.
   2. When displaying an entity, fetch the latest confirmed value from `entity_values`.
5. **Testing**:
   1. Unit tests for new logic.
   2. Migration test to ensure old data migrates properly.
   3. Integration tests ensuring the UI can create/read updated values.

---

## **7. Timeline**
- **Week 1**: Create migration, populate table, remove old columns.
- **Week 2**: Update back-end services and refactor existing endpoints.
- **Week 3**: Finalize front-end integration and fix any regressions.

---

## **Conclusion**
This refactoring centralizes value management in WealthSphere, unlocking robust historical and scenario-based analysis. Future enhancements, like advanced comparisons of multiple historical or scenario values, will be simpler with this design.

**Assigned Developer:** Junior Software Engineer
**Reviewer:** Senior Developer or Tech Lead

