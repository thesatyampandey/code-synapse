import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onScanSuccess, onClose }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        setIsScanning(true);
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Successfully scanned
            onScanSuccess(decodedText);
            stopScanner();
          },
          () => {
            // Scan error - ignore, happens frequently during scanning
          }
        );
      } catch (err) {
        console.error("Failed to start scanner:", err);
        toast({
          title: "Camera Error",
          description: "Unable to access camera. Please check permissions.",
          variant: "destructive",
        });
        onClose();
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch (err) {
          console.error("Error stopping scanner:", err);
        }
      }
      setIsScanning(false);
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onScanSuccess, onClose, toast]);

  const handleClose = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-card rounded-lg overflow-hidden border border-border">
        <div className="absolute top-4 right-4 z-10">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleClose}
            className="bg-background/80 hover:bg-background"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <Camera className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-semibold">Scan QR Code</h2>
            <p className="text-sm text-muted-foreground">
              Point your camera at the room invite QR code
            </p>
          </div>
          
          <div 
            id="qr-reader" 
            className="rounded-lg overflow-hidden"
          />
          
          {isScanning && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-pulse w-2 h-2 bg-primary rounded-full" />
                Scanning...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
