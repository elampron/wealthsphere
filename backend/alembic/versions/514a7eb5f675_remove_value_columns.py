"""remove_value_columns

Revision ID: 514a7eb5f675
Revises: 20231108_create_entity_values_table
Create Date: 2024-03-13

Remove value-related columns from models as they are now stored in entity_values table.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '514a7eb5f675'
down_revision: Union[str, None] = '20231108_create_entity_values_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove current_balance from investment_accounts
    op.drop_column('investment_accounts', 'current_balance')
    
    # Remove current_value from assets
    op.drop_column('assets', 'current_value')


def downgrade() -> None:
    # Add back current_balance to investment_accounts
    op.add_column('investment_accounts',
        sa.Column('current_balance', sa.Float, nullable=False, server_default='0.0')
    )
    
    # Add back current_value to assets
    op.add_column('assets',
        sa.Column('current_value', sa.Float, nullable=False, server_default='0.0')
    )
