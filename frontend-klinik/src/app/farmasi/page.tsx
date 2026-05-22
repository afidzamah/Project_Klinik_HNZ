'use client';
import { API_URL } from '@/lib/api';

import { useState, useEffect } from 'react';
import MasterLayout from '@/components/MasterLayout';

export default function FarmasiDashboard() {
  const [resepList, setResepList] = useState<any[]>([]);
  const [activeResep, setActiveResep] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State filter kategori antrean obat
  const [filterStatus, setFilterStatus] = useState<string>('BELUM'); // BELUM atau SELESAI
  // Simpan ID resep yang sudah diserahkan ke memori lokal sementara (state)
  const [sudahDiserahkanIds, setSudahDiserahkanIds] = useState<string[]>([]);

  // Checklist Keselamatan Obat (International Patient Safety Goals)
  const [checkIdentitas, setCheckIdentitas] = useState<boolean>(false);
  const [checkDosis, setCheckDosis] = useState<boolean>(false);
  const [checkAturanPakai, setCheckAturanPakai] = useState<boolean>(false);

  // Ambil data Rekam Medis & Resep dari kamar periksa dokter
  const fetchResep = async () => {
    try {
      const res = await fetch(`${API_URL}/pemeriksaan-dokter`);
      const data = await res.json();
      setResepList(data);
    } catch (error) {
      console.error('Gagal memuat resep farmasi:', error);
    }
  };

  useEffect(() => {
    fetchResep();
    const interval = setInterval(fetchResep, 5000); // Polling otomatis tiap 5 detik
    return () => clearInterval(interval);
  }, []);

  // Reset checklist setiap kali petugas farmasi memilih pasien yang berbeda
  const handleSelectResep = (resep: any) => {
    setActiveResep(resep);
    setCheckIdentitas(false);
    setCheckDosis(false);
    setCheckAturanPakai(false);
  };

  // Logika Filter Data Resep Medis
  const resepTerfilter = resepList.filter((item) => {
    const cocokStatus = filterStatus === 'SELESAI' 
      ? sudahDiserahkanIds.includes(item.id_pemeriksaan)
      : !sudahDiserahkanIds.includes(item.id_pemeriksaan);

    const query = searchQuery.toLowerCase();
    const cocokSearch = 
      item.kunjungan?.pasien?.nama_lengkap?.toLowerCase().includes(query) ||
      item.kunjungan?.pasien?.no_rm?.toLowerCase().includes(query);

    return cocokStatus && cocokSearch;
  });

  // Konfirmasi penyerahan obat ke tangan pasien
  const handleSerahkanObat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIdentitas || !checkDosis || !checkAturanPakai) {
      alert('⚠️ Peringatan Keselamatan: Seluruh item validasi 3S (Salah Pasien, Salah Dosis, Salah Aturan) wajib dicentang demi keselamatan pasien!');
      return;
    }

    if (activeResep) {
      // Masukkan ID pemeriksaan ke daftar yang sudah selesai diproses
      setSudahDiserahkanIds([...sudahDiserahkanIds, activeResep.id_pemeriksaan]);
      alert(`✅ Obat untuk Pasien ${activeResep.kunjungan?.pasien?.nama_lengkap} sukses diserahkan!`);
      setActiveResep(null);
    }
  };

  return (
    <MasterLayout>
      <div className="grid grid-cols-12 gap-5 items-start">
        
        {/* PANEL KIRI: MONITOR ANTRIAN RESEP MASUK (4 KOLOM) */}
        <div className="col-span-12 lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              💊 Antrean Resep Digital Masuk
            </h3>
          </div>

          {/* Cari Pasien */}
          <input 
            type="text" placeholder="Cari No. RM atau Nama Pasien..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-xs outline-none focus:bg-white focus:ring-2 focus:ring-red-500 text-slate-800"
          />

          {/* Tab Filter Status */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-center">
            <button 
              onClick={() => setFilterStatus('BELUM')}
              className={`py-2 rounded-lg transition-all ${filterStatus === 'BELUM' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-500'}`}
            >
              ⏳ Belum Diproses ({resepList.filter(item => !sudahDiserahkanIds.includes(item.id_pemeriksaan)).length})
            </button>
            <button 
              onClick={() => setFilterStatus('SELESAI')}
              className={`py-2 rounded-lg transition-all ${filterStatus === 'SELESAI' ? 'bg-white text-green-600 shadow-xs' : 'text-slate-500'}`}
            >
              ✅ Sudah Diserahkan ({sudahDiserahkanIds.length})
            </button>
          </div>

          {/* List Item Pasien */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-0.5">
            {resepTerfilter.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Tidak ada antrean resep obat...
              </p>
            ) : (
              resepTerfilter.map((item) => (
                <div 
                  key={item.id_pemeriksaan} onClick={() => handleSelectResep(item)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    activeResep?.id_pemeriksaan === item.id_pemeriksaan 
                      ? 'border-red-500 bg-red-50/40 shadow-xs' 
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-red-600">{item.kunjungan?.pasien?.no_rm}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(item.id_kunjungan ? new Date() : Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mt-1 truncate">{item.kunjungan?.pasien?.nama_lengkap}</h4>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL KANAN: DETAIL PERACIKAN & VERIFIKASI OBAT (8 KOLOM) */}
        <div className="col-span-12 lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          {activeResep ? (
            <form onSubmit={handleSerahkanObat} className="space-y-5">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">📄 Lembar Instruksi Obat & Etiket</h3>
                  <p className="text-xs text-slate-400">Pastikan pencocokan formula dosis tepat sebelum diserahkan.</p>
                </div>
                <span className="bg-red-600 text-white font-mono font-bold text-xs px-3 py-1 rounded-full">
                  {activeResep.kunjungan?.pasien?.no_rm}
                </span>
              </div>

              {/* Data Sosial Pasien */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-medium text-slate-600">
                <div><span className="text-slate-400 block">Nama Pasien:</span> <b className="text-slate-800">{activeResep.kunjungan?.pasien?.nama_lengkap}</b></div>
                <div><span className="text-slate-400 block">NIK KTP:</span> <span className="font-mono">{activeResep.kunjungan?.pasien?.nik}</span></div>
                <div><span className="text-slate-400 block">Kontak WA:</span> <span className="font-mono">{activeResep.kunjungan?.pasien?.no_kontak}</span></div>
                <div><span className="text-slate-400 block">Jenis Kelamin:</span> {activeResep.kunjungan?.pasien?.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</div>
              </div>

              {/* KOTAK RESEP DOKTER UTAMA */}
              <div className="space-y-1">
                <label className="text-[11px] text-red-600 font-extrabold uppercase block tracking-wider">🔮 Resep Obat & Takaran Dokter Spesialis:</label>
                <div className="w-full min-h-[120px] bg-red-50/20 border-2 border-dashed border-red-500/30 rounded-xl p-4 font-mono text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {activeResep.rencana_terapi_plan}
                </div>
              </div>

              {/* 🌟 WIDGET KESELAMATAN 3S (PATIENT SAFETY STANDARDS) */}
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-3">
                <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                  ⚠️ Protokol Keamanan Farmasi Klinik HNZ:
                </h4>
                <div className="space-y-2 text-xs text-slate-700 font-semibold">
                  <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200/60 cursor-pointer hover:bg-slate-50 transition-all select-none">
                    <input 
                      type="checkbox" checked={checkIdentitas} onChange={(e) => setCheckIdentitas(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 border-slate-300 focus:ring-red-500"
                    />
                    <span>Cocokkan Identitas Fisik Pasien (Nama, Tanggal Lahir, atau NIK) sesuai Etiket</span>
                  </label>
                  
                  <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200/60 cursor-pointer hover:bg-slate-50 transition-all select-none">
                    <input 
                      type="checkbox" checked={checkDosis} onChange={(e) => setCheckDosis(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 border-slate-300 focus:ring-red-500"
                    />
                    <span>Validasi Jumlah Fisik Obat, Kekuatan Sediaan, dan Ketepatan Racikan Dosis</span>
                  </label>

                  <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200/60 cursor-pointer hover:bg-slate-50 transition-all select-none">
                    <input 
                      type="checkbox" checked={checkAturanPakai} onChange={(e) => setCheckAturanPakai(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 border-slate-300 focus:ring-red-500"
                    />
                    <span>Siap Memberikan Edukasi Aturan Pakai (Kapan Harus Diminum & Efek Samping Obat)</span>
                  </label>
                </div>
              </div>

              {/* JIKA FILTER BELUM DIPROSES -> MUNCULKAN TOMBOL SERAHKAN */}
              {filterStatus === 'BELUM' && (
                <button 
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-lg shadow-red-500/10 transition-all active:scale-98 flex justify-center items-center gap-2"
                >
                  💊 KUNCI VALIDASI & SERAHKAN OBAT KE PASIEN
                </button>
              )}
            </form>
          ) : (
            <div className="text-center py-24 text-xs text-slate-400 font-medium border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
              Silakan pilih salah satu nama pasien di antrean panel kiri untuk memuat lembar resep obat.
            </div>
          )}
        </div>

      </div>
    </MasterLayout>
  );
}