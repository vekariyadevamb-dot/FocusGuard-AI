"""
Head Pose Estimation using OpenCV solvePnP and MediaPipe Facial Landmarks.
Estimates Yaw, Pitch, and Roll in degrees with neutral-pose calibration and smoothing.
"""

import cv2
import numpy as np
from typing import Tuple, Dict, Any, Optional

# Standard 3D facial model points (in anthropometric coordinates)
MODEL_POINTS_3D = np.array([
    (0.0, 0.0, 0.0),             # Nose tip (index 1)
    (0.0, -330.0, -65.0),        # Chin (index 152)
    (-225.0, 170.0, -135.0),     # Left eye outer corner (index 33)
    (225.0, 170.0, -135.0),      # Right eye outer corner (index 263)
    (-150.0, -150.0, -125.0),    # Left mouth corner (index 61)
    (150.0, -150.0, -125.0)      # Right mouth corner (index 291)
], dtype=np.float64)

KEY_LANDMARK_INDICES = [1, 152, 33, 263, 61, 291]


class HeadPoseEstimator:
    def __init__(self, smoothing_factor: float = 0.35):
        self.smoothing_factor = smoothing_factor
        self.smoothed_yaw: Optional[float] = None
        self.smoothed_pitch: Optional[float] = None
        self.smoothed_roll: Optional[float] = None

    def estimate(
        self,
        landmarks,
        frame_width: int,
        frame_height: int,
        baseline: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Estimate yaw, pitch, roll angles in degrees from facial landmarks.
        """
        if not landmarks or len(landmarks) < max(KEY_LANDMARK_INDICES) + 1:
            return {
                "valid": False,
                "yaw": 0.0,
                "pitch": 0.0,
                "roll": 0.0,
                "raw_yaw": 0.0,
                "raw_pitch": 0.0,
                "raw_roll": 0.0,
                "looking_away": False
            }

        # Extract 2D image coordinates for key landmark points
        image_points = []
        for idx in KEY_LANDMARK_INDICES:
            lm = landmarks[idx]
            x = float(lm.x * frame_width)
            y = float(lm.y * frame_height)
            image_points.append([x, y])

        image_points_2d = np.array(image_points, dtype=np.float64)

        # Approximate camera intrinsic matrix
        focal_length = frame_width
        center = (frame_width / 2.0, frame_height / 2.0)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1))  # Assuming minimal lens distortion

        success, rvec, tvec = cv2.solvePnP(
            MODEL_POINTS_3D,
            image_points_2d,
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )

        if not success:
            return {
                "valid": False,
                "yaw": 0.0,
                "pitch": 0.0,
                "roll": 0.0,
                "raw_yaw": 0.0,
                "raw_pitch": 0.0,
                "raw_roll": 0.0,
                "looking_away": False
            }

        rmat, _ = cv2.Rodrigues(rvec)
        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)

        # OpenCV Euler decomposition:
        # pitch: angles[0], yaw: angles[1], roll: angles[2]
        # Standardize angle ranges:
        raw_pitch = float(angles[0])
        # Invert/standardize pitch around 0 deg looking straight
        if raw_pitch > 90:
            raw_pitch = 180 - raw_pitch
        elif raw_pitch < -90:
            raw_pitch = -180 - raw_pitch

        raw_yaw = float(angles[1])
        raw_roll = float(angles[2])
        if raw_roll > 90:
            raw_roll = 180 - raw_roll
        elif raw_roll < -90:
            raw_roll = -180 - raw_roll

        # Apply exponential moving average (EMA)
        if self.smoothed_yaw is None:
            self.smoothed_yaw = raw_yaw
            self.smoothed_pitch = raw_pitch
            self.smoothed_roll = raw_roll
        else:
            alpha = self.smoothing_factor
            self.smoothed_yaw = alpha * raw_yaw + (1.0 - alpha) * self.smoothed_yaw
            self.smoothed_pitch = alpha * raw_pitch + (1.0 - alpha) * self.smoothed_pitch
            self.smoothed_roll = alpha * raw_roll + (1.0 - alpha) * self.smoothed_roll

        # Baseline offset calibration if provided
        base_yaw = baseline.get("baseline_yaw", 0.0) if baseline else 0.0
        base_pitch = baseline.get("baseline_pitch", 0.0) if baseline else 0.0
        base_roll = baseline.get("baseline_roll", 0.0) if baseline else 0.0

        calibrated_yaw = self.smoothed_yaw - base_yaw
        calibrated_pitch = self.smoothed_pitch - base_pitch
        calibrated_roll = self.smoothed_roll - base_roll

        return {
            "valid": True,
            "yaw": round(calibrated_yaw, 1),
            "pitch": round(calibrated_pitch, 1),
            "roll": round(calibrated_roll, 1),
            "raw_yaw": round(raw_yaw, 1),
            "raw_pitch": round(raw_pitch, 1),
            "raw_roll": round(raw_roll, 1)
        }

    def reset(self):
        self.smoothed_yaw = None
        self.smoothed_pitch = None
        self.smoothed_roll = None
