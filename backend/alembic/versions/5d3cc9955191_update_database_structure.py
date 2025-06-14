"""update_database_structure

Revision ID: 5d3cc9955191
Revises: 
Create Date: 2025-06-14 08:53:49.353474

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5d3cc9955191'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index('ix_conductores_id', table_name='conductores')
    op.drop_index('ix_conductores_licencia', table_name='conductores')
    op.drop_index('ix_conductores_nombre', table_name='conductores')
    op.drop_table('conductores')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('conductores',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('nombre', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('licencia', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('telefono', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id', name='conductores_pkey')
    )
    op.create_index('ix_conductores_nombre', 'conductores', ['nombre'], unique=False)
    op.create_index('ix_conductores_licencia', 'conductores', ['licencia'], unique=True)
    op.create_index('ix_conductores_id', 'conductores', ['id'], unique=False)
    # ### end Alembic commands ###
