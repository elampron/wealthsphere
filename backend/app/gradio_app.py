import gradio as gr
import os
import pandas as pd
from datetime import date, datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
import enum

from app.db import get_db_session, engine, Base, init_db
from app.models import (
    User,
    FamilyMember, 
    Asset,
    InvestmentAccount,
    IncomeSource,
    Expense,
    AssetType,
    AccountType,
    IncomeType,
    ExpenseType,
    EntityType,
    ValueRecord,
    Scenario,
    RelationshipType,
    InsurancePolicy
)
from app.services import value_service
from app.services.calculations import (
    calculate_net_worth,
    calculate_cash_flow,
    calculate_withdrawal_strategy,
    calculate_account_growth,
    calculate_asset_growth,
    is_alive,
    calculate_rrsp_to_rrif_conversion
)
from app.schemas.projections import ProjectionParameters


# Ensure database is set up
init_db()

# Set up a simple user for demo purposes
def ensure_demo_user(db: Session) -> User:
    """Create a demo user if one doesn't exist"""
    user = db.query(User).filter(User.username == "demo").first()
    if not user:
        user = User(
            username="demo",
            email="demo@example.com",
            hashed_password="demo",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


# Create default 'Actual' scenario
def ensure_actual_scenario(db: Session) -> Scenario:
    """Ensure the 'Actual' scenario exists"""
    return value_service.get_actual_scenario(db)


# Database setup function
def setup_db():
    db = next(get_db_session())
    user = ensure_demo_user(db)
    scenario = ensure_actual_scenario(db)
    return db, user, scenario


# Dashboard functions
def get_entity_counts() -> Dict[str, int]:
    """Get counts of each entity type in the database"""
    db = next(get_db_session())
    
    counts = {
        "assets": db.query(Asset).count(),
        "investment_accounts": db.query(InvestmentAccount).count(),
        "income_sources": db.query(IncomeSource).count(),
        "expenses": db.query(Expense).count(),
        "family_members": db.query(FamilyMember).count()
    }
    
    return counts


def get_asset_summary() -> pd.DataFrame:
    """Get a summary of assets with their current values"""
    db = next(get_db_session())
    assets = db.query(Asset).all()
    
    data = []
    for asset in assets:
        asset_dict = value_service.get_entity_with_actual_value(
            db=db,
            entity_type=EntityType.ASSET,
            entity_id=asset.id
        )
        if asset_dict:
            # Handle None values for actual_value
            actual_value = asset_dict.get('actual_value')
            if actual_value is None:
                actual_value = 0.0
                
            # Handle None values for actual_value_date
            actual_value_date = asset_dict.get('actual_value_date')
            if actual_value_date:
                actual_value_date = actual_value_date.strftime("%Y-%m-%d")
            else:
                actual_value_date = date.today().strftime("%Y-%m-%d")
                
            data.append({
                "Name": asset_dict.get("name", ""),
                "Type": asset_dict.get("asset_type", ""),
                "Value": actual_value,
                "As of": actual_value_date
            })
    
    return pd.DataFrame(data)


# Asset form functions
def create_or_update_asset(
    name: str, 
    asset_type: str, 
    expected_annual_appreciation: float, 
    is_primary_residence: bool,
    notes: str,
    actual_value: float,
    actual_value_date: str,  # Receiving as string in YYYY-MM-DD format
    asset_id: Optional[int] = None
) -> str:
    """Create or update an asset with its actual value"""
    db = next(get_db_session())
    
    try:
        # Convert date string to date object
        actual_value_date_obj = datetime.strptime(actual_value_date, "%Y-%m-%d").date()
        
        # Convert percentage back to decimal
        expected_annual_appreciation = expected_annual_appreciation / 100.0
        
        # Prepare asset data
        asset_data = {
            "name": name,
            "asset_type": asset_type,
            "expected_annual_appreciation": expected_annual_appreciation,
            "is_primary_residence": is_primary_residence,
            "notes": notes,
            "user_id": 1  # Demo user
        }
        
        if asset_id:
            asset_data["id"] = asset_id
        
        # Create or update asset with actual value
        asset = value_service.create_or_update_entity_with_actual_value(
            db=db,
            entity_data=asset_data,
            entity_type=EntityType.ASSET,
            actual_value=actual_value,
            actual_value_date=actual_value_date_obj
        )
        
        return f"Asset {asset.name} saved successfully with actual value {actual_value} as of {actual_value_date}"
    except Exception as e:
        return f"Error: {str(e)}"


def get_asset_list() -> List[Dict[str, Any]]:
    """Get a list of all assets with their actual values"""
    db = next(get_db_session())
    assets = db.query(Asset).all()
    
    result = []
    for asset in assets:
        asset_dict = value_service.get_entity_with_actual_value(
            db=db,
            entity_type=EntityType.ASSET,
            entity_id=asset.id
        )
        result.append(asset_dict)
    
    return result


def delete_asset(asset_id: int) -> str:
    """Delete an asset by ID"""
    db = next(get_db_session())
    
    try:
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            return f"Error: Asset with ID {asset_id} not found"
        
        # Delete associated value records first
        value_records = db.query(ValueRecord).filter(
            ValueRecord.entity_type == EntityType.ASSET,
            ValueRecord.entity_id == asset_id
        ).all()
        
        for record in value_records:
            db.delete(record)
        
        # Now delete the asset
        asset_name = asset.name
        db.delete(asset)
        db.commit()
        
        return f"Asset '{asset_name}' deleted successfully"
    except Exception as e:
        db.rollback()
        return f"Error deleting asset: {str(e)}"


def get_asset_details(asset_id: int) -> Tuple:
    """Get details for a specific asset"""
    db = next(get_db_session())
    
    asset_dict = value_service.get_entity_with_actual_value(
        db=db,
        entity_type=EntityType.ASSET,
        entity_id=asset_id
    )
    
    if not asset_dict:
        return ("", "", 0.0, False, "", 0.0, date.today().strftime("%Y-%m-%d"), None)
    
    # Extract values for the form
    name = asset_dict.get("name", "")
    asset_type = asset_dict.get("asset_type", "")
    expected_annual_appreciation = float(asset_dict.get("expected_annual_appreciation", 0.0)) * 100  # Convert to percentage
    is_primary_residence = asset_dict.get("is_primary_residence", False)
    notes = asset_dict.get("notes", "")
    
    # Handle None values for actual_value
    actual_value = asset_dict.get("actual_value")
    if actual_value is None:
        actual_value = 0.0
    else:
        actual_value = float(actual_value)
    
    # Handle None values for actual_value_date
    actual_value_date = asset_dict.get("actual_value_date")
    if actual_value_date is None:
        actual_value_date = date.today().strftime("%Y-%m-%d")
    elif isinstance(actual_value_date, date):
        actual_value_date = actual_value_date.strftime("%Y-%m-%d")
    
    return (name, asset_type, expected_annual_appreciation, is_primary_residence, notes, 
            actual_value, actual_value_date, asset_id)


def get_asset_dataframe() -> pd.DataFrame:
    """Convert asset list to DataFrame for display"""
    assets = get_asset_list()
    
    # Format the data for display
    data = []
    for asset in assets:
        # Handle None values for actual_value
        actual_value = asset.get('actual_value')
        if actual_value is None:
            actual_value = 0.0
        
        # Handle None values for actual_value_date
        actual_value_date = asset.get('actual_value_date')
        if actual_value_date:
            actual_value_date = actual_value_date.strftime("%Y-%m-%d")
        else:
            actual_value_date = ""
            
        data.append({
            "ID": asset.get("id", ""),
            "Name": asset.get("name", ""),
            "Type": asset.get("asset_type", ""),
            "Annual Appreciation": f"{float(asset.get('expected_annual_appreciation', 0)) * 100:.1f}%",
            "Primary Residence": "Yes" if asset.get("is_primary_residence", False) else "No",
            "Current Value": f"${float(actual_value):,.2f}",
            "As of Date": actual_value_date
        })
    
    return pd.DataFrame(data)


def get_asset_choices() -> List[str]:
    """Get a list of asset choices for the dropdown"""
    assets = get_asset_list()
    return ["Create New"] + [f"{a['id']}: {a['name']}" for a in assets]


# Dashboard tab
def dashboard_tab():
    with gr.Tab("Dashboard"):
        gr.Markdown("## WealthSphere Dashboard")
        
        # Refresh button for dashboard
        refresh_button = gr.Button("Refresh Dashboard")
        
        with gr.Row():
            # Entity counts
            with gr.Column(scale=1):
                gr.Markdown("### Entity Counts")
                entity_counts = gr.JSON(get_entity_counts())
            
            # Asset summary
            with gr.Column(scale=2):
                gr.Markdown("### Asset Summary")
                asset_summary = gr.DataFrame(get_asset_summary())
        
        # Set up refresh functionality
        refresh_button.click(
            fn=lambda: [get_entity_counts(), get_asset_summary()],
            inputs=[],
            outputs=[entity_counts, asset_summary]
        )


# Asset tab with list and form views
def asset_tab():
    with gr.Tab("Assets"):
        # Create state management for showing/hiding views
        view_state = gr.State("list")  # Default to list view
        selected_asset_id = gr.State(None)

        # List view components
        gr.Markdown("## Assets")
        asset_table = gr.DataFrame(get_asset_dataframe(), visible=True)
        
        with gr.Row(visible=True) as list_buttons:
            add_asset_button = gr.Button("Add New Asset", variant="primary")
            refresh_list_button = gr.Button("Refresh List")
            edit_asset_button = gr.Button("Edit Selected Asset")
            delete_asset_button = gr.Button("Delete Selected Asset")
        
        # Selected row display - initialize with empty dict instead of None
        selected_row_json = gr.JSON({}, label="Selected Asset", visible=True)

        # Form view components (initially hidden)
        gr.Markdown("## Asset Details")
        
        # Asset form inputs
        asset_id = gr.Number(visible=False)
        name = gr.Textbox(label="Asset Name", visible=False)
        asset_type = gr.Dropdown(
            label="Asset Type",
            choices=[t.value for t in AssetType],
            value=AssetType.PRIMARY_RESIDENCE.value,
            visible=False
        )
        expected_annual_appreciation = gr.Number(label="Expected Annual Appreciation (%)", value=2.0, visible=False)
        is_primary_residence = gr.Checkbox(label="Is Primary Residence", value=False, visible=False)
        notes = gr.Textbox(label="Notes", lines=3, visible=False)
        
        # Actual value section
        value_section_header = gr.Markdown("### Actual Value", visible=False)
        actual_value = gr.Number(label="Current Value ($)", value=0.0, visible=False)
        actual_value_date = gr.Textbox(
            label="Value Date",
            value=date.today().strftime("%Y-%m-%d"),
            placeholder="YYYY-MM-DD",
            visible=False
        )
        
        # Form buttons
        with gr.Row(visible=False) as form_buttons:
            save_button = gr.Button("Save Asset", variant="primary")
            cancel_button = gr.Button("Cancel")
        
        # Result message
        result_message = gr.Textbox(label="Result", visible=True)
        
        # Preview
        preview = gr.JSON(label="Asset Details Preview", visible=False)
        
        # Update preview when form fields change
        def update_preview(name, asset_type, expected_annual_appreciation, is_primary_residence, 
                          notes, actual_value, actual_value_date, asset_id):
            return {
                "id": asset_id,
                "name": name,
                "asset_type": asset_type,
                "expected_annual_appreciation": expected_annual_appreciation,
                "is_primary_residence": is_primary_residence,
                "notes": notes,
                "actual_value": actual_value,
                "actual_value_date": actual_value_date
            }
        
        for field in [name, asset_type, expected_annual_appreciation, is_primary_residence, 
                     notes, actual_value, actual_value_date, asset_id]:
            field.change(
                fn=update_preview,
                inputs=[name, asset_type, expected_annual_appreciation, is_primary_residence, 
                       notes, actual_value, actual_value_date, asset_id],
                outputs=preview
            )
        
        # Table selection event
        def handle_selection(evt: gr.SelectData, state: Dict):
            row_index = evt.index[0]
            df = get_asset_dataframe()
            asset_id = int(df.iloc[row_index]["ID"])
            row_data = df.iloc[row_index].to_dict()
            return asset_id, {"value": row_data}
        
        asset_table.select(
            fn=handle_selection,
            inputs=[selected_asset_id],
            outputs=[selected_asset_id, selected_row_json]
        )
        
        # Switch to form view functions
        def show_form_view(view="new", asset_id=None):
            if view == "new":
                # Clear form for new asset
                return (
                    "form",  # view_state
                    None,    # selected_asset_id
                    gr.update(visible=False),  # asset_table
                    gr.update(visible=False),  # list_buttons
                    gr.update(visible=False),  # selected_row_json
                    gr.update(visible=True),   # name
                    gr.update(visible=True),   # asset_type
                    gr.update(visible=True),   # expected_annual_appreciation
                    gr.update(visible=True),   # is_primary_residence
                    gr.update(visible=True),   # notes
                    gr.update(visible=True),   # value_section_header
                    gr.update(visible=True),   # actual_value
                    gr.update(visible=True),   # actual_value_date
                    gr.update(visible=True),   # form_buttons
                    gr.update(visible=True),   # preview
                    "",      # name value
                    AssetType.PRIMARY_RESIDENCE.value,  # asset_type value
                    2.0,     # expected_annual_appreciation value
                    False,   # is_primary_residence value
                    "",      # notes value
                    0.0,     # actual_value value
                    date.today().strftime("%Y-%m-%d"),  # actual_value_date value
                    None,    # asset_id value
                    ""       # result_message
                )
            else:
                # Load asset details for editing
                name_val, asset_type_val, expected_annual_appreciation_val, is_primary_residence_val, notes_val, actual_value_val, actual_value_date_val, asset_id_val = get_asset_details(asset_id)
                return (
                    "form",  # view_state
                    asset_id,  # selected_asset_id
                    gr.update(visible=False),  # asset_table
                    gr.update(visible=False),  # list_buttons
                    gr.update(visible=False),  # selected_row_json
                    gr.update(visible=True),   # name
                    gr.update(visible=True),   # asset_type
                    gr.update(visible=True),   # expected_annual_appreciation
                    gr.update(visible=True),   # is_primary_residence
                    gr.update(visible=True),   # notes
                    gr.update(visible=True),   # value_section_header
                    gr.update(visible=True),   # actual_value
                    gr.update(visible=True),   # actual_value_date
                    gr.update(visible=True),   # form_buttons
                    gr.update(visible=True),   # preview
                    name_val,     # name value
                    asset_type_val,  # asset_type value
                    expected_annual_appreciation_val,  # expected_annual_appreciation value
                    is_primary_residence_val,  # is_primary_residence value
                    notes_val,    # notes value
                    actual_value_val,  # actual_value value
                    actual_value_date_val,  # actual_value_date value
                    asset_id_val,  # asset_id value
                    ""        # result_message
                )
        
        # Switch to list view function
        def show_list_view():
            return (
                "list",  # view_state
                gr.update(visible=True),   # asset_table
                gr.update(visible=True),   # list_buttons
                gr.update(visible=True),   # selected_row_json
                gr.update(visible=False),  # name
                gr.update(visible=False),  # asset_type
                gr.update(visible=False),  # expected_annual_appreciation
                gr.update(visible=False),  # is_primary_residence
                gr.update(visible=False),  # notes
                gr.update(visible=False),  # value_section_header
                gr.update(visible=False),  # actual_value
                gr.update(visible=False),  # actual_value_date
                gr.update(visible=False),  # form_buttons
                gr.update(visible=False),  # preview
                get_asset_dataframe()      # refresh table data
            )
        
        # Add new asset button
        add_asset_button.click(
            fn=show_form_view,
            inputs=[],
            outputs=[
                view_state, 
                selected_asset_id,
                asset_table,
                list_buttons,
                selected_row_json,
                name,
                asset_type,
                expected_annual_appreciation,
                is_primary_residence,
                notes,
                value_section_header,
                actual_value,
                actual_value_date,
                form_buttons,
                preview,
                name,
                asset_type,
                expected_annual_appreciation,
                is_primary_residence,
                notes,
                actual_value,
                actual_value_date,
                asset_id,
                result_message
            ]
        )
        
        # Edit selected asset button
        def edit_selected_asset(asset_id):
            if asset_id is None:
                return [
                    "list", None,
                    gr.update(visible=True), gr.update(visible=True), gr.update(visible=True),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False),
                    gr.update(), gr.update(), gr.update(), gr.update(), gr.update(),
                    gr.update(), gr.update(),
                    "Please select an asset to edit"
                ]
            return show_form_view("edit", asset_id)
        
        edit_asset_button.click(
            fn=edit_selected_asset,
            inputs=[selected_asset_id],
            outputs=[
                view_state,
                selected_asset_id,
                asset_table,
                list_buttons,
                selected_row_json,
                name,
                asset_type,
                expected_annual_appreciation,
                is_primary_residence,
                notes,
                value_section_header,
                actual_value,
                actual_value_date,
                form_buttons,
                preview,
                name,
                asset_type,
                expected_annual_appreciation,
                is_primary_residence,
                notes,
                actual_value,
                actual_value_date,
                asset_id,
                result_message
            ]
        )
        
        # Delete selected asset button
        def delete_selected_asset(asset_id):
            if asset_id is None:
                return "Please select an asset to delete", None, get_asset_dataframe()
            
            # Perform the delete operation
            result = delete_asset(asset_id)
            
            # Return message, clear selected ID, and update table
            return result, None, get_asset_dataframe()
        
        delete_asset_button.click(
            fn=delete_selected_asset,
            inputs=[selected_asset_id],
            outputs=[result_message, selected_asset_id, asset_table]
        )
        
        # Refresh list button
        refresh_list_button.click(
            fn=get_asset_dataframe,
            inputs=[],
            outputs=[asset_table]
        )
        
        # Cancel button
        cancel_button.click(
            fn=show_list_view,
            inputs=[],
            outputs=[
                view_state,
                asset_table,
                list_buttons,
                selected_row_json,
                name,
                asset_type,
                expected_annual_appreciation,
                is_primary_residence,
                notes,
                value_section_header,
                actual_value,
                actual_value_date,
                form_buttons,
                preview,
                asset_table
            ]
        )
        
        # Save asset button
        def save_asset_and_return(
            name, asset_type, expected_annual_appreciation, is_primary_residence, 
            notes, actual_value, actual_value_date, asset_id
        ):
            result = create_or_update_asset(
                name, asset_type, expected_annual_appreciation, is_primary_residence,
                notes, actual_value, actual_value_date, asset_id
            )
            
            # Return to list view with updated data
            return [
                "list",  # view_state
                gr.update(visible=True),   # asset_table
                gr.update(visible=True),   # list_buttons
                gr.update(visible=True),   # selected_row_json
                gr.update(visible=False),  # name
                gr.update(visible=False),  # asset_type
                gr.update(visible=False),  # expected_annual_appreciation
                gr.update(visible=False),  # is_primary_residence
                gr.update(visible=False),  # notes
                gr.update(visible=False),  # value_section_header
                gr.update(visible=False),  # actual_value
                gr.update(visible=False),  # actual_value_date
                gr.update(visible=False),  # form_buttons
                gr.update(visible=False),  # preview
                result,                    # result_message
                get_asset_dataframe()      # refresh table data
            ]
        
        save_button.click(
            fn=save_asset_and_return,
            inputs=[
                name, asset_type, expected_annual_appreciation, is_primary_residence,
                notes, actual_value, actual_value_date, asset_id
            ],
            outputs=[
                view_state,
                asset_table,
                list_buttons,
                selected_row_json,
                name,
                asset_type,
                expected_annual_appreciation,
                is_primary_residence,
                notes,
                value_section_header,
                actual_value,
                actual_value_date,
                form_buttons,
                preview,
                result_message,
                asset_table
            ]
        )

        # When the selected ID changes, update the JSON display
        def update_selected_json(asset_id):
            if asset_id is None:
                return {}
            
            # Find the asset with this ID
            assets = get_asset_list()
            for asset in assets:
                if asset.get('id') == asset_id:
                    return asset
            return {}
        
        selected_asset_id.change(
            fn=update_selected_json,
            inputs=[selected_asset_id],
            outputs=[selected_row_json]
        )


