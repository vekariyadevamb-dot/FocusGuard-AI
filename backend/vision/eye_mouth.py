"""
Eye and Mouth Analysis Module for FocusGuard AI
Calculates Eye Aspect Ratio (EAR), Blink counts, Prolonged Eye Closure,
Mouth Aspect Ratio (MAR), and Possible Yawns.
"""

import time
import math
from typing import Dict, Any, List, Optional


def euclidean_dist(p1, p2) -> float:
    return math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)


# MediaPipe Mesh Landmark Indices
LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]   # [corner_outer, top1, top2, corner_inner, bottom2, bottom1]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380] # [corner_inner, top1, top2, corner_outer, bottom2, bottom1]

MOUTH_UPPER_LIP = 13
MOUTH_LOWER_LIP = 14
MOUTH_LEFT_CORNER = 61
MOUTH_RIGHT_CORNER = 291


class EyeMouthAnalyzer:
    def __init__(
        self,
        ear_threshold: float = 0.21,
        blink_min_duration: float = 0.08,
        blink_max_duration: float = 0.45,
        prolonged_closure_threshold_sec: float = 2.0,
        yawn_mar_threshold: float = 0.55,
        yawn_min_duration_sec: float = 1.3
    ):
        self.ear_threshold = ear_threshold
        self.blink_min_duration = blink_min_duration
        self.blink_max_duration = blink_max_duration
        self.prolonged_closure_threshold_sec = prolonged_closure_threshold_sec
        self.yawn_mar_threshold = yawn_mar_threshold
        self.yawn_min_duration_sec = yawn_min_duration_sec

        # State tracking
        self.blink_count: int = 0
        self.prolonged_closure_count: int = 0
        self.yawn_count: int = 0

        self._eye_closed_start_time: Optional[float] = None
        self._prolonged_closure_active: bool = False

        self._mouth_open_start_time: Optional[float] = None
        self._yawn_recorded_for_current_event: bool = False

        self.last_blink_time: float = 0.0

    def calculate_ear(self, landmarks, eye_indices: List[int]) -> float:
        p1 = landmarks[eye_indices[0]]
        p2 = landmarks[eye_indices[1]]
        p3 = landmarks[eye_indices[2]]
        p4 = landmarks[eye_indices[3]]
        p5 = landmarks[eye_indices[4]]
        p6 = landmarks[eye_indices[5]]

        vertical_1 = euclidean_dist(p2, p6)
        vertical_2 = euclidean_dist(p3, p5)
        horizontal = euclidean_dist(p1, p4)

        if horizontal == 0:
            return 0.0
        return (vertical_1 + vertical_2) / (2.0 * horizontal)

    def calculate_mar(self, landmarks) -> float:
        p_top = landmarks[MOUTH_UPPER_LIP]
        p_bottom = landmarks[MOUTH_LOWER_LIP]
        p_left = landmarks[MOUTH_LEFT_CORNER]
        p_right = landmarks[MOUTH_RIGHT_CORNER]

        vertical = euclidean_dist(p_top, p_bottom)
        horizontal = euclidean_dist(p_left, p_right)

        if horizontal == 0:
            return 0.0
        return vertical / horizontal

    def process(
        self,
        landmarks,
        blendshapes: Optional[List[Any]] = None
    ) -> Dict[str, Any]:
        now = time.monotonic()

        if not landmarks:
            return {
                "ear": 0.0,
                "mar": 0.0,
                "eyes_closed": False,
                "closure_duration": 0.0,
                "prolonged_closure": False,
                "blink_count": self.blink_count,
                "is_yawning": False,
                "yawn_count": self.yawn_count,
                "jaw_open_score": 0.0
            }

        left_ear = self.calculate_ear(landmarks, LEFT_EYE_INDICES)
        right_ear = self.calculate_ear(landmarks, RIGHT_EYE_INDICES)
        avg_ear = (left_ear + right_ear) / 2.0

        # Parse blendshapes if available
        blend_blink_score = 0.0
        jaw_open_score = 0.0
        if blendshapes:
            b_dict = {b.category_name: b.score for b in blendshapes}
            left_blink = b_dict.get("eyeBlinkLeft", 0.0)
            right_blink = b_dict.get("eyeBlinkRight", 0.0)
            blend_blink_score = (left_blink + right_blink) / 2.0
            jaw_open_score = b_dict.get("jawOpen", 0.0)

        # Fused eye closure decision: EAR < threshold OR blendshape > 0.50
        is_closed = (avg_ear < self.ear_threshold) or (blend_blink_score > 0.50)

        prolonged_closure_alert = False
        closure_duration = 0.0

        if is_closed:
            if self._eye_closed_start_time is None:
                self._eye_closed_start_time = now
            else:
                closure_duration = now - self._eye_closed_start_time
                if closure_duration >= self.prolonged_closure_threshold_sec:
                    if not self._prolonged_closure_active:
                        self._prolonged_closure_active = True
                        self.prolonged_closure_count += 1
                        prolonged_closure_alert = True
        else:
            if self._eye_closed_start_time is not None:
                closed_time = now - self._eye_closed_start_time
                # Check if it was a normal blink
                if self.blink_min_duration <= closed_time <= self.blink_max_duration:
                    self.blink_count += 1
                    self.last_blink_time = now
                self._eye_closed_start_time = None
                self._prolonged_closure_active = False

        # MAR and Yawn analysis
        mar = self.calculate_mar(landmarks)
        # Mouth open condition: MAR > threshold OR jawOpen blendshape > 0.45
        mouth_wide_open = (mar > self.yawn_mar_threshold) or (jaw_open_score > 0.45)

        is_yawning = False
        if mouth_wide_open:
            if self._mouth_open_start_time is None:
                self._mouth_open_start_time = now
            else:
                open_duration = now - self._mouth_open_start_time
                if open_duration >= self.yawn_min_duration_sec:
                    is_yawning = True
                    if not self._yawn_recorded_for_current_event:
                        self.yawn_count += 1
                        self._yawn_recorded_for_current_event = True
        else:
            self._mouth_open_start_time = None
            self._yawn_recorded_for_current_event = False

        return {
            "ear": round(avg_ear, 3),
            "mar": round(mar, 3),
            "eyes_closed": is_closed,
            "closure_duration": round(closure_duration, 2),
            "prolonged_closure": prolonged_closure_alert or self._prolonged_closure_active,
            "prolonged_closure_alert": prolonged_closure_alert,
            "blink_count": self.blink_count,
            "is_yawning": is_yawning,
            "yawn_count": self.yawn_count,
            "jaw_open_score": round(jaw_open_score, 2),
            "blend_blink_score": round(blend_blink_score, 2)
        }

    def reset(self):
        self.blink_count = 0
        self.prolonged_closure_count = 0
        self.yawn_count = 0
        self._eye_closed_start_time = None
        self._prolonged_closure_active = False
        self._mouth_open_start_time = None
        self._yawn_recorded_for_current_event = False
