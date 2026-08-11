import { useEffect, useMemo } from "react";

interface ScanStageProps {
  image: File;
  statusMessage: string;
}

/**
 * The analysis moment: the uploaded photo on a reticle stage with a
 * sweeping scan line while Claude works, styled like a lab instrument.
 */
const ScanStage = ({ image, statusMessage }: ScanStageProps) => {
  const imageUrl = useMemo(() => URL.createObjectURL(image), [image]);

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const bracket = "absolute w-6 h-6 border-blue-300/80";

  return (
    <div className="flex flex-col items-center gap-5 py-2" role="status" aria-live="polite">
      <div className="relative w-52 h-52 sm:w-60 sm:h-60">
        {/* Photo */}
        <div className="absolute inset-2 rounded-xl overflow-hidden">
          <img src={imageUrl} alt="Photo being analyzed" className="w-full h-full object-cover" />
          {/* Faint measurement grid over the photo */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(hsl(217 90% 75% / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(217 90% 75% / 0.35) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Sweeping scan line */}
          <div aria-hidden className="absolute inset-x-0 h-10 -translate-y-1/2 animate-scan motion-reduce:animate-none motion-reduce:top-1/2">
            <div className="h-full bg-gradient-to-b from-transparent via-blue-400/25 to-transparent" />
            <div className="absolute top-1/2 inset-x-0 h-px bg-blue-300/90 shadow-[0_0_12px_2px_hsl(217_90%_65%/0.8)]" />
          </div>
        </div>
        {/* Reticle corner brackets */}
        <div aria-hidden className={`${bracket} top-0 left-0 border-t-2 border-l-2 rounded-tl-md`} />
        <div aria-hidden className={`${bracket} top-0 right-0 border-t-2 border-r-2 rounded-tr-md`} />
        <div aria-hidden className={`${bracket} bottom-0 left-0 border-b-2 border-l-2 rounded-bl-md`} />
        <div aria-hidden className={`${bracket} bottom-0 right-0 border-b-2 border-r-2 rounded-br-md`} />
      </div>

      <p className="font-mono text-xs text-blue-200/80 uppercase tracking-[0.2em] text-center px-4">
        {statusMessage}
      </p>
    </div>
  );
};

export default ScanStage;
