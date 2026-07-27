'use client';

import { useState } from 'react';
import type { CaseDocument } from '@/types';

type Props = {
  document: CaseDocument;
  onClose: () => void;
};

export function DocumentPreviewModal({ document: doc, onClose }: Props) {
  const [loadError, setLoadError] = useState(false);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-fast-text truncate">{doc.name}</h3>
            <p className="text-xs text-fast-muted">{doc.type}</p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {doc.viewUrl && (
              <a
                href={doc.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-fast-teal hover:underline px-2 py-1 rounded border border-fast-teal/40 hover:bg-fast-teal/5"
              >
                Open in new tab
              </a>
            )}
            <button
              onClick={onClose}
              className="text-fast-muted hover:text-fast-text text-2xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-[300px] flex items-center justify-center bg-gray-50">
          {doc.viewUrl && !loadError ? (
            <iframe
              src={doc.viewUrl}
              className="w-full h-full min-h-[70vh] border-0"
              title={doc.name}
              onError={() => setLoadError(true)}
            />
          ) : (
            <div className="text-center py-12 px-6">
              <span className="text-4xl block mb-3">📄</span>
              <p className="text-sm text-fast-muted mb-3">
                {loadError
                  ? 'Unable to load document preview.'
                  : 'No document URL available.'}
              </p>
              {doc.viewUrl && (
                <a
                  href={doc.viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-fast-teal hover:underline"
                >
                  Open in new tab instead
                </a>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-fast-text hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