# Family member functions
def create_or_update_family_member(
    name: str,
    birth_date: str,  # Receiving as string in YYYY-MM-DD format
    relationship: str,
    notes: str,
    member_id: Optional[int] = None
) -> str:
    """Create or update a family member"""
    db = next(get_db_session())
    
    try:
        # Split name into first and last name
        first_name, *last_parts = name.split()
        last_name = " ".join(last_parts) if last_parts else ""
        
        # Convert date string to date object
        birth_date_obj = datetime.strptime(birth_date, "%Y-%m-%d").date()
        
        # Prepare family member data
        member_data = {
            "first_name": first_name,
            "last_name": last_name,
            "date_of_birth": birth_date_obj,
            "relationship_type": relationship,
            "user_id": 1,  # Demo user
            "is_primary": relationship == RelationshipType.SELF.value,
            "notes": notes
        }
        
        if member_id:
            member = db.query(FamilyMember).filter(FamilyMember.id == member_id).first()
            if not member:
                return f"Error: Family member with ID {member_id} not found"
            
            # Update existing member
            for key, value in member_data.items():
                setattr(member, key, value)
        else:
            # Create new member
            member = FamilyMember(**member_data)
            db.add(member)
        
        db.commit()
        db.refresh(member)
        return f"Family member {member.first_name} {member.last_name} saved successfully"
    except Exception as e:
        db.rollback()
        return f"Error: {str(e)}"


def get_family_member_list() -> List[Dict[str, Any]]:
    """Get a list of all family members"""
    db = next(get_db_session())
    members = db.query(FamilyMember).all()
    
    result = []
    for member in members:
        result.append({
            "id": member.id,
            "name": member.first_name + " " + member.last_name,
            "birth_date": member.date_of_birth.strftime("%Y-%m-%d"),
            "relationship": member.relationship_type,
            "notes": member.notes if hasattr(member, "notes") and member.notes is not None else ""
        })
    
    return result


def delete_family_member(member_id: int) -> str:
    """Delete a family member by ID"""
    db = next(get_db_session())
    
    try:
        member = db.query(FamilyMember).filter(FamilyMember.id == member_id).first()
        if not member:
            return f"Error: Family member with ID {member_id} not found"
        
        member_name = member.first_name + " " + member.last_name
        db.delete(member)
        db.commit()
        
        return f"Family member '{member_name}' deleted successfully"
    except Exception as e:
        db.rollback()
        return f"Error deleting family member: {str(e)}"


def get_family_member_details(member_id: int) -> Tuple:
    """Get details for a specific family member"""
    db = next(get_db_session())
    
    member = db.query(FamilyMember).filter(FamilyMember.id == member_id).first()
    
    if not member:
        return ("", date.today().strftime("%Y-%m-%d"), RelationshipType.SELF.value, "", None)
    
    # Get notes with a safe default
    notes = member.notes if hasattr(member, "notes") and member.notes is not None else ""
    
    return (
        f"{member.first_name} {member.last_name}",  # Combined name
        member.date_of_birth.strftime("%Y-%m-%d"),
        member.relationship_type,
        notes,
        member.id
    )


def get_family_member_dataframe() -> pd.DataFrame:
    """Convert family member list to DataFrame for display"""
    db = next(get_db_session())
    members = db.query(FamilyMember).all()
    
    # Format the data for display
    data = []
    for member in members:
        data.append({
            "ID": member.id,
            "Name": f"{member.first_name} {member.last_name}",
            "Birth Date": member.date_of_birth.strftime("%Y-%m-%d"),
            "Relationship": member.relationship_type,
            "Primary": "Yes" if member.is_primary else "No"
        })
    
    return pd.DataFrame(data)


