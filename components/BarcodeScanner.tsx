import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanFailure }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // element id must be unique
    const elementId = "html5-qrcode-reader";
    
    // cleanup previous instance if any (though useEffect cleanup handles it)
    
    const scanner = new Html5QrcodeScanner(
      elementId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    
    scanner.render(
      (decodedText) => {
        // Stop scanning after success to prevent multiple triggers
        scanner.clear();
        onScanSuccess(decodedText);
      }, 
      (error) => {
        if (onScanFailure) onScanFailure(error);
      }
    );
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []); // Empty dependency array to run only once on mount

  return <div id="html5-qrcode-reader" className="w-full overflow-hidden rounded-xl"></div>;
};
