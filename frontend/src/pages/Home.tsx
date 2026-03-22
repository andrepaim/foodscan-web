import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScanStore } from "../stores/scanStore";
import { estimateFromPhoto, blobToBase64 } from "../api/estimation";

type PhotoState = "idle" | "loading" | "error";

export function Home() {
  const navigate = useNavigate();
  const setProduct = useScanStore((s) => s.setProduct);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [photoState, setPhotoState] = useState<PhotoState>("idle");
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoState("loading");
    setPhotoError(null);
    try {
      const base64 = await blobToBase64(file);
      const result = await estimateFromPhoto(base64, file.type || "image/jpeg");
      setProduct(result);
      navigate("/review");
    } catch (err: any) {
      setPhotoError(err.message ?? "Could not estimate food from photo");
      setPhotoState("error");
    } finally {
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">FoodScan</h1>
        <p className="text-zinc-500 text-sm mt-1">Log food. Track macros.</p>
      </div>

      {/* Hidden photo inputs */}
      <input ref={cameraRef} type="file" capture="environment" className="hidden" onChange={handlePhotoFile} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />

      {/* Main actions */}
      <div className="px-5 flex flex-col gap-3 flex-1">

        {/* Scan barcode — primary CTA */}
        <button
          onClick={() => navigate("/scan")}
          className="w-full bg-white text-black rounded-2xl p-5 flex items-center gap-4 active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM4 6h6V4H4v2zm14 0h2V4h-2v2zM4 20h6v-2H4v2z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="font-semibold text-base">Scan barcode</p>
            <p className="text-zinc-500 text-sm">Point camera at a product barcode</p>
          </div>
          <svg className="w-5 h-5 text-zinc-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Photo estimate */}
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={photoState === "loading"}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 active:scale-95 transition-transform disabled:opacity-50"
        >
          <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
            {photoState === "loading" ? (
              <svg className="animate-spin w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
          <div className="text-left">
            <p className="font-semibold text-base">
              {photoState === "loading" ? "Estimating…" : "Take a photo"}
            </p>
            <p className="text-zinc-500 text-sm">AI estimates macros from photo</p>
          </div>
          <svg className="w-5 h-5 text-zinc-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {photoError && (
          <p className="text-red-400 text-sm text-center -mt-1">{photoError}</p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-xs uppercase tracking-widest">Reference</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Static pages */}
        <a
          href="/treinos"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <div className="text-left">
            <p className="font-semibold text-base">Treinos</p>
            <p className="text-zinc-500 text-sm">Ficha A + videos + schedule</p>
          </div>
          <svg className="w-5 h-5 text-zinc-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>

        <a
          href="/mobilidade"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="font-semibold text-base">Mobilidade</p>
            <p className="text-zinc-500 text-sm">Exercise illustrations</p>
          </div>
          <svg className="w-5 h-5 text-zinc-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      <div className="px-5 py-6 text-center text-zinc-700 text-xs">
        foodscan.duckdns.org
      </div>
    </div>
  );
}