# Family member tab
def family_member_tab():
    with gr.Tab("Family Members"):
        # Create state management for showing/hiding views
        view_state = gr.State("list")  # Default to list view
        selected_member_id = gr.State(None)

        # List view components
        gr.Markdown("## Family Members")
        member_table = gr.DataFrame(get_family_member_dataframe(), visible=True)
        
        with gr.Row(visible=True) as list_buttons:
            add_member_button = gr.Button("Add New Family Member", variant="primary")
            refresh_list_button = gr.Button("Refresh List")
            edit_member_button = gr.Button("Edit Selected Member")
            delete_member_button = gr.Button("Delete Selected Member")
        
        # Selected row display - initialize with empty dict instead of None
        selected_row_json = gr.JSON({}, label="Selected Family Member", visible=True)

        # Form view components (initially hidden)
        gr.Markdown("## Family Member Details")
        
        # Family member form inputs
        member_id = gr.Number(visible=False)
        name = gr.Textbox(label="Name", visible=False)
        birth_date = gr.Textbox(
            label="Birth Date",
            value=date.today().strftime("%Y-%m-%d"),
            placeholder="YYYY-MM-DD",
            visible=False
        )
        relationship = gr.Dropdown(
            label="Relationship",
            choices=[t.value for t in RelationshipType],
            value=RelationshipType.SELF.value,
            visible=False
        )
        notes = gr.Textbox(label="Notes", lines=3, visible=False)
        
        # Form buttons
        with gr.Row(visible=False) as form_buttons:
            save_button = gr.Button("Save Family Member", variant="primary")
            cancel_button = gr.Button("Cancel")
        
        # Result message
        result_message = gr.Textbox(label="Result", visible=True)
        
        # Preview
        preview = gr.JSON(label="Family Member Details Preview", visible=False)
        
        # Update preview when form fields change
        def update_preview(name, birth_date, relationship, notes, member_id):
            return {
                "id": member_id,
                "name": name,
                "birth_date": birth_date,
                "relationship": relationship,
                "notes": notes
            }
        
        for field in [name, birth_date, relationship, notes, member_id]:
            field.change(
                fn=update_preview,
                inputs=[name, birth_date, relationship, notes, member_id],
                outputs=preview
            )
        
        # Table selection event
        def handle_selection(evt: gr.SelectData, state: Dict):
            row_index = evt.index[0]
            df = get_family_member_dataframe()
            member_id = int(df.iloc[row_index]["ID"])
            row_data = df.iloc[row_index].to_dict()
            return member_id, {"value": row_data}
        
        member_table.select(
            fn=handle_selection,
            inputs=[selected_member_id],
            outputs=[selected_member_id, selected_row_json]
        )
        
        # Switch to form view functions
        def show_form_view(view="new", member_id=None):
            if view == "new":
                # Clear form for new member
                return (
                    "form",  # view_state
                    None,    # selected_member_id
                    gr.update(visible=False),  # member_table
                    gr.update(visible=False),  # list_buttons
                    gr.update(visible=False),  # selected_row_json
                    gr.update(visible=True),   # name
                    gr.update(visible=True),   # birth_date
                    gr.update(visible=True),   # relationship
                    gr.update(visible=True),   # notes
                    gr.update(visible=True),   # form_buttons
                    gr.update(visible=True),   # preview
                    "",      # name value
                    date.today().strftime("%Y-%m-%d"),  # birth_date value
                    RelationshipType.SELF.value,  # relationship value
                    "",      # notes value
                    None,    # member_id value
                    ""       # result_message
                )
            else:
                # Load member details for editing
                name_val, birth_date_val, relationship_val, notes_val, member_id_val = get_family_member_details(member_id)
                return (
                    "form",  # view_state
                    member_id,  # selected_member_id
                    gr.update(visible=False),  # member_table
                    gr.update(visible=False),  # list_buttons
                    gr.update(visible=False),  # selected_row_json
                    gr.update(visible=True),   # name
                    gr.update(visible=True),   # birth_date
                    gr.update(visible=True),   # relationship
                    gr.update(visible=True),   # notes
                    gr.update(visible=True),   # form_buttons
                    gr.update(visible=True),   # preview
                    name_val,     # name value
                    birth_date_val,  # birth_date value
                    relationship_val,  # relationship value
                    notes_val,    # notes value
                    member_id_val,  # member_id value
                    ""        # result_message
                )
        
        # Switch to list view function
        def show_list_view():
            return (
                "list",  # view_state
                gr.update(visible=True),   # member_table
                gr.update(visible=True),   # list_buttons
                gr.update(visible=True),   # selected_row_json
                gr.update(visible=False),  # name
                gr.update(visible=False),  # birth_date
                gr.update(visible=False),  # relationship
                gr.update(visible=False),  # notes
                gr.update(visible=False),  # form_buttons
                gr.update(visible=False),  # preview
                get_family_member_dataframe()  # refresh table data
            )
        
        # Add new member button
        add_member_button.click(
            fn=show_form_view,
            inputs=[],
            outputs=[
                view_state, 
                selected_member_id,
                member_table,
                list_buttons,
                selected_row_json,
                name,
                birth_date,
                relationship,
                notes,
                form_buttons,
                preview,
                name,
                birth_date,
                relationship,
                notes,
                member_id,
                result_message
            ]
        )
        
        # Edit selected member button
        def edit_selected_member(member_id):
            if member_id is None:
                return [
                    "list", None,
                    gr.update(visible=True), gr.update(visible=True), gr.update(visible=True),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False),
                    gr.update(), gr.update(), gr.update(), gr.update(), gr.update(),
                    gr.update(), gr.update(),
                    "Please select a family member to edit"
                ]
            return show_form_view("edit", member_id)
        
        edit_member_button.click(
            fn=edit_selected_member,
            inputs=[selected_member_id],
            outputs=[
                view_state,
                selected_member_id,
                member_table,
                list_buttons,
                selected_row_json,
                name,
                birth_date,
                relationship,
                notes,
                form_buttons,
                preview,
                name,
                birth_date,
                relationship,
                notes,
                member_id,
                result_message
            ]
        )
        
        # Delete selected member button
        def delete_selected_member(member_id):
            if member_id is None:
                return "Please select a family member to delete", None, get_family_member_dataframe()
            
            # Perform the delete operation
            result = delete_family_member(member_id)
            
            # Return message, clear selected ID, and update table
            return result, None, get_family_member_dataframe()
        
        delete_member_button.click(
            fn=delete_selected_member,
            inputs=[selected_member_id],
            outputs=[result_message, selected_member_id, member_table]
        )
        
        # Refresh list button
        refresh_list_button.click(
            fn=get_family_member_dataframe,
            inputs=[],
            outputs=[member_table]
        )
        
        # Cancel button
        cancel_button.click(
            fn=show_list_view,
            inputs=[],
            outputs=[
                view_state,
                member_table,
                list_buttons,
                selected_row_json,
                name,
                birth_date,
                relationship,
                notes,
                form_buttons,
                preview,
                member_table
            ]
        )
        
        # Save member button
        def save_member_and_return(
            name, birth_date, relationship, notes, member_id
        ):
            # Pass the notes field
            result = create_or_update_family_member(
                name, birth_date, relationship, notes, member_id
            )
            
            # Return to list view with updated data
            return [
                "list",  # view_state
                gr.update(visible=True),   # member_table
                gr.update(visible=True),   # list_buttons
                gr.update(visible=True),   # selected_row_json
                gr.update(visible=False),  # name
                gr.update(visible=False),  # birth_date
                gr.update(visible=False),  # relationship
                gr.update(visible=False),  # notes
                gr.update(visible=False),  # form_buttons
                gr.update(visible=False),  # preview
                result,                    # result_message
                get_family_member_dataframe()  # refresh table data
            ]
        
        save_button.click(
            fn=save_member_and_return,
            inputs=[
                name, birth_date, relationship, notes, member_id
            ],
            outputs=[
                view_state,
                member_table,
                list_buttons,
                selected_row_json,
                name,
                birth_date,
                relationship,
                notes,
                form_buttons,
                preview,
                result_message,
                member_table
            ]
        )

        # When the selected ID changes, update the JSON display
        def update_selected_json(member_id):
            if member_id is None:
                return {}
            
            # Find the member with this ID
            members = get_family_member_list()
            for member in members:
                if member.get('id') == member_id:
                    return member
            return {}
        
        selected_member_id.change(
            fn=update_selected_json,
            inputs=[selected_member_id],
            outputs=[selected_row_json]
        )


# Account functions
def create_or_update_account(
    name: str,
    account_type: str,
    institution: str,
    notes: str,
    actual_value: float,
    actual_value_date: str,  # Receiving as string in YYYY-MM-DD format
    account_id: Optional[int] = None
) -> str:
    """Create or update an investment account with its actual value"""
    db = next(get_db_session())
    
    try:
        # Convert date string to date object
        actual_value_date_obj = datetime.strptime(actual_value_date, "%Y-%m-%d").date()
        
        # Prepare account data
        account_data = {
            "name": name,
            "account_type": account_type,
            "institution": institution,
            "notes": notes,
            "user_id": 1,  # Demo user
            "family_member_id": 1  # Demo family member (primary)
        }
        
        if account_id:
            account_data["id"] = account_id
        
        # Create or update account with actual value
        account = value_service.create_or_update_entity_with_actual_value(
            db=db,
            entity_data=account_data,
            entity_type=EntityType.INVESTMENT_ACCOUNT,
            actual_value=actual_value,
            actual_value_date=actual_value_date_obj
        )
        
        return f"Account {account.name} saved successfully with actual value {actual_value} as of {actual_value_date}"
    except Exception as e:
        return f"Error: {str(e)}"


def get_account_list() -> List[Dict[str, Any]]:
    """Get a list of all accounts with their actual values"""
    db = next(get_db_session())
    accounts = db.query(InvestmentAccount).all()
    
    result = []
    for account in accounts:
        account_dict = value_service.get_entity_with_actual_value(
            db=db,
            entity_type=EntityType.INVESTMENT_ACCOUNT,
            entity_id=account.id
        )
        result.append(account_dict)
    
    return result


def delete_account(account_id: int) -> str:
    """Delete an account by ID"""
    db = next(get_db_session())
    
    try:
        account = db.query(InvestmentAccount).filter(InvestmentAccount.id == account_id).first()
        if not account:
            return f"Error: Account with ID {account_id} not found"
        
        # Delete associated value records first
        value_records = db.query(ValueRecord).filter(
            ValueRecord.entity_type == EntityType.INVESTMENT_ACCOUNT,
            ValueRecord.entity_id == account_id
        ).all()
        
        for record in value_records:
            db.delete(record)
        
        # Now delete the account
        account_name = account.name
        db.delete(account)
        db.commit()
        
        return f"Account '{account_name}' deleted successfully"
    except Exception as e:
        db.rollback()
        return f"Error deleting account: {str(e)}"


def get_account_details(account_id: int) -> Tuple:
    """Get details for a specific account"""
    db = next(get_db_session())
    
    account_dict = value_service.get_entity_with_actual_value(
        db=db,
        entity_type=EntityType.INVESTMENT_ACCOUNT,
        entity_id=account_id
    )
    
    if not account_dict:
        return ("", "", "", "", 0.0, date.today().strftime("%Y-%m-%d"), None)
    
    # Extract values for the form
    name = account_dict.get("name", "")
    account_type = account_dict.get("account_type", "")
    institution = account_dict.get("institution", "")
    notes = account_dict.get("notes", "")
    actual_value = float(account_dict.get("actual_value", 0.0))
    actual_value_date = account_dict.get("actual_value_date", date.today())
    if isinstance(actual_value_date, date):
        actual_value_date = actual_value_date.strftime("%Y-%m-%d")
    
    return (name, account_type, institution, notes, actual_value, actual_value_date, account_id)


def get_account_dataframe() -> pd.DataFrame:
    """Convert account list to DataFrame for display"""
    accounts = get_account_list()
    
    # Format the data for display
    data = []
    for account in accounts:
        # Handle None values for actual_value
        actual_value = account.get('actual_value')
        if actual_value is None:
            actual_value = 0.0
        
        # Handle None values for actual_value_date
        actual_value_date = account.get('actual_value_date')
        if actual_value_date:
            actual_value_date = actual_value_date.strftime("%Y-%m-%d")
        else:
            actual_value_date = ""
            
        data.append({
            "ID": account.get("id", ""),
            "Name": account.get("name", ""),
            "Type": account.get("account_type", ""),
            "Institution": account.get("institution", ""),
            "Current Value": f"${float(actual_value):,.2f}",
            "As of Date": actual_value_date
        })
    
    return pd.DataFrame(data)


