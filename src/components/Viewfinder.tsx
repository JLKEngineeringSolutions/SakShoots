type ViewfinderProps = {
  show: boolean;
};

export function Viewfinder({ show }: ViewfinderProps) {
  if (!show) return null;

  return (
    <div className="absolute inset-6 pointer-events-none z-10">
      <div className="absolute top-0 left-0 w-7 h-7 border-t-[1.5px] border-[#ece8e0] border-l-[1.5px]" />
      <div className="absolute top-0 right-0 w-7 h-7 border-t-[1.5px] border-[#ece8e0] border-r-[1.5px]" />
      <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[1.5px] border-[#ece8e0] border-l-[1.5px]" />
      <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[1.5px] border-[#ece8e0] border-r-[1.5px]" />
      <div className="absolute top-1/2 left-1/2 w-[18px] h-[18px] -mt-[9px] -ml-[9px] border border-[rgba(236,232,224,0.7)] rounded-full" />
      <div className="absolute top-2.5 left-11 flex gap-[18px] font-mono text-[11px] tracking-[0.12em] text-[#ece8e0]" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
        <span className="text-[#f0a55a]">● FR 001</span>
        <span>35MM</span>
        <span>F/1.8</span>
        <span>1/125</span>
      </div>
      <div className="absolute bottom-2.5 right-11 font-mono text-[11px] tracking-[0.12em] text-[#ece8e0]" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
        MIRARI — CHELTENHAM
      </div>
    </div>
  );
}
