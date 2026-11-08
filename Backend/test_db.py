from sqlalchemy import text
from app.db.database import engine


try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT DATABASE()"))
        print("Database connected:", result.scalar())
except Exception as error:
    print("Database connection failed:", error)
    