"""update_scenario_created_at_column

Revision ID: 37f2f1ffbabb
Revises: 
Create Date: 2025-03-13 00:46:32.459908

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '37f2f1ffbabb'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create all tables from scratch
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_id', 'users', ['id'], unique=False)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    op.create_table('family_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=False),
        sa.Column('relationship_type', sa.String(), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=True),
        sa.Column('expected_retirement_age', sa.Integer(), nullable=True),
        sa.Column('expected_death_age', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_family_members_id', 'family_members', ['id'], unique=False)

    op.create_table('scenarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('is_locked', sa.Boolean(), server_default=sa.text("'0'"), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_scenarios_id', 'scenarios', ['id'], unique=False)

    op.create_table('investment_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('family_member_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('account_type', sa.String(length=14), nullable=False),
        sa.Column('institution', sa.String(), nullable=True),
        sa.Column('current_balance', sa.Float(), nullable=False),
        sa.Column('expected_return_rate', sa.Float(), nullable=False),
        sa.Column('is_taxable', sa.Boolean(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('contribution_room', sa.Float(), nullable=True),
        sa.Column('expected_conversion_year', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['family_member_id'], ['family_members.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_investment_accounts_id', 'investment_accounts', ['id'], unique=False)

    op.create_table('assets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('asset_type', sa.String(length=18), nullable=False),
        sa.Column('current_value', sa.Float(), nullable=False),
        sa.Column('purchase_value', sa.Float(), nullable=True),
        sa.Column('purchase_date', sa.Date(), nullable=True),
        sa.Column('expected_annual_appreciation', sa.Float(), nullable=False),
        sa.Column('is_primary_residence', sa.Boolean(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_assets_id', 'assets', ['id'], unique=False)

    op.create_table('expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('expense_type', sa.String(length=14), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('start_year', sa.Integer(), nullable=False),
        sa.Column('end_year', sa.Integer(), nullable=True),
        sa.Column('expected_growth_rate', sa.Float(), nullable=False),
        sa.Column('is_tax_deductible', sa.Boolean(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('family_member_id', sa.Integer(), nullable=True),
        sa.Column('category', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['family_member_id'], ['family_members.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_expenses_id', 'expenses', ['id'], unique=False)

    op.create_table('insurance_policies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('family_member_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('policy_number', sa.String(), nullable=True),
        sa.Column('insurance_type', sa.String(length=16), nullable=False),
        sa.Column('provider', sa.String(), nullable=True),
        sa.Column('coverage_amount', sa.Float(), nullable=False),
        sa.Column('premium_amount', sa.Float(), nullable=False),
        sa.Column('premium_payment_frequency', sa.String(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('is_term', sa.Boolean(), nullable=True),
        sa.Column('is_taxable_benefit', sa.Boolean(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['family_member_id'], ['family_members.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_insurance_policies_id', 'insurance_policies', ['id'], unique=False)

    op.create_table('income_sources',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('family_member_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('income_type', sa.String(length=15), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('is_taxable', sa.Boolean(), nullable=True),
        sa.Column('start_year', sa.Integer(), nullable=False),
        sa.Column('end_year', sa.Integer(), nullable=True),
        sa.Column('expected_growth_rate', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['family_member_id'], ['family_members.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_income_sources_id', 'income_sources', ['id'], unique=False)


def downgrade() -> None:
    # Drop all tables in reverse order
    op.drop_index('ix_income_sources_id', table_name='income_sources')
    op.drop_table('income_sources')
    op.drop_index('ix_insurance_policies_id', table_name='insurance_policies')
    op.drop_table('insurance_policies')
    op.drop_index('ix_expenses_id', table_name='expenses')
    op.drop_table('expenses')
    op.drop_index('ix_assets_id', table_name='assets')
    op.drop_table('assets')
    op.drop_index('ix_investment_accounts_id', table_name='investment_accounts')
    op.drop_table('investment_accounts')
    op.drop_index('ix_scenarios_id', table_name='scenarios')
    op.drop_table('scenarios')
    op.drop_index('ix_family_members_id', table_name='family_members')
    op.drop_table('family_members')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_id', table_name='users')
    op.drop_table('users')
