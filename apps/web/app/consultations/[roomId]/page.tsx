"use client";

import React, { Suspense, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useWebRTC } from "@/hooks/useWebRTC";
import { VideoGrid } from "@/components/consultation/VideoGrid";
import { AlertCircle, Camera, RefreshCw, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

function ConsultationRoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId =
    typeof params?.roomId === "string"
      ? params.roomId
      : Array.isArray(params?.roomId)
      ? params.roomId[0] ?? ""
      : "";

  const participantId =
    searchParams?.get("participantId") || "participant-user";
  const participantName =
    searchParams?.get("name") || "Consultation Participant";

  const [hasLeft, setHasLeft] = useState<boolean>(false);

  const {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isCameraOff,
    isVerified,
    error,
    toggleMute,
    toggleCamera,
    leave,
  } = useWebRTC({
    roomId,
    participantId,
  });

  const handleLeave = () => {
    leave();
    setHasLeft(true);
  };

  // Error state: camera permission denied or media failure
  if (error) {
    return (
      <div
        data-testid="webrtc-error-state"
        className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-white"
      >
        <div className="max-w-md w-full bg-gray-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            Camera & Microphone Required
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {error ||
              "Could not access your camera or microphone. Please allow permissions in your browser and try again."}
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Permissions</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-slate-300 font-medium text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Call ended state
  if (hasLeft) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Camera className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            Consultation Completed
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            You have left room #{roomId}. Your attendance has been logged securely.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition"
          >
            Return to Marketplace
          </button>
        </div>
      </div>
    );
  }

  // Loading skeleton while initializing local media / awaiting connection
  return (
    <div className="relative min-h-screen bg-gray-950">
      {/* Loading skeleton banner when not yet connected */}
      {!isConnected && (
        <div
          data-testid="loading-skeleton"
          className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-4 py-2 rounded-full bg-gray-900/90 border border-indigo-500/30 text-indigo-300 text-xs font-medium shadow-lg backdrop-blur-md animate-pulse"
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          <span>Connecting to consultation room #{roomId}...</span>
        </div>
      )}

      {/* Main VideoGrid component */}
      <VideoGrid
        localStream={localStream}
        remoteStream={remoteStream}
        isConnected={isConnected}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isVerified={isVerified}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onLeave={handleLeave}
        roomId={roomId}
        participantName={participantName}
      />
    </div>
  );
}

export default function ConsultationRoomPage() {
  return (
    <Suspense
      fallback={
        <div
          data-testid="loading-skeleton"
          className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-4 animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
          <div className="h-4 w-48 bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-3 w-32 bg-gray-900 rounded animate-pulse" />
        </div>
      }
    >
      <ConsultationRoomContent />
    </Suspense>
  );
}
