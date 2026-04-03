import React from 'react';
import QRCode from 'qrcode.react';
import { Download } from 'lucide-react';

const QRCodeDisplay = ({ value, size = 150 }) => {
  const downloadQR = () => {
    const canvas = document.getElementById('qr-code-canvas');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `dev-darshan-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <QRCode
        id="qr-code-canvas"
        value={value}
        size={size}
        level="H"
        includeMargin={true}
        bgColor="#ffffff"
        fgColor="#000000"
      />
      <button
        onClick={downloadQR}
        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
      >
        <Download className="w-4 h-4" />
        Download QR Code
      </button>
    </div>
  );
};

export default QRCodeDisplay;