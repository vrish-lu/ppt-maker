import React, { useState } from 'react';
import { SlideCard } from '../../types';
import { DownloadService } from '../../services/download';

interface DownloadButtonProps {
  slides: SlideCard[];
  title: string;
  theme: any;
  disabled?: boolean;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  slides,
  title,
  theme,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');

  const downloadFormats = [
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Download as PDF for printing and sharing',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'pptx',
      name: 'PPTX',
      description: 'Download as PowerPoint compatible format',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v1H8a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'html',
      name: 'HTML',
      description: 'Download as HTML file for web viewing',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  // Accept theme as a prop (add to props if not present)
  const handleDownload = async (format: 'pdf' | 'pptx' | 'html') => {
    if (slides.length === 0) {
      alert('No slides to download. Please generate some slides first.');
      return;
    }

    setIsDownloading(true);
    setIsOpen(false);
    try {
      setDownloadProgress(`Generating ${format.toUpperCase()}...`);
      if (format === 'pptx') {
        await DownloadService.download(format, title, slides, theme);
      } else {
        await DownloadService.download(format, title);
      }
      setDownloadProgress('Download complete!');
      setTimeout(() => setDownloadProgress(''), 2000);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  return (
    <div className="relative">
      {/* Main Download Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || slides.length === 0 || isDownloading}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDownloading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {downloadProgress || 'Downloading...'}
          </>
        ) : (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download
          </>
        )}
        {!isDownloading && (
          <svg className="ml-2 -mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Download Options Dropdown */}
      {isOpen && !isDownloading && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Download Format
            </div>
            {downloadFormats.map((format) => (
              <button
                key={format.id}
                onClick={() => handleDownload(format.id as 'pdf' | 'pptx' | 'html')}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              >
                <div className="flex-shrink-0 text-gray-400 mr-3">
                  {format.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{format.name}</div>
                  <div className="text-xs text-gray-500">{format.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && !isDownloading && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DownloadButton; 