# Account tab
def account_tab():
    with gr.Tab("Accounts"):
        # Create state management for showing/hiding views
        view_state = gr.State("list")  # Default to list view
        selected_account_id = gr.State(None)

        # List view components
        gr.Markdown("## Investment Accounts")
        account_table = gr.DataFrame(get_account_dataframe(), visible=True)
        
        with gr.Row(visible=True) as list_buttons:
            add_account_button = gr.Button("Add New Account", variant="primary")
            refresh_list_button = gr.Button("Refresh List")
            edit_account_button = gr.Button("Edit Selected Account")
            delete_account_button = gr.Button("Delete Selected Account")
        
        # Selected row display - initialize with empty dict instead of None
        selected_row_json = gr.JSON({}, label="Selected Account", visible=True)

        # Form view components (initially hidden)
        gr.Markdown("## Account Details")
        
        # Account form inputs
        account_id = gr.Number(visible=False)
        name = gr.Textbox(label="Account Name", visible=False)
        account_type = gr.Dropdown(
            label="Account Type",
            choices=[t.value for t in AccountType],
            value=AccountType.NON_REGISTERED.value,
            visible=False
        )
        institution = gr.Textbox(label="Financial Institution", visible=False)
        notes = gr.Textbox(label="Notes", lines=3, visible=False)
        
        # Actual value section
        value_section_header = gr.Markdown("### Current Value", visible=False)
        actual_value = gr.Number(label="Current Value ($)", value=0.0, visible=False)
        actual_value_date = gr.Textbox(
            label="Value Date",
            value=date.today().strftime("%Y-%m-%d"),
            placeholder="YYYY-MM-DD",
            visible=False
        )
        
        # Form buttons
        with gr.Row(visible=False) as form_buttons:
            save_button = gr.Button("Save Account", variant="primary")
            cancel_button = gr.Button("Cancel")
        
        # Result message
        result_message = gr.Textbox(label="Result", visible=True)
        
        # Preview
        preview = gr.JSON(label="Account Details Preview", visible=False)
        
        # Update preview when form fields change
        def update_preview(name, account_type, institution, notes, actual_value, actual_value_date, account_id):
            return {
                "id": account_id,
                "name": name,
                "account_type": account_type,
                "institution": institution,
                "notes": notes,
                "actual_value": actual_value,
                "actual_value_date": actual_value_date
            }
        
        for field in [name, account_type, institution, notes, actual_value, actual_value_date, account_id]:
            field.change(
                fn=update_preview,
                inputs=[name, account_type, institution, notes, actual_value, actual_value_date, account_id],
                outputs=preview
            )
        
        # Table selection event
        def handle_selection(evt: gr.SelectData, state: Dict):
            row_index = evt.index[0]
            df = get_account_dataframe()
            account_id = int(df.iloc[row_index]["ID"])
            row_data = df.iloc[row_index].to_dict()
            return account_id, {"value": row_data}
        
        account_table.select(
            fn=handle_selection,
            inputs=[selected_account_id],
            outputs=[selected_account_id, selected_row_json]
        )
        
        # Switch to form view functions
        def show_form_view(view="new", account_id=None):
            if view == "new":
                # Clear form for new account
                return (
                    "form",  # view_state
                    None,    # selected_account_id
                    gr.update(visible=False),  # account_table
                    gr.update(visible=False),  # list_buttons
                    gr.update(visible=False),  # selected_row_json
                    gr.update(visible=True),   # name
                    gr.update(visible=True),   # account_type
                    gr.update(visible=True),   # institution
                    gr.update(visible=True),   # notes
                    gr.update(visible=True),   # value_section_header
                    gr.update(visible=True),   # actual_value
                    gr.update(visible=True),   # actual_value_date
                    gr.update(visible=True),   # form_buttons
                    gr.update(visible=True),   # preview
                    "",      # name value
                    AccountType.NON_REGISTERED.value,  # account_type value
                    "",      # institution value
                    "",      # notes value
                    0.0,     # actual_value value
                    date.today().strftime("%Y-%m-%d"),  # actual_value_date value
                    None,    # account_id value
                    ""       # result_message
                )
            else:
                # Load account details for editing
                name_val, account_type_val, institution_val, notes_val, actual_value_val, actual_value_date_val, account_id_val = get_account_details(account_id)
                return (
                    "form",  # view_state
                    account_id,  # selected_account_id
                    gr.update(visible=False),  # account_table
                    gr.update(visible=False),  # list_buttons
                    gr.update(visible=False),  # selected_row_json
                    gr.update(visible=True),   # name
                    gr.update(visible=True),   # account_type
                    gr.update(visible=True),   # institution
                    gr.update(visible=True),   # notes
                    gr.update(visible=True),   # value_section_header
                    gr.update(visible=True),   # actual_value
                    gr.update(visible=True),   # actual_value_date
                    gr.update(visible=True),   # form_buttons
                    gr.update(visible=True),   # preview
                    name_val,     # name value
                    account_type_val,  # account_type value
                    institution_val,  # institution value
                    notes_val,    # notes value
                    actual_value_val,  # actual_value value
                    actual_value_date_val,  # actual_value_date value
                    account_id_val,  # account_id value
                    ""        # result_message
                )
        
        # Switch to list view function
        def show_list_view():
            return (
                "list",  # view_state
                gr.update(visible=True),   # account_table
                gr.update(visible=True),   # list_buttons
                gr.update(visible=True),   # selected_row_json
                gr.update(visible=False),  # name
                gr.update(visible=False),  # account_type
                gr.update(visible=False),  # institution
                gr.update(visible=False),  # notes
                gr.update(visible=False),  # value_section_header
                gr.update(visible=False),  # actual_value
                gr.update(visible=False),  # actual_value_date
                gr.update(visible=False),  # form_buttons
                gr.update(visible=False),  # preview
                get_account_dataframe()  # refresh table data
            )
        
        # Add new account button
        add_account_button.click(
            fn=show_form_view,
            inputs=[],
            outputs=[
                view_state, 
                selected_account_id,
                account_table,
                list_buttons,
                selected_row_json,
                name,
                account_type,
                institution,
                notes,
                value_section_header,
                actual_value,
                actual_value_date,
                form_buttons,
                preview,
                name,
                account_type,
                institution,
                notes,
                actual_value,
                actual_value_date,
                account_id,
                result_message
            ]
        )
        
        # Edit selected account button
        def edit_selected_account(account_id):
            if account_id is None:
                return [
                    "list", None,
                    gr.update(visible=True), gr.update(visible=True), gr.update(visible=True),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False),
                    gr.update(), gr.update(), gr.update(), gr.update(), gr.update(),
                    gr.update(), gr.update(),
                    "Please select an account to edit"
                ]
            return show_form_view("edit", account_id)
        
        edit_account_button.click(
            fn=edit_selected_account,
            inputs=[selected_account_id],
            outputs=[
                view_state,
                selected_account_id,
                account_table,
                list_buttons,
                selected_row_json,
                name,
                account_type,
                institution,
                notes,
                value_section_header,
                actual_value,
                actual_value_date,
                form_buttons,
                preview,
                name,
                account_type,
                institution,
                notes,
                actual_value,
                actual_value_date,
                account_id,
                result_message
            ]
        )
        
        # Delete selected account button
        def delete_selected_account(account_id):
            if account_id is None:
                return "Please select an account to delete", None, get_account_dataframe()
            
            # Perform the delete operation
            result = delete_account(account_id)
            
            # Return message, clear selected ID, and update table
            return result, None, get_account_dataframe()
        
        delete_account_button.click(
            fn=delete_selected_account,
            inputs=[selected_account_id],
            outputs=[result_message, selected_account_id, account_table]
        )
        
        # Refresh list button
        refresh_list_button.click(
            fn=get_account_dataframe,
            inputs=[],
            outputs=[account_table]
        )
        
        # Cancel button
        cancel_button.click(
            fn=show_list_view,
            inputs=[],
            outputs=[
                view_state,
                account_table,
                list_buttons,
                selected_row_json,
                name,
                account_type,
                institution,
                notes,
                value_section_header,
                actual_value,
                actual_value_date,
                form_buttons,
                preview,
                account_table
            ]
        )
        
        # Save account button
        def save_account_and_return(
            name, account_type, institution, notes, actual_value, actual_value_date, account_id
        ):
            result = create_or_update_account(
                name, account_type, institution, notes, actual_value, actual_value_date, account_id
            )
            
            # Return to list view with updated data
            return [
                "list",  # view_state
                gr.update(visible=True),   # account_table
                gr.update(visible=True),   # list_buttons
                gr.update(visible=True),   # selected_row_json
                gr.update(visible=False),  # name
                gr.update(visible=False),  # account_type
                gr.update(visible=False),  # institution
                gr.update(visible=False),  # notes
                gr.update(visible=False),  # value_section_header
                gr.update(visible=False),  # actual_value
                gr.update(visible=False),  # actual_value_date
                gr.update(visible=False),  # form_buttons
                gr.update(visible=False),  # preview
                result,                    # result_message
                get_account_dataframe()    # refresh table data
            ]
        
        save_button.click(
            fn=save_account_and_return,
            inputs=[
                name, account_type, institution, notes, actual_value, actual_value_date, account_id
            ],
            outputs=[
                view_state,
                account_table,
                list_buttons,
                selected_row_json,
                name,
                account_type,
                institution,
                notes,
                value_section_header,
                actual_value,
                actual_value_date,
                form_buttons,
                preview,
                result_message,
                account_table
            ]
        )

        # When the selected ID changes, update the JSON display
        def update_selected_json(account_id):
            if account_id is None:
                return {}
            
            # Find the account with this ID
            accounts = get_account_list()
            for account in accounts:
                if account.get('id') == account_id:
                    return account
            return {}
        
        selected_account_id.change(
            fn=update_selected_json,
            inputs=[selected_account_id],
            outputs=[selected_row_json]
        )


# Income source functions
def create_or_update_income_source(
    name: str,
    income_type: str,
    annual_amount: float,
    family_member_id,  # Changed to accept any type
    start_date: str,  # Receiving as string in YYYY-MM-DD format
    end_date: str,  # Receiving as string in YYYY-MM-DD format
    notes: str,
    income_id: Optional[int] = None
) -> str:
    """Create or update an income source"""
    db = next(get_db_session())
    
    try:
        # Convert date strings to date objects
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else None
        
        # Convert dates to years
        start_year = start_date_obj.year
        end_year = end_date_obj.year if end_date_obj else None
        
        # Handle family_member_id which might be a dict from gradio
        if isinstance(family_member_id, dict) and "value" in family_member_id:
            family_member_id = family_member_id["value"]
        
        # Prepare income source data
        income_data = {
            "name": name,
            "income_type": income_type,
            "start_year": start_year,
            "end_year": end_year,
            "family_member_id": int(family_member_id),
            "notes": notes,
            "expected_growth_rate": 0.0,  # Default to 0% growth
            "is_taxable": True,  # Default to taxable
            "user_id": 1  # Demo user
        }
        
        if income_id:
            income = db.query(IncomeSource).filter(IncomeSource.id == income_id).first()
            if not income:
                return f"Error: Income source with ID {income_id} not found"
            
            # Update existing income source
            for key, value in income_data.items():
                setattr(income, key, value)
        else:
            # Create new income source
            income = IncomeSource(**income_data)
            db.add(income)
        
        db.commit()
        db.refresh(income)
        
        # Add or update the value record for this income source if amount provided
        if annual_amount > 0:
            # Get actual scenario
            scenario = value_service.get_actual_scenario(db)
            
            # Create value record with the annual amount
            value_service.create_or_update_value_record(
                db=db,
                entity_type=EntityType.INCOME_SOURCE,
                entity_id=income.id,
                scenario_id=scenario.id,
                value_date=start_date_obj,
                value_amount=annual_amount
            )
        
        return f"Income source {income.name} saved successfully with annual amount ${annual_amount:,.2f}"
    except Exception as e:
        db.rollback()
        return f"Error: {str(e)}"


def get_income_source_list() -> List[Dict[str, Any]]:
    """Get a list of all income sources"""
    db = next(get_db_session())
    income_sources = db.query(IncomeSource).all()
    
    result = []
    for income in income_sources:
        # Get family member name
        family_member = db.query(FamilyMember).filter(FamilyMember.id == income.family_member_id).first()
        family_member_name = f"{family_member.first_name} {family_member.last_name}" if family_member else "Unknown"
        
        # Get the current value (amount) from value records
        scenario = value_service.get_actual_scenario(db)
        value_record = db.query(ValueRecord).filter(
            ValueRecord.entity_type == EntityType.INCOME_SOURCE,
            ValueRecord.entity_id == income.id,
            ValueRecord.scenario_id == scenario.id
        ).order_by(ValueRecord.value_date.desc()).first()
        
        annual_amount = value_record.value_amount if value_record else 0.0
        
        # Format dates for display
        start_date = date(income.start_year, 1, 1)
        end_date = date(income.end_year, 12, 31) if income.end_year else None
        end_date_str = end_date.strftime("%Y-%m-%d") if end_date else "Ongoing"
        
        result.append({
            "id": income.id,
            "name": income.name,
            "income_type": income.income_type,
            "annual_amount": annual_amount,
            "family_member_id": income.family_member_id,
            "family_member_name": family_member_name,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date_str,
            "notes": income.notes if income.notes is not None else ""
        })
    
    return result


def delete_income_source(income_id: int) -> str:
    """Delete an income source by ID"""
    db = next(get_db_session())
    
    try:
        income = db.query(IncomeSource).filter(IncomeSource.id == income_id).first()
        if not income:
            return f"Error: Income source with ID {income_id} not found"
        
        # Delete associated value records first
        value_records = db.query(ValueRecord).filter(
            ValueRecord.entity_type == EntityType.INCOME_SOURCE,
            ValueRecord.entity_id == income_id
        ).all()
        
        for record in value_records:
            db.delete(record)
        
        # Now delete the income source
        income_name = income.name
        db.delete(income)
        db.commit()
        
        return f"Income source '{income_name}' deleted successfully"
    except Exception as e:
        db.rollback()
        return f"Error deleting income source: {str(e)}"


def get_income_source_details(income_id: int) -> Tuple:
    """Get details for a specific income source"""
    db = next(get_db_session())
    
    income = db.query(IncomeSource).filter(IncomeSource.id == income_id).first()
    
    if not income:
        return ("", "", 0.0, 1, date.today().strftime("%Y-%m-%d"), "", "", None)
    
    # Get the value record for the annual amount
    scenario = value_service.get_actual_scenario(db)
    value_record = db.query(ValueRecord).filter(
        ValueRecord.entity_type == EntityType.INCOME_SOURCE,
        ValueRecord.entity_id == income.id,
        ValueRecord.scenario_id == scenario.id
    ).order_by(ValueRecord.value_date.desc()).first()
    
    annual_amount = value_record.value_amount if value_record else 0.0
    
    # Format dates for form
    start_date = date(income.start_year, 1, 1)
    end_date = date(income.end_year, 12, 31) if income.end_year else None
    end_date_str = end_date.strftime("%Y-%m-%d") if end_date else ""
    
    # Get notes with a safe default
    notes = income.notes if income.notes is not None else ""
    
    return (
        income.name,
        income.income_type,
        annual_amount,
        income.family_member_id,
        start_date.strftime("%Y-%m-%d"),
        end_date_str,
        notes,
        income.id
    )


def get_income_source_dataframe() -> pd.DataFrame:
    """Convert income source list to DataFrame for display"""
    income_sources = get_income_source_list()
    
    # Format the data for display
    data = []
    for income in income_sources:
        data.append({
            "ID": income.get("id", ""),
            "Name": income.get("name", ""),
            "Type": income.get("income_type", ""),
            "Annual Amount": f"${float(income.get('annual_amount', 0)):,.2f}",
            "Family Member": income.get("family_member_name", ""),
            "Start Date": income.get("start_date", ""),
            "End Date": income.get("end_date", "")
        })
    
    return pd.DataFrame(data)


def get_family_member_choices() -> List[Tuple[int, str]]:
    """Get a list of family members as (id, name) tuples for dropdowns"""
    db = next(get_db_session())
    members = db.query(FamilyMember).all()
    return [(member.id, f"{member.first_name} {member.last_name}") for member in members]


