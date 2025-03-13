"""Revision ID: 20231108_create_entity_values_table
Revises: 37f2f1ffbabb
Create Date: 2023-11-08 10:00:00.000000

This migration creates the entity_values table as per the refactoring plan.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20231108_create_entity_values_table'
down_revision = '37f2f1ffbabb'
branch_labels = None
depends_on = None


def upgrade():
    # Create the new entity_values table
    op.create_table(
        'entity_values',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.Integer, nullable=False),
        sa.Column('scenario_id', sa.Integer, nullable=False),
        sa.Column('recorded_at', sa.DateTime, nullable=False),
        sa.Column('value', sa.Float, nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['scenario_id'], ['scenarios.id'], name='fk_entity_values_scenario_id')
    )


def downgrade():
    op.drop_table('entity_values') 