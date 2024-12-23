import os
import sys
import time
import cv2
import numpy as np

class Perspective:
    def __init__(self, img_name, FOV, THETA, PHI ):
        if isinstance(img_name, np.ndarray):
            self._img = img_name
        else:
            self._img = cv2.imread(img_name, cv2.IMREAD_COLOR)
        [self._height, self._width, _] = self._img.shape
        self.wFOV = FOV
        self.THETA = THETA
        self.PHI = PHI
        # self.hFOV = float(self._height) / self._width * FOV

        self.w_len = np.tan(np.radians(self.wFOV / 2.0))
        self.h_len = (float(self._height) / self._width) * np.tan(np.radians(self.wFOV / 2.0))


    def GetEquirec(self,height,width, translation=[0, 0, 0]):
        #
        # THETA is left/right angle, PHI is up/down angle, both in degree
        #
        # print("\t\t** GetEquirec **")
        # print(f"\t\theight: {height}")
        # print(f"\t\twidth: {width}")
        # print(f"\t\ttranslation: {translation}")
        # print(f"\t\tTHETA: {self.THETA}")
        # print(f"\t\tPHI: {self.PHI}")

        x,y = np.meshgrid(np.linspace(-180, 180,width),np.linspace(90,-90,height))
        
        # duplicate calls to cos sin etc..
        # TODO persist these radian values..
        # precalc the cos and sin values.. 
        s1 = time.time()
        x_rad = np.radians(x)
        y_rad = np.radians(y)
        y_cos = np.cos(y_rad)

        x_map = np.cos(x_rad) * y_cos
        y_map = np.sin(x_rad) * y_cos
        z_map = np.sin(y_rad)

        s2 = time.time()
        # print(f"\t\tsin/cos -- radians -- {s2-s1}")
        s1 = time.time()
        # xyz = np.zeros([3, height, width], dtype = np.float32)
        
        # xyz[height, width, 0] = np.copy(x_map)

        #TODO: form this object ahead of time and insert. instad of concatinating.. 
        xyz = np.stack((x_map,y_map,z_map),axis=2)
        s2 = time.time()
        # print(f"\t\tstack -- {s2-s1}")
        y_axis = np.array([0.0, 1.0, 0.0], np.float32)
        z_axis = np.array([0.0, 0.0, 1.0], np.float32)
        s1 = time.time()
        [R1, _] = cv2.Rodrigues(z_axis * np.radians(self.THETA))
        [R2, _] = cv2.Rodrigues(np.dot(R1, y_axis) * np.radians(-self.PHI))
        s2 = time.time()
        # print(f"\t\trodrigues 2x: {s2-s1}")

        s1 = time.time()
        R1 = np.linalg.inv(R1)
        R2 = np.linalg.inv(R2)
        s2 = time.time()
        # print(f"\t\tmatrix inversion: {s2-s1}")
        s1 = time.time()
        xyz = xyz.reshape([height * width, 3]).T
        s2 = time.time()
        # print(f"\t\txyz reshape (remvoe dimension): {s2-s1}")
        s1 = time.time()
        xyz = np.dot(R2, xyz)
        s2 = time.time()
        # print(f"\t\tdot 1 : {s2-s1}")
        s1 = time.time()
        xyz = np.dot(R1, xyz).T - translation
        s2 = time.time()
        # print(f"\t\tdot2: {s2-s1}") 

        s1 = time.time()
        xyz = xyz.reshape([height , width, 3])
        s2 = time.time()
        # print(f"\t\txyz reshape (original dim) : {s2-s1}")

        s1 = time.time()
        inverse_mask = np.where(xyz[:,:,0]>0,1,0)
        s2 = time.time()
        # print(f"\t\tgenerate inverse mask: {s2-s1}")
        s1 = time.time()
        # TODO: biggest time offender, fix this.. figure out what its doing.. 
        xyz[:,:] = xyz[:,:]/np.repeat(xyz[:,:,0][:, :, np.newaxis], 3, axis=2)
        s2 = time.time()
        # print(f"\t\tnp.repeat? : {s2-s1}")

        s1 = time.time()
        lon_map = np.where((-self.w_len<xyz[:,:,1])&(xyz[:,:,1]<self.w_len)&(-self.h_len<xyz[:,:,2])
                    &(xyz[:,:,2]<self.h_len),(xyz[:,:,1]+self.w_len)/2/self.w_len*self._width,0)
        s2 = time.time()
        lat_map = np.where((-self.w_len<xyz[:,:,1])&(xyz[:,:,1]<self.w_len)&(-self.h_len<xyz[:,:,2])
                    &(xyz[:,:,2]<self.h_len),(-xyz[:,:,2]+self.h_len)/2/self.h_len*self._height,0)
        s3 = time.time()
        mask = np.where((-self.w_len<xyz[:,:,1])&(xyz[:,:,1]<self.w_len)&(-self.h_len<xyz[:,:,2])
                    &(xyz[:,:,2]<self.h_len),1,0)
        s4 = time.time()
        # print(f"\t\twhere 1 (lon_map) -- {s2-s1}")
        # print(f"\t\twhere 2 (lat_map) -- {s3-s2}")
        # print(f"\t\twhere 3 (mask) -- {s4-s3}")
        # print(f"\t\ttotal where -- {s4-s1}")

        s1 = time.time()
        persp = cv2.remap(self._img, lon_map.astype(np.float32), lat_map.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_WRAP)
        s2 = time.time()
        # print(f"\t\tremap -- {s2-s1}")
        s1 = time.time()
        mask = mask * inverse_mask
        mask = np.repeat(mask[:, :, np.newaxis], 3, axis=2)
        persp = persp * mask
        s2=time.time()
        # print(f"\t\tmask generation -- {s2-s1}")
        
        
        return persp, mask
        






