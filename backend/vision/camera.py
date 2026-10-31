"""
Webcam Capture Thread for FocusGuard AI
Provides thread-safe frame access, camera health monitoring, and graceful recovery.
"""

import cv2
import threading
import time
from typing import Optional, Tuple
import numpy as np


class CameraManager:
    def __init__(self, camera_index: int = 0, width: int = 640, height: int = 480):
        self.camera_index = camera_index
        self.width = width
        self.height = height
        self.cap: Optional[cv2.VideoCapture] = None
        self._lock = threading.Lock()
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._latest_frame: Optional[np.ndarray] = None
        self._last_frame_time: float = 0.0
        self._is_healthy = False
        self._fps_counter = 0
        self._fps_timer = time.time()
        self.current_fps: float = 0.0

    def start(self) -> bool:
        with self._lock:
            if self._running:
                return True
            self.cap = cv2.VideoCapture(self.camera_index)
            if not self.cap.isOpened():
                # Try fallback device if 0 fails
                self.cap.release()
                self.cap = cv2.VideoCapture(0)
            
            if not self.cap.isOpened():
                self._is_healthy = False
                return False

            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self._running = True
            self._is_healthy = True
            self._thread = threading.Thread(target=self._capture_loop, daemon=True)
            self._thread.start()
            return True

    def _capture_loop(self) -> None:
        while self._running:
            if self.cap is None or not self.cap.isOpened():
                self._is_healthy = False
                time.sleep(0.5)
                continue

            ret, frame = self.cap.read()
            if not ret or frame is None:
                self._is_healthy = False
                time.sleep(0.1)
                continue

            with self._lock:
                self._latest_frame = frame
                self._last_frame_time = time.monotonic()
                self._is_healthy = True
                self._fps_counter += 1

            now = time.time()
            if now - self._fps_timer >= 1.0:
                self.current_fps = self._fps_counter / (now - self._fps_timer)
                self._fps_counter = 0
                self._fps_timer = now

            # Sleep slightly to prevent pegging 100% CPU on capture
            time.sleep(0.01)

    def get_frame(self) -> Tuple[bool, Optional[np.ndarray]]:
        with self._lock:
            if not self._running or self._latest_frame is None:
                return False, None
            # Return a copy to avoid concurrency race during processing
            return True, self._latest_frame.copy()

    def is_healthy(self) -> bool:
        with self._lock:
            if not self._running or not self._is_healthy:
                return False
            # If no frame received in over 2 seconds, mark unhealthy
            return (time.monotonic() - self._last_frame_time) < 2.0

    def stop(self) -> None:
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        with self._lock:
            if self.cap:
                self.cap.release()
                self.cap = None
            self._latest_frame = None
            self._is_healthy = False
