import React from "react";
import { vi } from "vitest";

export class MockMediaStreamTrack {
  id = "mock-track-id-" + Math.random().toString(36).substring(7);
  kind: "audio" | "video";
  enabled = true;
  readyState = "live";
  _switchCamera = vi.fn();
  stop = vi.fn(() => {
    this.readyState = "ended";
  });

  constructor(kind: "audio" | "video" = "video") {
    this.kind = kind;
  }
}

export class MockMediaStream {
  id = "mock-stream-id-" + Math.random().toString(36).substring(7);
  tracks: MockMediaStreamTrack[] = [];

  constructor(tracks?: MockMediaStreamTrack[]) {
    this.tracks = tracks || [
      new MockMediaStreamTrack("audio"),
      new MockMediaStreamTrack("video"),
    ];
  }

  getTracks() {
    return this.tracks;
  }

  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === "audio");
  }

  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === "video");
  }

  addTrack(track: MockMediaStreamTrack) {
    this.tracks.push(track);
  }

  removeTrack(track: MockMediaStreamTrack) {
    this.tracks = this.tracks.filter((t) => t !== track);
  }

  toURL() {
    return `stream:${this.id}`;
  }
}

export class MockRTCPeerConnection {
  iceServers: any[];
  localDescription: any = null;
  remoteDescription: any = null;
  connectionState = "new";
  signalingState = "stable";
  iceConnectionState = "new";

  onicecandidate: ((event: any) => void) | null = null;
  ontrack: ((event: any) => void) | null = null;
  onaddstream: ((event: any) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;

  senders: any[] = [];
  listeners: Record<string, Function[]> = {};

  constructor(configuration?: any) {
    this.iceServers = configuration?.iceServers || [];
  }

  addEventListener(event: string, handler: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  removeEventListener(event: string, handler: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
    }
  }

  dispatchEvent(event: { type: string; [key: string]: any }) {
    const list = this.listeners[event.type] || [];
    list.forEach((fn) => fn(event));
  }

  addTrack(track: any, stream: any) {
    const sender = { track, stream };
    this.senders.push(sender);
    return sender;
  }

  addStream(_stream: any) {}

  createOffer = vi.fn(async () => {
    return { type: "offer", sdp: "v=0\r\no=mock 12345 1 IN IP4 127.0.0.1\r\ns=mock\r\n" };
  });

  createAnswer = vi.fn(async () => {
    return { type: "answer", sdp: "v=0\r\no=mock 54321 1 IN IP4 127.0.0.1\r\ns=mock\r\n" };
  });

  setLocalDescription = vi.fn(async (desc: any) => {
    this.localDescription = desc;
  });

  setRemoteDescription = vi.fn(async (desc: any) => {
    this.remoteDescription = desc;
  });

  addIceCandidate = vi.fn(async (_candidate: any) => {});

  close = vi.fn(() => {
    this.connectionState = "closed";
    if (this.onconnectionstatechange) this.onconnectionstatechange();
  });
}

export class MockRTCIceCandidate {
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
  constructor(init: any) {
    this.candidate = typeof init === "string" ? init : init?.candidate || "candidate:mock";
    this.sdpMid = init?.sdpMid;
    this.sdpMLineIndex = init?.sdpMLineIndex;
  }
  toJSON() {
    return {
      candidate: this.candidate,
      sdpMid: this.sdpMid,
      sdpMLineIndex: this.sdpMLineIndex,
    };
  }
}

export class MockRTCSessionDescription {
  type: string;
  sdp: string;
  constructor(init: any) {
    this.type = init?.type || "offer";
    this.sdp = init?.sdp || "";
  }
  toJSON() {
    return { type: this.type, sdp: this.sdp };
  }
}

export const mediaDevices = {
  getUserMedia: vi.fn(async (_constraints?: any) => {
    return new MockMediaStream();
  }),
  enumerateDevices: vi.fn(async () => []),
};

export const RTCView = React.forwardRef<any, any>(
  ({ testID, style, streamURL, objectFit, mirror, zOrder, ...props }, ref) => (
    <div
      ref={ref}
      data-testid={testID || "rtc-view"}
      data-stream-url={streamURL}
      data-object-fit={objectFit}
      data-mirror={mirror}
      data-z-order={zOrder}
      style={{
        width: "100%",
        height: "100%",
        ...(typeof style === "object" ? style : {}),
      }}
      {...props}
    />
  )
);
RTCView.displayName = "RTCView";

export {
  MockRTCPeerConnection as RTCPeerConnection,
  MockRTCIceCandidate as RTCIceCandidate,
  MockRTCSessionDescription as RTCSessionDescription,
  MockMediaStream as MediaStream,
  MockMediaStreamTrack as MediaStreamTrack,
};

export default {
  RTCPeerConnection: MockRTCPeerConnection,
  RTCIceCandidate: MockRTCIceCandidate,
  RTCSessionDescription: MockRTCSessionDescription,
  MediaStream: MockMediaStream,
  MediaStreamTrack: MockMediaStreamTrack,
  mediaDevices,
  RTCView,
};
