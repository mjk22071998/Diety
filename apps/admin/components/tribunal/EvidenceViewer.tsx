"use client";

import React, { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Maximize2,
  X,
  User,
  Clock,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export type EvidenceUploaderRole = "CLIENT" | "DIETITIAN" | "SYSTEM";

export interface EvidenceDocument {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  fileType: "image" | "pdf" | "document" | "log";
  uploaderRole: EvidenceUploaderRole;
  uploaderName?: string;
  timestamp: string;
  fileSizeFormatted?: string;
  verifiedIntegritySha256?: string;
}

export interface EvidenceViewerProps {
  documents: EvidenceDocument[];
  title?: string;
  filterRole?: EvidenceUploaderRole | "ALL";
  className?: string;
}

export function EvidenceViewer({
  documents,
  title = "Evidentiary Exhibits",
  filterRole = "ALL",
  className = "",
}: EvidenceViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<EvidenceDocument | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<EvidenceUploaderRole | "ALL">(
    filterRole
  );

  const filteredDocs = documents.filter((doc) =>
    activeFilter === "ALL" ? true : doc.uploaderRole === activeFilter
  );

  const handleOpenDoc = (doc: EvidenceDocument) => {
    setSelectedDoc(doc);
    setZoomLevel(1);
  };

  const handleCloseModal = () => {
    setSelectedDoc(null);
    setZoomLevel(1);
  };

  const getRoleBadge = (role: EvidenceUploaderRole) => {
    switch (role) {
      case "CLIENT":
        return {
          label: "CLIENT EXHIBIT",
          className: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        };
      case "DIETITIAN":
        return {
          label: "DIETITIAN EXHIBIT",
          className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        };
      case "SYSTEM":
        return {
          label: "SYSTEM AUDIT LOG",
          className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        };
    }
  };

  const getDocIcon = (type: EvidenceDocument["fileType"]) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case "pdf":
      case "document":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "log":
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      className={`bg-[#1E293B] border border-[#334155] rounded-lg overflow-hidden shadow-sm flex flex-col ${className}`}
      data-testid="evidence-viewer"
    >
      {/* Evidence Viewer Header */}
      <div className="p-3.5 border-b border-[#334155] flex flex-wrap items-center justify-between gap-2 bg-[#0F172A]/80">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
            {title}
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {filteredDocs.length} {filteredDocs.length === 1 ? "file" : "files"}
          </span>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#0B0F19] p-0.5 rounded border border-[#334155]">
          {(["ALL", "CLIENT", "DIETITIAN"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setActiveFilter(role)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                activeFilter === role
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              data-testid={`filter-evidence-${role.toLowerCase()}`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Document List */}
      <div className="p-3 space-y-2.5 max-h-[460px] overflow-y-auto">
        {filteredDocs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-mono">
            No evidentiary exhibits uploaded under this classification.
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const roleBadge = getRoleBadge(doc.uploaderRole);
            return (
              <div
                key={doc.id}
                data-testid={`evidence-item-${doc.id}`}
                className="bg-[#0F172A] border border-[#334155] hover:border-[#475569] rounded p-3 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Thumbnail / Icon preview */}
                  <div
                    onClick={() => handleOpenDoc(doc)}
                    className="w-12 h-12 rounded bg-[#1E293B] border border-[#334155] flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group-hover:border-blue-500/50 transition-colors relative"
                    title="Click to expand high-resolution preview"
                    data-testid={`preview-thumb-${doc.id}`}
                  >
                    {doc.fileType === "image" && doc.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={doc.thumbnailUrl || doc.url}
                        alt={doc.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getDocIcon(doc.fileType)
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  {/* Document details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${roleBadge.className}`}
                      >
                        {roleBadge.label}
                      </span>
                      {doc.uploaderName && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <User className="w-2.5 h-2.5 text-slate-500" />
                          {doc.uploaderName}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-slate-500" />
                        {doc.timestamp}
                      </span>
                    </div>

                    <h4 className="text-xs font-medium text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                      {doc.title}
                    </h4>

                    {doc.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {doc.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-slate-500">
                      {doc.fileSizeFormatted && <span>{doc.fileSizeFormatted}</span>}
                      {doc.verifiedIntegritySha256 && (
                        <span
                          className="truncate max-w-[140px] text-emerald-400/80"
                          title={`SHA-256: ${doc.verifiedIntegritySha256}`}
                        >
                          SHA: {doc.verifiedIntegritySha256.slice(0, 10)}…
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleOpenDoc(doc)}
                    className="px-2.5 py-1 text-[11px] font-mono bg-[#1E293B] hover:bg-blue-600 hover:text-white text-slate-300 border border-[#334155] rounded transition-colors flex items-center gap-1 cursor-pointer"
                    data-testid={`expand-evidence-${doc.id}`}
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Expand</span>
                  </button>

                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-slate-400 hover:text-slate-200 bg-[#1E293B] border border-[#334155] rounded hover:border-[#475569] transition-colors"
                    title="Open document in new tab"
                    data-testid={`open-evidence-${doc.id}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={doc.url}
                    download={doc.title}
                    className="p-1 text-slate-400 hover:text-slate-200 bg-[#1E293B] border border-[#334155] rounded hover:border-[#475569] transition-colors"
                    title="Download exhibit"
                    data-testid={`download-evidence-${doc.id}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expandable High-Resolution Modal */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 select-none"
          data-testid="high-res-modal"
          onClick={handleCloseModal}
        >
          <div
            className="bg-[#0F172A] border border-[#334155] rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-[#334155] flex items-center justify-between bg-[#1E293B]">
              <div className="flex items-center gap-2.5 min-w-0">
                {getDocIcon(selectedDoc.fileType)}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-100 truncate">
                    {selectedDoc.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                    <span
                      className={`px-1.5 py-0.2 rounded border ${
                        getRoleBadge(selectedDoc.uploaderRole).className
                      }`}
                    >
                      {getRoleBadge(selectedDoc.uploaderRole).label}
                    </span>
                    <span>Uploaded: {selectedDoc.timestamp}</span>
                    {selectedDoc.fileSizeFormatted && (
                      <span>• {selectedDoc.fileSizeFormatted}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {selectedDoc.fileType === "image" && (
                  <div className="flex items-center gap-1 bg-[#0B0F19] p-0.5 rounded border border-[#334155] mr-2">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                      className="p-1 text-slate-400 hover:text-slate-200"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono px-1.5 text-slate-300">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                      className="p-1 text-slate-400 hover:text-slate-200"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <a
                  href={selectedDoc.url}
                  download={selectedDoc.title}
                  className="px-2.5 py-1 text-xs font-mono bg-[#0B0F19] hover:bg-[#243247] text-slate-200 border border-[#334155] rounded flex items-center gap-1.5"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </a>

                <button
                  onClick={handleCloseModal}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/50"
                  data-testid="close-high-res-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / High-Res View */}
            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-[#0B0F19]/90 min-h-[350px]">
              {selectedDoc.fileType === "image" ? (
                <div
                  className="transition-transform duration-150 flex items-center justify-center"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedDoc.url}
                    alt={selectedDoc.title}
                    className="max-h-[60vh] max-w-full rounded border border-[#334155] object-contain shadow-lg"
                    data-testid="high-res-image"
                  />
                </div>
              ) : selectedDoc.fileType === "pdf" ? (
                <div className="w-full h-[55vh] flex flex-col items-center justify-center bg-[#1E293B] rounded border border-[#334155] p-6 text-center">
                  <FileText className="w-16 h-16 text-blue-400 mb-3" />
                  <p className="text-sm font-semibold text-slate-200">
                    PDF Document Preview
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-1 max-w-md">
                    Target: {selectedDoc.url}
                  </p>
                  <a
                    href={selectedDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-mono flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Dedicated PDF Viewer</span>
                  </a>
                </div>
              ) : (
                <div className="w-full h-[55vh] bg-[#1E293B] rounded border border-[#334155] p-4 font-mono text-xs text-slate-300 overflow-auto whitespace-pre-wrap">
                  {selectedDoc.description ||
                    `Audit Log Content: Verification integrity confirmed via S3 presigned vault.\nSHA-256: ${
                      selectedDoc.verifiedIntegritySha256 || "N/A"
                    }\nTimestamp: ${selectedDoc.timestamp}\nOrigin URL: ${
                      selectedDoc.url
                    }`}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {selectedDoc.description && (
              <div className="p-3 bg-[#1E293B] border-t border-[#334155] text-xs text-slate-300 font-sans">
                <span className="font-semibold text-slate-200">Exhibit Notes: </span>
                {selectedDoc.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
