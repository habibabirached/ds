import matplotlib.pyplot as plt

import numpy as np
import open3d as o3d
import json
import os
import cv2 
import time
import statistics
from skspatial.objects import Plane, Points
import matplotlib.pyplot as plt
import logging
from defect_measurement import computeWidthLength
from defect_measurement import Analyze360im

measurement_map = {}

class DefectMeasure:
    def __init__(self, model_path):
        self.scene = self.create_scene(model_path)
        self.model_path = model_path
    
    def find_width_using_line(self, binary_mask, debug=False):
        # add 1 pixel boundary all around binary mask to deal with
        binary_mask = cv2.copyMakeBorder(binary_mask, 1, 1, 1, 1, cv2.BORDER_CONSTANT, value=[0, 0, 0])
    
        # Ensure the input is a binary mask
        binary_mask = binary_mask.astype(np.uint8)
        width, height = binary_mask.shape[0:2]
    
        # Compute the distance transform
        dist_transform = cv2.distanceTransform(binary_mask, cv2.DIST_C, 5)
    
        # Find the maximum value in the distance transform (i.e., maximum width center)
        max_dist_value = np.max(dist_transform)
    
        # Get all coordinates that have the maximum distance value
        max_dist_coords = np.argwhere(dist_transform == max_dist_value)
    
        # Find the coordinates of all edge points (contour) in the binary mask
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    
        # Flatten all contour points into a single list
        contour_points = np.vstack(contours).squeeze()
    
        # remove all points that have 0 or boundary points in it
        contour_points = [x for x in contour_points if not ((0 in x) or (width in x) or (height in x))]
    
        # For each point in max_dist_coords, find the two contour points forming the max width
        widths = []
        points = []
        contour_points_arr = np.array(contour_points)
    
        for max_coord in max_dist_coords:
            max_coord = tuple(max_coord[::-1])  # Reverse to (x, y) format
    
            distances = np.linalg.norm(contour_points_arr - max_coord, axis=1)
    
            # Find the closest contour point (P1)
            p1_idx = np.argmin(distances)
            p1 = contour_points_arr[p1_idx]
    
            # Now, calculate the line direction: max_coord -> P1
            line_direction = max_coord - p1
            line_direction = line_direction / np.linalg.norm(line_direction)  # Normalize
    
            # Create positions along the line (both directions)
            t_values = np.arange(1, min(binary_mask.shape))
    
            def line_func(t, direction, start_point):
                return np.round(np.array(start_point) + t[:, np.newaxis] * np.array(direction)).astype(int)
    
            # Create positions along the line for both directions (+/- t_values)
            pos_positive = line_func(t_values, line_direction, max_coord)
            pos_negative = line_func(-t_values, line_direction, max_coord)
    
            # Ensure positions are within the image bounds
            pos_positive = pos_positive[(pos_positive[:, 1] >= 0) & (pos_positive[:, 1] < binary_mask.shape[0]) &
                                        (pos_positive[:, 0] >= 0) & (pos_positive[:, 0] < binary_mask.shape[1])]
    
            pos_negative = pos_negative[(pos_negative[:, 1] >= 0) & (pos_negative[:, 1] < binary_mask.shape[0]) &
                                        (pos_negative[:, 0] >= 0) & (pos_negative[:, 0] < binary_mask.shape[1])]
    
            # Check for transitions in the binary mask
            p2 = None
            for pos in pos_positive:
                if binary_mask[pos[1], pos[0]] == 0:
                    p2 = tuple(pos)
                    break
            if (p2 is None) and len([x for x in pos_positive if 0 in x]) == len(pos_positive):
                p2 = pos_positive[0]
    
            for pos in pos_negative:
                if binary_mask[pos[1], pos[0]] == 0:
                    p1 = tuple(pos)
                    break
    
            # Compute width (distance between P1 and P2)
            if p1 is not None and p2 is not None:
                width_at_point = np.linalg.norm(np.array(p1) - np.array(p2))
                widths.append(width_at_point)
    
                # subtract 1 pixels from all the points to account for 1 pixel padding
                p1 = (max(p1[0]-1, 0), max(p1[1]-1, 0))
                p2 = (max(p2[0] - 1, 0), max(p2[1] - 1, 0))
                max_coord = (max(max_coord[0] - 1, 0), max(max_coord[1] - 1, 0))
                points.append((p1, p2, tuple(max_coord)))
    
        # Display the points on the image
        if len(points) > 0 and debug:
            sz = binary_mask.shape
            binary_mask = binary_mask[1:sz[0]-1, 1:sz[1]-1]
            # Convert the binary mask to a 3-channel image for color drawing
            display_image = cv2.cvtColor(binary_mask, cv2.COLOR_GRAY2BGR)
            # display_image = 255 * dist_transform / np.amax(dist_transform)
            np.random.seed(0)
            for count, ((p1, p2, mx_cord), width) in enumerate(zip(points, widths)):
                if p1 is not None and p2 is not None:
                    # Draw the two points with a star marker
                    color = (int(np.random.rand() * 255), int(np.random.rand() * 255), int(np.random.rand() * 255))
                    cv2.drawMarker(display_image, p1, color=color, markerType=cv2.MARKER_CROSS, markerSize=5,
                                thickness=2)
                    cv2.drawMarker(display_image, p2, color=color, markerType=cv2.MARKER_CROSS, markerSize=5,
                                thickness=2)
                    cv2.drawMarker(display_image, mx_cord, color=(255, 0, 0), markerType=cv2.MARKER_TRIANGLE_UP,
                                markerSize=5,
                                thickness=2)
    
            # Display the image using matplotlib
            plt.figure(figsize=(6, 6))
            plt.imshow(display_image)
            plt.title(f"Widths at max distance locations")
            plt.axis('off')
            plt.show()
    
        return points, widths
    

    def setup(self, annotation_data, frame_data, visualize=True):
        self.visualize = visualize
        section_map = {'lead' : 'Leading_Edge', 'web' : 'Central_Web', 'trail' : 'Trailing_Edge'}
        # TODO: very minor performance gain if these are replaced with direct variable assignement (2x speed but in ns range..)
        for key, val in annotation_data.items():
            setattr(self, '_%s' % (key,), val)
        for key, val in frame_data.items():
            setattr(self, '_%s' % (key,), val)

        if self._sect in section_map.keys():
            self._sect = section_map[self._sect]
    
        self.poly_xy_snap = [np.array(x['points'], dtype=int) for x in self._shapes]
        self.poly_xy_360 = []
        self.poly_xy_360_w = []

        if self._transform == "":
            logging.info(f'Transform not available for z={self._z}')
            return False
        else:
            self._r = np.matmul(np.array(self._transform)[:3,:3],np.array([0, 0, 1]).T)
        self.cam_offset = [0.08*x for x in self._r]
        self.pos = [sum(x) for x in zip(self._position[:3], self.cam_offset)]
        self.ball_pivot_radii = [0.05, 0.1, 0.15, 0.4]

        self.snapshot_to_360_pts()
        logging.info('Snapshot pixels converted!')
        return True


    def get_line_ends(self, line_pts):
        x = sorted(line_pts, key=lambda poly_xy_360: poly_xy_360[0])
        y = sorted(line_pts, key=lambda poly_xy_360: poly_xy_360[1])
        if abs(x[-1][0] - x[0][0]) >= abs(y[-1][1] - y[0][1]):
            return [x[0], x[-1]]
        else:
            return [y[0], y[-1]]
    
    def latch_coords(self, xy):
        for pts in xy:
            if pts[0] <= 0:
                pts[0] = 1
            if pts[0] >= self._imageWidth:
                pts[0] = self._imageWidth - 1
            if pts[1] <= 0:
                pts[1] = 1
            if pts[1] >= self._imageHeight:
                pts[1] = self._imageHeight - 1
        return xy
    
    
    def snapshot_to_360_pts(self):
        poly_xy_snap_latched = [self.latch_coords(x) for x in self.poly_xy_snap]
        self.poly_xy_snap = poly_xy_snap_latched
        self.poly_xy_360_w = [[] for x in self.poly_xy_snap]

        for i, xy in enumerate(self.poly_xy_snap):

            n_pts = len(xy)

            if n_pts < 2:
                logging.error('Zero or single point polygon, ignoring')
                self.poly_xy_360.append([])
                continue

            equi_mask_im, contours = Analyze360im.snapshot_to_360(xy, self._imageHfov, self._imageYaw, self._imagePitch, self._imageHeight, self._imageWidth, self._eqHeight, self._eqWidth)
            poly_xy_360 = [contours[0].tolist()][0]

            if n_pts == 2:
                # Point-To-Point Line 
                self.poly_xy_360.append(self.get_line_ends(poly_xy_360))

            elif n_pts > 2:              
                self.poly_xy_360.append(poly_xy_360)

                if self._shapes[i]['label'] == 'Core Gap' or self._shapes[i]['label'] == 'CoreGap':
                    mask = np.zeros([self._imageHeight, self._imageWidth], dtype=np.uint8)
                    mask = cv2.fillPoly(mask, [xy], 255)
                    xy_fw, _mask_w = self.find_width_using_line(mask, debug=False)
                    xy_fw_med = xy_fw[np.argsort(_mask_w)[len(_mask_w)//2]][:2]
                    equi_mask_im, contours_fw = Analyze360im.snapshot_to_360(xy_fw_med, self._imageHfov, self._imageYaw, self._imagePitch, self._imageHeight, self._imageWidth, self._eqHeight, self._eqWidth)
                    poly_xy_360_w = [contours_fw[0].tolist()][0]
                    self.poly_xy_360_w[i] = self.get_line_ends(poly_xy_360_w)
                    
        return
    
    def create_scene(self, model_path=None):
        model_path = self.model_path if not model_path else model_path

        # Scale and normalize the model
        bmesh = o3d.io.read_triangle_mesh(model_path)
        bmesh.scale(1/1000, center=(0,0,0))
        bmesh.translate((0,0,0)) 
        bmesh.compute_vertex_normals()
        mesh = o3d.t.geometry.TriangleMesh.from_legacy(bmesh)

        # Create a scene and add the triangle mesh
        scene = o3d.t.geometry.RaycastingScene()
        mesh_id = scene.add_triangles(mesh)
        return scene
    
    def poly_xy_to_angle(self, poly_xy):
        poly_angs = []
        for coords in poly_xy:
            x, y = coords
            theta = round(360 * (x / self._eqWidth), 3)
            phi = round(-180 * (y / self._eqHeight) + 90, 3)
            poly_angs.append([theta, phi])
        return poly_angs

    def ang2vec(self, poly_angs):
        poly_vecs = []
        for angles in poly_angs:
            p, t = angles

            phi = np.radians(p-180)
            theta = np.radians(-t)
            v = [np.sin(theta)*np.cos(phi), np.cos(theta)*np.cos(phi), np.sin(phi)]
            phi = -phi
            uN = np.array([np.sin(theta), np.cos(theta), 0])
            Rx = np.array([[1, 0, 0], [0, np.cos(phi), -np.sin(phi)], [0, np.sin(phi), np.cos(phi)]])
            v = np.matmul(Rx, uN.T)
            poly_vecs.append(v)
        return poly_vecs

    def xyz_to_rcf(self, poly_vecs):
        poly_vecs_rcf = []
        for vec in poly_vecs:
            c = np.pad(vec, (0, 1), 'constant')
            vec_rcf = np.matmul(self._transform, c)
            poly_vecs_rcf.append(vec_rcf[:3])
        return poly_vecs_rcf

    def drawPoly(self, image_path):
        if not self.visualize:
            return
        
        # abspath = os.path.abspath(os.getcwd())
        # dname = os.path.dirname(abspath)
        # os.chdir(dname)
        img = cv2.imread(image_path)
        for i, coord in enumerate(self.poly_xy):
            cv2.drawMarker(img, (int(coord[0]), int(coord[1])), color=[255,100, 255], thickness=6, 
            markerType= cv2.MARKER_SQUARE, line_type=cv2.LINE_AA,
            markerSize=35)
            if i < len(self.poly_xy) - 1:
                cv2.line(img, self.poly_xy[i], self.poly_xy[i+1], color=[0,255,255], thickness=8)
            else:
                cv2.line(img, self.poly_xy[i], self.poly_xy[0], color=[0,255,255], thickness=8)
        cv2.imshow('image', img)
        cv2.waitKey(0) 

    def getSeqDist(self, pts):
        seq_dists = []
        for i in range(len(pts)):
            p1 = pts[i]
            if i == len(pts)-1:
                p2 = pts[0]
            else:
                p2 = pts[i+1]
            dist = np.linalg.norm(np.array(p2)-np.array(p1))
            seq_dists.append(dist.tolist())
        return [round(x, 5) for x in seq_dists]

    def getClosestPlnPts(self, pts, p0, n):
        plane_pts = []
        for pt in pts:
            pp = pt - np.dot(pt-p0, n)*n
            plane_pts.append(pp)
        return plane_pts

    def poly_angles_to_3d_pts(self, poly_xy, poly_angs):
 
        poly_vecs = self.ang2vec(poly_angs)
        poly_vecs = [arr.tolist() for arr in self.xyz_to_rcf(poly_vecs)]
        poly_pvecs = [self.pos + x for x in poly_vecs]
        rays = o3d.core.Tensor(poly_pvecs,
                        dtype=o3d.core.Dtype.Float32)
        ans = self.scene.cast_rays(rays)
        hit_dists = ans['t_hit'].numpy()
        
        if np.isinf(hit_dists).any():
            return False, None
        
        pts = []
        pts_ref = []
        pts_ref.append(o3d.geometry.TriangleMesh.create_coordinate_frame(size = 0.15, origin=self.pos))
        for i in range(len(poly_vecs)):
            pt = np.array(self.pos) + hit_dists[i]*np.array(poly_vecs[i])
            pts.append(pt)
        
        return True, pts
    
    def get_area_mean_plane(self,pts):
        points = Points(pts)
        plane = Plane.best_fit(points)
        n = np.array(plane.normal)
        p = np.array(plane.point)
        D = np.dot(n,p)
        plane_pts = self.getClosestPlnPts(pts, p, n)
        #TODO: test mean plane projection, coplanar triangulation, summate triangle areas

    def get_area_ball_pivot(self, pts):
        radii = self.ball_pivot_radii

        poly_pcl = o3d.geometry.PointCloud()
        poly_pcl.points = o3d.utility.Vector3dVector(np.array(pts))
        poly_pcl.estimate_normals()

        rec_mesh = o3d.geometry.TriangleMesh.create_from_point_cloud_ball_pivoting(
        poly_pcl, o3d.utility.DoubleVector(radii))
        sa = rec_mesh.get_surface_area()
        
        if self.visualize:
            o3d.visualization.draw_geometries([rec_mesh], mesh_show_wireframe=True, point_show_normal=True)

        return round(sa, 9)

    def project_and_eval_polygon(self):
        #self.poly_xy_360 and self.poly_xy_360_w have index parity, access both and populate output 
        result_keys = ['point_to_point_distance', 'perimeter', 'area', 'width', 'length', 'width_blob']
        result_dict = {k: [-1 for idx in self.poly_xy_snap] for k in result_keys}

        for i, poly_xy in enumerate(self.poly_xy_360):
            
            n_pts = len(poly_xy)
            if not poly_xy or n_pts <= 1:
                continue
            
            poly_angles = self.poly_xy_to_angle(poly_xy)
            projection_success, pts = self.poly_angles_to_3d_pts(poly_xy, poly_angles)
            if not projection_success:
                logging.error('A polygon point did not intersect with the model, skipping...')
                continue

            _sd = self.getSeqDist(pts)

            if n_pts > 2:
                result_dict['perimeter'][i] = [round(sum(_sd), 5)]
                result_dict['area'][i] = self.get_area_ball_pivot(pts)
                
                poly_xy_blob_w= self.poly_xy_360_w[i]

                if self._shapes[i]['label'] == 'Core Gap' or self._shapes[i]['label'] == 'CoreGap':
                    if poly_xy_blob_w:
                        poly_angles_blob_w = self.poly_xy_to_angle(poly_xy_blob_w)
                        fw_success, pts_fw = self.poly_angles_to_3d_pts(poly_xy_blob_w, poly_angles_blob_w)
                        if not fw_success:
                            logging.error('A blob width point did not intersect with the model, skipping...')
                            continue
                        sd_fw = self.getSeqDist(pts_fw)
                        result_dict['width_blob'][i] = sd_fw[0]
                else:
                    w, l, _pca, _pp = (computeWidthLength.compute_polygon_dimensions(pts))
                    result_dict['width'][i] = w
                    result_dict['length'][i] = l
            
            elif n_pts == 2:
                result_dict['point_to_point_distance'][i] = _sd[0]
                continue
        
        return result_dict

# initialize the different models so we dont do this at request time.
def init(model_paths):
    if not isinstance(model_paths, list):
        model_paths = [model_paths]

    for model_path in model_paths:
        if model_path not in measurement_map.keys():
            measurement_map[model_path] = DefectMeasure(model_path)

def measure_defects(model_path, image_path=None, annotation_data=None, frame_data=None, visualize=False):
    # only setup the DetectMeasurement object if we need it.
    # TODO: need to fix this cacheing, not working currently.. tries to recreate this object when the model is already loaded..
    if model_path not in measurement_map.keys():
        print(f"{model_path} not in {measurement_map.keys()}")
        measurement_map[model_path] = DefectMeasure(model_path)
    defMeas = measurement_map[model_path]
    # Create Defect Measurement environment and apply methods
    if not defMeas.setup(annotation_data, frame_data, visualize):
        logging.info('Setup failed,  invalid transform')
        return
    
    # draw the image if its available
    if image_path:
        defMeas.drawPoly(image_path)

    result_dict = defMeas.project_and_eval_polygon()
    
    for key in  result_dict.keys():
        print(f'{key}: {result_dict[key]}')

    # abspath = os.path.abspath(os.getcwd()) 
    # dname = os.path.dirname(abspath)
    # os.chdir(dname)

    #return result_dict
    return json.dumps(result_dict)
