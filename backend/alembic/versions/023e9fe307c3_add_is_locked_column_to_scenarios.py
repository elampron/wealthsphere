"""Add is_locked column to scenarios

Revision ID: 023e9fe307c3
Revises: 
Create Date: 2025-03-12 20:25:49.084284

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '023e9fe307c3'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('scenarios', sa.Column('is_locked', sa.Boolean(), nullable=False, server_default='0'))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('scenarios', 'is_locked')
    # ### end Alembic commands ###
