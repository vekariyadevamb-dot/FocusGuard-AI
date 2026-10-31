"""
Central Computer Vision Pipeline for FocusGuard AI
Orchestrates webcam capture, MediaPipe FaceLandmarker, solvePnP head pose,
eye/mouth analysis, neutral calibration, and frame annotation.
"""

import cv2
import base64
import os
import time
import numpy as np
from typing import Dict, Any, Optional, List

import mediapipe as mp
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision

from .camera import CameraManager
from .head_pose import HeadPoseEstimator
from .eye_mouth import EyeMouthAnalyzer
from .attention import AttentionEngine, AttentionState

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "models", "face_landmarker.task")


class VisionPipeline:
    def __init__(self, camera_index: int = 0, model_path: str = MODEL_PATH):
        self.camera_manager = CameraManager(camera_index=camera_index)
        self.head_pose = HeadPoseEstimator()
        self.eye_mouth = EyeMouthAnalyzer()
        self.attention = AttentionEngine()

        self.model_path = os.path.abspath(model_path)
        self.landmarker: Optional[vision.FaceLandmarker] = None
        self._is_initialized = False

        self.baseline_calibration: Dict[str, float] = {
            "baseline_yaw": 0.0,
            "baseline_pitch": 0.0,
            "baseline_roll": 0.0,
            "baseline_ear": 0.28
        }

        # Calibration state
        self._calibrating = False
        self._calibration_samples: List[Dict[str, float]] = []

    def initialize(self) -> bool:
        if self._is_initialized:
            return True

        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"MediaPipe face landmarker model not found at {self.model_path}")

        base_options = mp_tasks.BaseOptions(model_asset_path=self.model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5,
            output_face_blendshapes=True
        )
        self.landmarker = vision.FaceLandmarker.create_from_options(options)

        started = self.camera_manager.start()
        self._is_initialized = started
        return started

    def set_calibration(self, calibration: Dict[str, float]) -> None:
        self.baseline_calibration.update(calibration)

    def start_calibration(self) -> None:
        self._calibrating = True
        self._calibration_samples.clear()

    def process_frame(
        self,
        show_preview: bool = True,
        show_landmarks: bool = True,
        is_paused: bool = False,
        is_break: bool = False
    ) -> Dict[str, Any]:
        if not self._is_initialized or self.landmarker is None:
            return {
                "success": False,
                "error": "Pipeline not initialized",
                "camera_healthy": False
            }

        camera_healthy = self.camera_manager.is_healthy()
        success, frame = self.camera_manager.get_frame()

        if not success or frame is None:
            # Camera frame read issue
            attention_result = self.attention.update(
                has_face=False,
                pose_data={},
                eye_data={},
                is_paused=is_paused,
                is_break=is_break,
                camera_healthy=False
            )
            return {
                "success": False,
                "camera_healthy": False,
                "attention": attention_result,
                "preview_base64": None
            }

        h, w, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        detection_result = self.landmarker.detect(mp_image)
        has_face = bool(detection_result.face_landmarks and len(detection_result.face_landmarks) > 0)

        landmarks = detection_result.face_landmarks[0] if has_face else None
        blendshapes = detection_result.face_blendshapes[0] if (has_face and detection_result.face_blendshapes) else None

        # 1. Head Pose Estimation
        pose_data = self.head_pose.estimate(
            landmarks,
            frame_width=w,
            frame_height=h,
            baseline=self.baseline_calibration
        )

        # 2. Eye & Mouth Analysis
        eye_data = self.eye_mouth.process(landmarks, blendshapes)

        # Handle calibration collection if active
        calibration_progress = None
        if self._calibrating and has_face and pose_data.get("valid"):
            self._calibration_samples.append({
                "yaw": pose_data["raw_yaw"],
                "pitch": pose_data["raw_pitch"],
                "roll": pose_data["raw_roll"],
                "ear": eye_data["ear"]
            })
            calibration_progress = len(self._calibration_samples) / 30.0
            if len(self._calibration_samples) >= 30:
                # Compute median baseline
                self.baseline_calibration["baseline_yaw"] = float(np.median([s["yaw"] for s in self._calibration_samples]))
                self.baseline_calibration["baseline_pitch"] = float(np.median([s["pitch"] for s in self._calibration_samples]))
                self.baseline_calibration["baseline_roll"] = float(np.median([s["roll"] for s in self._calibration_samples]))
                self.baseline_calibration["baseline_ear"] = float(np.median([s["ear"] for s in self._calibration_samples]))
                self._calibrating = False

        # 3. Attention State Machine & Alert Decisions
        attention_result = self.attention.update(
            has_face=has_face,
            pose_data=pose_data,
            eye_data=eye_data,
            is_paused=is_paused,
            is_break=is_break,
            camera_healthy=camera_healthy
        )

        # 4. Generate annotated preview image if requested
        preview_base64 = None
        if show_preview:
            annotated = frame.copy()
            # Draw facial landmarks mesh contour if enabled
            if show_landmarks and landmarks:
                # Draw key points
                for idx in [1, 33, 263, 61, 291, 152]:
                    pt = landmarks[idx]
                    cx, cy = int(pt.x * w), int(pt.y * h)
                    cv2.circle(annotated, (cx, cy), 3, (0, 255, 200), -1)

                # Draw eye outlines
                from .eye_mouth import LEFT_EYE_INDICES, RIGHT_EYE_INDICES
                for e_idx in LEFT_EYE_INDICES + RIGHT_EYE_INDICES:
                    pt = landmarks[e_idx]
                    cx, cy = int(pt.x * w), int(pt.y * h)
                    cv2.circle(annotated, (cx, cy), 1, (0, 200, 255), -1)

            # Draw HUD status overlay
            state_color = (0, 230, 115)  # Green for attentive
            state_text = attention_result["state"]
            if state_text in ("LOOKING_AWAY", "EYES_CLOSED"):
                state_color = (40, 60, 240)  # Red
            elif state_text == "FACE_NOT_DETECTED":
                state_color = (0, 165, 255)  # Orange
            elif state_text in ("PAUSED", "BREAK_ACTIVE"):
                state_color = (200, 200, 200)

            # Top bar badge
            cv2.rectangle(annotated, (10, 10), (w - 10, 42), (20, 24, 33), -1)
            cv2.putText(
                annotated,
                f"STATUS: {state_text}",
                (20, 32),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                state_color,
                2
            )

            # Orientation text
            yaw_txt = f"Yaw: {pose_data['yaw']:+.1f}°"
            pitch_txt = f"Pitch: {pose_data['pitch']:+.1f}°"
            roll_txt = f"Roll: {pose_data['roll']:+.1f}°"
            cv2.putText(
                annotated,
                f"{yaw_txt} | {pitch_txt} | {roll_txt}",
                (20, h - 20),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (230, 230, 230),
                1
            )

            # Away timer badge if looking away
            if attention_result["away_duration_sec"] > 0:
                away_txt = f"AWAY: {attention_result['away_duration_sec']}s / {int(attention_result['alert_threshold_sec'])}s"
                cv2.putText(
                    annotated,
                    away_txt,
                    (w - 240, 32),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 100, 255),
                    2
                )

            # Compress preview to JPEG (quality 70 for fast low-latency streaming)
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 70]
            _, buffer = cv2.imencode('.jpg', annotated, encode_param)
            preview_base64 = base64.b64encode(buffer).decode('utf-8')

        return {
            "success": True,
            "has_face": has_face,
            "camera_healthy": camera_healthy,
            "fps": round(self.camera_manager.current_fps, 1),
            "pose": pose_data,
            "eye": eye_data,
            "attention": attention_result,
            "calibrating": self._calibrating,
            "calibration_progress": calibration_progress,
            "baseline": self.baseline_calibration,
            "preview_base64": preview_base64
        }

    def close(self) -> None:
        self.camera_manager.stop()
        if self.landmarker:
            self.landmarker.close()
            self.landmarker = None
        self._is_initialized = False
