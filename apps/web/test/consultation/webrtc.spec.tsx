import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, renderHook } from "@testing-library/react";
import React, { useState } from "react";
import { VideoGrid } from "@/components/consultation/VideoGrid";
import { useWebRTC } from "@/hooks/useWebRTC";

// Mocks
const mockSocketEmit = vi.fn();
const mockSocketOn = vi.fn();
const mockSocketDisconnect = vi.fn();

const mockSocketInstance = {
  emit: mockSocketEmit,
  on: mockSocketOn,
  disconnect: mockSocketDisconnect,
  connected: true,
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocketInstance),
}));

const mockPeerOn = vi.fn();
const mockPeerSignal = vi.fn();
const mockPeerDestroy = vi.fn();

vi.mock("simple-peer", () => ({
  default: vi.fn().mockImplementation(() => ({
    on: mockPeerOn,
    signal: mockPeerSignal,
    destroy: mockPeerDestroy,
  })),
}));

describe("WebRTC In-Browser Consultation Room", () => {
  let mockAudioTrack: { kind: string; enabled: boolean; stop: () => void };
  let mockVideoTrack: { kind: string; enabled: boolean; stop: () => void };
  let mockStream: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAudioTrack = {
      kind: "audio",
      enabled: true,
      stop: vi.fn(),
    };

    mockVideoTrack = {
      kind: "video",
      enabled: true,
      stop: vi.fn(),
    };

    mockStream = {
      getTracks: vi.fn(() => [mockAudioTrack, mockVideoTrack]),
      getAudioTracks: vi.fn(() => [mockAudioTrack]),
      getVideoTracks: vi.fn(() => [mockVideoTrack]),
    };

    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("VideoGrid Component", () => {
    it("renders local and remote video elements", () => {
      render(
        <VideoGrid
          localStream={mockStream as unknown as MediaStream}
          remoteStream={mockStream as unknown as MediaStream}
          isConnected={true}
          isMuted={false}
          isCameraOff={false}
          isVerified={false}
          onToggleMute={vi.fn()}
          onToggleCamera={vi.fn()}
          onLeave={vi.fn()}
          roomId="room-test-101"
        />
      );

      const localVideo = screen.getByTestId("local-video");
      const remoteVideo = screen.getByTestId("remote-video");
      const container = screen.getByTestId("video-grid-container");

      expect(localVideo).toBeDefined();
      expect(remoteVideo).toBeDefined();
      expect(container.className).toContain("bg-gray-950");
      expect(screen.getByTestId("local-video-pip").className).toContain("border-indigo-500");
    });

    it("toggleMute changes muted state and calls handler", () => {
      function TestHarness() {
        const [isMuted, setIsMuted] = useState(false);
        return (
          <VideoGrid
            localStream={mockStream as unknown as MediaStream}
            remoteStream={null}
            isConnected={false}
            isMuted={isMuted}
            isCameraOff={false}
            isVerified={false}
            onToggleMute={() => setIsMuted((prev) => !prev)}
            onToggleCamera={vi.fn()}
            onLeave={vi.fn()}
            roomId="room-test-101"
          />
        );
      }

      render(<TestHarness />);

      const muteBtn = screen.getByTestId("mute-button");
      expect(muteBtn.getAttribute("aria-label")).toBe("Mute microphone");
      expect(screen.queryByTestId("mic-muted-indicator")).toBeNull();

      // Click to mute
      fireEvent.click(muteBtn);

      expect(muteBtn.getAttribute("aria-label")).toBe("Unmute microphone");
      expect(screen.getByTestId("mic-muted-indicator")).toBeDefined();
    });

    it("displays Verified ✓ badge when isVerified is true", () => {
      const { rerender } = render(
        <VideoGrid
          localStream={mockStream as unknown as MediaStream}
          remoteStream={null}
          isConnected={false}
          isMuted={false}
          isCameraOff={false}
          isVerified={false}
          onToggleMute={vi.fn()}
          onToggleCamera={vi.fn()}
          onLeave={vi.fn()}
        />
      );

      expect(screen.queryByTestId("verified-badge")).toBeNull();

      rerender(
        <VideoGrid
          localStream={mockStream as unknown as MediaStream}
          remoteStream={null}
          isConnected={false}
          isMuted={false}
          isCameraOff={false}
          isVerified={true}
          onToggleMute={vi.fn()}
          onToggleCamera={vi.fn()}
          onLeave={vi.fn()}
        />
      );

      const badge = screen.getByTestId("verified-badge");
      expect(badge).toBeDefined();
      expect(badge.textContent).toContain("Verified ✓");
    });

    it("renders attendance verification progress bar", () => {
      render(
        <VideoGrid
          localStream={mockStream as unknown as MediaStream}
          remoteStream={null}
          isConnected={true}
          isMuted={false}
          isCameraOff={false}
          isVerified={false}
          onToggleMute={vi.fn()}
          onToggleCamera={vi.fn()}
          onLeave={vi.fn()}
        />
      );

      const progressBar = screen.getByTestId("attendance-progress-bar");
      expect(progressBar).toBeDefined();
      expect(progressBar.className).toContain("bg-indigo-500");
    });
  });

  describe("useWebRTC Hook", () => {
    it("heartbeat timer is set up on mount", async () => {
      vi.useFakeTimers();

      renderHook(() =>
        useWebRTC({
          roomId: "room-abc-123",
          participantId: "dietitian-456",
        })
      );

      // Await promise resolution for getUserMedia
      await act(async () => {
        await Promise.resolve();
      });

      // Verify socket joined room
      expect(mockSocketEmit).toHaveBeenCalledWith("join-room", {
        sessionId: "room-abc-123",
        participantId: "dietitian-456",
      });

      // Advance timers by 60 seconds (heartbeat interval)
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(mockSocketEmit).toHaveBeenCalledWith(
        "heartbeat",
        expect.objectContaining({
          sessionId: "room-abc-123",
          participantId: "dietitian-456",
        }),
        expect.any(Function)
      );
    });

    it("toggleMute changes audio track enabled property and hook state", async () => {
      const { result } = renderHook(() =>
        useWebRTC({
          roomId: "room-abc-123",
          participantId: "dietitian-456",
        })
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isMuted).toBe(false);
      expect(mockAudioTrack.enabled).toBe(true);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(true);
      expect(mockAudioTrack.enabled).toBe(false);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(false);
      expect(mockAudioTrack.enabled).toBe(true);
    });

    it("toggleCamera toggles video track enabled property", async () => {
      const { result } = renderHook(() =>
        useWebRTC({
          roomId: "room-abc-123",
          participantId: "dietitian-456",
        })
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isCameraOff).toBe(false);
      expect(mockVideoTrack.enabled).toBe(true);

      act(() => {
        result.current.toggleCamera();
      });

      expect(result.current.isCameraOff).toBe(true);
      expect(mockVideoTrack.enabled).toBe(false);
    });

    it("handles getUserMedia permission failure", async () => {
      Object.defineProperty(global.navigator, "mediaDevices", {
        value: {
          getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied")),
        },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() =>
        useWebRTC({
          roomId: "room-abc-123",
          participantId: "dietitian-456",
        })
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.error).toBe("Permission denied");
      expect(result.current.localStream).toBeNull();
    });

    it("cleans up media tracks and socket connection on leave", async () => {
      const { result } = renderHook(() =>
        useWebRTC({
          roomId: "room-abc-123",
          participantId: "dietitian-456",
        })
      );

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        result.current.leave();
      });

      expect(mockAudioTrack.stop).toHaveBeenCalled();
      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(mockSocketDisconnect).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
    });
  });
});
