"""merge_entity_values_and_scenarios

Revision ID: 6302d508ce4e
Revises: 20231108_create_entity_values_table, 514a7eb5f675
Create Date: 2025-03-12 23:51:39.260735

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6302d508ce4e'
down_revision: Union[str, None] = ('20231108_create_entity_values_table', '514a7eb5f675')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
