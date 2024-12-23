from defect_measurement import measure_defects
import os
import json

abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)

a = open('../json/example_annotation.json') 
annotation_data = json.load(a) 
s = open('../json/example_frame.json')
frame_data = json.load(s)
model_path = 'models/Leading_Edge-75.STL'
image_path = '../images/test.jpg'

output_json = measure_defects.measure_defects(model_path, image_path, annotation_data, frame_data, visualize=True)

