import os
import numpy as np
abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)

import measure_defects
import json
import glob
import time

# a = open('/Users/223114154/Documents/bcert/defect_loc/scripts/defect_measurement/json/frame_60015_22_LE.json')
# frame_data = json.load(a)
# b = open('/Users/223114154/Documents/bcert/defect_loc/scripts/defect_measurement/json/annotation_60015_22_LE.json')
# annotation_data = json.load(b)
debug_dir = '/Users/223114154/Documents/bcert/defect_loc/scripts/defect_measurement/json/TPI-60099_Leading_Edge_608_Full/'
idx = debug_dir.find('-') + 1
result_name = debug_dir[idx:idx+7]
# debug_dir = '/Users/223114154/Documents/bcert/defect_loc/scripts/defect_measurement/json/99-le-iso/'
results_dir = '/Users/223114154/Documents/bcert/defect_loc/scripts/defect_measurement/results/'
model_path = '/Users/223114154/Documents/bcert/defect_loc/scripts/defect_measurement/src/models/Leading_Edge-75.STL'
image_path = '../images/test.jpg'
os.chdir(debug_dir)
dirs = os.listdir()
width_list = []

s_total = time.time()
count = 0
n_dirs = len(dirs)

for dir in sorted(dirs):
    s_files = []
    if str(dir) == '.DS_Store':
        continue
    os.chdir(debug_dir + dir)
    for file in glob.glob('*.json'):
        if 'frame' in str(file):
            frame = str(file)
        elif 'json' in str(file):
            s_files.append(str(file))

    a = open(debug_dir + str(dir) + '/' + frame)
    frame_data = json.load(a)
    print('dir: ', dir)
    print('loaded frame data: ', frame)
    for s_file in s_files:
        b = open(debug_dir + str(dir) + '/' + str(s_file))
        annotation_data = json.load(b)
        
        print('loaded s file: ', str(s_file) )
        s = time.time()
        dict = measure_defects.measure_defects(model_path, image_path, annotation_data, frame_data, visualize=False)
        
        print('Single frame output took %s seconds' %  (time.time()-s))
        for i, _w in enumerate(dict['width_blob']):
            if _w and _w >= 0:
                width_list.append((str(dict['width_blob'][i]), str(s_file)))
            else:
                width_list.append((None, str(s_file)))
        np.savetxt(f'{results_dir}{result_name}.csv', width_list, delimiter=',', fmt='%s')
    count += 1
    print(f'Processing frames, count {count}/{n_dirs}')

print('Total blade output took %s seconds' %  (time.time()-s_total))

