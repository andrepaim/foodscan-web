import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScanStore } from "../stores/scanStore";
import { estimateFromPhoto, blobToBase64 } from "../api/estimation";

type State = "idle" | "loading" | "error";

export function PhotoCapture() {
  const cameraRef = useRef<HTMLInputElement>(null); // forces camera
  const galleryRef = useRef<HTMLInputElement>(null); // opens gallery
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const setProduct = useScanStore((s) => s.setProduct);
  const navigate = useNavigate();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState("loading");
    setError(null);

    try {
      const base64 = await blobToBase64(file);
      const result = await estimateFromPhoto(base64, file.type || "image/jpeg");
      setProduct(result);
      navigate("/review");
    } catch (err: any) {
      setError(err.message ?? "Could not estimate food from photo");
      setState("error");
    } finally {
      // Reset inputs so same file can be selected again
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  };

  if (state === "loading") {
    return (
      <div className="w-full py-3 flex items-center justify-center gap-2 text-zinc-300">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span>Estimating with AI…</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {/* Hidden inputs */}
      {/* Camera: no accept + capture alone forces camera app on Android 14/15 */}
      <input
        ref={cameraRef}
        type="file"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      {/* Gallery: accept only, no capture */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* Two explicit buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex-1 py-3 border border-zinc-700 rounded-lg text-zinc-300 flex items-center justify-center gap-2 hover:border-zinc-500 hover:text-white transition-colors"
        >
          {/* Camera icon */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm">Take photo</span>
        </button>

        <button
          onClick={() => galleryRef.current?.click()}
          className="flex-1 py-3 border border-zinc-700 rounded-lg text-zinc-300 flex items-center justify-center gap-2 hover:border-zinc-500 hover:text-white transition-colors"
        >
          {/* Gallery icon */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">Gallery</span>
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
