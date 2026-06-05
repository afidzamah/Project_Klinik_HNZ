import React from 'react';

interface SoapFormProps {
  anamnesisSubjektif: string;
  setAnamnesisSubjektif: (val: string) => void;
  pemeriksaanObjektif: string;
  setPemeriksaanObjektif: (val: string) => void;
  diagnosaUtama: string;
  setDiagnosaUtama: (val: string) => void;
  icd10Utama: string;
  setIcd10Utama: (val: string) => void;
  rencanaTerapi: string;
  setRencanaTerapi: (val: string) => void;
  aiResult: any;
  loadingAI: boolean;
  handleMintaSaranAI: () => void;
  activePasien: any;
}

export default function SoapForm({
  anamnesisSubjektif,
  setAnamnesisSubjektif,
  pemeriksaanObjektif,
  setPemeriksaanObjektif,
  diagnosaUtama,
  setDiagnosaUtama,
  icd10Utama,
  setIcd10Utama,
  rencanaTerapi,
  setRencanaTerapi,
  aiResult,
  loadingAI,
  handleMintaSaranAI,
  activePasien,
}: SoapFormProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <h3 className="font-extrabold text-slate-800 text-sm pb-2 border-b border-slate-100 flex justify-between items-center">
        <span>📝 SOAP Rawat Jalan</span>
        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">Formulir SOAP</span>
      </h3>

      <div className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Subjective (Anamnesis Dokter)</label>
          <textarea 
            required rows={3} placeholder="Ketik keluhan mendalam pasien, kronologi penyakit saat ini..."
            value={anamnesisSubjektif} onChange={(e) => setAnamnesisSubjektif(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none text-slate-800 font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Objective (Cek Fisik / Vital Sign)</label>
          <textarea 
            required rows={2} placeholder="Ketik hasil cek fisik, stetoskop, palpasi dokter disini..."
            value={pemeriksaanObjektif} onChange={(e) => setPemeriksaanObjektif(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none text-slate-800 font-semibold"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Assessment (Diagnosa Penyakit)</label>
            <input 
              type="text" required placeholder="Gastroenteritis Akut"
              value={diagnosaUtama} onChange={(e) => setDiagnosaUtama(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none font-bold text-slate-800"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">ICD-10 Code</label>
            <input 
              type="text" required placeholder="A09"
              value={icd10Utama} onChange={(e) => setIcd10Utama(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none font-mono font-black text-center text-red-600"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Plan (Rencana Terapi Medis)</label>
          <textarea 
            required rows={3} placeholder="Tindakan penunjang medis, takaran resep apotek..."
            value={rencanaTerapi} onChange={(e) => setRencanaTerapi(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none text-slate-800 font-semibold"
          />
        </div>

        {/* ✨ AI CLINICAL ASSISTANT INSIDE SOAP */}
        <div className="border border-red-200/55 rounded-2xl bg-red-50/10 p-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-red-100 select-none">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
              <span>✨</span> CDSS AI Clinical Assistant
            </h4>
            <span className="bg-red-100 text-red-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Gemini Pro
            </span>
          </div>

          <button 
            type="button" 
            disabled={loadingAI || !anamnesisSubjektif}
            onClick={handleMintaSaranAI}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-black py-2.5 rounded-xl shadow-md hover:from-red-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 transition-all duration-300 active:scale-[0.98]"
          >
            {loadingAI ? '🧠 AI SEDANG MENGANALISIS GEJALA...' : '✨ DAPATKAN REKOMENDASI DIAGNOSA AI'}
          </button>

          {aiResult && (
            <div className="bg-white p-3 rounded-xl border border-slate-100 text-[11px] space-y-2.5 text-slate-600 leading-relaxed">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Rekomendasi Diagnosa</span>
                <p className="font-extrabold text-slate-850 text-xs flex items-center gap-1">
                  🩻 {aiResult.diagnosa_utama} <span className="bg-red-50 text-red-600 font-mono text-[10px] px-1 py-0.5 rounded border border-red-200 font-black">{aiResult.icd10_utama}</span>
                </p>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Rencana Terapi AI</span>
                <p className="font-semibold text-slate-700">{aiResult.rekomendasi_tindakan}</p>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Edukasi Pasien</span>
                <p className="font-semibold text-slate-700">{aiResult.edukasi_pasien}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