# Income source tab
def income_source_tab():
    with gr.Tab("Income Sources"):
        # Create state management for showing/hiding views
        view_state = gr.State("list")  # Default to list view
        selected_income_id = gr.State(None)

        # List view components
        gr.Markdown("## Income Sources")
        income_table = gr.DataFrame(get_income_source_dataframe(), visible=True)
        
        with gr.Row(visible=True) as list_buttons:
            add_income_button = gr.Button("Add New Income Source", variant="primary")
            refresh_list_button = gr.Button("Refresh List")
            edit_income_button = gr.Button("Edit Selected Income Source")
            delete_income_button = gr.Button("Delete Selected Income Source")
        
        # Selected row display
        selected_row_json = gr.JSON({}, label="Selected Income Source", visible=True)

        # Form view components (initially hidden)
        gr.Markdown("## Income Source Details")
        
        # Income source form inputs
        income_id = gr.Number(visible=False)
        name = gr.Textbox(label="Income Name", visible=False)
        income_type = gr.Dropdown(
            label="Income Type",
            choices=[t.value for t in IncomeType],
            value=IncomeType.SALARY.value,
            visible=False
        )
        annual_amount = gr.Number(label="Annual Amount ($)", value=0.0, visible=False)
        
        # Get family member choices
        family_members = get_family_member_choices()
        family_member_id = gr.Dropdown(
            label="Family Member",
            choices=[{"value": str(id), "label": name} for id, name in family_members],
            value=str(family_members[0][0]) if family_members else None,
            visible=False
        )
        
        start_date = gr.Textbox(
            label="Start Date",
            value=date.today().strftime("%Y-%m-%d"),
            placeholder="YYYY-MM-DD",
            visible=False
        )
        end_date = gr.Textbox(
            label="End Date (leave empty for ongoing)",
            placeholder="YYYY-MM-DD",
            visible=False
        )
        notes = gr.Textbox(label="Notes", lines=3, visible=False)
        
        # Form buttons
        with gr.Row(visible=False) as form_buttons:
            save_button = gr.Button("Save Income Source", variant="primary")
            cancel_button = gr.Button("Cancel")
        
        # Result message
        result_message = gr.Textbox(label="Result", visible=True)
        
        # Preview
        preview = gr.JSON(label="Income Source Details Preview", visible=False)
        
        # Update preview when form fields change
        def update_preview(name, income_type, annual_amount, family_member_id, start_date, 
                          end_date, notes, income_id):
            # Extract member_id if it's a dict
            member_id = family_member_id
            if isinstance(family_member_id, dict) and "value" in family_member_id:
                member_id = family_member_id["value"]
            
            return {
                "id": income_id,
                "name": name,
                "income_type": income_type,
                "annual_amount": annual_amount,
                "family_member_id": member_id,
                "start_date": start_date,
                "end_date": end_date,
                "notes": notes
            }
        
        for field in [name, income_type, annual_amount, family_member_id, start_date, 
                     end_date, notes, income_id]:
            field.change(
                fn=update_preview,
                inputs=[name, income_type, annual_amount, family_member_id, start_date, 
                       end_date, notes, income_id],
                outputs=preview
            )
        
        # Table selection event
        def handle_selection(evt: gr.SelectData, state: Dict):
            row_index = evt.index[0]
            df = get_income_source_dataframe()
            income_id = int(df.iloc[row_index]["ID"])
            row_data = df.iloc[row_index].to_dict()
            return income_id, {"value": row_data}
        
        income_table.select(
            fn=handle_selection,
            inputs=[selected_income_id],
            outputs=[selected_income_id, selected_row_json]
        )
        
        # Switch to form view functions
        def show_form_view(view="new", income_id=None):
            # Refresh family member choices
            family_members = get_family_member_choices()
            family_member_choices = [{"value": str(id), "label": name} for id, name in family_members]
            default_family_member = str(family_members[0][0]) if family_members else None
            
            if view == "new":
                # Clear form for new income source
                return (
                    "form",  # view_state
                    None,    # selected_income_id
                    gr.update(visible=False),  # income_table
                    gr.update(visible=False),  # list_buttons
                    gr.update(visible=False),  # selected_row_json
                    gr.update(visible=True),   # name
                    gr.update(visible=True),   # income_type
                    gr.update(visible=True),   # annual_amount
                    gr.update(visible=True, choices=family_member_choices, value=default_family_member),  # family_member_id
                    gr.update(visible=True),   # start_date
                    gr.update(visible=True),   # end_date
                    gr.update(visible=True),   # notes
                    gr.update(visible=True),   # form_buttons
                    gr.update(visible=True),   # preview
                    "",      # name value
                    IncomeType.SALARY.value,  # income_type value
                    0.0,     # annual_amount value
                    default_family_member,  # family_member_id value
                    date.today().strftime("%Y-%m-%d"),  # start_date value
                    "",      # end_date value
                    "",      # notes value
                    None,    # income_id value
                    ""       # result_message
                )
            else:
                # Load income source details for editing
                name_val, income_type_val, annual_amount_val, family_member_id_val, start_date_val, end_date_val, notes_val, income_id_val = get_income_source_details(income_id)
                return (
                    "form",  # view_state
                    income_id,  # selected_income_id
                    gr.update(visible=False),  # income_table
                    gr.update(visible=False),  # list_buttons
                    gr.update(visible=False),  # selected_row_json
                    gr.update(visible=True),   # name
                    gr.update(visible=True),   # income_type
                    gr.update(visible=True),   # annual_amount
                    gr.update(visible=True, choices=family_member_choices, value=str(family_member_id_val)),  # family_member_id
                    gr.update(visible=True),   # start_date
                    gr.update(visible=True),   # end_date
                    gr.update(visible=True),   # notes
                    gr.update(visible=True),   # form_buttons
                    gr.update(visible=True),   # preview
                    name_val,     # name value
                    income_type_val,  # income_type value
                    annual_amount_val,  # annual_amount value
                    str(family_member_id_val),  # family_member_id value as string
                    start_date_val,  # start_date value
                    end_date_val,  # end_date value
                    notes_val,    # notes value
                    income_id_val,  # income_id value
                    ""        # result_message
                )
        
        # Switch to list view function
        def show_list_view():
            return (
                "list",  # view_state
                gr.update(visible=True),   # income_table
                gr.update(visible=True),   # list_buttons
                gr.update(visible=True),   # selected_row_json
                gr.update(visible=False),  # name
                gr.update(visible=False),  # income_type
                gr.update(visible=False),  # annual_amount
                gr.update(visible=False),  # family_member_id
                gr.update(visible=False),  # start_date
                gr.update(visible=False),  # end_date
                gr.update(visible=False),  # notes
                gr.update(visible=False),  # form_buttons
                gr.update(visible=False),  # preview
                get_income_source_dataframe()  # refresh table data
            )
        
        # Add new income source button
        add_income_button.click(
            fn=show_form_view,
            inputs=[],
            outputs=[
                view_state, 
                selected_income_id,
                income_table,
                list_buttons,
                selected_row_json,
                name,
                income_type,
                annual_amount,
                family_member_id,
                start_date,
                end_date,
                notes,
                form_buttons,
                preview,
                name,
                income_type,
                annual_amount,
                family_member_id,
                start_date,
                end_date,
                notes,
                income_id,
                result_message
            ]
        )
        
        # Edit selected income source button
        def edit_selected_income(income_id):
            if income_id is None:
                return [
                    "list", None,
                    gr.update(visible=True), gr.update(visible=True), gr.update(visible=True),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False),
                    gr.update(), gr.update(), gr.update(), gr.update(), gr.update(),
                    gr.update(), gr.update(),
                    "Please select an income source to edit"
                ]
            return show_form_view("edit", income_id)
        
        edit_income_button.click(
            fn=edit_selected_income,
            inputs=[selected_income_id],
            outputs=[
                view_state,
                selected_income_id,
                income_table,
                list_buttons,
                selected_row_json,
                name,
                income_type,
                annual_amount,
                family_member_id,
                start_date,
                end_date,
                notes,
                form_buttons,
                preview,
                name,
                income_type,
                annual_amount,
                family_member_id,
                start_date,
                end_date,
                notes,
                income_id,
                result_message
            ]
        )
        
        # Delete selected income source button
        def delete_selected_income(income_id):
            if income_id is None:
                return "Please select an income source to delete", None, get_income_source_dataframe()
            
            # Perform the delete operation
            result = delete_income_source(income_id)
            
            # Return message, clear selected ID, and update table
            return result, None, get_income_source_dataframe()
        
        delete_income_button.click(
            fn=delete_selected_income,
            inputs=[selected_income_id],
            outputs=[result_message, selected_income_id, income_table]
        )
        
        # Refresh list button
        refresh_list_button.click(
            fn=get_income_source_dataframe,
            inputs=[],
            outputs=[income_table]
        )
        
        # Cancel button
        cancel_button.click(
            fn=show_list_view,
            inputs=[],
            outputs=[
                view_state,
                income_table,
                list_buttons,
                selected_row_json,
                name,
                income_type,
                annual_amount,
                family_member_id,
                start_date,
                end_date,
                notes,
                form_buttons,
                preview,
                income_table
            ]
        )
        
        # Save income source button
        def save_income_and_return(
            name, income_type, annual_amount, family_member_id, start_date, end_date, notes, income_id
        ):
            result = create_or_update_income_source(
                name, income_type, annual_amount, family_member_id, start_date, end_date, notes, income_id
            )
            
            # Return to list view with updated data
            updated_table = get_income_source_dataframe()
            
            return [
                "list",  # view_state
                gr.update(visible=True, value=updated_table),   # income_table - explicitly set the updated value
                gr.update(visible=True),   # list_buttons
                gr.update(visible=True),   # selected_row_json
                gr.update(visible=False),  # name
                gr.update(visible=False),  # income_type
                gr.update(visible=False),  # annual_amount
                gr.update(visible=False),  # family_member_id
                gr.update(visible=False),  # start_date
                gr.update(visible=False),  # end_date
                gr.update(visible=False),  # notes
                gr.update(visible=False),  # form_buttons
                gr.update(visible=False),  # preview
                result,                    # result_message
                updated_table              # refresh table data
            ]
        
        save_button.click(
            fn=save_income_and_return,
            inputs=[
                name, income_type, annual_amount, family_member_id, start_date, end_date, notes, income_id
            ],
            outputs=[
                view_state,
                income_table,
                list_buttons,
                selected_row_json,
                name,
                income_type,
                annual_amount,
                family_member_id,
                start_date,
                end_date,
                notes,
                form_buttons,
                preview,
                result_message,
                income_table
            ]
        )

        # When the selected ID changes, update the JSON display
        def update_selected_json(income_id):
            if income_id is None:
                return {}
            
            # Find the income source with this ID
            income_sources = get_income_source_list()
            for income in income_sources:
                if income.get('id') == income_id:
                    return income
            return {}
        
        selected_income_id.change(
            fn=update_selected_json,
            inputs=[selected_income_id],
            outputs=[selected_row_json]
        )


# Expense functions
def create_or_update_expense(
    name: str,
    expense_type: str,
    annual_amount: float,
    family_member_id,  # Changed to accept any type
    start_date: str,  # Receiving as string in YYYY-MM-DD format
    end_date: str,  # Receiving as string in YYYY-MM-DD format
    notes: str,
    expense_id: Optional[int] = None
) -> str:
    """Create or update an expense"""
    db = next(get_db_session())
    
    try:
        # Convert date strings to date objects
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else None
        
        # Convert dates to years
        start_year = start_date_obj.year
        end_year = end_date_obj.year if end_date_obj else None
        
        # Handle family_member_id which might be a dict from gradio
        member_id = None
        if family_member_id:
            if isinstance(family_member_id, dict) and "value" in family_member_id:
                member_id = int(family_member_id["value"])
            else:
                member_id = int(family_member_id)
        
        # Prepare expense data
        expense_data = {
            "name": name,
            "expense_type": expense_type,
            "start_year": start_year,
            "end_year": end_year,
            "family_member_id": member_id,
            "notes": notes,
            "expected_growth_rate": 0.0,  # Default to 0% growth
            "is_tax_deductible": False,  # Default to not tax deductible
            "user_id": 1  # Demo user
        }
        
        if expense_id:
            expense = db.query(Expense).filter(Expense.id == expense_id).first()
            if not expense:
                return f"Error: Expense with ID {expense_id} not found"
            
            # Update existing expense
            for key, value in expense_data.items():
                setattr(expense, key, value)
        else:
            # Create new expense
            expense = Expense(**expense_data)
            db.add(expense)
        
        db.commit()
        db.refresh(expense)
        
        # Add or update the value record for this expense if amount provided
        if annual_amount > 0:
            # Get actual scenario
            scenario = value_service.get_actual_scenario(db)
            
            # Create value record with the annual amount
            value_service.create_or_update_value_record(
                db=db,
                entity_type=EntityType.EXPENSE,
                entity_id=expense.id,
                scenario_id=scenario.id,
                value_date=start_date_obj,
                value_amount=annual_amount
            )
        
        return f"Expense {expense.name} saved successfully with annual amount ${annual_amount:,.2f}"
    except Exception as e:
        db.rollback()
        return f"Error: {str(e)}"


