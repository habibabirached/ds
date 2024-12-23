import cv2

from defect_measurement import Perspec2Equirec 

import time

import numpy as np
import matplotlib
#matplotlib.use("tkagg")
matplotlib.use('Agg')
import matplotlib.pyplot as plt


def get_contour_coordinates(binary_mask_image, epsilon_factor=0.01):
    """
    Finds and approximates contours in a binary mask image.

    :param binary_mask_image: Binary mask image (numpy array)
    :param epsilon_factor: Approximation accuracy as a factor of the contour length.
    :return: List of coordinates of the approximated contours.
    """
    contours, _ = cv2.findContours(binary_mask_image.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    return [cv2.approxPolyDP(c, epsilon_factor * cv2.arcLength(c, True), True).reshape(-1, 2) for c in contours]


def snapshot_to_360(snapshot_coords, fov, yaw, pitch, im_height, im_width, eq_height, eq_width):
    """
    Projects a mask to a 360-degree equirectangular image.

    :param snapshot_coords: Annotation mask coordinates (polygon)
    :param fov: Field of view for the mask image
    :param yaw: Yaw angle for 360 projection
    :param pitch: Pitch angle for 360 projection
    :param eq_height: Height of the output equirectangular image
    :param eq_width: Width of the output equirectangular image
    :return: Tuple of the 360 image and its contours
    """
    mask = cv2.fillPoly(np.zeros((im_height, im_width, 3), dtype=np.uint8), [np.array(snapshot_coords)], (255, 255, 255))
    
    obj = Perspec2Equirec.Perspective(mask, fov, yaw, pitch)
    equi_mask_im, _ = obj.GetEquirec(eq_height, eq_width)
    equi_mask_im_bin = cv2.threshold(equi_mask_im[:, :, 0].astype(np.uint8), 10, 255, cv2.THRESH_BINARY)[1]

    return equi_mask_im, get_contour_coordinates(equi_mask_im_bin)

# example
pp = [
                [
                    880,
                    156
                ],
                [
                    910,
                    114
                ],
                [
                    1118,
                    259
                ],
                [
                    1088,
                    302
                ]]
# imageHeight=1200
# imageWidth=1600
# fov = 80
# pitch = 30
# yaw = 190
# eq_height = 2688
# eq_width = 5376
# equi_mask_im, contours = snapshot_to_360(pp, fov, yaw, pitch, imageHeight, imageWidth, eq_height, eq_width)
# tmp = cv2.drawContours(np.array(equi_mask_im, dtype=np.uint8), contours, -1, (0, 255, 0), 3)
# plt.imshow(tmp)