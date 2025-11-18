# Import the Base from your database setup
import os
from database import Base 
# OR: from .database import Base  (depending on your path)

# Target metadata setup
target_metadata = Base.metadata

from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    # 1. Get the base configuration from alembic.ini
    config_section = config.get_section(config.config_ini_section, {})

    # 2. Get the database URL from the environment variable
    #    Note: This is the URL you defined as "postgresql://user:pass@db:5432/..."
    alembic_url = os.getenv("DATABASE_URL")
    
    # 3. Explicitly inject the URL into the configuration dictionary
    #    This satisfies the requirement of engine_from_config
    if alembic_url:
        config_section['sqlalchemy.url'] = alembic_url
    else:
        # Optional: Handle case where DATABASE_URL is missing
        raise ValueError("DATABASE_URL environment variable is not set.")

    # Now, pass the modified configuration to create the connectable engine
    connectable = engine_from_config(
        config_section, # Pass the config dictionary including 'sqlalchemy.url'
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