def get_expense_list() -> List[Dict[str, Any]]:
    """Get a list of all expenses"""
    db = next(get_db_session())
    expenses = db.query(Expense).all()
    
    result = []
    for expense in expenses:
        # Get family member name
        family_member = db.query(FamilyMember).filter(FamilyMember.id == expense.family_member_id).first() if expense.family_member_id else None
        family_member_name = f"{family_member.first_name} {family_member.last_name}" if family_member else "Household"
        
        # Get the current value (amount) from value records
        scenario = value_service.get_actual_scenario(db)
        value_record = db.query(ValueRecord).filter(
            ValueRecord.entity_type == EntityType.EXPENSE,
            ValueRecord.entity_id == expense.id,
            ValueRecord.scenario_id == scenario.id
        ).order_by(ValueRecord.value_date.desc()).first()
        
        annual_amount = value_record.value_amount if value_record else 0.0
        
        # Format dates for display
        start_date = date(expense.start_year, 1, 1)
        end_date = date(expense.end_year, 12, 31) if expense.end_year else None
        end_date_str = end_date.strftime("%Y-%m-%d") if end_date else "Ongoing"
        
        result.append({
            "id": expense.id,
            "name": expense.name,
            "expense_type": expense.expense_type,
            "annual_amount": annual_amount,
            "family_member_id": expense.family_member_id,
            "family_member_name": family_member_name,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date_str,
            "notes": expense.notes if expense.notes is not None else ""
        })
    
    return result


def get_expense_details(expense_id: int) -> Tuple:
    """Get details for a specific expense"""
    db = next(get_db_session())
    
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    
    if not expense:
        return ("", "", 0.0, 1, date.today().strftime("%Y-%m-%d"), "", "", None)
    
    # Get the value record for the annual amount
    scenario = value_service.get_actual_scenario(db)
    value_record = db.query(ValueRecord).filter(
        ValueRecord.entity_type == EntityType.EXPENSE,
        ValueRecord.entity_id == expense.id,
        ValueRecord.scenario_id == scenario.id
    ).order_by(ValueRecord.value_date.desc()).first()
    
    annual_amount = value_record.value_amount if value_record else 0.0
    
    # Format dates for form
    start_date = date(expense.start_year, 1, 1)
    end_date = date(expense.end_year, 12, 31) if expense.end_year else None
    end_date_str = end_date.strftime("%Y-%m-%d") if end_date else ""
    
    # Get notes with a safe default
    notes = expense.notes if expense.notes is not None else ""
    
    return (
        expense.name,
        expense.expense_type,
        annual_amount,
        expense.family_member_id or 1,  # Default to first family member if None
        start_date.strftime("%Y-%m-%d"),
        end_date_str,
        notes,
        expense.id
    )


def get_expense_dataframe() -> pd.DataFrame:
    """Convert expense list to DataFrame for display"""
    expenses = get_expense_list()
    
    # Format the data for display
    data = []
    for expense in expenses:
        data.append({
            "ID": expense.get("id", ""),
            "Name": expense.get("name", ""),
            "Type": expense.get("expense_type", ""),
            "Annual Amount": f"${float(expense.get('annual_amount', 0)):,.2f}",
            "Family Member": expense.get("family_member_name", ""),
            "Start Date": expense.get("start_date", ""),
            "End Date": expense.get("end_date", "")
        })
    
    return pd.DataFrame(data)


# Expense tab
def expense_tab():
    with gr.Tab("Expenses"):
        # Create state management for showing/hiding views
        view_state = gr.State("list")  # Default to list view
        selected_expense_id = gr.State(None)

        # List view components
        gr.Markdown("## Expenses")
        expense_table = gr.DataFrame(get_expense_dataframe(), visible=True)
        
        with gr.Row(visible=True) as list_buttons:
            add_expense_button = gr.Button("Add New Expense", variant="primary")
            refresh_list_button = gr.Button("Refresh List")
            edit_expense_button = gr.Button("Edit Selected Expense")
            delete_expense_button = gr.Button("Delete Selected Expense")
        
        # Selected row display
        selected_row_json = gr.JSON({}, label="Selected Expense", visible=True)

        # Form view components (initially hidden)
        gr.Markdown("## Expense Details")
        
        # Expense form inputs
        expense_id = gr.Number(visible=False)
        name = gr.Textbox(label="Expense Name", visible=False)
        expense_type = gr.Dropdown(
            label="Expense Type",
            choices=[t.value for t in ExpenseType],
            value=ExpenseType.HOUSING.value,
            visible=False
        )
        annual_amount = gr.Number(label="Annual Amount ($)", value=0.0, visible=False)
        
        # Get family member choices
        family_members = get_family_member_choices()
        family_member_id = gr.Dropdown(
            label="Family Member",
            choices=[{"value": str(id), "label": name} for id, name in family_members],
            value=str(family_members[0][0]) if family_members else None,
            visible=False
        )
        
        start_date = gr.Textbox(
            label="Start Date",
            value=date.today().strftime("%Y-%m-%d"),
            placeholder="YYYY-MM-DD",
            visible=False
        )
        end_date = gr.Textbox(
            label="End Date (leave empty for ongoing)",
            placeholder="YYYY-MM-DD",
            visible=False
        )
        notes = gr.Textbox(label="Notes", lines=3, visible=False)
        
        # Form buttons
        with gr.Row(visible=False) as form_buttons:
            save_button = gr.Button("Save Expense", variant="primary")
            cancel_button = gr.Button("Cancel")
        
        # Result message
        result_message = gr.Textbox(label="Result", visible=True)
        
        # Preview
        preview = gr.JSON(label="Expense Details Preview", visible=False)
        
        # Update preview when form fields change
        def update_preview(name, expense_type, annual_amount, family_member_id, start_date, 
                          end_date, notes, expense_id):
            # Extract member_id if it's a dict
            member_id = family_member_id
            if isinstance(family_member_id, dict) and "value" in family_member_id:
                member_id = family_member_id["value"]
                
            return {
                "id": expense_id,
                "name": name,
                "expense_type": expense_type,
                "annual_amount": annual_amount,
                "family_member_id": member_id,
                "start_date": start_date,
                "end_date": end_date,
                "notes": notes
            }
        
        for field in [name, expense_type, annual_amount, family_member_id, start_date, 
                     end_date, notes, expense_id]:
            field.change(
                fn=update_preview,
                inputs=[name, expense_type, annual_amount, family_member_id, start_date, 
                       end_date, notes, expense_id],
                outputs=preview
            )
        
        # Table selection event
        def handle_selection(evt: gr.SelectData, state: Dict):
            row_index = evt.index[0]
            df = get_expense_dataframe()
            expense_id = int(df.iloc[row_index]["ID"])
            row_data = df.iloc[row_index].to_dict()
            return expense_id, {"value": row_data}
        
        expense_table.select(
            fn=handle_selection,
            inputs=[selected_expense_id],
            outputs=[selected_expense_id, selected_row_json]
        )
        
        # Switch to form view functions
        def show_form_view(view="new", expense_id=None):
            # Refresh family member choices
            family_members = get_family_member_choices()
            family_member_choices = [{"value": str(id), "label": name} for id, name in family_members]
            default_family_member = str(family_members[0][0]) if family_members else None
            
            if view == "new":
                # Clear form for new expense
                return (
                    "form",  # view_state
                    None,    # selected_expense_id
                    gr.update(visible=False),  # expense_table
                    gr.update(visible=False),  # list_buttons
                    gr.update(visible=False),  # selected_row_json
                    gr.update(visible=True),   # name
                    gr.update(visible=True),   # expense_type
                    gr.update(visible=True),   # annual_amount
                    gr.update(visible=True, choices=family_member_choices, value=default_family_member),  # family_member_id
                    gr.update(visible=True),   # start_date
                    gr.update(visible=True),   # end_date
                    gr.update(visible=True),   # notes
                    gr.update(visible=True),   # form_buttons
                    gr.update(visible=True),   # preview
                    "",      # name value
                    ExpenseType.HOUSING.value,  # expense_type value
                    0.0,     # annual_amount value
                    default_family_member,  # family_member_id value
                    date.today().strftime("%Y-%m-%d"),  # start_date value
                    "",      # end_date value
                    "",      # notes value
                    None,    # expense_id value
                    ""       # result_message
                )
            else:
                # Load expense details for editing
                name_val, expense_type_val, annual_amount_val, family_member_id_val, start_date_val, end_date_val, notes_val, expense_id_val = get_expense_details(expense_id)
                return (
                    "form",  # view_state
                    expense_id,  # selected_expense_id
                    gr.update(visible=False),  # expense_table
                    gr.update(visible=False),  # list_buttons
                    gr.update(visible=False),  # selected_row_json
                    gr.update(visible=True),   # name
                    gr.update(visible=True),   # expense_type
                    gr.update(visible=True),   # annual_amount
                    gr.update(visible=True, choices=family_member_choices, value=str(family_member_id_val)),  # family_member_id
                    gr.update(visible=True),   # start_date
                    gr.update(visible=True),   # end_date
                    gr.update(visible=True),   # notes
                    gr.update(visible=True),   # form_buttons
                    gr.update(visible=True),   # preview
                    name_val,     # name value
                    expense_type_val,  # expense_type value
                    annual_amount_val,  # annual_amount value
                    str(family_member_id_val),  # family_member_id value as string
                    start_date_val,  # start_date value
                    end_date_val,  # end_date value
                    notes_val,    # notes value
                    expense_id_val,  # expense_id value
                    ""        # result_message
                )
        
        # Switch to list view function
        def show_list_view():
            return (
                "list",  # view_state
                gr.update(visible=True),   # expense_table
                gr.update(visible=True),   # list_buttons
                gr.update(visible=True),   # selected_row_json
                gr.update(visible=False),  # name
                gr.update(visible=False),  # expense_type
                gr.update(visible=False),  # annual_amount
                gr.update(visible=False),  # family_member_id
                gr.update(visible=False),  # start_date
                gr.update(visible=False),  # end_date
                gr.update(visible=False),  # notes
                gr.update(visible=False),  # form_buttons
                gr.update(visible=False),  # preview
                get_expense_dataframe()  # refresh table data
            )
        
        # Add new expense button
        add_expense_button.click(
            fn=show_form_view,
            inputs=[],
            outputs=[
                view_state, 
                selected_expense_id,
                expense_table,
                list_buttons,
                selected_row_json,
                name,
                expense_type,
                annual_amount,
                family_member_id,
                start_date,
                end_date,
                notes,
                form_buttons,
                preview,
                name,
                expense_type,
                annual_amount,
                family_member_id,
                start_date,
                end_date,
                notes,
                expense_id,
                result_message
            ]
        )
        
        # Edit selected expense button
        def edit_selected_expense(expense_id):
            if expense_id is None:
                return [
                    "list", None,
                    gr.update(visible=True), gr.update(visible=True), gr.update(visible=True),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),
                    gr.update(visible=False),
                    gr.update(), gr.update(), gr.update(), gr.update(), gr.update(),
                    gr.update(), gr.update(),
                    "Please select an expense to edit"
                ]
            return show_form_view("edit", expense_id)
        
        edit_expense_button.click(
            fn=edit_selected_expense,
            inputs=[selected_expense_id],
            outputs=[
                view_state,
                selected_expense_id,
                expense_table,
                list_buttons,
                selected_row_json,
                name,
                expense_type,
                annual_amount,
                family_member_id,
                start_date,
                end_date,
                notes,
                form_buttons,
                preview,
                name,
                expense_type,
                annual_amount,
                family_member_id,
                start_date,
                end_date,
                notes,
                expense_id,
                result_message
            ]
        )
        
        # Delete selected expense button
        def delete_selected_expense(expense_id):
            if expense_id is None:
                return "Please select an expense to delete", None, get_expense_dataframe()
            
            # Perform the delete operation
            result = delete_expense(expense_id)
            
            # Return message, clear selected ID, and update table
            return result, None, get_expense_dataframe()
        
        delete_expense_button.click(
            fn=delete_selected_expense,
            inputs=[selected_expense_id],
            outputs=[result_message, selected_expense_id, expense_table]
        )
        
        # Refresh list button
        refresh_list_button.click(
            fn=get_expense_dataframe,
            inputs=[],
            outputs=[expense_table]
        )
        
        # Cancel button
        cancel_button.click(
            fn=show_list_view,
            inputs=[],
            outputs=[
                view_state,
                expense_table,
                list_buttons,
                selected_row_json,
                name,
                expense_type,
                annual_amount,
                family_member_id,
                start_date,
                end_date,
                notes,
                form_buttons,
                preview,
                expense_table
            ]
        )
        
        # Save expense button
        def save_expense_and_return(
            name, expense_type, annual_amount, family_member_id, start_date, end_date, notes, expense_id
        ):
            result = create_or_update_expense(
                name, expense_type, annual_amount, family_member_id, start_date, end_date, notes, expense_id
            )
            
            # Return to list view with updated data
            updated_table = get_expense_dataframe()
            
            return [
                "list",  # view_state
                gr.update(visible=True, value=updated_table),   # expense_table - explicitly set the updated value
                gr.update(visible=True),   # list_buttons
                gr.update(visible=True),   # selected_row_json
                gr.update(visible=False),  # name
                gr.update(visible=False),  # expense_type
                gr.update(visible=False),  # annual_amount
                gr.update(visible=False),  # family_member_id
                gr.update(visible=False),  # start_date
                gr.update(visible=False),  # end_date
                gr.update(visible=False),  # notes
                gr.update(visible=False),  # form_buttons
                gr.update(visible=False),  # preview
                result,                    # result_message
                updated_table              # refresh table data
            ]
        
        save_button.click(
            fn=save_expense_and_return,
            inputs=[
                name, expense_type, annual_amount, family_member_id, start_date, end_date, notes, expense_id
            ],
            outputs=[
                view_state,
                expense_table,
                list_buttons,
                selected_row_json,
                name,
                expense_type,
                annual_amount,
                family_member_id,
                start_date,
                end_date,
                notes,
                form_buttons,
                preview,
                result_message,
                expense_table
            ]
        )

        # When the selected ID changes, update the JSON display
        def update_selected_json(expense_id):
            if expense_id is None:
                return {}
            
            # Find the expense with this ID
            expenses = get_expense_list()
            for expense in expenses:
                if expense.get('id') == expense_id:
                    return expense
            return {}
        
        selected_expense_id.change(
            fn=update_selected_json,
            inputs=[selected_expense_id],
            outputs=[selected_row_json]
        )


