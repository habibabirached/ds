from sqlalchemy.orm import Session
from models import db, Inspection

def testDB(db):
    with Session(db) as session:
        inspection = Inspection(
            name="inspection_name",
            part_number="part number"
        )
        session.add_all([inspection])
        session.commit()

