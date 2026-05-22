'use client';
import { API_URL } from '@/lib/api';

import MasterLayout from '@/components/MasterLayout';
import { useState, useEffect } from 'react';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fungsi pembantu untuk menghitung umur pasien
const hitungUmur = (tglLahir: string) => {
  if (!tglLahir) return '-';
  const today = new Date();
  const birthDate = new Date(tglLahir);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return `${age} Tahun`;
};

export default function NurseStationDashboard() {
  const [antreanPoliList, setAntreanPoliList] = useState<any[]>([]);
  const [activeAntrean, setActiveAntrean] = useState<any>(null);
  
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  const [formTriage, setFormTriage] = useState({
    keluhan_utama: '',
    sistole: '',
    diastole: '',
    suhu_tubuh: '',
    berat_badan: '',
  });

  const [loading, setLoading] = useState(false);

  const fetchAntreanPoli = async () => {
    try {
      const response = await fetch(`${API_URL}/antrean`);
      const data = await response.json();
      
      const poliQueue = data.filter((item: any) => {
        const isPoli = item.tipe_antrean === 'Poli';
        const isNotSelesai = item.status_panggil !== 'Selesai';
        
        let isMatchDate = false;
        if (item.kunjungan && item.kunjungan.tgl_kunjungan) {
          const antreanDate = item.kunjungan.tgl_kunjungan.split('T')[0];
          isMatchDate = antreanDate === selectedDate;
        }
        
        return isPoli && isNotSelesai && isMatchDate;
      });
      
      setAntreanPoliList(poliQueue);
    } catch (error) {
      console.error('Gagal mengambil data antrean poli:', error);
    }
  };

  useEffect(() => {
    fetchAntreanPoli();
    const interval = setInterval(fetchAntreanPoli, 5000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // FUNGSI 1: Memilih Pasien (Hanya melihat data, tidak memanggil)
  const handlePilihPasien = (antrean: any) => {
    setActiveAntrean(antrean);
  };

  // FUNGSI 2: Memanggil Suara (Robot TTS)
  const handlePanggilSuara = (e: React.MouseEvent, antrean: any) => {
    e.stopPropagation(); // Mencegah klik menyebar ke fungsi Pilih Pasien jika tidak diinginkan
    setActiveAntrean(antrean); // Otomatis aktifkan pasien ini di layar
    
    const nomorEja = antrean.no_antrean.split('').join(' ');
    const namaPasien = antrean.kunjungan?.pasien?.nama_lengkap || '';
    const teksPanggilan = `Nomor antrean, ${nomorEja}, atas nama pasien ${namaPasien}, silakan menuju ruang pemeriksaan awal perawat.`;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(teksPanggilan);
      utterance.lang = 'id-ID';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSimpanTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAntrean || !activeAntrean.id_kunjungan) {
      alert('Silakan pilih antrean yang valid!');
      return;
    }
    
    setLoading(true);
    try {
      const resTriage = await fetch(`${API_URL}/asesmen-keperawatan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: activeAntrean.id_kunjungan,
          id_perawat: "PRW-HNZ-001",
          keluhan_utama: formTriage.keluhan_utama,
          sistole: parseInt(formTriage.sistole),
          diastole: parseInt(formTriage.diastole),
          suhu_tubuh: parseFloat(formTriage.suhu_tubuh),
          berat_badan: parseFloat(formTriage.berat_badan),
        }),
      });

      if (!resTriage.ok) throw new Error('Gagal menyimpan data asesmen keperawatan.');

      alert(`✅ Triage Sukses!\nData rekam medis awal pasien ${activeAntrean.kunjungan?.pasien?.nama_lengkap} berhasil disimpan dan diteruskan ke Dokter Spesialis.`);
      
      setFormTriage({ keluhan_utama: '', sistole: '', diastole: '', suhu_tubuh: '', berat_badan: '' });
      setActiveAntrean(null);
      fetchAntreanPoli(); 
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pasienAktif = activeAntrean?.kunjungan?.pasien;

  return (
    <MasterLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL KIRI: DAFTAR ANTREAN TRIAGE (PISAH KLIK & PANGGIL) */}
        <aside className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col h-full min-h-[75vh]">
          
          <div className="flex flex-col mb-4 pb-4 border-b border-slate-100 gap-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black text-slate-800 tracking-wide flex items-center gap-2">
                <span className="text-red-600 text-lg">🩺</span> Antrean Triage
              </h2>
              <span className="bg-red-50 text-red-600 text-xs font-black px-3 py-1 rounded-full">{antreanPoliList.length} Pasien</span>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 whitespace-nowrap">Filter Tgl:</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white"
              />
            </div>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-2 pb-2">
            {antreanPoliList.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                <span className="text-4xl block mb-3 opacity-50">📅</span>
                <p className="text-xs font-bold text-slate-400">Tidak ada jadwal antrean pasien <br/>pada tanggal {selectedDate}.</p>
              </div>
            ) : (
              antreanPoliList.map((item) => (
                <div 
                  key={item.id_antrean} 
                  onClick={() => handlePilihPasien(item)} // KLIK KARTU = HANYA LIHAT DATA
                  className={`p-3 rounded-2xl border-2 flex justify-between items-center transition-all cursor-pointer ${
                    activeAntrean?.id_antrean === item.id_antrean 
                      ? 'border-red-500 bg-red-50 shadow-md shadow-red-100' 
                      : 'border-slate-100 bg-white hover:border-red-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-1 overflow-hidden pr-3">
                    <span className="text-2xl font-mono font-black text-slate-900 tracking-tighter block leading-none mb-1">{item.no_antrean}</span>
                    <span className="text-xs font-bold text-slate-700 block truncate">
                      {item.kunjungan?.pasien?.nama_lengkap || 'Pasien Tidak Diketahui'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Tujuan: {item.kunjungan?.master_poliklinik?.nama_poli || 'Poliklinik'}</span>
                  </div>
                  {/* TOMBOL PANGGIL TERPISAH (HANYA MEMAINKAN SUARA) */}
                  <button 
                    onClick={(e) => handlePanggilSuara(e, item)}
                    className="p-3 rounded-xl shadow-sm transition-all active:scale-95 shrink-0 bg-red-600 text-white hover:bg-red-700 hover:shadow-red-500/30"
                    title="Panggil Pasien"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* PANEL KANAN: KARTU IDENTITAS & FORM TRIAGE (8 KOLOM) */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          
          {/* SECTION A: KARTU IDENTITAS PASIEN (MUNCUL JIKA PASIEN DIPILIH) */}
          {activeAntrean ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 flex flex-col relative overflow-hidden">
              {/* Ornamen Pita Merah di Kiri */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-500"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-[10px] font-black text-red-500 tracking-widest uppercase mb-1">Data Demografi Pasien</h3>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{pasienAktif?.nama_lengkap || '-'}</h2>
                  <p className="text-sm font-bold text-slate-500 mt-1">No. RM: <span className="font-mono text-slate-800">{pasienAktif?.no_rm || '-'}</span></p>
                </div>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl font-bold text-xs flex flex-col items-end">
                  <span className="text-[9px] uppercase tracking-widest text-red-400">Nomor Antrean Triage</span>
                  <span className="font-mono text-xl">{activeAntrean.no_antrean}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">NIK KTP</span>
                  <span className="text-sm font-bold text-slate-800 font-mono">{pasienAktif?.nik || '-'}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Umur / Tgl Lahir</span>
                  <span className="text-sm font-bold text-slate-800">{hitungUmur(pasienAktif?.tgl_lahir)}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Jenis Kelamin</span>
                  <span className="text-sm font-bold text-slate-800">{pasienAktif?.jenis_kelamin === 'L' ? 'Laki-Laki' : pasienAktif?.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kontak / WA</span>
                  <span className="text-sm font-bold text-slate-800">{pasienAktif?.no_kontak || '-'}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pekerjaan</span>
                  <span className="text-sm font-bold text-slate-800">{pasienAktif?.pekerjaan || '-'}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Agama</span>
                  <span className="text-sm font-bold text-slate-800">{pasienAktif?.agama || '-'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center h-[200px]">
              <span className="text-4xl mb-3">👆</span>
              <h3 className="text-sm font-black text-slate-700">Silakan Pilih Pasien</h3>
              <p className="text-xs font-medium text-slate-400 mt-1">Klik salah satu kartu antrean di sebelah kiri untuk melihat data demografi pasien.</p>
            </div>
          )}

          {/* SECTION B: FORMULIR TRIAGE & TTV (MUNCUL TERUS TAPI DISABLED JIKA TIDAK ADA PASIEN) */}
          <div className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${activeAntrean ? 'border-slate-200' : 'border-slate-200 opacity-60 pointer-events-none'}`}>
            <form onSubmit={handleSimpanTriage} className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="text-red-600">📝</span> Input Asesmen Keperawatan (TTV)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* KELUHAN UTAMA */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Keluhan Utama</label>
                  <textarea 
                    required 
                    rows={6}
                    placeholder="Catat keluhan subjektif pasien di sini..."
                    value={formTriage.keluhan_utama} 
                    onChange={(e) => setFormTriage({...formTriage, keluhan_utama: e.target.value})}
                    className="w-full rounded-2xl border-2 border-slate-200 p-4 bg-slate-50 text-sm font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none"
                  ></textarea>
                </div>

                {/* TANDA-TANDA VITAL (TTV) CARD */}
                <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100 space-y-5">
                  <h3 className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Pemeriksaan Tanda Vital
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Tensi */}
                    <div className="col-span-2 flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sistole</label>
                        <div className="relative">
                          <input type="number" required placeholder="120" value={formTriage.sistole} onChange={(e) => setFormTriage({...formTriage, sistole: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 p-3 pl-4 pr-10 text-lg font-black text-slate-800 focus:border-red-500 outline-none transition-all bg-white" />
                          <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">mmHg</span>
                        </div>
                      </div>
                      <span className="text-2xl font-light text-slate-300 pb-2">/</span>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Diastole</label>
                        <div className="relative">
                          <input type="number" required placeholder="80" value={formTriage.diastole} onChange={(e) => setFormTriage({...formTriage, diastole: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 p-3 pl-4 pr-10 text-lg font-black text-slate-800 focus:border-red-500 outline-none transition-all bg-white" />
                          <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">mmHg</span>
                        </div>
                      </div>
                    </div>

                    {/* Suhu & BB */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Suhu Tubuh</label>
                      <div className="relative">
                        <input type="number" step="0.1" required placeholder="36.5" value={formTriage.suhu_tubuh} onChange={(e) => setFormTriage({...formTriage, suhu_tubuh: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 p-3 pl-4 pr-8 text-lg font-black text-slate-800 focus:border-red-500 outline-none transition-all bg-white" />
                        <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">°C</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Berat Badan</label>
                      <div className="relative">
                        <input type="number" step="0.1" required placeholder="65" value={formTriage.berat_badan} onChange={(e) => setFormTriage({...formTriage, berat_badan: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 p-3 pl-4 pr-8 text-lg font-black text-slate-800 focus:border-red-500 outline-none transition-all bg-white" />
                        <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={loading || !activeAntrean} 
                  className="w-full bg-red-600 text-white border border-red-700 font-black py-4 rounded-2xl shadow-lg shadow-red-500/30 hover:bg-red-700 active:scale-[0.99] transition-all disabled:bg-slate-300 disabled:border-slate-300 disabled:shadow-none disabled:text-slate-500 text-sm flex justify-center items-center gap-2 tracking-widest uppercase"
                >
                  {loading ? '⏳ MENYIMPAN DATA TRIAGE...' : '💾 SIMPAN & TERUSKAN KE DOKTER SPESIALIS'}
                </button>
              </div>
            </form>
          </div>

        </main>
      </div>
    </MasterLayout>
  );
}