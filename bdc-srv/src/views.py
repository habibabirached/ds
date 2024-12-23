from flask import Blueprint, jsonify
from flask_restful import Api, Resource
from bdc_api import *
from email_utility import *

bdc_view = Blueprint('bcd', __name__)
api = Api(bdc_view)

# api.add_resource(TaskListAPI, '/todo/api/v1.0/tasks', endpoint='tasks')
# api.add_resource(TaskAPI, '/todo/api/v1.0/tasks/<int:id>', endpoint='task')

PREFIX = '/api'

# 360 image and meta-data import -----------------------------------------------------------------------------
api.add_resource(UploadImageAndMetadataAPI, PREFIX +
                 '/inspection/<int:inspection_id>/<int:blade_id>/uploadImageFileAndMetadata')

# Maintenance -----------------------------------------------------------------------------
api.add_resource(EmptyInspectionAPI, PREFIX +
                 '/maintenance/empty_inspection/list')  # GET and DELETE
api.add_resource(InvalidMeasurementAPI, PREFIX +
                 '/maintenance/invalid_measurement/list')  # GET and DELETE
api.add_resource(MissingImageFilesAPI, PREFIX +
                 '/maintenance/inspection/<int:id>/image_list/missing_image_files')  # GET
api.add_resource(CompressInspectionImageFilesAPI, PREFIX +
                 '/maintenance/inspection/<int:id>/compress_image_files')  # GET
api.add_resource(MoveInspectionImageFilesToS3API, PREFIX +
                 '/maintenance/inspection/<int:id>/move_image_files_to_s3')  # GET

# used to verify new records
api.add_resource(InspectionStatsAPI, PREFIX+'/inspection/<int:id>/stats')

# Inspection -----------------------------------------------------------------------------
api.add_resource(InspectionAPI, PREFIX+'/inspection/<int:id>')
api.add_resource(CreateInspectionAPI, PREFIX+'/inspection')
api.add_resource(UpdateInspectionAPI, PREFIX+'/inspection/<int:id>/update')
api.add_resource(InspectionListAPI, PREFIX+'/inspection/list')
api.add_resource(SearchInspectionAPI, PREFIX+'/inspection/search')
api.add_resource(InspectionImageListAPI, PREFIX +
                 '/inspection/<int:id>/image/list')
api.add_resource(InspectionImageFindAPI, PREFIX +
                 '/inspection/<int:id>/image/find')
api.add_resource(InspectionImageDistancesAPI, PREFIX +
                 '/inspection/<int:id>/image/distances')
api.add_resource(InspectionMeasurementListAPI, PREFIX +
                 '/inspection/<int:id>/measurement/list')
api.add_resource(InspectionDefectListAPI, PREFIX +
                 '/inspection/<int:id>/defect/list') # defects is a sub-division of a measurement

# Reporting --------------------------------------------------------------------------------
api.add_resource(InspectionListCsvAPI, PREFIX+'/inspection/list/csv')
api.add_resource(InspectionStatsCsvAPI, PREFIX+'/inspection/stats/csv')
api.add_resource(DefectStatsCsvAPI, PREFIX+'/defect/stats/csv')
api.add_resource(InspectionXlsAPI, PREFIX + '/inspection/<int:id>/xls')
api.add_resource(InspectionReportDocxAPI, PREFIX + '/inspection/docx')
api.add_resource(InspectionReportPdfAPI, PREFIX + '/inspection/pdf')
api.add_resource(InspectionZipAPI, PREFIX + '/inspection/<int:id>/zip')

api.add_resource(VirtualTourReportDocxAPI, PREFIX + '/virtualtour/docx')
api.add_resource(VirtualTourReportPdfAPI, PREFIX + '/virtualtour/pdf')

# Logs ------------------------------------------------------------------
api.add_resource(InspectionLogsAPI, PREFIX+'/logs')  # get
api.add_resource(CreateInspectionLogsAPI, PREFIX+'/logs')  # Post

# Certificate --------------------------------------------------------------------------------
api.add_resource(CertificateAPI, PREFIX+'/certificate/<int:id>')
api.add_resource(CreateCertificateAPI, PREFIX+'/certificate')
api.add_resource(UpdateCertificateAPI, PREFIX+'/certificate/<int:id>/update')
api.add_resource(CertificateListAPI, PREFIX+'/certificate/list')
api.add_resource(CertificateReportDocxAPI, PREFIX + '/certificate/docx')
api.add_resource(CertificateReportPdfAPI, PREFIX + '/certificate/pdf')

# Blade --------------------------------------------------------------------------------
api.add_resource(BladeAPI, PREFIX+'/blade/<int:id>')
api.add_resource(CreateBladeAPI, PREFIX+'/blade')
api.add_resource(BladeListAPI, PREFIX+'/blade/list')

# 360 Image --------------------------------------------------------------------------------
api.add_resource(ImageFileAPI, PREFIX+'/image/<int:id>/file')  # GET and POST
api.add_resource(ImageThumbnailAPI, PREFIX+'/image/<int:id>/thumbnail')
api.add_resource(ImageAPI, PREFIX+'/image/<int:id>')

