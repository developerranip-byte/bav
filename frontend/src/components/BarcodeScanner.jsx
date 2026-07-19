import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BarcodeScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize the scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 100 },
        supportedScanTypes: [0] // 0 corresponds to html5QrcodeSupportedFormats for 1D/2D
      },
      false
    );

    scanner.render(
      (decodedText) => {
        // Stop scanning and call the callback
        scanner.clear();
        onScan(decodedText);
      },
      (error) => {
        // Ignore continuous scanning errors
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, [onScan]);

  return (
    <div style={modalStyle}>
      <div style={contentStyle}>
        <h3 style={{ marginBottom: '8px' }}>Scan ISBN Barcode</h3>
        <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
          Point your device camera at the book's barcode.
        </p>
        <div id="reader" style={{ width: '100%', margin: '0 auto' }}></div>
        <button type="button" onClick={onClose} style={{ marginTop: '20px', background: '#dc2626', width: '100%' }}>
          Cancel Scanning
        </button>
      </div>
    </div>
  );
};

const modalStyle = {
  position: 'fixed',
  top: 0, 
  left: 0, 
  right: 0, 
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
};

const contentStyle = {
  backgroundColor: '#fff',
  padding: '24px',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '500px',
  textAlign: 'center',
  color: '#000',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

export default BarcodeScanner;