# Projections functions
def generate_net_worth_projections(
    start_year: int, 
    end_year: int, 
    inflation_rate: float, 
    province: str
) -> pd.DataFrame:
    """Generate net worth projections from start_year to end_year"""
    db = next(get_db_session())
    user = ensure_demo_user(db)
    
    # Create projection parameters
    params = ProjectionParameters(
        start_year=start_year,
        end_year=end_year,
        inflation_rate=inflation_rate/100.0,  # Convert from percentage to decimal
        province=province
    )
    
    # Get required data for projections
    family_members = db.query(FamilyMember).filter(FamilyMember.user_id == user.id).all()
    investment_accounts_db = db.query(InvestmentAccount).filter(InvestmentAccount.user_id == user.id).all()
    assets_db = db.query(Asset).filter(Asset.user_id == user.id).all()
    
    # Fetch value records and prepare data
    investment_accounts = []
    for account in investment_accounts_db:
        account_dict = value_service.get_entity_with_actual_value(
            db=db,
            entity_type=EntityType.INVESTMENT_ACCOUNT,
            entity_id=account.id
        )
        
        # Create account copy with actual value
        account_copy = InvestmentAccount(
            id=account.id,
            user_id=account.user_id,
            family_member_id=account.family_member_id,
            name=account.name,
            account_type=account.account_type,
            institution=account.institution,
            notes=account.notes,
        )
        
        # Add actual value attribute using setattr
        actual_value = account_dict.get('actual_value', 0.0) if account_dict else 0.0
        setattr(account_copy, 'actual_value', actual_value)
        setattr(account_copy, 'expected_return_rate', 0.05)  # Default 5% return rate
        setattr(account_copy, 'is_taxable', True)
        setattr(account_copy, 'contribution_room', 0.0)
        
        investment_accounts.append(account_copy)
    
    # Prepare assets with their actual values
    assets = []
    for asset in assets_db:
        asset_dict = value_service.get_entity_with_actual_value(
            db=db, 
            entity_type=EntityType.ASSET,
            entity_id=asset.id
        )
        
        # Create asset copy with actual value
        asset_copy = Asset(
            id=asset.id,
            user_id=asset.user_id,
            name=asset.name,
            asset_type=asset.asset_type,
            expected_annual_appreciation=asset.expected_annual_appreciation,
            is_primary_residence=asset.is_primary_residence,
            notes=asset.notes
        )
        
        # Add actual value attribute using setattr
        actual_value = asset_dict.get('actual_value', 0.0) if asset_dict else 0.0
        setattr(asset_copy, 'actual_value', actual_value)
        
        assets.append(asset_copy)
    
    # Track projected account values by year
    projected_accounts = {}
    
    # Get current year for baseline
    current_year = date.today().year
    
    # Generate year-by-year projections
    yearly_projections = {}
    
    for year in range(start_year, end_year + 1):
        # Initialize tracking for this year
        if year not in projected_accounts:
            projected_accounts[year] = {}
            
        # RRSP to RRIF conversions that should happen in this year
        for account in investment_accounts:
            member = next((m for m in family_members if m.id == account.family_member_id), None)
            if not member:
                continue
                
            # Check if this account should convert from RRSP to RRIF
            if calculate_rrsp_to_rrif_conversion(account, member, year):
                # Convert the account for projections - note this doesn't affect the database
                account.account_type = AccountType.RRIF
        
        # Calculate projected account values for this year
        for account in investment_accounts:
            # Skip projections for deceased account holders
            member = next((m for m in family_members if m.id == account.family_member_id), None)
            if not member or not is_alive(member, year):
                projected_accounts[year][account.id] = 0
                continue
                
            # Calculate growth for this account
            projected_accounts[year][account.id] = calculate_account_growth(
                account, 
                year, 
                projected_accounts
            )
        
        # Calculate net worth for this year
        net_worth = calculate_net_worth(
            family_members,
            investment_accounts,
            assets,
            year,
            current_year,
            projected_accounts
        )
        
        # Breakdown by category
        rrsp_total = sum(
            projected_accounts[year].get(a.id, getattr(a, 'actual_value', 0.0))
            for a in investment_accounts 
            if a.account_type == AccountType.RRSP
        )
        
        tfsa_total = sum(
            projected_accounts[year].get(a.id, getattr(a, 'actual_value', 0.0))
            for a in investment_accounts 
            if a.account_type == AccountType.TFSA
        )
        
        non_registered_total = sum(
            projected_accounts[year].get(a.id, getattr(a, 'actual_value', 0.0))
            for a in investment_accounts 
            if a.account_type == AccountType.NON_REGISTERED
        )
        
        rrif_total = sum(
            projected_accounts[year].get(a.id, getattr(a, 'actual_value', 0.0))
            for a in investment_accounts 
            if a.account_type == AccountType.RRIF
        )
        
        other_investments_total = sum(
            projected_accounts[year].get(a.id, getattr(a, 'actual_value', 0.0))
            for a in investment_accounts 
            if a.account_type not in [AccountType.RRSP, AccountType.TFSA, AccountType.NON_REGISTERED, AccountType.RRIF]
        )
        
        # Sum up assets by type
        property_total = sum(
            calculate_asset_growth(a, year, current_year)
            for a in assets
            if a.asset_type in [AssetType.PRIMARY_RESIDENCE, AssetType.SECONDARY_PROPERTY]
        )
        
        business_total = sum(
            calculate_asset_growth(a, year, current_year)
            for a in assets
            if a.asset_type == AssetType.BUSINESS
        )
        
        other_assets_total = sum(
            calculate_asset_growth(a, year, current_year)
            for a in assets
            if a.asset_type not in [AssetType.PRIMARY_RESIDENCE, AssetType.SECONDARY_PROPERTY, AssetType.BUSINESS]
        )
        
        yearly_projections[str(year)] = {
            "total_net_worth": net_worth,
            "rrsp_total": rrsp_total,
            "tfsa_total": tfsa_total,
            "non_registered_total": non_registered_total,
            "rrif_total": rrif_total,
            "other_investments_total": other_investments_total,
            "property_total": property_total,
            "business_total": business_total,
            "other_assets_total": other_assets_total
        }
    
    # Convert to DataFrame for display
    data = []
    for year, projection in yearly_projections.items():
        data.append({
            "Year": year,
            "Net Worth": f"${projection['total_net_worth']:,.2f}",
            "RRSP": f"${projection['rrsp_total']:,.2f}",
            "TFSA": f"${projection['tfsa_total']:,.2f}",
            "Non-Registered": f"${projection['non_registered_total']:,.2f}",
            "RRIF": f"${projection['rrif_total']:,.2f}",
            "Property": f"${projection['property_total']:,.2f}",
            "Business": f"${projection['business_total']:,.2f}",
            "Other Assets": f"${projection['other_assets_total']:,.2f}"
        })
    
    return pd.DataFrame(data)


def generate_cash_flow_projections(
    start_year: int, 
    end_year: int, 
    inflation_rate: float, 
    province: str
) -> pd.DataFrame:
    """Generate cash flow projections from start_year to end_year"""
    db = next(get_db_session())
    user = ensure_demo_user(db)
    
    # Create projection parameters
    params = ProjectionParameters(
        start_year=start_year,
        end_year=end_year,
        inflation_rate=inflation_rate/100.0,  # Convert from percentage to decimal
        province=province
    )
    
    # Get required data for projections
    family_members = db.query(FamilyMember).filter(FamilyMember.user_id == user.id).all()
    investment_accounts_db = db.query(InvestmentAccount).filter(InvestmentAccount.user_id == user.id).all()
    income_sources_db = db.query(IncomeSource).filter(IncomeSource.user_id == user.id).all()
    expenses_db = db.query(Expense).filter(Expense.user_id == user.id).all()
    insurance_policies = db.query(InsurancePolicy).filter(InsurancePolicy.user_id == user.id).all() if 'InsurancePolicy' in globals() else []
    
    # Fetch value records and prepare investment accounts
    investment_accounts = []
    for account in investment_accounts_db:
        account_dict = value_service.get_entity_with_actual_value(
            db=db,
            entity_type=EntityType.INVESTMENT_ACCOUNT,
            entity_id=account.id
        )
        
        # Create account copy with actual value
        account_copy = InvestmentAccount(
            id=account.id,
            user_id=account.user_id,
            family_member_id=account.family_member_id,
            name=account.name,
            account_type=account.account_type,
            institution=account.institution,
            notes=account.notes,
        )
        
        # Add actual value attribute using setattr
        actual_value = account_dict.get('actual_value', 0.0) if account_dict else 0.0
        setattr(account_copy, 'actual_value', actual_value)
        setattr(account_copy, 'expected_return_rate', 0.05)  # Default 5% return rate
        
        investment_accounts.append(account_copy)
    
    # Fetch value records and prepare income sources
    income_sources = []
    for income in income_sources_db:
        # Get the value record for the income source
        scenario = value_service.get_actual_scenario(db)
        value_record = db.query(ValueRecord).filter(
            ValueRecord.entity_type == EntityType.INCOME_SOURCE,
            ValueRecord.entity_id == income.id,
            ValueRecord.scenario_id == scenario.id
        ).order_by(ValueRecord.value_date.desc()).first()
        
        income_copy = IncomeSource(
            id=income.id,
            user_id=income.user_id,
            name=income.name,
            income_type=income.income_type,
            start_year=income.start_year,
            end_year=income.end_year,
            family_member_id=income.family_member_id,
            notes=income.notes,
            expected_growth_rate=income.expected_growth_rate if hasattr(income, 'expected_growth_rate') else 0.0,
            is_taxable=income.is_taxable if hasattr(income, 'is_taxable') else True
        )
        
        # Add actual value
        actual_value = value_record.value_amount if value_record else 0.0
        setattr(income_copy, 'actual_value', actual_value)
        
        income_sources.append(income_copy)
    
    # Fetch value records and prepare expenses
    expenses = []
    for expense in expenses_db:
        # Get the value record for the expense
        scenario = value_service.get_actual_scenario(db)
        value_record = db.query(ValueRecord).filter(
            ValueRecord.entity_type == EntityType.EXPENSE,
            ValueRecord.entity_id == expense.id,
            ValueRecord.scenario_id == scenario.id
        ).order_by(ValueRecord.value_date.desc()).first()
        
        expense_copy = Expense(
            id=expense.id,
            user_id=expense.user_id,
            name=expense.name,
            expense_type=expense.expense_type,
            start_year=expense.start_year,
            end_year=expense.end_year,
            family_member_id=expense.family_member_id,
            notes=expense.notes,
            expected_growth_rate=expense.expected_growth_rate if hasattr(expense, 'expected_growth_rate') else 0.0,
            is_tax_deductible=expense.is_tax_deductible if hasattr(expense, 'is_tax_deductible') else False
        )
        
        # Add actual value
        actual_value = value_record.value_amount if value_record else 0.0
        setattr(expense_copy, 'actual_value', actual_value)
        
        expenses.append(expense_copy)
    
    # Track projected account values by year
    projected_accounts = {}
    
    # Get current year for baseline
    current_year = date.today().year
    
    # Generate year-by-year projections
    yearly_projections = {}
    
    for year in range(start_year, end_year + 1):
        # Initialize tracking for this year
        if year not in projected_accounts:
            projected_accounts[year] = {}
        
        # RRSP to RRIF conversions that should happen in this year
        for account in investment_accounts:
            member = next((m for m in family_members if m.id == account.family_member_id), None)
            if not member:
                continue
                
            # Check if this account should convert from RRSP to RRIF
            if calculate_rrsp_to_rrif_conversion(account, member, year):
                # Create new RRIF account for projections
                account.account_type = AccountType.RRIF
        
        # Calculate cash flow for this year
        cash_flow = calculate_cash_flow(
            family_members,
            income_sources,
            expenses,
            insurance_policies,
            year,
            current_year
        )
        
        # Calculate withdrawal strategy if income doesn't cover expenses
        withdrawal_strategy = None
        if cash_flow["net_cash_flow"] < 0:
            withdrawal_strategy = calculate_withdrawal_strategy(
                family_members,
                investment_accounts,
                income_sources,
                expenses,
                year,
                current_year,
                projected_accounts
            )
            
            # Update projected account values after withdrawals
            for account_id, remaining in withdrawal_strategy["remaining_balance"].items():
                projected_accounts[year][account_id] = remaining
        else:
            # No withdrawals needed, update account values with growth only
            for account in investment_accounts:
                # Skip projections for deceased account holders
                member = next((m for m in family_members if m.id == account.family_member_id), None)
                if not member or not is_alive(member, year):
                    projected_accounts[year][account.id] = 0
                    continue
                    
                # Calculate growth for this account
                projected_accounts[year][account.id] = calculate_account_growth(
                    account, 
                    year, 
                    projected_accounts
                )
        
        # Check for deaths in this year and add death benefits
        death_benefits = []
        for member in family_members:
            # If they're alive this year but not next year
            if is_alive(member, year) and not is_alive(member, year + 1):
                # Placeholder for death benefit calculation
                benefit = 0
                death_benefits.append({
                    "family_member_id": member.id,
                    "family_member_name": f"{member.first_name} {member.last_name}",
                    "benefit_amount": benefit
                })
        
        # Store the year's projection
        yearly_projections[str(year)] = {
            "total_income": cash_flow["total_income"],
            "total_expenses": cash_flow["total_expenses"],
            "net_cash_flow": cash_flow["net_cash_flow"],
            "withdrawal_strategy": withdrawal_strategy,
            "death_benefits": death_benefits
        }
    
    # Convert to DataFrame for display
    data = []
    for year, projection in yearly_projections.items():
        withdrawal_amount = 0
        if projection['withdrawal_strategy'] and 'withdrawals' in projection['withdrawal_strategy']:
            withdrawal_amount = sum(projection['withdrawal_strategy']['withdrawals'].values())
        
        data.append({
            "Year": year,
            "Income": f"${projection['total_income']:,.2f}",
            "Expenses": f"${projection['total_expenses']:,.2f}",
            "Net Cash Flow": f"${projection['net_cash_flow']:,.2f}",
            "Withdrawal Amount": f"${withdrawal_amount:,.2f}" if withdrawal_amount > 0 else "$0.00",
            "Cash Flow After Withdrawals": f"${max(0, projection['net_cash_flow']):,.2f}"
        })
    
    return pd.DataFrame(data)