api.add_resource(ImageMeasurementsAPI, PREFIX +
                 '/image/<int:id>/measurement/list')
api.add_resource(ImageDefectsAPI, PREFIX +
                 '/image/<int:id>/defect/list')

api.add_resource(ImageVTShotsAPI, PREFIX +
                 '/image/<int:id>/vtshot/list')
# api.add_resource(ImageListAPI, PREFIX+'/image/list')
api.add_resource(SearchImageAPI, PREFIX+'/image/search')  # GET

api.add_resource(SelectedImagesZipAPI, PREFIX +
                 '/image/selected_list/zip')  # POST

# Measurement --------------------------------------------------------------------------------
api.add_resource(SearchMeasurementAPI, PREFIX+'/measurement/search')  # GET
api.add_resource(CreateMeasurementAPI, PREFIX+'/measurement')  # POST
api.add_resource(UpdateMeasurementAPI, PREFIX +
                 '/measurement/<int:id>/update')  # POST
api.add_resource(MeasurementAPI, PREFIX+'/measurement/<int:id>')  # GET DELETE
api.add_resource(MeasurementImageFileAPI, PREFIX +
                 '/measurement/<int:id>/image_file')  # GET POST
api.add_resource(MeasurementImageThumbnailAPI, PREFIX +
                 '/measurement/<int:id>/thumbnail')  # GET

# Defect parsers and listers
api.add_resource(MeasurementDefectListAPI, PREFIX +
                 '/measurement/<int:id>/defect_list')  # GET
api.add_resource(ParseDefectsMeasurementAnnotationFileAPI, PREFIX +
                 '/measurement/<int:id>/annotation_file/parse_defects')  # GET

api.add_resource(ComputeMeasurementsForMeasurementAnnotationFileAPI, PREFIX +
                 '/measurement/<int:id>/annotation_file/compute_measurements')  # GET

# Defect -------------------------------------------------------------------------------------

# Individual defect operations
api.add_resource(SearchDefectAPI, PREFIX+'/defect/search')  # GET
api.add_resource(SearchDefectCsvAPI, PREFIX+'/defect/search/csv')  # GET
api.add_resource(CreateDefectAPI, PREFIX+'/defect')  # POST
api.add_resource(DefectAPI, PREFIX+'/defect/<int:id>')  # GET DELETE
api.add_resource(UpdateDefectAPI, PREFIX +
                 '/defect/<int:id>/update')  # POST
api.add_resource(UpdateDefectListAPI, PREFIX +
                 '/defect/update_list')  # POST
api.add_resource(DefectFragmentFileAPI, PREFIX+'/defect/<int:id>/annotation_fragment') # GET
api.add_resource(DefectFrameAPI, PREFIX+'/defect/<int:id>/frame') # GET
api.add_resource(DefectImageFileAPI, PREFIX +
                 '/defect/<int:id>/image_file')  # GET
api.add_resource(DefectImageThumbnailAPI, PREFIX +
                 '/defect/<int:id>/thumbnail')  # GET

api.add_resource(SelectedDefectsZipAPI, PREFIX +
                 '/defect/selected_annotation_list/zip')  # POST
api.add_resource(DefectImageCommentsAPI, PREFIX +
                 '/defect/<int:id>/defect_image_file_comments') # GET & # POST

api.add_resource(DefectRepairEvidenceCommentsAPI, PREFIX +
                 '/defect/<int:id>/defect_repair_evidence_comments') # GET & # POST

# Defect Repair Evidence Files --------------------------------------------------------------

api.add_resource(CreateDefectRepairEvidenceFileAPI, PREFIX +
                 '/defect/<int:id>/repair_evidence_file')  # POST
api.add_resource(DefectRepairEvidenceFileAPI, PREFIX +
                 '/defect/repair_evidence_file/<int:id>')  # GET DELETE
api.add_resource(DefectRepairEvidenceFileListAPI, PREFIX +
                 '/defect/<int:id>/repair_evidence_file_list')  # GET
api.add_resource(DefectRepairEvidenceImageAPI, PREFIX +
                 '/defect/<int:id>/defect_repair_evidence_file')  # GET



# -------------------------------------------------------------------------------------------

api.add_resource(UploadMeasurementImageAndAnnotationAPI,
                 PREFIX+'/image/<int:image_id>/uploadMeasurementImageAndAnnotation')  # POST
api.add_resource(MeasurementAnnotationFileAPI, PREFIX +
                 '/measurement/<int:id>/annotation_file')  # GET, POST, DELETE

# Measurement validation --------------------------------------------------------------------
api.add_resource(ValidatedMeasurementAnnotationFileAPI, PREFIX +
                 '/measurement/<int:id>/validated_annotation_file')  # GET, POST, DELETE
api.add_resource(ValidatedMeasurementAnnotationFileMetadataAPI, PREFIX +
                 '/measurement/<int:id>/validated_annotation_file_metadata')  # GET
api.add_resource(ValidatedAnnotationsZipAPI, PREFIX +
                 '/measurement/validated_annotation_list/zip')  # POST


