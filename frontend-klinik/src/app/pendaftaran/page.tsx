//D:\develop\Project_Klinik_HNZ\frontend-klinik\src\app\pendaftaran.page.tsx

'use client';
import { API_URL } from '@/lib/api';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MasterLayout from '@/components/MasterLayout';

export default function PendaftaranDashboard() {
  const [rawAntreanList, setRawAntreanList] = useState<any[]>([]);
  const [activeAntrean, setActiveAntrean] = useState<any>(null);

  // State Filter Antrean Loket Kiosk (Panel Kiri)
  const [filterTanggal, setFilterTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');

  // Filter Tanggal Independen untuk Live Monitoring (Panel Kanan)
  const [rightFilterTanggal, setRightFilterTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rightFilterPoli, setRightFilterPoli] = useState<string>('SEMUA');
  const [rightFilterDokter, setRightFilterDokter] = useState<string>('SEMUA');
  const [rightFilteredDokterList, setRightFilteredDokterList] = useState<any[]>([]);

  // State Master Dropdown & Sinkronisasi UUID (Panel Tengah)
  const [masterPoliklinik, setMasterPoliklinik] = useState<any[]>([]);
  const [masterDokter, setMasterDokter] = useState<any[]>([]);
  const [filteredDokter, setFilteredDokter] = useState<any[]>([]);

  // 🏛️ STATE BARU: Master Data Alamat Berjenjang (Cascading)
  const [masterJenisAlamat, setMasterJenisAlamat] = useState<any[]>([]);
  const [masterProvinsi, setMasterProvinsi] = useState<any[]>([]);
  const [masterKabupaten, setMasterKabupaten] = useState<any[]>([]);
  const [masterKecamatan, setMasterKecamatan] = useState<any[]>([]);
  const [masterKelurahan, setMasterKelurahan] = useState<any[]>([]);

  // State pembantu untuk menampung teks nama wilayah untuk generator alamat lengkap
  const [namaWilayah, setNamaWilayah] = useState({
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
    kelurahan: '',
  });

  const [idPoli, setIdPoli] = useState<string>('');
  const [idDokter, setIdDokter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Tanggal Kunjungan Hari Ini (Otomatis & Terkunci)
  const [tglKunjungan] = useState<string>(new Date().toISOString());

  // State Lookup Pasien Lama (Pop-up Modal Rekam Medis)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pasienHistoryList, setPasienHistoryList] = useState<any[]>([]);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState<string>('');
  const [selectedPasienId, setSelectedPasienId] = useState<string | null>(null);
  const [selectedNoRm, setSelectedNoRm] = useState<string>('');

  const [formPasien, setFormPasien] = useState({
    nik: '',
    nama_lengkap: '',
    tgl_lahir: '',
    jenis_kelamin: 'L',
    agama: '',
    pekerjaan: '',
    no_kontak: '',
    // 🌟 FIELD ALAMAT BARU
    id_jenis_alamat: '',
    rt_rw: '',
    id_provinsi: '',
    id_kabupaten: '',
    id_kecamatan: '',
    id_kelurahan: '',
    alamat_lengkap: '',
  });

  const fetchData = async () => {
    try {
      const resAntrean = await fetch(`${API_URL}/antrean`);
      const dataAntrean = await resAntrean.json();
      setRawAntreanList(Array.isArray(dataAntrean) ? dataAntrean : []);

      const resPoli = await fetch(`${API_URL}/master-poliklinik`);
      const dataPoli = await resPoli.json();
      setMasterPoliklinik(Array.isArray(dataPoli) ? dataPoli : []);
      if (Array.isArray(dataPoli) && dataPoli.length > 0 && !idPoli) setIdPoli(dataPoli[0].id_poli);

      const resDokter = await fetch(`${API_URL}/master-dokter`);
      const dataDokter = await resDokter.json();
      setMasterDokter(Array.isArray(dataDokter) ? dataDokter : []);

      // 📥 FETCH BARU DENGAN PENGAMAN ARRAY SEHINGGA TIDAK ERROR MAP IS NOT A FUNCTION
      const resJenis = await fetch(`${API_URL}/master-wilayah/jenis-alamat`);
      const dataJenis = await resJenis.json();
      setMasterJenisAlamat(Array.isArray(dataJenis) ? dataJenis : []);

      const resProv = await fetch(`${API_URL}/master-wilayah/provinsi`);
      const dataProv = await resProv.json();
      setMasterProvinsi(Array.isArray(dataProv) ? dataProv : []);
    } catch (error) {
      console.error('Gagal menarik data:', error);
    }
  };

  const fetchPasienHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/pasien`);
      const data = await res.json();
      setPasienHistoryList(Array.isArray(data) ? data : []);
      setIsModalOpen(true);
    } catch (error) {
      alert('Gagal memuat master arsip rekam medis.');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (idPoli && masterDokter.length > 0) {
      const filtered = masterDokter.filter((doc) => doc.id_poli === idPoli);
      setFilteredDokter(filtered);
      if (filtered.length > 0) setIdDokter(filtered[0].id_dokter);
    }
  }, [idPoli, masterDokter]);

  useEffect(() => {
    if (rightFilterPoli === 'SEMUA') {
      setRightFilteredDokterList(masterDokter);
    } else {
      const filtered = masterDokter.filter((doc) => doc.id_poli === rightFilterPoli);
      setRightFilteredDokterList(filtered);
    }
    setRightFilterDokter('SEMUA');
  }, [rightFilterPoli, masterDokter]);

  // 🔗 EFFECT CASCADING: Ambil Kabupaten berdasarkan Provinsi terpilih (DENGAN PENGAMAN ARRAY)
  useEffect(() => {
    if (formPasien.id_provinsi) {
      fetch(`${API_URL}/master-wilayah/kabupaten/${formPasien.id_provinsi}`)
        .then((res) => res.json())
        .then((data) => setMasterKabupaten(Array.isArray(data) ? data : []))
        .catch((err) => console.error(err));
    } else {
      setMasterKabupaten([]);
    }
  }, [formPasien.id_provinsi]);

  // 🔗 EFFECT CASCADING: Ambil Kecamatan berdasarkan Kabupaten terpilih (DENGAN PENGAMAN ARRAY)
  useEffect(() => {
    if (formPasien.id_kabupaten) {
      fetch(`${API_URL}/master-wilayah/kecamatan/${formPasien.id_kabupaten}`)
        .then((res) => res.json())
        .then((data) => setMasterKecamatan(Array.isArray(data) ? data : []))
        .catch((err) => console.error(err));
    } else {
      setMasterKecamatan([]);
    }
  }, [formPasien.id_kabupaten]);

  // 🔗 EFFECT CASCADING: Ambil Kelurahan berdasarkan Kecamatan terpilih (DENGAN PENGAMAN ARRAY)
  useEffect(() => {
    if (formPasien.id_kecamatan) {
      fetch(`${API_URL}/master-wilayah/kelurahan/${formPasien.id_kecamatan}`)
        .then((res) => res.json())
        .then((data) => setMasterKelurahan(Array.isArray(data) ? data : []))
        .catch((err) => console.error(err));
    } else {
      setMasterKelurahan([]);
    }
  }, [formPasien.id_kecamatan]);

  // 🧠 EFFECT AUTOMATIC ALAMAT GENERATOR: Menyusun String Alamat Lengkap Secara Real-time
  useEffect(() => {
    if (!namaWilayah.provinsi && !namaWilayah.kabupaten && !namaWilayah.kecamatan && !namaWilayah.kelurahan && !formPasien.rt_rw) return;

    const rtRwStr = formPasien.rt_rw ? `RT/RW ${formPasien.rt_rw}, ` : '';
    const kelStr = namaWilayah.kelurahan ? `Kel. ${namaWilayah.kelurahan}, ` : '';
    const kecStr = namaWilayah.kecamatan ? `Kec. ${namaWilayah.kecamatan}, ` : '';
    const kabStr = namaWilayah.kabupaten ? `${namaWilayah.kabupaten}, ` : '';
    const provStr = namaWilayah.provinsi ? `Prov. ${namaWilayah.provinsi}` : '';

    const autoAlamat = `${rtRwStr}${kelStr}${kecStr}${kabStr}${provStr}`.replace(/,\s*$/, '').trim();
    setFormPasien((prev) => ({ ...prev, alamat_lengkap: autoAlamat }));
  }, [formPasien.rt_rw, namaWilayah]);

  const handlePanggilSuara = async (antrean: any) => {
    setActiveAntrean(antrean);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Nomor antrean, ${antrean.no_antrean.split('').join(' ')}, menuju loket pendaftaran.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }

    try {
      await fetch(`${API_URL}/antrean/${antrean.id_antrean}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_panggil: 'Panggil' }),
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  // 1. FILTERING DATA LOKET (PANEL KIRI)
  const dataAntreanLoketTerfilter = rawAntreanList.filter((item) => {
    if (item.tipe_antrean !== 'Loket') return false;
    const tanggalItem = new Date(item.created_at).toISOString().split('T')[0];
    const cocokTanggal = tanggalItem === filterTanggal;
    const cocokStatus =
      filterStatus === 'SEMUA' || 
      (filterStatus === 'TUNGGU' && item.status_panggil === 'Tunggu') ||
      (filterStatus === 'PANGGIL' && item.status_panggil !== 'Tunggu' && item.status_panggil !== 'Selesai');
    return cocokTanggal && cocokStatus;
  });

  // 2. FILTERING BERLAPIS DATA PASIEN TERDAFTAR (PANEL KANAN)
  const dataPasienTerdaftarHariIni = rawAntreanList.filter((item) => {
    if (item.tipe_antrean !== 'Poli') return false;

    const tanggalItem = new Date(item.created_at).toISOString().split('T')[0];
    const cocokTanggal = tanggalItem === rightFilterTanggal;
    const cocokPoli = rightFilterPoli === 'SEMUA' || item.kunjungan?.id_poli === rightFilterPoli;
    const cocokDokter = rightFilterDokter === 'SEMUA' || item.kunjungan?.id_dokter === rightFilterDokter;

    return cocokTanggal && cocokPoli && cocokDokter;
  });

  const pasienTerfilterDiModal = pasienHistoryList.filter((p) => {
    const query = searchHistoryQuery.toLowerCase();
    return (
      p.no_rm?.toLowerCase().includes(query) ||
      p.nik?.toLowerCase().includes(query) ||
      p.nama_lengkap?.toLowerCase().includes(query)
    );
  });

  const handlePilihPasienLama = (pasien: any) => {
    setSelectedPasienId(pasien.id_pasien);
    setSelectedNoRm(pasien.no_rm);
    setFormPasien({
      nik: pasien.nik,
      nama_lengkap: pasien.nama_lengkap,
      tgl_lahir: pasien.tgl_lahir ? pasien.tgl_lahir.split('T')[0] : '',
      jenis_kelamin: pasien.jenis_kelamin,
      agama: pasien.agama || '',
      pekerjaan: pasien.pekerjaan || '',
      no_kontak: pasien.no_kontak || '',
      // Sertakan data alamat tersimpan
      id_jenis_alamat: pasien.id_jenis_alamat || '',
      rt_rw: pasien.rt_rw || '',
      id_provinsi: pasien.id_provinsi || '',
      id_kabupaten: pasien.id_kabupaten || '',
      id_kecamatan: pasien.id_kecamatan || '',
      id_kelurahan: pasien.id_kelurahan || '',
      alamat_lengkap: pasien.alamat_lengkap || '',
    });

    setNamaWilayah({
      provinsi: pasien.provinsi?.nama_provinsi || '',
      kabupaten: pasien.kabupaten?.nama_kabupaten || '',
      kecamatan: pasien.kecamatan?.nama_kecamatan || '',
      kelurahan: pasien.kelurahan?.nama_kelurahan || '',
    });

    setIsModalOpen(false);
    setSearchHistoryQuery('');
  };

  const handleResetModePasienBaru = () => {
    setSelectedPasienId(null);
    setSelectedNoRm('');
    setFormPasien({
      nik: '',
      nama_lengkap: '',
      tgl_lahir: '',
      jenis_kelamin: 'L',
      agama: '',
      pekerjaan: '',
      no_kontak: '',
      id_jenis_alamat: '',
      rt_rw: '',
      id_provinsi: '',
      id_kabupaten: '',
      id_kecamatan: '',
      id_kelurahan: '',
      alamat_lengkap: '',
    });
    setNamaWilayah({ provinsi: '', kabupaten: '', kecamatan: '', kelurahan: '' });
  };

  const handleSimpanPendaftaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAntrean) {
      alert('Silakan pilih dan panggil nomor antrean loket terlebih dahulu!');
      return;
    }
    setLoading(true);
    try {
      let finalPasienId = selectedPasienId;

      // Buat Pasien Baru (Bila belum ada)
      if (!finalPasienId) {
        const resPasien = await fetch(`${API_URL}/pasien`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formPasien),
        });
        const dataPasien = await resPasien.json();
        if (!resPasien.ok) throw new Error('Gagal menyimpan rekam medis pasien baru.');
        finalPasienId = dataPasien.id_pasien;
      }

      // Mengikutsertakan TANGGAL KUNJUNGAN ke Payload
      const resKunjungan = await fetch(`${API_URL}/kunjungan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pasien: finalPasienId,
          id_poli: idPoli,
          id_dokter: idDokter,
          tgl_kunjungan: tglKunjungan,
        }),
      });
      const dataKunjungan = await resKunjungan.json();
      if (!resKunjungan.ok) throw new Error('Gagal memproses pembuatan transaksi kunjungan.');

      // Antrekan ke Poli
      await fetch(`${API_URL}/antrean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: dataKunjungan.id_kunjungan,
          tipe_antrean: 'Poli',
        }),
      });

      // Selesaikan Antrean Kiosk Loket
      await fetch(`${API_URL}/antrean/${activeAntrean.id_antrean}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_panggil: 'Selesai' }),
      });

      alert(`✅ Registrasi Sukses!\nPasien dialirkan ke Nurse Station.`);
      handleResetModePasienBaru();
      setActiveAntrean(null);
      fetchData();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MasterLayout>
      <div className="grid grid-cols-12 gap-5 items-start">

        {/* 1. PANEL KIRI: MONITOR ANTREAN LOKET KIOSK (2 KOLOM) */}
        <div className="col-span-12 xl:col-span-2 lg:col-span-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              📋 Antrean Loket
            </h3>
          </div>
          <div>
            <input
              type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)}
              className="w-full text-[11px] p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-0.5 bg-slate-100 p-0.5 rounded-lg text-[9px] font-extrabold text-center">
            {['SEMUA', 'TUNGGU', 'PANGGIL'].map((statusOption) => (
              <button
                key={statusOption} onClick={() => setFilterStatus(statusOption)}
                className={`py-1 rounded-md transition-all ${filterStatus === statusOption ? 'bg-white text-red-600 shadow-xs' : 'text-slate-500'}`}
              >
                {statusOption}
              </button>
            ))}
          </div>
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-0.5">
            {dataAntreanLoketTerfilter.length === 0 ? (
              <p className="text-center py-5 text-[10px] text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">Kosong...</p>
            ) : (
              dataAntreanLoketTerfilter.map((item) => (
                <div key={item.id_antrean} className={`p-2 rounded-xl border flex flex-col gap-1.5 transition-all ${activeAntrean?.id_antrean === item.id_antrean ? 'border-red-500 bg-red-50/40' : 'border-slate-100 bg-white'}`}>
                  <div className="flex justify-between items-center">
                    <h4 className="font-mono font-bold text-slate-800 text-xs">{item.no_antrean}</h4>
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${item.status_panggil === 'Tunggu' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {item.status_panggil === 'Tunggu' ? 'Belum' : 'Panggil'}
                    </span>
                  </div>
                  <button onClick={() => handlePanggilSuara(item)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1 rounded-lg text-[10px] transition-all flex justify-center items-center gap-1 shadow-sm shadow-red-500/10">
                    📢 Panggil
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. PANEL TENGAH: FORMULIR IDENTITAS & MASTER DATA (8 KOLOM) */}
        <form onSubmit={handleSimpanPendaftaran} className="col-span-12 xl:col-span-8 lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                {selectedPasienId ? `👤 Registrasi Kunjungan Pasien Lama [${selectedNoRm}]` : '👤 Registrasi Rekam Medis Pasien Baru'}
              </h3>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button" onClick={fetchPasienHistory}
                className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 font-bold text-[11px] px-3 py-2 rounded-xl transition-all"
              >
                🔍 Cari Arsip RM
              </button>
              {selectedPasienId && (
                <button
                  type="button" onClick={handleResetModePasienBaru}
                  className="bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-[11px] px-3 py-2 rounded-xl transition-all"
                >
                  🔄 Pasien Baru
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400 font-bold">NOMOR NIK KTP Pasien</label>
              <input
                type="text" required maxLength={16} placeholder="Masukkan 16 digit NIK" disabled={!!selectedPasienId}
                value={formPasien.nik} onChange={(e) => setFormPasien({ ...formPasien, nik: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-mono text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-800 disabled:opacity-60"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400 font-bold">NAMA LENGKAP PASIEN</label>
              <input
                type="text" required placeholder="Sesuai kartu identitas" disabled={!!selectedPasienId}
                value={formPasien.nama_lengkap} onChange={(e) => setFormPasien({ ...formPasien, nama_lengkap: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-800 disabled:opacity-60"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400 font-bold">TANGGAL LAHIR</label>
              <input
                type="date" required disabled={!!selectedPasienId}
                value={formPasien.tgl_lahir} onChange={(e) => setFormPasien({ ...formPasien, tgl_lahir: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-700 disabled:opacity-60"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400 font-bold">JENIS KELAMIN</label>
              <select
                value={formPasien.jenis_kelamin} onChange={(e) => setFormPasien({ ...formPasien, jenis_kelamin: e.target.value })} disabled={!!selectedPasienId}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-700 disabled:opacity-60"
              >
                <option value="L">Laki-Laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400 font-bold">AGAMA</label>
              <input
                type="text" required placeholder="Contoh: Islam, Kristen" disabled={!!selectedPasienId}
                value={formPasien.agama} onChange={(e) => setFormPasien({ ...formPasien, agama: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-800 disabled:opacity-60"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400 font-bold">PEKERJAAN</label>
              <input
                type="text" required placeholder="Contoh: Karyawan Swasta" disabled={!!selectedPasienId}
                value={formPasien.pekerjaan} onChange={(e) => setFormPasien({ ...formPasien, pekerjaan: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-800 disabled:opacity-60"
              />
            </div>
            <div className="space-y-0.5 md:col-span-2">
              <label className="text-[10px] text-slate-400 font-bold">NOMOR KONTAK / WHATSAPP</label>
              <input
                type="text" required placeholder="Contoh: 08123456789" disabled={!!selectedPasienId}
                value={formPasien.no_kontak} onChange={(e) => setFormPasien({ ...formPasien, no_kontak: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-800 disabled:opacity-60"
              />
            </div>

            {/* 🌟 GRUP BARU: BLOK FIELD ALAMAT CASCADING DINAMIS */}
            <div className="md:col-span-2 pt-3 border-t border-dashed border-slate-100 mt-2">
              <h4 className="text-[10px] text-red-600 font-extrabold uppercase tracking-wider mb-3">📍 Data Wilayah Tempat Tinggal Pasien</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-400 font-bold">JENIS ALAMAT</label>
                  <select
                    value={formPasien.id_jenis_alamat} disabled={!!selectedPasienId}
                    onChange={(e) => setFormPasien({ ...formPasien, id_jenis_alamat: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-700 disabled:opacity-60"
                  >
                    <option value="">-- Pilih Jenis --</option>
                    {Array.isArray(masterJenisAlamat) && masterJenisAlamat.map((j) => <option key={j.id_jenis_alamat} value={j.id_jenis_alamat}>{j.nama_jenis}</option>)}
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-400 font-bold">RT / RW</label>
                  <input
                    type="text" placeholder="Contoh: 002/011" disabled={!!selectedPasienId}
                    value={formPasien.rt_rw} onChange={(e) => setFormPasien({ ...formPasien, rt_rw: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-800 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-400 font-bold">PROVINSI</label>
                  <select
                    value={formPasien.id_provinsi} disabled={!!selectedPasienId}
                    onChange={(e) => {
                      const txt = e.target.options[e.target.selectedIndex].text;
                      const isBlank = e.target.value === "";
                      setFormPasien({ ...formPasien, id_provinsi: e.target.value, id_kabupaten: '', id_kecamatan: '', id_kelurahan: '' });
                      setNamaWilayah({ ...namaWilayah, provinsi: isBlank ? '' : txt, kabupaten: '', kecamatan: '', kelurahan: '' });
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-700 disabled:opacity-60"
                  >
                    <option value="">-- Pilih Provinsi --</option>
                    {Array.isArray(masterProvinsi) && masterProvinsi.map((p) => <option key={p.id_provinsi} value={p.id_provinsi}>{p.nama_provinsi}</option>)}
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-400 font-bold">KABUPATEN / KOTA</label>
                  <select
                    value={formPasien.id_kabupaten} disabled={!formPasien.id_provinsi || !!selectedPasienId}
                    onChange={(e) => {
                      const txt = e.target.options[e.target.selectedIndex].text;
                      const isBlank = e.target.value === "";
                      setFormPasien({ ...formPasien, id_kabupaten: e.target.value, id_kecamatan: '', id_kelurahan: '' });
                      setNamaWilayah({ ...namaWilayah, kabupaten: isBlank ? '' : txt, kecamatan: '', kelurahan: '' });
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-700 disabled:opacity-60 disabled:bg-slate-100"
                  >
                    <option value="">-- Pilih Kabupaten --</option>
                    {Array.isArray(masterKabupaten) && masterKabupaten.map((k) => <option key={k.id_kabupaten} value={k.id_kabupaten}>{k.nama_kabupaten}</option>)}
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-400 font-bold">KECAMATAN</label>
                  <select
                    value={formPasien.id_kecamatan} disabled={!formPasien.id_kabupaten || !!selectedPasienId}
                    onChange={(e) => {
                      const txt = e.target.options[e.target.selectedIndex].text;
                      const isBlank = e.target.value === "";
                      setFormPasien({ ...formPasien, id_kecamatan: e.target.value, id_kelurahan: '' });
                      setNamaWilayah({ ...namaWilayah, kecamatan: isBlank ? '' : txt, kelurahan: '' });
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-700 disabled:opacity-60 disabled:bg-slate-100"
                  >
                    <option value="">-- Pilih Kecamatan --</option>
                    {Array.isArray(masterKecamatan) && masterKecamatan.map((kec) => <option key={kec.id_kecamatan} value={kec.id_kecamatan}>{kec.nama_kecamatan}</option>)}
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-400 font-bold">KELURAHAN</label>
                  <select
                    value={formPasien.id_kelurahan} disabled={!formPasien.id_kecamatan || !!selectedPasienId}
                    onChange={(e) => {
                      const txt = e.target.options[e.target.selectedIndex].text;
                      const isBlank = e.target.value === "";
                      setFormPasien({ ...formPasien, id_kelurahan: e.target.value });
                      setNamaWilayah({ ...namaWilayah, kelurahan: isBlank ? '' : txt });
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-700 disabled:opacity-60 disabled:bg-slate-100"
                  >
                    <option value="">-- Pilih Kelurahan --</option>
                    {Array.isArray(masterKelurahan) && masterKelurahan.map((kel) => <option key={kel.id_kelurahan} value={kel.id_kelurahan}>{kel.nama_kelurahan}</option>)}
                  </select>
                </div>

                <div className="space-y-0.5 md:col-span-2">
                  <label className="text-[10px] text-slate-400 font-bold">ALAMAT LENGKAP (OTOMATIS / BISA DIEDIT MANUAL)</label>
                  <textarea
                    rows={2} placeholder="Sistem otomatis menyusun alamat, ketik nama jalan atau detail di sini..." disabled={!!selectedPasienId}
                    value={formPasien.alamat_lengkap} onChange={(e) => setFormPasien({ ...formPasien, alamat_lengkap: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-800 disabled:opacity-60"
                  />
                </div>

              </div>
            </div>

          </div>

          {/* FORM LAYOUT DIUBAH JADI 3 KOLOM */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3.5 border-t border-slate-100">
            <div className="space-y-0.5">
              <label className="text-[10px] text-red-600 font-bold">TANGGAL KUNJUNGAN</label>
              <input
                type="text"
                readOnly
                value={new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                className="w-full rounded-xl border border-red-500/30 p-2.5 bg-slate-50 text-slate-500 font-bold outline-none text-xs cursor-not-allowed"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-red-600 font-bold">TUJUAN POLIKLINIK</label>
              <select
                value={idPoli} onChange={(e) => setIdPoli(e.target.value)}
                className="w-full rounded-xl border border-red-500/30 p-2.5 bg-red-50/10 text-red-900 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500"
              >
                {Array.isArray(masterPoliklinik) && masterPoliklinik.map((p) => <option key={p.id_poli} value={p.id_poli}>{p.nama_poli}</option>)}
              </select>
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-red-600 font-bold">DOKTER PRAKTIK</label>
              <select
                value={idDokter} onChange={(e) => setIdDokter(e.target.value)}
                className="w-full rounded-xl border border-red-500/30 p-2.5 bg-red-50/10 text-red-900 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500"
              >
                {(!Array.isArray(filteredDokter) || filteredDokter.length === 0) ? <option value="">Tidak ada dokter tersedia</option> : filteredDokter.map((d) => <option key={d.id_dokter} value={d.id_dokter}>{d.nama_dokter}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-500/10 hover:bg-red-700 transition-all active:scale-98 disabled:bg-slate-300 flex justify-center items-center gap-2 text-xs"
          >
            {loading ? '⏳ MEMPROSES STRUK KUNJUNGAN...' : '💾 SIMPAN TRANSAKSI & TERUSKAN KE NURSE STATION'}
          </button>
        </form>

        {/* 3. PANEL KANAN: LIVE MONITORING TERDAFTAR (2 KOLOM) */}
        <div className="col-span-12 xl:col-span-2 lg:col-span-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-xs">
              ✅ Terdaftar ({Array.isArray(dataPasienTerdaftarHariIni) ? dataPasienTerdaftarHariIni.length : 0})
            </h3>
          </div>

          {/* FILTER PANEL KANAN */}
          <div className="space-y-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100 text-[10px]">
            <div>
              <label className="text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Filter Tanggal</label>
              <input
                type="date" value={rightFilterTanggal} onChange={(e) => setRightFilterTanggal(e.target.value)}
                className="w-full p-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Filter Ruangan</label>
              <select
                value={rightFilterPoli} onChange={(e) => setRightFilterPoli(e.target.value)}
                className="w-full font-bold p-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="SEMUA">✨ Semua Poliklinik</option>
                {Array.isArray(masterPoliklinik) && masterPoliklinik.map((p) => <option key={p.id_poli} value={p.id_poli}>📍 {p.nama_poli}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Filter Dokter</label>
              <select
                value={rightFilterDokter} onChange={(e) => setRightFilterDokter(e.target.value)}
                className="w-full font-bold p-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="SEMUA">👨‍⚕️ Semua Dokter</option>
                {Array.isArray(rightFilteredDokterList) && rightFilteredDokterList.map((d) => <option key={d.id_dokter} value={d.id_dokter}>{d.nama_dokter}</option>)}
              </select>
            </div>
          </div>

          {/* LIST MONITOR PANEL KANAN */}
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-0.5">
            {(!Array.isArray(dataPasienTerdaftarHariIni) || dataPasienTerdaftarHariIni.length === 0) ? (
              <p className="text-center py-6 text-[10px] text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">Tidak ada pasien...</p>
            ) : (
              dataPasienTerdaftarHariIni.map((item) => {
                const namaPoli = (Array.isArray(masterPoliklinik) && masterPoliklinik.find((p) => p.id_poli === item.kunjungan?.id_poli)?.nama_poli) || 'Poliklinik';
                return (
                  <div key={item.id_antrean} className="p-2 rounded-xl border border-slate-100 bg-slate-50/60 text-[11px] space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-red-600 text-[10px]">{item.kunjungan?.no_kunjungan || 'KUNJ-XXXX'}</span>
                      <span className="bg-slate-200 text-slate-700 font-mono font-extrabold px-1 rounded text-[8px]">{item.no_antrean}</span>
                    </div>
                    <p className="font-bold text-slate-800 truncate">{item.kunjungan?.pasien?.nama_lengkap}</p>
                    <p className="text-[9px] text-red-700 font-bold truncate">{namaPoli}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* TOMBOL NAVIGASI LAPORAN */}
          <Link href="/pendaftaran/laporan" className="block text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-[10px] shadow-sm transition-all active:scale-95">
            📊 Lihat Jejak Lengkap Pasien →
          </Link>
        </div>

      </div>

      {/* POP-UP MODAL LOOKUP REKAM MEDIS PATIENT HISTORY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">🔍 Master Arsip Rekam Medis (Pasien Lama)</h3>
                <p className="text-[11px] text-slate-500">Pilih pasien untuk memuat data sosial ke loket.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm p-1 hover:bg-slate-200 rounded-full w-7 h-7 flex items-center justify-center">✕</button>
            </div>
            <div className="p-4 bg-white border-b border-slate-100">
              <input
                type="text" placeholder="Ketik No. RM, NIK, atau Nama Lengkap untuk mencari..."
                value={searchHistoryQuery} onChange={(e) => setSearchHistoryQuery(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-xs outline-none focus:bg-white focus:ring-2 focus:ring-red-500 text-slate-800 transition-all"
              />
            </div>
            <div className="p-4 overflow-x-auto flex-1 overflow-y-auto">
              {(!Array.isArray(pasienTerfilterDiModal) || pasienTerfilterDiModal.length === 0) ? (
                <p className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">Data rekam medis tidak ditemukan...</p>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold uppercase border-b border-slate-200">
                      <th className="p-2.5 text-center rounded-l-lg">No. RM</th>
                      <th className="p-2.5">NIK KTP</th>
                      <th className="p-2.5">Nama Lengkap</th>
                      <th className="p-2.5">Tgl Lahir</th>
                      <th className="p-2.5">No. Kontak</th>
                      <th className="p-2.5 text-center rounded-r-lg">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
                    {pasienTerfilterDiModal.map((pasien) => (
                      <tr key={pasien.id_pasien} className="hover:bg-slate-50/80 font-medium">
                        <td className="p-2.5 text-center font-mono font-bold text-red-600">{pasien.no_rm}</td>
                        <td className="p-2.5 font-mono text-slate-700">{pasien.nik}</td>
                        <td className="p-2.5 text-slate-900 font-semibold">{pasien.nama_lengkap}</td>
                        <td className="p-2.5">{pasien.tgl_lahir ? new Date(pasien.tgl_lahir).toLocaleDateString('id-ID') : '-'}</td>
                        <td className="p-2.5 font-mono">{pasien.no_kontak || '-'}</td>
                        <td className="p-2.5 text-center">
                          <button onClick={() => handlePilihPasienLama(pasien)} className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all shadow-xs">Pilih ✓</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 bg-slate-50 text-right rounded-b-2xl text-[10px] text-slate-400 font-medium">
              Total Terdata: {Array.isArray(pasienTerfilterDiModal) ? pasienTerfilterDiModal.length : 0} Pasien
            </div>
          </div>
        </div>
      )}
    </MasterLayout>
  );
}