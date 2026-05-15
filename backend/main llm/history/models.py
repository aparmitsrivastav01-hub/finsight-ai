from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from auth.database import Base


class QueryHistory(Base):
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    company_name = Column(String(255), nullable=False, default="Unknown")
    query = Column(Text, nullable=False)
    analysis_type = Column(String(32), nullable=False, default="analysis")
    response_summary = Column(Text, nullable=False, default="")
    document_id = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", backref="history_entries")
