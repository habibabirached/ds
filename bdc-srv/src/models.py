

from sqlalchemy.inspection import inspect
from sqlalchemy import Column
from sqlalchemy import Computed
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import Float
from sqlalchemy import String
from sqlalchemy import Boolean
from sqlalchemy import LargeBinary
from sqlalchemy import Date
from sqlalchemy import DateTime
from sqlalchemy.schema import Index
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from sqlalchemy import create_engine
from sqlalchemy_utils import database_exists, create_database
import logging
import os
import json
from flask import jsonify

import flask.json

from dataclasses import dataclass  # enables serialization as json

Base = declarative_base()

# =============================== Json Serialization ====================================


class Serializer(object):

    def serialize(self):
        return {c: getattr(self, c) for c in inspect(self).attrs.keys()}

    @staticmethod
    def serialize_list(l):
        return [m.serialize() for m in l]
    
    @staticmethod
    def toJsonList(list):
        return jsonify([m.serialize() for m in list])

# ====================================== DB Tables ==================================


@dataclass
class Inspection(Base, Serializer):
    __tablename__ = "inspection"

    id = Column(Integer, primary_key=True)
    esn = Column(String, nullable=True, default="")
    customer_name = Column(String, nullable=True, default="")
    location = Column(String, nullable=True, default="")
    date = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    app_type = Column(String, nullable=True, default="")
    engine_type = Column(String, nullable=True, default="")
    sso = Column(String, nullable=True, default="")
    sect = Column(String, nullable=True, default="")
    disp = Column(String, nullable=True, default="")
    misc = Column(String, nullable=True, default="")
    status = Column(String, default='Incomplete') # annotation status
    annotation_status_comments = Column(String, nullable=True, default="") # partial annotation status comments

    blade_type = Column(String, nullable=True, default="")
    manufacture_date = Column(DateTime(timezone=True), nullable=True)
    factory_name = Column(String, nullable=True, default="")
    inspector_name = Column(String, nullable=True, default="")
    manufacture_stage = Column(String, nullable=True, default="")
    certification_status = Column(String, nullable=True, default="")

    post_molding_date = Column(Date, nullable=True, default=None)
    d3_date = Column(DateTime(timezone=True), nullable=True, default=None)
    upload_date = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    certificate_id = Column(Integer, ForeignKey( "certificate.id"), nullable=True)
    supplier = Column(String, nullable=True, default="")
    priority = Column(String, nullable=True, default="NONE")


    finding_list = []

    def set_finding_list(self, list):
        self.finding_list = list

    __table_args__ = (
        Index("Inspection_date_idx", "date"),
    )

    @staticmethod
    def toJsonList(list):
        return jsonify([m.serialize() for m in list])

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, 
            sort_keys=True, indent=4)
    
    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)


