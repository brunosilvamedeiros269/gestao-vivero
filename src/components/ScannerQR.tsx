'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X } from 'lucide-react';

interface ScannerQRProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function ScannerQR({ onScan, onClose }: ScannerQRProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializa o Scanner apenas do lado do cliente
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E
        ]
      },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        // Sucesso no scan
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        onScan(decodedText);
      },
      (errorMessage) => {
        // Ignora erros contínuos de leitura (quando não acha o QR)
        // console.log(errorMessage);
      }
    );

    return () => {
      if (scannerRef.current) {
         scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col justify-center items-center">
      <div className="absolute top-6 right-6 z-10">
        <button onClick={onClose} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition">
          <X size={24}/>
        </button>
      </div>
      
      <div className="w-full max-w-sm px-4">
        <h2 className="text-white text-center text-xl font-bold mb-6">Escaneie o Código</h2>
        
        {/* Container do Scanner - A div id="reader" é obrigatória para o html5-qrcode */}
        <div id="reader" className="w-full rounded-2xl overflow-hidden bg-black border-4 border-primary"></div>
        
        <p className="text-white/60 text-center text-sm mt-6 px-4">
          Aponte a câmera para o QR Code ou Código de Barras da etiqueta para acessar o item instantaneamente.
        </p>
      </div>
    </div>
  );
}
