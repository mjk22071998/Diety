"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Clock,
  ShieldCheck,
  User,
} from "lucide-react";

export interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isVerified?: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
  roomId?: string;
  participantName?: string;
}

/**
 * VideoGrid Component
 *
 * Requirements:
 * - Full-height dark background (bg-gray-950)
 * - Remote video: large centered <video> element taking 85% of screen height
 * - Local video: picture-in-picture bottom-right, w-48 h-36, rounded, border border-indigo-500
 * - Controls bar (bottom center): Mute mic button, Camera toggle, End call (red), Timer display
 * - Timer shows MM:SS elapsed and "Verified ✓" badge when isVerified prop is true (server notified)
 * - Attendance verification indicator: indigo progress bar filling over 15 minutes (900s)
 */
export function VideoGrid({
  localStream,
  remoteStream,
  isConnected,
  isMuted,
  isCameraOff,
  isVerified = false,
  onToggleMute,
  onToggleCamera,
  onLeave,
  roomId,
  participantName,
}: VideoGridProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Attach local media stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote media stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // 1-second interval timer for consultation duration
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((sec) => sec + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number): string => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 15 minutes attendance verification progress (900 seconds)
  const attendanceProgress = Math.min(100, (elapsedSeconds / 900) * 100);

  return (
    <div
      data-testid="video-grid-container"
      className="relative w-full h-screen min-h-screen bg-gray-950 text-white flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Top Header & Attendance Verification Bar */}
      <div className="absolute top-0 left-0 right-0 z-30">
        {/* Progress Bar (filling over 15 minutes) */}
        <div
          className="w-full bg-gray-900/80 h-1.5"
          role="progressbar"
          aria-valuenow={Math.round(attendanceProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Attendance verification progress"
        >
          <div
            data-testid="attendance-progress-bar"
            className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
            style={{ width: `${attendanceProgress}%` }}
          />
        </div>

        {/* Top Header Information */}
        <header className="px-6 py-3.5 flex items-center justify-between bg-gradient-to-b from-gray-950/90 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-900/80 border border-gray-800 text-xs font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Room: {roomId || "Clinical Session"}</span>
            </div>
            {participantName && (
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                Participant: {participantName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-900/80 border border-gray-800 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>15m Attendance Protocol</span>
              <span className="font-mono text-indigo-300 ml-1">
                {Math.floor(elapsedSeconds / 60)}/15m
              </span>
            </div>
          </div>
        </header>
      </div>

      {/* Main Remote Video Area (large centered taking 85% of screen height) */}
      <main className="relative flex-1 flex items-center justify-center p-4 pt-14 pb-24">
        <div className="relative w-full max-w-6xl h-[85vh] flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            data-testid="remote-video"
            autoPlay
            playsInline
            aria-label="Remote consultation video"
            className="w-full h-full max-h-[85vh] rounded-2xl object-cover bg-black border border-gray-800 shadow-2xl"
          />

          {/* Placeholder when peer is not yet streaming video */}
          {(!isConnected || !remoteStream) && (
            <div
              data-testid="remote-placeholder"
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-gray-900/90 backdrop-blur-sm pointer-events-none"
            >
              <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-slate-500 mb-4 animate-pulse">
                <User className="w-10 h-10" />
              </div>
              <h3 className="text-base font-semibold text-slate-200 mb-1">
                Waiting for participant...
              </h3>
              <p className="text-xs text-slate-400 max-w-sm text-center">
                Secure WebRTC signaling connection established. The video stream will start automatically when your peer connects.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Local Video Picture-in-Picture (Bottom-Right, w-48 h-36, rounded, border border-indigo-500) */}
      <div
        data-testid="local-video-pip"
        className="absolute bottom-24 right-6 w-48 h-36 rounded-xl overflow-hidden border-2 border-indigo-500 shadow-2xl bg-gray-900 z-20 group"
      >
        <video
          ref={localVideoRef}
          data-testid="local-video"
          autoPlay
          playsInline
          muted
          aria-label="Local user video preview"
          className="w-full h-full object-cover"
        />

        {/* Camera Off Overlay */}
        {isCameraOff && (
          <div
            data-testid="camera-off-overlay"
            className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center text-slate-400"
          >
            <VideoOff className="w-6 h-6 text-slate-500 mb-1" />
            <span className="text-[11px] font-medium">Camera Off</span>
          </div>
        )}

        {/* Local Stream Mic Muted Indicator */}
        {isMuted && (
          <div
            data-testid="mic-muted-indicator"
            className="absolute top-2 right-2 p-1 rounded-md bg-red-600/90 text-white shadow-md"
            title="Microphone muted"
          >
            <MicOff className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Local Participant Tag */}
        <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-medium text-slate-300">
          You {isMuted ? "(Muted)" : ""}
        </div>
      </div>

      {/* Controls Bar (Bottom Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 md:gap-4 bg-gray-900/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-gray-800 shadow-2xl">
        {/* Timer Display with Verified Badge */}
        <div
          data-testid="timer-container"
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-950/80 rounded-xl border border-gray-800 text-sm font-mono tabular-nums text-slate-300"
        >
          <Clock className="w-4 h-4 text-slate-400" />
          <span data-testid="timer-display">{formatTimer(elapsedSeconds)}</span>
          {isVerified && (
            <span
              data-testid="verified-badge"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
            >
              Verified ✓
            </span>
          )}
        </div>

        {/* Mute Mic Button */}
        <button
          type="button"
          data-testid="mute-button"
          onClick={onToggleMute}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          className={`p-3 rounded-xl transition duration-150 flex items-center justify-center ${
            isMuted
              ? "bg-red-600/90 text-white hover:bg-red-700 active:bg-red-800 ring-2 ring-red-500/50"
              : "bg-gray-800 text-slate-200 hover:bg-gray-700 active:bg-gray-600"
          }`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera Toggle Button */}
        <button
          type="button"
          data-testid="camera-button"
          onClick={onToggleCamera}
          aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
          className={`p-3 rounded-xl transition duration-150 flex items-center justify-center ${
            isCameraOff
              ? "bg-amber-600/90 text-white hover:bg-amber-700 active:bg-amber-800 ring-2 ring-amber-500/50"
              : "bg-gray-800 text-slate-200 hover:bg-gray-700 active:bg-gray-600"
          }`}
        >
          {isCameraOff ? (
            <VideoOff className="w-5 h-5" />
          ) : (
            <Video className="w-5 h-5" />
          )}
        </button>

        {/* End Call Button (Red) */}
        <button
          type="button"
          data-testid="end-call-button"
          onClick={onLeave}
          aria-label="End consultation call"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium transition duration-150 shadow-lg shadow-red-900/30"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-sm font-semibold">End call</span>
        </button>
      </div>
    </div>
  );
}
