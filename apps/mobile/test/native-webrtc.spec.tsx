import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, renderHook } from "@testing-library/react";
import { MediaStream } from "react-native-webrtc";
import { useNativeWebRTC } from "../hooks/useNativeWebRTC";
import { ConsultationCall } from "../components/ConsultationCall";
import ConsultationScreen from "../app/consultation/[roomId]";
import { MockMediaStream, mediaDevices } from "./mocks/react-native-webrtc";

// Mock socket.io-client
const mockSocketListeners: Record<string, Function[]> = {};
const mockSocketEmits: Array<{ event: string; data: any; ack?: Function | undefined }> = [];

const mockSocket = {
  connected: true,
  id: "mock-socket-001",
  on: vi.fn((event: string, callback: Function) => {
    if (!mockSocketListeners[event]) {
      mockSocketListeners[event] = [];
    }
    mockSocketListeners[event].push(callback);
    return mockSocket;
  }),
  emit: vi.fn((event: string, data: any, ack?: Function | undefined) => {
    mockSocketEmits.push({ event, data, ack });
    return mockSocket;
  }),
  disconnect: vi.fn(),
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

// Helper to trigger socket event from server to client
function triggerSocketEvent(event: string, ...args: any[]) {
  const handlers = mockSocketListeners[event] || [];
  handlers.forEach((h) => h(...args));
}

describe("Native WebRTC Telehealth Consultation (Task 7.2)", () => {
  let mockStream: MockMediaStream;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    Object.keys(mockSocketListeners).forEach((k) => delete mockSocketListeners[k]);
    mockSocketEmits.length = 0;

    mockStream = new MockMediaStream();
    mediaDevices.getUserMedia = vi.fn(async () => mockStream);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("useNativeWebRTC hook", () => {
    it("initializes peer connection and registers socket listeners", async () => {
      const { result } = renderHook(() =>
        useNativeWebRTC({
          roomId: "room-test-123",
          participantId: "client-alex",
          signalingUrl: "ws://localhost:3301/signaling",
        })
      );

      // Allow async initializeCall to complete
      await act(async () => {
        await Promise.resolve();
      });

      // Verify mediaDevices.getUserMedia requested audio & user camera
      expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: true,
        video: { facingMode: "user" },
      });

      // Verify local stream state
      expect(result.current.localStream).toBe(mockStream);
      expect(result.current.isConnected).toBe(false);

      // Verify socket listeners registered
      expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("peer-joined", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("signal-offer", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("signal-answer", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("ice-candidate", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("session-verified", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("peer-disconnected", expect.any(Function));

      // Verify join-room emitted with roomId and participantId
      expect(mockSocket.emit).toHaveBeenCalledWith("join-room", {
        sessionId: "room-test-123",
        participantId: "client-alex",
      });
    });

    it("handles peer-joined by generating offer and emitting signal-offer", async () => {
      renderHook(() =>
        useNativeWebRTC({
          roomId: "room-test-123",
          participantId: "client-alex",
        })
      );

      await act(async () => {
        await Promise.resolve();
      });

      // Remote peer joins
      await act(async () => {
        triggerSocketEvent("peer-joined");
        await Promise.resolve();
      });

      // Verify signal-offer emitted
      const offerEmit = mockSocketEmits.find((e) => e.event === "signal-offer");
      expect(offerEmit).toBeDefined();
      expect(offerEmit?.data.sessionId).toBe("room-test-123");
      expect(offerEmit?.data.payload.type).toBe("offer");
    });

    it("handles signal-offer and responds with signal-answer", async () => {
      renderHook(() =>
        useNativeWebRTC({
          roomId: "room-test-123",
          participantId: "client-alex",
        })
      );

      await act(async () => {
        await Promise.resolve();
      });

      // Receiving incoming offer from remote dietitian
      await act(async () => {
        triggerSocketEvent("signal-offer", {
          type: "offer",
          sdp: "mock-remote-sdp",
        });
        await Promise.resolve();
      });

      const answerEmit = mockSocketEmits.find((e) => e.event === "signal-answer");
      expect(answerEmit).toBeDefined();
      expect(answerEmit?.data.sessionId).toBe("room-test-123");
      expect(answerEmit?.data.payload.type).toBe("answer");
    });

    it("toggles mute and updates audio track state", async () => {
      const { result } = renderHook(() =>
        useNativeWebRTC({
          roomId: "room-test-123",
          participantId: "client-alex",
        })
      );

      await act(async () => {
        await Promise.resolve();
      });

      const audioTrack = mockStream.getAudioTracks()[0];
      expect(audioTrack).toBeDefined();
      expect(audioTrack!.enabled).toBe(true);
      expect(result.current.isMuted).toBe(false);

      // Toggle mute ON
      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(true);
      expect(audioTrack!.enabled).toBe(false);

      // Toggle mute OFF
      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(false);
      expect(audioTrack!.enabled).toBe(true);
    });

    it("toggles camera and updates video track state", async () => {
      const { result } = renderHook(() =>
        useNativeWebRTC({
          roomId: "room-test-123",
          participantId: "client-alex",
        })
      );

      await act(async () => {
        await Promise.resolve();
      });

      const videoTrack = mockStream.getVideoTracks()[0];
      expect(videoTrack).toBeDefined();
      expect(videoTrack!.enabled).toBe(true);
      expect(result.current.isCameraOff).toBe(false);

      // Toggle camera OFF
      act(() => {
        result.current.toggleCamera();
      });

      expect(result.current.isCameraOff).toBe(true);
      expect(videoTrack!.enabled).toBe(false);

      // Toggle camera ON
      act(() => {
        result.current.toggleCamera();
      });

      expect(result.current.isCameraOff).toBe(false);
      expect(videoTrack!.enabled).toBe(true);
    });

    it("switches camera using track _switchCamera API", async () => {
      const { result } = renderHook(() =>
        useNativeWebRTC({
          roomId: "room-test-123",
          participantId: "client-alex",
        })
      );

      await act(async () => {
        await Promise.resolve();
      });

      const videoTrack = mockStream.getVideoTracks()[0];
      expect(videoTrack).toBeDefined();
      expect(videoTrack!._switchCamera).not.toHaveBeenCalled();

      act(() => {
        result.current.switchCamera();
      });

      expect(videoTrack!._switchCamera).toHaveBeenCalledTimes(1);
    });

    it("emits periodic presence heartbeats every 10 seconds", async () => {
      renderHook(() =>
        useNativeWebRTC({
          roomId: "room-session-999",
          participantId: "client-alex",
        })
      );

      await act(async () => {
        await Promise.resolve();
      });

      // Clear previous emits
      mockSocket.emit.mockClear();

      // Fast forward 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "heartbeat",
        {
          sessionId: "room-session-999",
          participantId: "client-alex",
        },
        expect.any(Function)
      );

      // Fast forward another 10 seconds (total 20s)
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
    });

    it("handles session-verified event and sets isVerified: true", async () => {
      const { result } = renderHook(() =>
        useNativeWebRTC({
          roomId: "room-session-999",
          participantId: "client-alex",
        })
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isVerified).toBe(false);

      // Mutual 15m verification event received from backend accumulator
      act(() => {
        triggerSocketEvent("session-verified", {
          sessionId: "room-session-999",
          mutualAttendanceMinutes: 15,
        });
      });

      expect(result.current.isVerified).toBe(true);
    });

    it("handles session verification via heartbeat acknowledgement callback", async () => {
      const { result } = renderHook(() =>
        useNativeWebRTC({
          roomId: "room-session-999",
          participantId: "client-alex",
        })
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isVerified).toBe(false);

      // Fast forward 10s to trigger heartbeat
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Find heartbeat emit and call its ack callback with isVerified: true
      const heartbeatCall = mockSocket.emit.mock.calls.find(
        (call: any[]) => call[0] === "heartbeat"
      );
      expect(heartbeatCall).toBeDefined();
      const ackCallback = heartbeatCall?.[2];

      act(() => {
        ackCallback?.({ acknowledged: true, isVerified: true });
      });

      expect(result.current.isVerified).toBe(true);
    });

    it("handles endCall by stopping tracks and disconnecting", async () => {
      const { result } = renderHook(() =>
        useNativeWebRTC({
          roomId: "room-test-123",
          participantId: "client-alex",
        })
      );

      await act(async () => {
        await Promise.resolve();
      });

      const audioTrack = mockStream.getAudioTracks()[0];
      const videoTrack = mockStream.getVideoTracks()[0];
      expect(audioTrack).toBeDefined();
      expect(videoTrack).toBeDefined();

      act(() => {
        result.current.endCall();
      });

      expect(audioTrack!.stop).toHaveBeenCalled();
      expect(videoTrack!.stop).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(result.current.localStream).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe("ConsultationCall Component", () => {
    it("renders video views, elapsed timer, and control bar", async () => {
      const mockRemoteStream = new MockMediaStream();

      act(() => {
        render(
          <ConsultationCall
            roomId="room-402"
            participantId="usr-100"
            roomTitle="Metabolic Protocol Consultation"
            webRTCState={{
              localStream: mockStream as unknown as MediaStream,
              remoteStream: mockRemoteStream as unknown as MediaStream,
              isConnected: true,
              isMuted: false,
              isCameraOff: false,
              isVerified: false,
            }}
          />
        );
      });

      // Fullscreen view container
      expect(screen.getByTestId("consultation-call-screen")).toBeDefined();

      // Remote video rendering
      expect(screen.getByTestId("remote-video")).toBeDefined();

      // Local PiP video rendering
      expect(screen.getByTestId("local-video")).toBeDefined();

      // Title & timer
      expect(screen.getByText("Metabolic Protocol Consultation")).toBeDefined();
      expect(screen.getByTestId("call-timer")).toBeDefined();

      // Attendance verification pending badge
      expect(screen.getByTestId("attendance-pending-badge")).toBeDefined();
      expect(screen.getByText("15m Verification")).toBeDefined();

      // Controls
      expect(screen.getByTestId("toggle-mute-button")).toBeDefined();
      expect(screen.getByTestId("toggle-camera-button")).toBeDefined();
      expect(screen.getByTestId("switch-camera-button")).toBeDefined();
      expect(screen.getByTestId("end-call-button")).toBeDefined();
    });

    it("displays attendance verified badge when isVerified is true", () => {
      act(() => {
        render(
          <ConsultationCall
            roomId="room-402"
            participantId="usr-100"
            webRTCState={{
              localStream: mockStream as unknown as MediaStream,
              remoteStream: null,
              isConnected: true,
              isVerified: true,
            }}
          />
        );
      });

      expect(screen.getByTestId("verified-badge")).toBeDefined();
      expect(screen.getByText("✓ Attendance Verified")).toBeDefined();
      expect(screen.queryByTestId("attendance-pending-badge")).toBeNull();
    });

    it("displays camera off placeholder in PiP when isCameraOff is true", () => {
      act(() => {
        render(
          <ConsultationCall
            roomId="room-402"
            participantId="usr-100"
            webRTCState={{
              localStream: mockStream as unknown as MediaStream,
              isCameraOff: true,
            }}
          />
        );
      });

      expect(screen.getByTestId("camera-off-pip")).toBeDefined();
      expect(screen.getByText("Camera Off")).toBeDefined();
    });

    it("triggers toggle controls and endCall when buttons are clicked", () => {
      const toggleMuteMock = vi.fn();
      const toggleCameraMock = vi.fn();
      const switchCameraMock = vi.fn();
      const endCallMock = vi.fn();
      const onEndCallMock = vi.fn();

      act(() => {
        render(
          <ConsultationCall
            roomId="room-402"
            participantId="usr-100"
            onEndCall={onEndCallMock}
            webRTCState={{
              localStream: mockStream as unknown as MediaStream,
              toggleMute: toggleMuteMock,
              toggleCamera: toggleCameraMock,
              switchCamera: switchCameraMock,
              endCall: endCallMock,
            }}
          />
        );
      });

      act(() => {
        fireEvent.click(screen.getByTestId("toggle-mute-button"));
      });
      expect(toggleMuteMock).toHaveBeenCalledTimes(1);

      act(() => {
        fireEvent.click(screen.getByTestId("toggle-camera-button"));
      });
      expect(toggleCameraMock).toHaveBeenCalledTimes(1);

      act(() => {
        fireEvent.click(screen.getByTestId("switch-camera-button"));
      });
      expect(switchCameraMock).toHaveBeenCalledTimes(1);

      act(() => {
        fireEvent.click(screen.getByTestId("end-call-button"));
      });
      expect(endCallMock).toHaveBeenCalledTimes(1);
      expect(onEndCallMock).toHaveBeenCalledTimes(1);
    });

    it("advances elapsed timer every second", () => {
      act(() => {
        render(
          <ConsultationCall
            roomId="room-402"
            participantId="usr-100"
            webRTCState={{ localStream: mockStream as unknown as MediaStream }}
          />
        );
      });

      expect(screen.getByTestId("call-timer").textContent).toBe("00:00");

      act(() => {
        vi.advanceTimersByTime(65000); // 1 minute 5 seconds
      });

      expect(screen.getByTestId("call-timer").textContent).toBe("01:05");
    });
  });

  describe("Consultation Route Permissions Fallback", () => {
    it("renders permissions fallback view when media access fails", async () => {
      // Mock getUserMedia failure (permission denied)
      mediaDevices.getUserMedia = vi.fn(async () => {
        throw new Error("Permission denied by user");
      });

      act(() => {
        render(<ConsultationScreen />);
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId("permissions-fallback")).toBeDefined();
      expect(
        screen.getByText("Camera or Microphone Access Required")
      ).toBeDefined();
      expect(screen.getByTestId("error-message").textContent).toContain(
        "Permission denied by user"
      );
      expect(screen.getByTestId("permission-fallback-back")).toBeDefined();
      expect(screen.getByTestId("permission-fallback-retry")).toBeDefined();
    });
  });
});