# Original measurement --------------------------------------------------------------------
api.add_resource(OriginalMeasurementAnnotationFileAPI, PREFIX +
                 '/measurement/<int:id>/original_annotation_file')  # GET, POST, DELETE
api.add_resource(OriginalMeasurementAnnotationFileMetadataAPI, PREFIX +
                 '/measurement/<int:id>/original_annotation_file_metadata')  # GET


# ------------------------------- 2D virtual tour snapshot from virtual tour ----------------------------
api.add_resource(CreateVTShotAPI, PREFIX+'/vtshot')  # POST
api.add_resource(VTShotAPI, PREFIX+'/vtshot/<int:id>')  # GET, DELETE
api.add_resource(VTShotImageFileAPI, PREFIX +
                 '/vtshot/<int:id>/image_file')  # GET, POST
api.add_resource(VTShotImageThumbnailAPI, PREFIX +
                 '/vtshot/<int:id>/thumbnail')  # GET

# Utilities -------------------------------------------------------------------------------------
api.add_resource(BladeCrossSectionPositionAPI,
                 PREFIX+'/blade/cross_section_image')
api.add_resource(BladeSideViewPositionAPI, PREFIX+'/blade/side_view_image')

api.add_resource(DefectSeverityAPI, PREFIX+'/defect_severity')
api.add_resource(DefectColorsAPI, PREFIX+'/defect_colors')

api.add_resource(PingAPI, PREFIX+'/ping')

# Async Task management -------------------------------------------------------------------------

api.add_resource(TaskStatusAPI, PREFIX+'/task/<string:id>/status')
api.add_resource(TaskStatusListAPI, PREFIX+'/task/list')
api.add_resource(TaskFileAPI, PREFIX+'/task/<string:id>/file')


# Login and sso ---------------------------------------------------------------------------------
api.add_resource(UserInfoAPI, PREFIX+'/userinfo')
api.add_resource(IDMGroupAPI, PREFIX+'/idmcheck/<string:id>')
api.add_resource(IDMDLMembersAPI, PREFIX+'/idmmembers')
api.add_resource(LogOffUserAPI, PREFIX+'/logoff')
api.add_resource(WhichIDMGroupAPI,PREFIX+'/usergroup/<string:id>')

# Blade Monitoring API ---------------------------------------------------------------------------
#api.add_resource(BladeMonitoringAPI, PREFIX+'/monitoring/<int:id>')
#api.add_resource(UpdateBladeMonitoringAPI, PREFIX+'/monitoring/<int:id>/update')
api.add_resource(BladeMonitoringListAPI, PREFIX+'/monitoring/list')
api.add_resource(UpdateBladeMonitoringAPI, PREFIX+'/update_blade_monitoring')
#api.add_resource(SearchBladeMonitoringAPI, PREFIX+'/monitoring/search')

# S3 Upload API ---------------------------------------------------------------------------
api.add_resource(S3InitiateUploadAPI, PREFIX + '/initiate_upload')
api.add_resource(S3PresignedUrlsAPI, PREFIX + '/get_presigned_urls')
api.add_resource(S3CompleteUploadAPI, PREFIX + '/complete_upload')
api.add_resource(S3AbortUploadAPI, PREFIX + '/abort_upload')
api.add_resource(ValidateROSAPI, PREFIX + '/validate_ros')

# AI Model Run ------------------------------------------------------------------------------
api.add_resource(BladeDefectModelListAPI, PREFIX + '/ai_model_list')
api.add_resource(BladeTypeListAPI, PREFIX + '/blade_type_list')
api.add_resource(DefectModelListAPI, PREFIX + '/defect_model_list')
api.add_resource(BladeDefectModelAddUpdateAPI, PREFIX + '/ai_model_add')
api.add_resource(BladeDefectModelUpdateAPI, PREFIX + '/ai_model_update')
api.add_resource(BladeDefectModelS3UploadAPI, PREFIX + '/ai_s3_upload')

# Filtered Report Generation ---------------------------------------------------------------
api.add_resource(InspectionDefectStatsReportAPI, PREFIX+'/report/inspDefectStats')
api.add_resource(InspectionListReportAPI, PREFIX+'/report/inspectionList')
api.add_resource(BladeMonitoringReportAPI, PREFIX+'/report/bladeMonitoringReport')
api.add_resource(InspectionDefectListReportAPI, PREFIX+'/report/inspectionDefectList')

# Email sending API -------------------------------------------------------------------------
api.add_resource(EmailNotificationAPI, PREFIX + '/email_noification')


# Service Now Requests API -------------------------------------------------------------------------
api.add_resource(SNServiceRequestAPI, PREFIX + '/sn_service_request')
api.add_resource(SNIncidentCreateAPI, PREFIX + '/sn_incident_request')
api.add_resource(SNIncidentGetAPI, PREFIX + '/sn_incident_request/<string:sso>')
api.add_resource(SNTaskGetAPI, PREFIX + '/sn_task_request/<string:sso>')


# Search and Download Input Files API ------------------------------------------------------
api.add_resource(InputFileSearchAPI, PREFIX + '/s3_input_files_list')
api.add_resource(InputFileURLsAPI, PREFIX + '/s3_input_files_urls/<string:blade_number>')