# Represents a 360 image taken at a certain linear distance from the blade base
# It has high-level descriptions of the defect found at that high.
# An image can be broken down into multiple measurement 2d closeup shots called Measurements
@dataclass
class Image(Base, Serializer):
    __tablename__ = "image" 

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    distance = Column(Float, nullable=True, default=0.0)
    defect_severity = Column(String, nullable=True, default="")
    defect_location = Column(String, nullable=True, default="")
    defect_size = Column(Float, nullable=True, default=0.0)
    defect_desc = Column(String, nullable=True, default="")
    frame = Column(String, nullable=True, default="")

    inspection_id = Column(Integer, ForeignKey( "inspection.id"), nullable=False)
    blade_id = Column(Integer, ForeignKey("blade.id"), nullable=False)
    
    __table_args__ = (
        Index("Image_timestamp_idx", "timestamp"),
        Index("Image_inspection_id_idx", "inspection_id"),
        Index("Image_blade_id_idx", "blade_id"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d
    
    def toJson(self):
        return jsonify(self.serialize())
    

    def __repr__(self):
        return str(self.__dict__)
    

# ImageFile is a 360 image
@dataclass
class ImageFile(Base, Serializer):
    __tablename__ = "image_file"

    id = Column(Integer, primary_key=True)
    image_id = Column(Integer, ForeignKey("image.id"), nullable=False)
    filename = Column(String, nullable=True)
    s3key = Column(String, nullable=True)
    content = Column(LargeBinary, nullable=True)
    thumbnail = Column(LargeBinary, nullable=True)

    __table_args__ = (
        Index("Image_File_Image_id_idx", "image_id"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)


@dataclass
class Blade(Base, Serializer):
    __tablename__ = "blade"

    id = Column(Integer, primary_key=True)

    number = Column(String, nullable=True, default="")
    set_number = Column(String, nullable=True, default="")
    serial_number = Column(String, nullable=True, default="")
    model = Column(String, nullable=True, default="")
    manufacturer = Column(String, nullable=True, default="")
    tpi_ncr_number = Column(String, nullable=True, default="")
    length = Column(Float, nullable=True, default=0.0)

    __table_args__ = (
        # Index("Turbine_image_id_idx","image_id"),
    )


    @staticmethod
    def toJsonList(list):
        return jsonify([m.serialize() for m in list])

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)

@dataclass
class Certificate(Base, Serializer):
    __tablename__ = "certificate"

    id = Column(Integer, primary_key=True)

    blade_type = Column(String, nullable=True, default="")
    blade_serial_number = Column(String, nullable=True, default="")
    blade_model = Column(String, nullable=True, default="")
    supplier_name = Column(String, nullable=True, default="")
    factory_location = Column(String, nullable=True, default="")
    factory_name = Column(String, nullable=True, default="")
    manufacture_date = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    inspection_modality = Column(String, nullable=True, default="")
    inspection_equipment = Column(String, nullable=True, default="")
    blade_areas_inspected = Column(String, nullable=True, default="")
    inspection_date = Column(DateTime(timezone=True), nullable=True, default=None)
    inspector_name  = Column(String, nullable=True, default="")
    certification_date = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    certificate_number= Column(String, nullable=True, default="")
    reason_for_deviation= Column(String, nullable=True, default="")

    __table_args__ = (
        Index("Certificate_date_idx","certification_date"),
    )


    @staticmethod
    def toJsonList(list):
        return jsonify([m.serialize() for m in list])

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)
    

class InspectionLogs(Base, Serializer):
    __tablename__ = "inspection_logs"

    id = Column(Integer, primary_key=True)

    # in case we cannot create an inspection this will be null
    # We dont declare it as a foreign key since we want to keep record on delete.
    inspection_id = Column(Integer,  nullable=True)

    date = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    folder_name = Column(String, nullable=True)
    operation = Column(String, nullable=True) # IMPORT, DELETE, UPDATE
    status = Column(String, nullable=True)
    message = Column(String, nullable=True)
    sso = Column(String, nullable=True)

    __table_args__ = (
        #Index("Inspection_logs_inspection_id_idx", "inspection_id"),
        Index("Inspection_logs_date_idx", "date"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)


@dataclass
class VTShot(Base, Serializer):
    __tablename__ = "vtshot"

    id = Column(Integer, primary_key=True)
    image_id = Column(Integer, ForeignKey("image.id"), nullable=False)

    date = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    root_face_distance = Column(Float, nullable=True, default=0.0)     

    image_pitch = Column(Float, nullable=True, default=0.0)
    image_yaw = Column(Float, nullable=True, default=0.0)
    image_hfov = Column(Float, nullable=True, default=0.0)

    __table_args__ = (
        Index("VTShot_image_id_idx", "image_id"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)

@dataclass
class VTShotImageFile(Base, Serializer):
    __tablename__ = "vtshot_image_file"

    id = Column(Integer, primary_key=True)
    image_id = Column(Integer, ForeignKey("image.id"), nullable=False)
    vtshot_id = Column(Integer, ForeignKey("vtshot.id"), nullable=False) 
    filename = Column(String, nullable=True)
    s3key = Column(String, nullable=True)
    content = Column(LargeBinary, nullable=True) # binary content
    thumbnail = Column(LargeBinary, nullable=True)

    __table_args__ = (
        Index("VTShot_Image_File_Image_id_idx", "image_id"),
        Index("VTShot_Image_File_Snapshot_id_idx", "vtshot_id"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)


# A defect is a polygon marked inside a measurement
# measurement may include many defects, potentially belonging to different finding_type's
# We can reconstruct a measurement by combining its defects.
@dataclass
class Defect(Base, Serializer):
    __tablename__ = "defect"

    id = Column(Integer, primary_key=True)
    image_id = Column(Integer, ForeignKey("image.id"), nullable=False)
    measurement_id = Column(Integer, ForeignKey("measurement.id"), nullable=False)

    date = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    location = Column(String, nullable=True, default="")

    root_face_distance = Column(Float, nullable=True, default=0.0) 
    span_wise_length = Column(Float, nullable=True, default=0.0)
    chord_wise_width = Column(Float, nullable=True, default=0.0)
    depth = Column(Float, nullable=True, default=0.0)
    height = Column(Float, nullable=True, default=0.0)
    width = Column(Float, nullable=True, default=0.0)
    length = Column(Float, nullable=True, default=0.0)
    aspect_ratio = Column(Float, nullable=True, default=0.0)
    area = Column(Float, nullable=True, default=0.0)
    percent_area = Column(Float, nullable=True, default=0.0)
    
    finding_type = Column(String, nullable=True, default="Other")
    ge_disposition = Column(String, nullable=True, default="")
    
    is_priority = Column(Boolean, nullable=True, default=False)
    description = Column(String, nullable=True, default="")

    image_pitch = Column(Float, nullable=True, default=0.0)
    image_yaw = Column(Float, nullable=True, default=0.0)
    image_hfov = Column(Float, nullable=True, default=0.0)

    design_tolerance = Column(String, nullable=True, default="")
    disposition_provided_by = Column(String, nullable=True, default="")
    status = Column(String, nullable=True, default="Open")
    repair_date = Column(DateTime(timezone=True), nullable=True)
    repair_report_id = Column(String, nullable=True, default="")
    repair_approved_by = Column(String, nullable=True, default="")
    is_manual = Column(Boolean, nullable=True, default=False) #TODO: make sure to set it to true when user saves annotations
    sso = Column(String, nullable=True, default=None)

    __table_args__ = (
        Index("Defect_image_id_idx", "image_id"),
        Index("Defect_measurement_id_idx", "measurement_id"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)


# DefectAnnotationFragment represents single polygon annotations made on top of measurement image
# where measurement image is a close-up 2d snapshot taken from the 360 image
# meta-data is stored in the defect table
# we can reconstruct a measurement_annotation_file by combining its many defect_annotation_fragment's
@dataclass
class DefectAnnotationFragment(Base, Serializer): 
    __tablename__ = "defect_annotation_fragment"

    id = Column(Integer, primary_key=True)
    image_id = Column(Integer, ForeignKey("image.id"), nullable=False)
    measurement_id = Column(Integer, ForeignKey("measurement.id"), nullable=False)
    defect_id = Column(Integer, ForeignKey("defect.id"), nullable=False)
    content = Column(String, nullable=True) # string representation of json

    __table_args__ = (
        Index("Defect_Annotation_Fragment_Image_id_idx", "image_id"),
        Index("Defect_Annotation_Fragment_Measurement_id_idx", "measurement_id"),
        Index("Defect_Annotation_Fragment_Defect_id_idx", "defect_id"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)


# The measurement is performed on a 2d photo originated from the 360 image(image_id)
# This photo is saved in a separate measurement_image_file
# measurements are performed using annotation files highlighting the found defects
@dataclass
class Measurement(Base, Serializer):
    __tablename__ = "measurement"

    id = Column(Integer, primary_key=True)
    image_id = Column(Integer, ForeignKey("image.id"), nullable=False)

    finding_code = Column(String, nullable=True, default="") # string description of the finding
    submission_code = Column(String, nullable=True, default="")
    date = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    component = Column(String, nullable=True, default="")
    reference = Column(String, nullable=True, default="")
    position_in_blade = Column(String, nullable=True, default="")
    location = Column(String, nullable=True, default="")

    root_face_distance = Column(Float, nullable=True, default=0.0) 
    edge_distance = Column(Float, nullable=True, default=0.0)
    le_distance = Column(Float, nullable=True, default=0.0)
    te_distance = Column(Float, nullable=True, default=0.0)
    span_wise_length = Column(Float, nullable=True, default=0.0)
    chord_wise_width = Column(Float, nullable=True, default=0.0)
    depth = Column(Float, nullable=True, default=0.0)
    height = Column(Float, nullable=True, default=0.0)
    width = Column(Float, nullable=True, default=0.0)
    length = Column(Float, nullable=True, default=0.0)
    aspect_ratio = Column(Float, nullable=True, default=0.0)
    area = Column(Float, nullable=True, default=0.0)
    percent_area = Column(Float, nullable=True, default=0.0)
    
    finding_type = Column(String, nullable=True, default="Other")
    finding_category = Column(String, nullable=True, default="")
    finding_reference = Column(String, nullable=True, default="")
    ge_disposition = Column(String, nullable=True, default="")
    ge_disposition_response = Column(String, nullable=True, default="")
    dnv_response = Column(String, nullable=True,default="")
    
    is_priority = Column(Boolean, nullable=True, default=False)

    description = Column(String, nullable=True, default="")

    image_pitch = Column(Float, nullable=True, default=0.0)
    image_yaw = Column(Float, nullable=True, default=0.0)
    image_hfov = Column(Float, nullable=True, default=0.0)

    design_tolerance = Column(String, nullable=True, default="")
    disposition_provided_by = Column(String, nullable=True, default="")
    status = Column(String, nullable=True, default="Open")
    repair_date = Column(DateTime(timezone=True), nullable=True)
    repair_report_id = Column(String, nullable=True, default="")
    repair_approved_by = Column(String, nullable=True, default="")
    is_manual = Column(Boolean, nullable=True, default=False) #TODO: make sure to set it to true when user saves annotations
    sso = Column(String, nullable=True, default=None)

    __table_args__ = (
        Index("Measurement_image_id_idx", "image_id"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)


# MeasurementFile represents 2d image taken from the 360 image
# the 2d images are used for defect measurement.
@dataclass
class MeasurementImageFile(Base, Serializer):
    __tablename__ = "measurement_image_file"

    id = Column(Integer, primary_key=True)
    image_id = Column(Integer, ForeignKey("image.id"), nullable=False)
    measurement_id = Column(Integer, ForeignKey("measurement.id"), nullable=False) 
    filename = Column(String, nullable=True)
    s3key = Column(String, nullable=True)
    content = Column(LargeBinary, nullable=True) # binary content
    thumbnail = Column(LargeBinary, nullable=True)
    comments = Column(String, nullable=True)

    __table_args__ = (
        Index("Measurement_Image_File_Image_id_idx", "image_id"),
        Index("Measurement_Image_File_Measurement_id_idx", "measurement_id"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)


# MeasurementAnnotationFile represents annotations made on top of measurement image
# where measurement image is a close-up 2d snapshot taken from the 360 image
@dataclass
class MeasurementAnnotationFile(Base, Serializer): 
    __tablename__ = "measurement_annotation_file"

    id = Column(Integer, primary_key=True)
    image_id = Column(Integer, ForeignKey("image.id"), nullable=False)
    measurement_id = Column(Integer, ForeignKey("measurement.id"), nullable=False)
    filename = Column(String, nullable=True)
    s3key = Column(String, nullable=True)
    content = Column(String, nullable=True) # string representation of json

    __table_args__ = (
        Index("Measurement_Annotation_File_Image_id_idx", "image_id"),
        Index("Measurement_Annotation_File_Measurement_id_idx", "measurement_id"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)

# ValidatedMeasurementAnnotationFile represents MeasurementAnnotationFile that has been reviewed
# by an expert. The validation_status indicates whether it was accepted, rejected or corrected.
# We chose to keep these in a separate table so not to interfere with existing queries
@dataclass
class ValidatedMeasurementAnnotationFile(Base, Serializer): 
    __tablename__ = "validated_measurement_annotation_file"

    id = Column(Integer, primary_key=True)
    image_id = Column(Integer, ForeignKey("image.id"), nullable=False)
    measurement_id = Column(Integer, ForeignKey("measurement.id"), nullable=False)
    filename = Column(String, nullable=True)
    s3key = Column(String, nullable=True)
    content = Column(String, nullable=True) # string representation of json
    validation_status = Column(String, nullable=True) # accepted, rejected, corrected
    validated_by = Column(String, nullable=True) # user id or name of the validator
    validation_timestamp =  Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    finding_type = Column(String, nullable=True, default=None) # potential different label from the json content

    __table_args__ = (
        Index("Validated_Measurement_Annotation_File_Image_id_idx", "image_id"),
        Index("Validated_Measurement_Annotation_File_Measurement_id_idx", "measurement_id"),
        Index("Validated_Measurement_Annotation_File_Validation_Timestamp_idx", "validation_timestamp"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)

# The user may choose to replace the original file with validated content.
# This table saves copies of original annotation contents from 
# current MeasurementAnnotationFile records that got replaced during validation.
@dataclass
class OriginalMeasurementAnnotationFile(Base, Serializer): 
    __tablename__ = "original_measurement_annotation_file" 

    id = Column(Integer, primary_key=True)
    image_id = Column(Integer, ForeignKey("image.id"), nullable=False)
    measurement_id = Column(Integer, ForeignKey("measurement.id"), nullable=False)
    filename = Column(String, nullable=True)
    s3key = Column(String, nullable=True)
    content = Column(String, nullable=True) # string representation of json
    replaced_by = Column(String, nullable=True) # user id or name of the validator
    replaced_timestamp = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    
    __table_args__ = (
        Index("Original_Measurement_Annotation_File_Image_id_idx", "image_id"),
        Index("Original_Measurement_Annotation_File_Measurement_id_idx", "measurement_id"),
        Index("Original_Measurement_Annotation_File_Replaced_Timestamp_idx", "replaced_timestamp"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)


# When defects are repaired, one can upload one or more photos to document the final result
@dataclass
class RepairEvidenceFile(Base, Serializer):
    __tablename__ = "repair_evidence_file"

    id = Column(Integer, primary_key=True)
    defect_id = Column(Integer, ForeignKey("defect.id"), nullable=False)
    filename = Column(String, nullable=True)
    mime_type = Column(String, nullable=True)
    s3key = Column(String, nullable=True)
    content = Column(LargeBinary, nullable=True) # binary content
    thumbnail = Column(LargeBinary, nullable=True)
    comments = Column(String, nullable=True)

    __table_args__ = (
        Index("Repair_Evidence_File_Defect_id_idx", "defect_id"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)


# The user may choose to replace the original file with validated content.
# This table saves copies of original annotation contents from 
# current MeasurementAnnotationFile records that got replaced during validation.
@dataclass
class BladeMonitoring(Base, Serializer): 
    __tablename__ = "blade_monitoring" 

    id = Column(Integer, primary_key=True)
    blade_number = Column(String, nullable=True)
    file_size = Column(String, nullable=True)
    s3_bucket = Column(DateTime, nullable=True)
    s3_cvpl_input = Column(DateTime, nullable=True)
    s3_cvpl_output = Column(DateTime, nullable=True)
    application_ui = Column(DateTime, nullable=True)
    upload_status = Column(String, nullable=True)
    upload_date = Column(DateTime, nullable=True)
    upload_end_date = Column(DateTime, nullable=True) 
    upload_time_taken = Column(Integer, Computed("round(EXTRACT(epoch FROM upload_end_date - upload_date)/3600, 2)"))
    total_time_taken = Column(Integer,  Computed("round(EXTRACT(epoch FROM cert_issued - upload_date)/3600, 2)"))
    annot_start_time = Column(DateTime, nullable=True) 
    annot_end_time = Column(DateTime, nullable=True)
    annot_time_taken = Column(Integer, Computed("round(EXTRACT(epoch FROM annot_end_time - annot_start_time)/3600, 2)"))
    sage_start_time = Column(DateTime, nullable=True) 
    sage_end_time = Column(DateTime, nullable=True)
    sage_time_taken = Column(Integer, Computed("round(EXTRACT(epoch FROM sage_end_time - sage_start_time)/3600, 2)"))
    cert_issued = Column(DateTime, nullable=True)
    blade_scan_time = Column(DateTime, nullable=True)


    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)

# The Blade types is stored in this table
@dataclass
class BladeType(Base, Serializer):
    __tablename__ = "blade_type"

    id = Column(Integer, primary_key=True)
    blade_type = Column(String, nullable=False)
    alias = Column(String, nullable=True)     
    bladeDefectModel = relationship("BladeDefectModel", back_populates="bladeType")      


    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__) 

# The defect types is stored in this table
@dataclass
class DefectModel(Base, Serializer):
    __tablename__ = "defect_model"

    id = Column(Integer, primary_key=True)
    defect_name = Column(String, nullable=False)
    bladeDefectModel = relationship("BladeDefectModel", back_populates="defectModel")      

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__) 

# The AI Models that should be run for the defect types is stored in this table
@dataclass
class BladeDefectModel(Base, Serializer):
    __tablename__ = "blade_defect_model"

    id = Column(Integer, primary_key=True)
    blade_type_id = Column(Integer, ForeignKey("blade_type.id"), nullable=False)
    defect_model_id = Column(Integer, ForeignKey("defect_model.id"), nullable=False) 
    ai_enabled = Column(Boolean, nullable=False, default=False)
    bladeType = relationship("BladeType", back_populates="bladeDefectModel")
    defectModel = relationship("DefectModel", back_populates="bladeDefectModel")


    __table_args__ = (
        Index("BladeDefectModel_blade_type_id_idx", "blade_type_id"),
        Index("BladeDefectModel_defect_model_id_idx", "defect_model_id"),
    )

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def toJson(self):
        return jsonify(self.serialize())

    def __repr__(self):
        return str(self.__dict__)        

# ============================================ Database =====================================================

logger = logging.getLogger()

DB_HOSTNAME = "bdc_db" # network name of db docker container
DB_USERNAME = "" # Should be obtained from environment var DATABASE_USERNAME 
DB_PASSWORD = "" # Should be obtained from environment var DATABASE_PASSWORD
DB_NAME = "bdc"
DB_PORT = 5436

# for name, value in os.environ.items():
#     print("{0}: {1}".format(name, value))

DATABASE_NAME = os.getenv('DATABASE_NAME')
if DATABASE_NAME is not None:
    DB_NAME = DATABASE_NAME
    logging.info(f'read DATABASE_NAME from env: {DB_NAME}')

DATABASE_HOSTNAME = os.getenv('DATABASE_HOSTNAME')
if DATABASE_HOSTNAME is not None:
    DB_HOSTNAME = DATABASE_HOSTNAME
    logging.info(f'read DATABASE_HOSTNAME from env: {DB_HOSTNAME}')

DATABASE_USERNAME = os.getenv('DATABASE_USERNAME')
if DATABASE_USERNAME is not None:
    DB_USERNAME = DATABASE_USERNAME
    logging.info(f'read DATABASE_USERNAME from env: {DB_USERNAME}')

DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD')
if DATABASE_PASSWORD is not None:
    DB_PASSWORD = DATABASE_PASSWORD
    logging.info(f'read DATABASE_PASSWORD from env: {DB_PASSWORD}')

DATABASE_PORT = os.getenv('DATABASE_PORT')
if DATABASE_PORT is not None:
    DB_PORT= DATABASE_PORT
    logging.info(f'read DATABASE_PORT from env: {DB_PORT}')


#JDBC_DRIVER_NAME="jdbcapi+pgjdbc"
PG_DRIVER_NAME="postgresql+psycopg"

DRIVER_NAME = PG_DRIVER_NAME

DATABASE = {
    "USERNAME": DB_USERNAME,
    "PASSWORD": DB_PASSWORD,
    "HOST": DB_HOSTNAME,
    "PORT": DB_PORT,
    "NAME": DB_NAME,
    "DRIVER": DRIVER_NAME
}

logging.info('DB Config: {DATABASE}')

POSTGRESQL_CONNECTION_ID = "{driver}://{db_username}:{db_password}@{db_host}:{db_port}/{db_name}".format(
    driver=DATABASE['DRIVER'],
    db_username=DATABASE['USERNAME'],
    db_password=DATABASE['PASSWORD'],
    db_host=DATABASE['HOST'],
    db_port=DATABASE['PORT'],
    db_name=DATABASE['NAME']
)

DB_CONNECTION_ID = POSTGRESQL_CONNECTION_ID
print(f'Connection id: {DB_CONNECTION_ID}')

def init_db():
    logger.info('models.init_db() called')

    #print(f'DB_CONNECTION_ID: {DB_CONNECTION_ID}')

    DB_CONNECTION_POOL_SIZE = 20
    DB_MAX_OVERFLOW = 5
    engine = create_engine(DB_CONNECTION_ID, echo=False,
                           pool_size=DB_CONNECTION_POOL_SIZE, 
                           max_overflow=DB_MAX_OVERFLOW,
                           pool_timeout=8000,
                           json_serializer = flask.json.dumps
                           )

    #print(f'DB_CONNECTION_POOL_SIZE: {DB_CONNECTION_POOL_SIZE}')

    if not database_exists(engine.url):
        create_database(engine.url)
        logging.info('create_database called')

     # create tables if necessary
    Base.metadata.create_all(bind=engine)
    
    return engine 


db = init_db()

