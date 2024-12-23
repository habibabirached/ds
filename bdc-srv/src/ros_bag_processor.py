import rosbags
import matplotlib.pyplot as plt
from rosbags.rosbag2 import Reader, Writer
from rosbags.serde import deserialize_cdr
import numpy as np
import os
import shutil
from scipy.signal import argrelextrema, find_peaks, butter, filtfilt, lfilter
from scipy.interpolate import UnivariateSpline
import pandas as pd
import logging
import pathlib
import sqlite3
import yaml

class ROSBagProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def read_bag(self, bag_dir, name, verbose=False):
        uwb_raw, rot_raw, scan_meta, scan_ranges = [], [], [], []
        
        self.logger.info(f'Inside read_bag, bag_dir = {bag_dir}, name = {name}')
        with Reader(os.path.join(bag_dir, name)) as reader:
            # topic and msgtype information is available on .connections list
            if verbose: 
                for connection in reader.connections:
                    self.logger.info(connection.topic, connection.msgtype)

            # grab the raw data
            for connection, timestamp, rawdata in reader.messages():
                if connection.topic == '/uwb/range':
                    msg = deserialize_cdr(rawdata, connection.msgtype)
                    uwb_raw.append([timestamp, float(msg.header.stamp.sec) + float(msg.header.stamp.nanosec*10**-9), msg.range])
                if connection.topic == '/lidar_rotations':
                    msg = deserialize_cdr(rawdata, connection.msgtype)
                    rot_raw.append([timestamp, int(msg.data)])
                if connection.topic == '/scan':
                    msg = deserialize_cdr(rawdata, connection.msgtype)
                    scan_meta.append([timestamp, msg.header.stamp.sec, msg.header.stamp.nanosec, msg.angle_min, msg.angle_max, \
                        msg.angle_increment, msg.time_increment, msg.scan_time, msg.range_min, msg.range_max])
                    scan_ranges.append(list(msg.ranges))

        uwb_raw = np.array(uwb_raw)
        rot_raw = np.array(rot_raw)
        scan_meta = np.array(scan_meta)
        scan_ranges = np.array(scan_ranges)
        return uwb_raw, rot_raw, scan_meta, scan_ranges
                    
    def match_stamps(self, rot_raw, uwb): #returns rot - distance - reference - timestamps
        out = []
        for i, d in enumerate(rot_raw[:,0]):
            diff = np.abs(uwb[:, 0]-d)
            ind_t = diff.argmin() 
            out.append([d/1e9, rot_raw[i,1], uwb[ind_t,2]])
        out_shaping = list(zip(*out))
        return  out_shaping[0], out_shaping[1], out_shaping[2]

    def butter_lowpass(self, cutoff, fs, order=5):
        return butter(order, cutoff, fs=fs, btype='low', analog=False)

    def butter_lowpass_filter(self, data, cutoff, fs, order=5):
        b, a = self.butter_lowpass(cutoff, fs, order=order)
        y = lfilter(b, a, data)
        return y

    def determine_number_of_peaks(self, x, fs, cutoff, thresh, graph_path):
        
        filtered_data = self.butter_lowpass_filter(x, cutoff, fs)
        
        if graph_path is not None:
            plt.plot(range(len(filtered_data)) / fs, filtered_data, label="filtered")

        # Find local maxima that are over the threshold
        peaks = [ filtered_data[x] for x in argrelextrema(filtered_data, np.greater)[0] if filtered_data[x] > thresh ]
        return len(peaks)

    def uwb_validity_check(self, uwb, graph_path, cavityCount):
        uwb_readings = uwb[:,2]
        uwb_time = uwb[:,1] - uwb[0,1]
        fs = 1 / (uwb_time[1] - uwb_time[0]) # Hz
        cutoff_frequency = fs / 200 # Hz
        thresh = 20.0
        n_peaks = self.determine_number_of_peaks(uwb_readings, fs, cutoff_frequency, thresh, graph_path)
        self.logger.info(f'npeaks = {n_peaks}')

        if graph_path is not None:
            plt.plot(uwb_time, uwb_readings, label = "unfiltered")
            plt.xlabel("Time since scan start (s)")
            plt.ylabel("Measured Z Distance (m)")
            plt.legend()
            plt.savefig(graph_path)

        cavityCount = int(cavityCount)
        return n_peaks >= cavityCount and n_peaks != 0

    def rosbag_validity_check(self, bag_dir, cavityCount):
        # Get list of rosbags and sort by creation time
        self.logger.info(f'Inside rosbag_validity_check, bag_dir = {bag_dir}')
        list_of_bags = os.listdir(bag_dir)# glob.glob(bag_dir + '*')
        self.logger.info(f'List of bags {list_of_bags}')
        sorted_list_of_bags = sorted(list_of_bags, key=lambda bag: os.stat(os.path.join(bag_dir, bag)).st_ctime)

        # Read in data from all rosbags
        ros_timestamps = []
        lidar_rotations = []
        ros_z_dists = []
        for name in list_of_bags:
            self.logger.info(f'Inside rosbag_validity_check, name = {name}')
            # Read Rosbag data
            try:
                uwb, rot, scan_meta, scan_ranges = self.read_bag(bag_dir, name)
                ros_timestamps_current, lidar_rotations_current, ros_z_dists_current = self.match_stamps(rot, uwb)
            
                # Aggregate rosbag data
                ros_timestamps.extend(ros_timestamps_current)
                lidar_rotations.extend(lidar_rotations_current)
                ros_z_dists.extend(ros_z_dists_current) 
            except Exception as e:
                self.logger.error(f"Error processing bag {name}: {str(e)}")
                return False

        return self.uwb_validity_check(uwb, None, cavityCount)
    
    # ------------------- Rosbag processing -------------------
    def process_rosbag(self, temp_dir):
        if not os.path.isdir(temp_dir):
            self.logger.error(f"The provided path {temp_dir} is not a directory")
            return False

        db3_files = [f for f in os.listdir(temp_dir) if f.endswith('.db3')]

        if not db3_files:
            self.logger.warning(f"No .db3 files found in {temp_dir}")
            return False

        for db3_file in db3_files:
            rosbag_file_path = os.path.join(temp_dir, db3_file)
            
            try:
                # SQLite recovery
                self.recover_sqlite_db(rosbag_file_path)
                
                # Generate metadata for this specific .db3 file
                self.generate_metadata(temp_dir, db3_file)
                
                self.logger.info(f"Successfully processed {db3_file}")
            except sqlite3.Error as e:
                self.logger.error(f"Error processing {db3_file}: {e}")
                continue

        return True

    def recover_sqlite_db(self, rosbag_file_path):
        # Connect to the original database
        conn = sqlite3.connect(rosbag_file_path)
        cursor = conn.cursor()

        # Perform integrity check
        cursor.execute("PRAGMA integrity_check")
        integrity_result = cursor.fetchone()[0]
        
        if integrity_result != "ok":
            self.logger.warning(f"Integrity check failed for {rosbag_file_path}. Attempting recovery.")
            
            # Create a new database file
            new_db_path = rosbag_file_path + ".recovered"
            new_conn = sqlite3.connect(new_db_path)
            
            # Copy schema and data to the new database
            for line in conn.iterdump():
                try:
                    new_conn.execute(line)
                except sqlite3.Error as e:
                    self.logger.error(f"Error during recovery: {e}")
                    new_conn.close()
                    os.remove(new_db_path)
                    raise
            
            # Close connections
            new_conn.close()
            conn.close()

            # Replace the original file with the recovered one
            shutil.move(new_db_path, rosbag_file_path)
            self.logger.info(f"Recovery completed for {rosbag_file_path}")
        else:
            self.logger.info(f"Integrity check passed for {rosbag_file_path}. No recovery needed.")
            conn.close()

    def get_table_columns(self, cursor, table_name):
        cursor.execute(f"PRAGMA table_info({table_name})")
        return [column[1] for column in cursor.fetchall()]

    def generate_metadata(self, temp_dir, db3_file):
        db_path = os.path.join(temp_dir, db3_file)
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Get list of tables in the database
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [table[0] for table in cursor.fetchall()]

        metadata = {
            'rosbag2_bagfile_information': {
                'version': 5,
                'storage_identifier': 'sqlite3',
                'relative_file_paths': [db3_file],
                'files': [db3_file],
                'custom_data': {}
            }
        }

        if 'messages' in tables:
            messages_columns = self.get_table_columns(cursor, 'messages')
            
            if 'timestamp' in messages_columns:
                cursor.execute("SELECT MIN(timestamp), MAX(timestamp) FROM messages")
                start_time, end_time = cursor.fetchone()
                metadata['rosbag2_bagfile_information']['duration'] = {
                    'nanoseconds': end_time - start_time if start_time and end_time else 0
                }
                metadata['rosbag2_bagfile_information']['starting_time'] = {
                    'nanoseconds_since_epoch': start_time if start_time else 0
                }

            cursor.execute("SELECT COUNT(*) FROM messages")
            total_message_count = cursor.fetchone()[0]
            metadata['rosbag2_bagfile_information']['message_count'] = total_message_count

        topics_with_info = []
        if 'topics' in tables and 'messages' in tables:
            topics_columns = self.get_table_columns(cursor, 'topics')
            messages_columns = self.get_table_columns(cursor, 'messages')
            
            topic_name_column = 'name' if 'name' in topics_columns else 'topic'
            topic_id_column = 'id' if 'id' in topics_columns else 'topic_id'
            type_column = 'type' if 'type' in topics_columns else 'message_type'
            
            if topic_name_column in topics_columns and topic_id_column in topics_columns and 'topic_id' in messages_columns:
                query = f"""
                    SELECT topics.{topic_name_column}, topics.{type_column}, COUNT(messages.id)
                    FROM topics
                    LEFT JOIN messages ON topics.{topic_id_column} = messages.topic_id
                    GROUP BY topics.{topic_name_column}, topics.{type_column}
                """
                cursor.execute(query)
                topics_with_info = cursor.fetchall()

        metadata['rosbag2_bagfile_information']['topics_with_message_count'] = [
            {
                'topic_metadata': {
                    'name': topic,
                    'type': msg_type,
                    'serialization_format': 'cdr'
                },
                'message_count': count
            } for topic, msg_type, count in topics_with_info
        ]

        # Try to get the ROS distro version from the database
        if 'metadata' in tables:
            try:
                cursor.execute("SELECT value FROM metadata WHERE name = 'ros_distro'")
                ros_distro_result = cursor.fetchone()
                if ros_distro_result:
                    metadata['rosbag2_bagfile_information']['custom_data']['ros_distro_version'] = ros_distro_result[0]
            except sqlite3.OperationalError:
                self.logger.warning("Could not find ROS distro version in the database.")

        conn.close()

        # Create a directory for this specific rosbag
        rosbag_dir = os.path.join(temp_dir, os.path.splitext(db3_file)[0])
        os.makedirs(rosbag_dir, exist_ok=True)

        # Move the .db3 file to the new directory
        shutil.move(db_path, os.path.join(rosbag_dir, db3_file))

        # Write metadata to yaml file in the new directory
        metadata_path = os.path.join(rosbag_dir, 'metadata.yaml')
        with open(metadata_path, 'w') as f:
            yaml.dump(metadata, f, default_flow_style=False)

        self.logger.info(f"Generated metadata.yaml for {db3_file}")

 # -------------------- Ros bag combiner --------------------
    def merge_rosbags(self, bag_paths, output_bag_path):
        """
        Merges multiple ROS bag .db3 files into a single bag file.

        Args:
            bag_paths (list): List of paths to the input .db3 bag files.
            output_bag_path (str): Path to the output merged .db3 bag file.

        Returns:
            None
        """
        self.logger.info(f"Inside the merge_rosbags method: {bag_paths} {output_bag_path}")
        # Create the output directory if it doesn't exist
        output_dir = os.path.dirname(output_bag_path)
        self.logger.info(f"Output Directory: {output_dir}")
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        self.logger.info(f"Initializing a writer")

        # Initialize a writer for the new bag file
        with Writer(output_bag_path) as writer:

            # A set to keep track of existing topics already added to the writer
            existing_topics = set()

            # Process each bag file in the provided list
            for bag_path in bag_paths:
                self.logger.info(f"Inside for loop bag_path: {bag_path}")
                with Reader(bag_path) as reader:
                    reader.open()
                    connections = reader.connections
                    
                    # Add topics from the current bag file to the writer if not already added
                    for connection in connections.values():
                        if connection.topic not in existing_topics:
                            writer.add_connection(connection.topic, connection.msgtype, connection.serialization_format)
                            existing_topics.add(connection.topic)
                    
                    # Write all the messages from the current bag file
                    for connection, timestamp, rawdata in reader.messages():
                        msg = deserialize_cdr(rawdata, connection.msgtype)
                        writer.write(connection, timestamp, msg)
        
        self.logger.info(f"Successfully merged {len(bag_paths)} ros bag files into {output_bag_path}")
