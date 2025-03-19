1. Overview
Purpose:
The “Projections” tab will allow users to generate future financial projections using the underlying business logic already implemented in the backend services. Instead of calling API endpoints, the Gradio app will invoke the service functions (such as those in the projections and calculations modules) directly.

Scope:

Integrate projection generation directly into the Gradio app.
Allow users to set projection parameters (start/end year, inflation rate, province, etc.) via a form.
Display projections for net worth, cash flow, and detailed withdrawal strategies.
Once working, the API endpoints can be rebuilt to mirror the Gradio logic.
2. UI Design & Layout
2.1. Tab Layout
Main Tab: “Projections” – added alongside existing tabs (Dashboard, Assets, Family Members, etc.).
Sub-sections within the Tab:
Net Worth Projections: Display yearly net worth values and breakdown by asset and account types.
Cash Flow Projections: Present annual cash flow details including income, expenses, and any recommended withdrawal strategy.
Detailed Withdrawal Projections: Show account-by-account breakdowns with details on withdrawals, shortfall, and remaining balances.
2.2. Projection Parameters Form
Inputs:
Start Year: (Number input) – e.g., 2025.
End Year: (Number input) – e.g., 2040.
Inflation Rate: (Number input) – percentage value (default 2%).
Province: (Dropdown) – for tax calculations (e.g., “ON”, “QC”, etc.).
(Optional) Scenario Type: (Dropdown or radio buttons) – to support different projection scenarios (Base, Early Retirement, etc.) in the future.
Action Button:
“Generate Projections” – initiates the computation using backend services directly.
2.3. Results Display
Output Area:
Use Gradio’s DataFrame and/or JSON components to display the computed projections.
Consider additional visualization components (e.g., line charts) for trend analysis.
Feedback and Error Messaging:
A Textbox or alert component to show status messages (e.g., “Calculating projections…” or error messages).
2.4. Refresh and Navigation
Include a “Refresh” button to re-run the projections with current parameters.
Allow users to easily switch between sub-sections (Net Worth, Cash Flow, Detailed Withdrawals) via sub-tabs or navigation buttons within the “Projections” tab.
3. Functional Requirements
3.1. Direct Backend Integration
Service Function Calls:
Instead of POSTing to API endpoints, import and call the projection functions directly (for instance, functions from app.routers.projections or app.services.calculations).
Example functions include those that calculate net worth (calculate_net_worth), cash flow (calculate_cash_flow), and withdrawal strategies (calculate_withdrawal_strategy).
Data Flow:
When “Generate Projections” is clicked, collect the projection parameters and construct an object (e.g., an instance of ProjectionParameters).
Call the appropriate function (e.g., a local wrapper function that calls the net worth or cash flow projection service).
Render the returned results (a dictionary keyed by years) in a user-friendly table.
3.2. Data Validation & Error Handling
Validate user input (for instance, ensure the start year is not later than the end year).
Catch exceptions from the backend service calls and display appropriate error messages.
Include loading states (e.g., a spinner or message) while projections are computed.
3.3. User Interaction Flow
Input:
User fills in the projection parameters.
Projection Generation:
User clicks “Generate Projections.”
The Gradio app immediately invokes the local projection functions with the provided parameters.
A loading indicator is shown.
Results Display:
Once the computations are complete, the results are displayed in one or more DataFrame (or JSON) components.
Users can toggle between different projection views (Net Worth, Cash Flow, Detailed Withdrawals).
Refresh:
A refresh button allows re-computation with current settings.
4. Implementation Details
4.1. Adding the Projections Tab in Gradio
Function Structure:
Create a new function (e.g., projections_tab()) that defines the UI components for the projections.
Wrap the components inside a with gr.Tab("Projections"): block.
UI Components:
A section for entering projection parameters.
Buttons for “Generate Projections” and “Refresh.”
Sub-sections or nested tabs for different types of projections.
Output components (DataFrame/JSON) to show the projection results.
4.2. Invoking Backend Services Directly
Direct Function Calls:
Import the necessary functions from your backend code (for example, from app.routers.projections or app.services.calculations).
Write wrapper functions that accept projection parameters from Gradio, call these backend functions, and return the computed results.
Example:
python
Copy
def generate_net_worth_projection(start_year, end_year, inflation_rate, province):
    params = ProjectionParameters(start_year=start_year, end_year=end_year, inflation_rate=inflation_rate, province=province)
    results = project_net_worth(params, db, current_user)  # Directly use local DB session and current demo user
    return results
Session and Context:
Since the Gradio app is running in the same codebase, set up a local DB session and demo user context (similar to what’s done in the asset and family member tabs).
4.3. State Management and Output Rendering
State:
Use gr.State to store current projection parameters and results.
Output:
Render results in a DataFrame for clarity, and consider using additional visualization components (if needed).
Code Organization:
Keep all projection-related UI logic and function calls in a dedicated section of the Gradio app (or in a separate module imported by the Gradio app).
4.4. Documentation and Comments
Add inline comments and docstrings explaining each function and UI component.
Update project documentation to note that the projections feature currently bypasses API calls by directly invoking backend services.
5. Future Enhancements
Advanced Visualization:
Once the direct integration works, consider enhancing the display with interactive charts (using libraries like Plotly or Matplotlib).
Refactor for API Rebuild:
After the projections feature is stable, refactor the code so that the API endpoints mimic the direct function calls, allowing for a cleaner separation between the frontend and backend.
Scenario Customization:
Expand projection parameters to include multiple scenario types.
Performance Improvements:
Cache repeated computations when the same parameters are used to speed up refreshes.
6. Summary
This revised specification outlines the addition of a “Projections” tab to the Gradio app that directly integrates backend services and models—bypassing the API layer. Users will input custom projection parameters, trigger direct function calls to compute net worth, cash flow, and withdrawal strategies, and view the results in an interactive format. The design follows the established patterns of the app (as seen in the asset, family member, and account tabs) while setting the stage for later API integration.

This approach will allow the team to test and refine the projection functionality using the current backend services before transitioning to a full API-based architecture.