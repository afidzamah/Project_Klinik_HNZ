import React from 'react';

interface RujukanFormProps {
  rsRujukan: string;
  setRsRujukan: (val: string) => void;
  poliRujukan: string;
  setPoliRujukan: (val: string) => void;
  alasanRujukan: string;
  setAlasanRujukan: (val: string) => void;
}

export default function RujukanForm({
  rsRujukan,
  setRsRujukan,
  poliRujukan,
  setPoliRujukan,
  alasanRujukan,
  setAlasanRujukan,
}: RujukanFormProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <h3 className="font-extrabold text-slate-800 text-sm pb-2 border-b border-slate-100 flex justify-between items-center">
        <span>📨 Surat Rujukan Faskes</span>
        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">Surat Rujukan</span>
      </h3>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase block">Rumah Sakit Rujukan</label>
          <input 
            type="text" placeholder="Contoh: RS Brawijaya Hospital"
            value={rsRujukan} onChange={(e) => setRsRujukan(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none font-bold text-slate-850"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase block">Spesialis / Poliklinik Rujukan</label>
          <input 
            type="text" placeholder="Contoh: Poliklinik Kardiologi"
            value={poliRujukan} onChange={(e) => setPoliRujukan(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none font-bold text-slate-850"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase block">Alasan Rujukan Medis</label>
          <textarea 
            rows={3} placeholder="Contoh: Evaluasi lebih lanjut terhadap kardiomegali..."
            value={alasanRujukan} onChange={(e) => setAlasanRujukan(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none font-semibold text-slate-700"
          />
        </div>
      </div>
    </div>
  );
}
