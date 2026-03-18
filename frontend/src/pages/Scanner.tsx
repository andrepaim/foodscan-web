import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/library";
import { lookupBarcode } from "../api/foodfacts";
import { useScanStore } from "../stores/scanStore";

type ScanState = "idle" | "scanning" | "loading" | "not_found" | "error";

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
}

export function Scanner() {
  const navigate = useNavigate();
  const setProduct = useScanStore((s) => s.setProduct);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [state, setState] = useState<ScanState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const startScanning = async () => {
      try {
        setState("scanning");
        const videoInputDevices: MediaDeviceInfo[] = await reader.listVideoInputDevices();

        if (videoInputDevices.length === 0) {
          setState("error");
          setErrorMsg("No camera found");
          return;
        }

        // Prefer back camera on mobile
        const backCamera = videoInputDevices.find(
          (d: MediaDeviceInfo) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear")
        );
        const deviceId = backCamera?.deviceId ?? videoInputDevices[0].deviceId;

        await reader.decodeFromVideoDevice(deviceId, videoRef.current!, async (result, err) => {
          if (result) {
            const barcode = result.getText();
            setState("loading");

            reader.reset();

            const product = await lookupBarcode(barcode);
            if (product) {
              setProduct(product);
              navigate("/review");
            } else {
              setState("not_found");
              setErrorMsg(`Product not found: ${barcode}`);
              setTimeout(() => {
                setState("scanning");
                setErrorMsg("");
                startScanning();
              }, 2000);
            }
          }
          if (err && err.name !== "NotFoundException") {
            // Ignore not found (normal during scanning)
          }
        });
      } catch (err) {
        setState("error");
        if (err instanceof Error && err.name === "NotAllowedError") {
          setErrorMsg("Camera permission denied. Please allow camera access.");
        } else {
          setErrorMsg("Could not start camera");
        }
      }
    };

    startScanning();

    return () => {
      reader.reset();
    };
  }, [navigate, setProduct]);

  return (
    <div className="h-screen bg-black flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Scan frame overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-40 border-2 border-white/50 rounded-lg relative">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          {state === "idle" && (
            <p className="text-white text-center">Initializing camera...</p>
          )}
          {state === "scanning" && (
            <p className="text-white text-center">Point at a barcode</p>
          )}
          {state === "loading" && (
            <p className="text-white text-center animate-pulse">Looking up product...</p>
          )}
          {state === "not_found" && (
            <div className="bg-red-900/80 rounded-lg p-4 text-center">
              <p className="text-red-200">{errorMsg}</p>
            </div>
          )}
          {state === "error" && (
            <div className="bg-red-900/80 rounded-lg p-4 text-center">
              <p className="text-red-200">{errorMsg}</p>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-white text-xl font-semibold text-center">FoodScan</h1>
      </div>
    </div>
  );
}