def generate_withdrawal_projections(
    start_year: int, 
    end_year: int, 
    inflation_rate: float, 
    province: str
) -> pd.DataFrame:
    """Generate detailed withdrawal projections from start_year to end_year"""
    db = next(get_db_session())
    user = ensure_demo_user(db)
    
    # Create projection parameters
    params = ProjectionParameters(
        start_year=start_year,
        end_year=end_year,
        inflation_rate=inflation_rate/100.0,  # Convert from percentage to decimal
        province=province
    )
    
    # Get required data for projections
    family_members = db.query(FamilyMember).filter(FamilyMember.user_id == user.id).all()
    investment_accounts_db = db.query(InvestmentAccount).filter(InvestmentAccount.user_id == user.id).all()
    income_sources_db = db.query(IncomeSource).filter(IncomeSource.user_id == user.id).all()
    expenses_db = db.query(Expense).filter(Expense.user_id == user.id).all()
    
    # Fetch value records and prepare investment accounts
    investment_accounts = []
    for account in investment_accounts_db:
        account_dict = value_service.get_entity_with_actual_value(
            db=db,
            entity_type=EntityType.INVESTMENT_ACCOUNT,
            entity_id=account.id
        )
        
        # Create account copy with actual value
        account_copy = InvestmentAccount(
            id=account.id,
            user_id=account.user_id,
            family_member_id=account.family_member_id,
            name=account.name,
            account_type=account.account_type,
            institution=account.institution,
            notes=account.notes,
        )
        
        # Add actual value attribute using setattr
        actual_value = account_dict.get('actual_value', 0.0) if account_dict else 0.0
        setattr(account_copy, 'actual_value', actual_value)
        setattr(account_copy, 'expected_return_rate', 0.05)  # Default 5% return rate
        
        investment_accounts.append(account_copy)
    
    # Fetch value records and prepare income sources
    income_sources = []
    for income in income_sources_db:
        # Get the value record for the income source
        scenario = value_service.get_actual_scenario(db)
        value_record = db.query(ValueRecord).filter(
            ValueRecord.entity_type == EntityType.INCOME_SOURCE,
            ValueRecord.entity_id == income.id,
            ValueRecord.scenario_id == scenario.id
        ).order_by(ValueRecord.value_date.desc()).first()
        
        income_copy = IncomeSource(
            id=income.id,
            user_id=income.user_id,
            name=income.name,
            income_type=income.income_type,
            start_year=income.start_year,
            end_year=income.end_year,
            family_member_id=income.family_member_id,
            notes=income.notes,
            expected_growth_rate=income.expected_growth_rate if hasattr(income, 'expected_growth_rate') else 0.0,
            is_taxable=income.is_taxable if hasattr(income, 'is_taxable') else True
        )
        
        # Add actual value
        actual_value = value_record.value_amount if value_record else 0.0
        setattr(income_copy, 'actual_value', actual_value)
        
        income_sources.append(income_copy)
    
    # Fetch value records and prepare expenses
    expenses = []
    for expense in expenses_db:
        # Get the value record for the expense
        scenario = value_service.get_actual_scenario(db)
        value_record = db.query(ValueRecord).filter(
            ValueRecord.entity_type == EntityType.EXPENSE,
            ValueRecord.entity_id == expense.id,
            ValueRecord.scenario_id == scenario.id
        ).order_by(ValueRecord.value_date.desc()).first()
        
        expense_copy = Expense(
            id=expense.id,
            user_id=expense.user_id,
            name=expense.name,
            expense_type=expense.expense_type,
            start_year=expense.start_year,
            end_year=expense.end_year,
            family_member_id=expense.family_member_id,
            notes=expense.notes,
            expected_growth_rate=expense.expected_growth_rate if hasattr(expense, 'expected_growth_rate') else 0.0,
            is_tax_deductible=expense.is_tax_deductible if hasattr(expense, 'is_tax_deductible') else False
        )
        
        # Add actual value
        actual_value = value_record.value_amount if value_record else 0.0
        setattr(expense_copy, 'actual_value', actual_value)
        
        expenses.append(expense_copy)
    
    # Track projected account values by year
    projected_accounts = {}
    
    # Get current year for baseline
    current_year = date.today().year
    
    # Generate year-by-year projections
    yearly_detailed_withdrawals = []
    
    for year in range(start_year, end_year + 1):
        # Initialize tracking for this year
        if year not in projected_accounts:
            projected_accounts[year] = {}
        
        # Calculate cash flow for this year
        cash_flow = calculate_cash_flow(
            family_members,
            income_sources,
            expenses,
            [],  # No insurance policies for now
            year,
            current_year
        )
        
        # Only proceed with withdrawal strategy if income doesn't cover expenses
        if cash_flow["net_cash_flow"] < 0:
            # Calculate withdrawal strategy
            withdrawal_strategy = calculate_withdrawal_strategy(
                family_members,
                investment_accounts,
                income_sources,
                expenses,
                year,
                current_year,
                projected_accounts
            )
            
            # Update projected account values after withdrawals
            for account_id, remaining in withdrawal_strategy["remaining_balance"].items():
                projected_accounts[year][account_id] = remaining
            
            # Create detailed withdrawal data
            for account in investment_accounts:
                # Skip accounts with no withdrawals
                if account.id not in withdrawal_strategy["withdrawals"] or withdrawal_strategy["withdrawals"][account.id] == 0:
                    continue
                
                # Get family member name
                member = next((m for m in family_members if m.id == account.family_member_id), None)
                member_name = f"{member.first_name} {member.last_name}" if member else "Unknown"
                
                # Add to detailed withdrawals
                yearly_detailed_withdrawals.append({
                    "Year": year,
                    "Account": account.name,
                    "Account Type": account.account_type,
                    "Family Member": member_name,
                    "Starting Value": f"${(withdrawal_strategy['withdrawals'][account.id] + projected_accounts[year][account.id]):,.2f}",
                    "Withdrawal": f"${withdrawal_strategy['withdrawals'][account.id]:,.2f}",
                    "Ending Value": f"${projected_accounts[year][account.id]:,.2f}"
                })
        else:
            # No withdrawals needed, update account values with growth only
            for account in investment_accounts:
                # Skip projections for deceased account holders
                member = next((m for m in family_members if m.id == account.family_member_id), None)
                if not member or not is_alive(member, year):
                    projected_accounts[year][account.id] = 0
                    continue
                    
                # Calculate growth for this account
                projected_accounts[year][account.id] = calculate_account_growth(
                    account, 
                    year, 
                    projected_accounts
                )
    
    # Return empty DataFrame if no withdrawals
    if not yearly_detailed_withdrawals:
        return pd.DataFrame(columns=["Year", "Account", "Account Type", "Family Member", "Starting Value", "Withdrawal", "Ending Value"])
    
    return pd.DataFrame(yearly_detailed_withdrawals)


# Projections tab
def projections_tab():
    with gr.Tab("Projections"):
        # State to track active sub-tab
        active_subtab = gr.State("net-worth")
        
        # Projection parameters form
        gr.Markdown("## Financial Projections")
        gr.Markdown("Set parameters and generate future financial projections")
        
        with gr.Row():
            with gr.Column(scale=2):
                # Parameters form
                start_year = gr.Number(
                    label="Start Year", 
                    value=date.today().year + 1,
                    precision=0,
                    minimum=date.today().year,
                    maximum=date.today().year + 50
                )
                end_year = gr.Number(
                    label="End Year", 
                    value=date.today().year + 10,
                    precision=0,
                    minimum=date.today().year + 1,
                    maximum=date.today().year + 50
                )
                inflation_rate = gr.Slider(
                    label="Inflation Rate (%)", 
                    value=2.0,
                    minimum=0.0,
                    maximum=10.0,
                    step=0.1
                )
                province = gr.Dropdown(
                    label="Province", 
                    choices=["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"],
                    value="ON"
                )
                
                generate_button = gr.Button("Generate Projections", variant="primary")
            
            with gr.Column(scale=1):
                # Info box with tips
                gr.Markdown("""
                ### Projection Tips
                - Start year should be at least the current year
                - End year should be reasonable for your planning horizon
                - Projections use data from your assets, accounts, income, and expenses
                - Add or update your data in the respective tabs for more accurate projections
                """)
        
        # Sub-tabs for different projection types
        with gr.Tabs() as subtabs:
            with gr.TabItem("Net Worth Projections", id="net-worth"):
                net_worth_df = gr.DataFrame(label="Net Worth Projections by Year")
            
            with gr.TabItem("Cash Flow Projections", id="cash-flow"):
                cash_flow_df = gr.DataFrame(label="Cash Flow Projections by Year")
            
            with gr.TabItem("Detailed Withdrawals", id="withdrawals"):
                withdrawals_df = gr.DataFrame(label="Detailed Withdrawal Strategy")
        
        # Function to update the active subtab
        def change_subtab(evt: gr.SelectData):
            return evt.target.id
        
        for tab in subtabs.children:
            tab.select(change_subtab, None, outputs=[active_subtab])
        
        # Status message
        status_message = gr.Textbox(label="Status", value="Set parameters and click 'Generate Projections'")
        
        # Function to generate projections based on parameters
        def generate_projections(start_year, end_year, inflation_rate, province, active_tab):
            if end_year <= start_year:
                return (
                    pd.DataFrame(), 
                    pd.DataFrame(), 
                    pd.DataFrame(),
                    "Error: End year must be greater than start year"
                )
            
            try:
                if active_tab == "net-worth":
                    net_worth_projection = generate_net_worth_projections(
                        start_year, end_year, inflation_rate, province
                    )
                    return (
                        net_worth_projection,
                        generate_cash_flow_projections(start_year, end_year, inflation_rate, province),
                        generate_withdrawal_projections(start_year, end_year, inflation_rate, province),
                        f"Net worth projections generated from {start_year} to {end_year}"
                    )
                elif active_tab == "cash-flow":
                    cash_flow_projection = generate_cash_flow_projections(
                        start_year, end_year, inflation_rate, province
                    )
                    return (
                        generate_net_worth_projections(start_year, end_year, inflation_rate, province),
                        cash_flow_projection,
                        generate_withdrawal_projections(start_year, end_year, inflation_rate, province),
                        f"Cash flow projections generated from {start_year} to {end_year}"
                    )
                elif active_tab == "withdrawals":
                    withdrawal_projection = generate_withdrawal_projections(
                        start_year, end_year, inflation_rate, province
                    )
                    return (
                        generate_net_worth_projections(start_year, end_year, inflation_rate, province),
                        generate_cash_flow_projections(start_year, end_year, inflation_rate, province),
                        withdrawal_projection,
                        f"Withdrawal projections generated from {start_year} to {end_year}"
                    )
                else:
                    return (
                        pd.DataFrame(), 
                        pd.DataFrame(), 
                        pd.DataFrame(),
                        "Error: Unknown projection type"
                    )
            except Exception as e:
                return (
                    pd.DataFrame(), 
                    pd.DataFrame(), 
                    pd.DataFrame(),
                    f"Error generating projections: {str(e)}"
                )
        
        generate_button.click(
            fn=generate_projections,
            inputs=[start_year, end_year, inflation_rate, province, active_subtab],
            outputs=[net_worth_df, cash_flow_df, withdrawals_df, status_message]
        )


# Main app setup
def create_app():
    # Initialize database
    db, user, scenario = setup_db()
    
    app = gr.Blocks(title="WealthSphere Prototype")
    
    with app:
        gr.Markdown("# WealthSphere Financial Planning Prototype")
        gr.Markdown("### This prototype demonstrates the features of the final application")
        
        # Tabs for different entity types
        with gr.Tabs():
            dashboard_tab()
            asset_tab()
            family_member_tab()
            account_tab()
            income_source_tab()
            expense_tab()
            projections_tab()  # Add the projections tab
    
    return app


if __name__ == "__main__":
    app = create_app()
    app.launch() 