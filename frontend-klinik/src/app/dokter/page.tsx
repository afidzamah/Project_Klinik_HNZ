'use client';
import { API_URL } from '@/lib/api';

import { useState, useEffect } from 'react';
import MasterLayout from '@/components/MasterLayout';

export default function DokterDashboard() {
  const [pasienQueue, setPasienQueue] = useState<any[]>([]);
  const [activePasien, setActivePasien] = useState<any>(null);
  const [filterTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // State Input SOAP Dokter
  const [anamnesisSubjektif, setAnamnesisSubjektif] = useState<string>('');
  const [pemeriksaanObjektif, setPemeriksaanObjektif] = useState<string>('');
  const [diagnosaUtama, setDiagnosaUtama] = useState<string>('');
  const [icd10Utama, setIcd10Utama] = useState<string>('');
  const [rencanaTerapi, setRencanaTerapi] = useState<string>('');
  
  // State Asisten Pintar AI CDSS
  const [aiResult, setAiResult] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);

  // Ambil data antrean perawat (Tipe Poli) yang siap diperiksa dokter
  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API_URL}/antrean`);
      const data = await res.json();
      // Ambil tipe Poli yang statusnya Tunggu atau Panggil hari ini
      const poliQueue = data.filter((item: any) => {
        const tanggalItem = new Date(item.created_at).toISOString().split('T')[0];
        return item.tipe_antrean === 'Poli' && tanggalItem === filterTanggal && item.status_panggil !== 'Selesai';
      });
      setPasienQueue(poliQueue);
    } catch (error) {
      console.error('Gagal memuat antrean dokter:', error);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  // Memilih Pasien untuk di-review data rekam medis awal dan TTV-nya
  const handleSelectPasien = (item: any) => {
    setActivePasien(item);
    setAnamnesisSubjektif('');
    setPemeriksaanObjektif('');
    setDiagnosaUtama('');
    setIcd10Utama('');
    setRencanaTerapi('');
    setAiResult(null);
  };

  // 🔥 FUNGSI SAKTI: PANGGIL ASISTEN AI KLINIS HNZZ
  const handleMintaSaranAI = async () => {
    if (!activePasien) {
      alert('Silakan pilih pasien terlebih dahulu!');
      return;
    }
    if (!anamnesisSubjektif.trim()) {
      alert('Ketik keluhan anamnesis subjektif dokter terlebih dahulu sebagai bahan analisis AI!');
      return;
    }

    setLoadingAI(true);
    try {
      const res = await fetch(`${API_URL}/pemeriksaan-dokter/analisis-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: activePasien.id_kunjungan,
          anamnesis_subjektif: anamnesisSubjektif,
        }),
      });
      const data = await res.json();
      setAiResult(data);
      
      // Auto-fill diagnosis utama & ICD-10 dari saran AI untuk mempercepat input dokter!
      if (data.diagnosa_utama) setDiagnosaUtama(data.diagnosa_utama);
      if (data.icd10_utama) setIcd10Utama(data.icd10_utama);
      if (data.rekomendasi_tindakan) setRencanaTerapi(data.rekomendasi_tindakan);
    } catch (error) {
      alert('Gagal mendapatkan analisis asisten AI.');
    } finally {
      setLoadingAI(false);
    }
  };

  // Simpan rekam medis akhir SOAP dokter ke database
  const handleSimpanSOAP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePasien) return;
    setLoadingSubmit(true);

    try {
      // 1. Simpan Pemeriksaan SOAP Dokter
      const resSOAP = await fetch(`${API_URL}/pemeriksaan-dokter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: activePasien.id_kunjungan,
          anamnesis_subjektif: anamnesisSubjektif,
          pemeriksaan_fisik_objektif: pemeriksaanObjektif,
          rencana_terapi_plan: rencanaTerapi,
        }),
      });

      if (!resSOAP.ok) throw new Error('Gagal menyimpan rekam medis SOAP.');

      // 2. Update status antrean pasien di poli ini menjadi Selesai agar lanjut ke kasir
      await fetch(`${API_URL}/antrean/${activePasien.id_antrean}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_panggil: 'Selesai' }),
      });

      alert('✅ Pemeriksaan Berhasil Disimpan!\nData RME telah dikunci dan diteruskan ke bagian Kasir/Apotek.');
      setActivePasien(null);
      fetchQueue();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <MasterLayout>
      {/* MACRO GRID SYSTEM: 3 PANEL ERGONOMI DOKTER */}
      <div className="grid grid-cols-12 gap-5 items-start">
        
        {/* PANEL 1: LIST ANTREAN PASIEN POLIKLINIK (3 KOLOM) */}
        <div className="col-span-12 xl:col-span-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
              🚪 Antrean Ruang Periksa Dokter
            </h3>
          </div>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-0.5">
            {pasienQueue.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Belum ada pasien dari Nurse Station...
              </p>
            ) : (
              pasienQueue.map((item) => (
                <div 
                  key={item.id_antrean} 
                  onClick={() => handleSelectPasien(item)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    activePasien?.id_antrean === item.id_antrean 
                      ? 'border-red-500 bg-red-50/40 shadow-xs' 
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-red-600">
                      {item.kunjungan?.pasien?.no_rm || 'RM-HNZ-XXXX'}
                    </span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600">
                      {item.no_antrean}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mt-1 truncate">
                    {item.kunjungan?.pasien?.nama_lengkap}
                  </h4>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL 2: FORM INPUT DATA SOAP UTAMA (5 KOLOM) */}
        <form onSubmit={handleSimpanSOAP} className="col-span-12 xl:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              📝 Input Rekam Medis Elektronik (SOAP)
            </h3>
          </div>

          {activePasien ? (
            <div className="space-y-4">
              {/* Ringkasan TTV dari Perawat */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
  <p className="font-bold text-slate-700">💡 Hasil Pemeriksaan Awal Perawat (Nurse Station):</p>
  
  {/* ✅ UBAH MENJADI HURUF KECIL: asesmen_keperawatan */}
  <p>
    <span className="font-medium text-slate-400">Keluhan Utama:</span>{' '}
    {activePasien.kunjungan?.asesmen_keperawatan?.[0]?.keluhan_utama || 'Tidak ada catatan keluhan'}
  </p>
  
  <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-red-700 font-bold">
    {/* ✅ UBAH SEMUA MENJADI HURUF KECIL */}
    <div>Tensi: {activePasien.kunjungan?.asesmen_keperawatan?.[0]?.sistole || '0'}/{activePasien.kunjungan?.asesmen_keperawatan?.[0]?.diastole || '0'} mmHg</div>
    <div>Suhu: {activePasien.kunjungan?.asesmen_keperawatan?.[0]?.suhu_tubuh || '0'} °C</div>
    <div>BB: {activePasien.kunjungan?.asesmen_keperawatan?.[0]?.berat_badan || '0'} kg</div>
  </div>
</div>

              {/* Input S & O */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Subjective (Anamnesis Hasil Wawancara Dokter)</label>
                <textarea 
                  required rows={3} placeholder="Ketik keluhan mendalam, riwayat alergi, kronologi gejala pasien disini..."
                  value={anamnesisSubjektif} onChange={(e) => setAnamnesisSubjektif(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500 outline-none resize-none text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Objective (Hasil Pemeriksaan Fisik Fisik Dokter)</label>
                <textarea 
                  required rows={2} placeholder="Ketik hasil cek fisik spesialis (cth: Abdomen supel, ronkhi -/-, dll)..."
                  value={pemeriksaanObjektif} onChange={(e) => setPemeriksaanObjektif(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500 outline-none resize-none text-slate-800"
                />
              </div>

              {/* Input Asesmen & Plan */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Assessment (Diagnosis Penyakit)</label>
                  <input 
                    type="text" required placeholder="Contoh: Gastroenteritis Akut"
                    value={diagnosaUtama} onChange={(e) => setDiagnosaUtama(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500 outline-none font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">ICD-10 Code</label>
                  <input 
                    type="text" required placeholder="A09"
                    value={icd10Utama} onChange={(e) => setIcd10Utama(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500 outline-none font-mono font-bold text-center text-red-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Plan (Rencana Terapi Medis & Resep Obat)</label>
                <textarea 
                  required rows={3} placeholder="Masukkan rincian takaran obat atau rencana tindakan medis penunjang..."
                  value={rencanaTerapi} onChange={(e) => setRencanaTerapi(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500 outline-none resize-none text-slate-800"
                />
              </div>

              <button 
                type="submit" disabled={loadingSubmit}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 rounded-xl shadow-md shadow-red-500/10 active:scale-98 disabled:bg-slate-300 transition-all"
              >
                {loadingSubmit ? '⏳ MENGUNCI REKAM MEDIS...' : '💾 SELESAI PERIKSA & KIRIM RESEP DIGITAL'}
              </button>
            </div>
          ) : (
            <p className="text-center py-20 text-xs text-slate-400 font-medium">Silakan pilih pasien di panel kiri untuk memulai pemeriksaan SOAP klinis.</p>
          )}
        </form>

        {/* PANEL 3: ✨ WIDGET UTAMA ASISTEN DIAGNOSA AI CDSS (4 KOLOM) */}
        <div className="col-span-12 xl:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              ✨ HNZ AI Assistant (CDSS)
            </h3>
            <span className="bg-red-100 text-red-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              Gemini Pro Tier
            </span>
          </div>

          <button 
            type="button" 
            disabled={loadingAI || !activePasien || !anamnesisSubjektif}
            onClick={handleMintaSaranAI}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-red-500/20 hover:from-red-700 hover:to-red-600 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all active:scale-95 flex justify-center items-center gap-1.5"
          >
            {loadingAI ? '🧠 AI SEDANG MENGANALISIS GEJALA...' : '✨ DAPATKAN REKOMENDASI DIAGNOSA AI'}
          </button>

          {/* AREA OUTPUT HASIL INTERAKSI AI */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-3 min-h-[250px] flex flex-col justify-between">
            {aiResult ? (
              <div className="space-y-3 animate-fadeIn">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Saran Diagnosa Utama</p>
                  <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    🩻 {aiResult.diagnosa_utama} <span className="bg-red-100 text-red-700 font-mono text-xs px-1.5 py-0.5 rounded font-bold">{aiResult.icd10_utama}</span>
                  </p>
                </div>

                {aiResult.diagnosa_banding && aiResult.diagnosa_banding.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Diagnosa Banding (Differential)</p>
                    <div className="space-y-1">
                      {aiResult.diagnosa_banding.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white px-2 py-1 rounded border border-slate-200 flex justify-between items-center text-[11px]">
                          <span className="font-medium text-slate-700">{item.penyakit} ({item.icd10})</span>
                          <span className="bg-amber-100 text-amber-800 font-bold px-1 rounded text-[9px]">{item.probabilitas}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-200/60 pt-2 space-y-1.5">
                  <p className="text-[11px] text-slate-600"><b className="text-slate-700 block text-[10px] uppercase font-bold text-slate-400">Rencana Terapi AI:</b> {aiResult.rekomendasi_tindakan}</p>
                  <p className="text-[11px] text-slate-600"><b className="text-slate-700 block text-[10px] uppercase font-bold text-slate-400">Edukasi Pasien:</b> {aiResult.edukasi_pasien}</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-400 font-medium py-12 italic">
                Belum ada data analisis... Silakan isi data Subjective (S) di panel tengah lalu klik tombol pemicu AI di atas.
              </p>
            )}

            {/* GUARDRAIL ETIKA MEDIS WAJIB KEMENKES */}
            <div className="border-t border-slate-200/80 pt-2 text-[9px] text-slate-400 leading-normal font-medium italic">
              ⚠️ <b>Catatan Etika Medis (Guardrail):</b> Saran AI hanya bersifat referensi akademis penunjang keputusan klinis. Keputusan medis akhir dan legalitas hukum diagnosis sepenuhnya berada di tangan Dokter Spesialis yang memeriksa pasien[cite: 1385].
            </div>
          </div>
        </div>

      </div>
    </MasterLayout>
  );
}