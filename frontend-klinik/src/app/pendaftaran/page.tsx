//D:\develop\Project_Klinik_HNZ\frontend-klinik\src\app\pendaftaran.page.tsx

'use client';
import { API_URL } from '@/lib/api';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import MasterLayout from '@/components/MasterLayout';

const formatLocalDate = (dateInput?: string | Date) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface SearchOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '-- Pilih --',
  emptyMessage = 'Data tidak ditemukan',
  disabled = false,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset search when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl border border-brand-light p-2.5 bg-brand-light font-bold outline-none text-xs text-left ring-brand focus:ring-2 transition-all ${
          disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'cursor-pointer'
        }`}
        style={{ color: disabled ? undefined : 'var(--foreground)' }}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-brand transition-transform duration-200 ml-2 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-slate-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari..."
              className="w-full bg-transparent text-slate-800 font-semibold outline-none text-xs placeholder:text-slate-400"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-slate-400 italic text-center">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex flex-col transition-colors border-l-2 ${
                      isSelected
                        ? 'bg-brand-light border-brand font-bold'
                        : 'hover:bg-slate-50 text-slate-700 border-transparent font-semibold'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.sublabel && (
                      <span className={`text-[10px] mt-0.5 font-normal ${
                        isSelected ? 'text-brand-hover' : 'text-slate-400'
                      }`}>
                        {opt.sublabel}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PendaftaranDashboard() {
  const [rawAntreanList, setRawAntreanList] = useState<any[]>([]);
  const [activeAntrean, setActiveAntrean] = useState<any>(null);

  // State Filter Antrean Loket Kiosk (Panel Kiri)
  const [filterTanggal, setFilterTanggal] = useState<string>(formatLocalDate());
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');

  // Filter Tanggal Independen untuk Live Monitoring (Panel Kanan) - Dipisah untuk Terdaftar dan Batal
  const [activeTabPanel, setActiveTabPanel] = useState<string>('terdaftar');

  // Filter Terdaftar
  const [terdaftarFilterTanggal, setTerdaftarFilterTanggal] = useState<string>(formatLocalDate());
  const [terdaftarFilterPoli, setTerdaftarFilterPoli] = useState<string>('SEMUA');
  const [terdaftarFilterDokter, setTerdaftarFilterDokter] = useState<string>('SEMUA');
  const [terdaftarSearchNama, setTerdaftarSearchNama] = useState<string>('');
  const [terdaftarFilteredDokterList, setTerdaftarFilteredDokterList] = useState<any[]>([]);

  // Filter Batal
  const [batalFilterTanggal, setBatalFilterTanggal] = useState<string>(formatLocalDate());
  const [batalFilterPoli, setBatalFilterPoli] = useState<string>('SEMUA');
  const [batalFilterDokter, setBatalFilterDokter] = useState<string>('SEMUA');
  const [batalSearchNama, setBatalSearchNama] = useState<string>('');
  const [batalFilteredDokterList, setBatalFilteredDokterList] = useState<any[]>([]);

  // Filter Riwayat
  const [riwayatFilterTanggal, setRiwayatFilterTanggal] = useState<string>('');
  const [riwayatFilterPoli, setRiwayatFilterPoli] = useState<string>('SEMUA');
  const [riwayatFilterDokter, setRiwayatFilterDokter] = useState<string>('SEMUA');
  const [riwayatSearchNama, setRiwayatSearchNama] = useState<string>('');
  const [riwayatFilteredDokterList, setRiwayatFilteredDokterList] = useState<any[]>([]);

  // State Master Dropdown & Sinkronisasi UUID (Panel Tengah)
  const [masterPoliklinik, setMasterPoliklinik] = useState<any[]>([]);
  const [masterDokter, setMasterDokter] = useState<any[]>([]);

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

  // 💳 STATE BARU: Cara Bayar, Penjamin, Asal Rujukan, Detail Rujukan
  const [idCaraBayar, setIdCaraBayar] = useState<string>('');
  const [idPenjamin, setIdPenjamin] = useState<string>('');
  const [idAsalRujukan, setIdAsalRujukan] = useState<string>('');
  const [detailAsalRujukan, setDetailAsalRujukan] = useState<string>('');

  const [masterCaraBayar, setMasterCaraBayar] = useState<any[]>([]);
  const [masterAsalRujukan, setMasterAsalRujukan] = useState<any[]>([]);
  const [masterJadwal, setMasterJadwal] = useState<any[]>([]); // 📅 STATE UNTUK JADWAL DOKTER
  const [defaultCaraBayarId, setDefaultCaraBayarId] = useState<string>(''); // ⚙️ STATE DEFAULT CARA BAYAR GLOBAL

  // Tanggal Kunjungan Hari Ini (Otomatis & Terkunci)
  const [tglKunjungan] = useState<string>(new Date().toISOString());

  // State Lookup Pasien Lama (Pop-up Modal Rekam Medis)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pasienHistoryList, setPasienHistoryList] = useState<any[]>([]);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState<string>('');
  const [selectedPasienId, setSelectedPasienId] = useState<string | null>(null);
  const [selectedNoRm, setSelectedNoRm] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isDetailPasienExpanded, setIsDetailPasienExpanded] = useState<boolean>(true);
  const [currentPageRiwayat, setCurrentPageRiwayat] = useState<number>(1);
  const isFieldDisabled = !!selectedPasienId && !isEditMode;

  // 🏥 Saring dokter secara dinamis dalam render phase untuk mencegah state lag & race condition
  // Menampilkan dokter yang hanya memiliki jadwal praktek HARI INI pada poliklinik terpilih, beserta perhitungan sisa kuota.
  const getHariToday = () => {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayIndex = new Date().getDay();
    return dayNames[dayIndex];
  };

  const hariToday = getHariToday();
  const todaySchedules = masterJadwal.filter(
    (s) => s.hari === hariToday && s.id_poli === idPoli
  );

  const filteredDokter = masterDokter
    .filter((doc) => doc.id_poli === idPoli && todaySchedules.some((s) => s.id_dokter === doc.id_dokter))
    .map((doc) => {
      const sched = todaySchedules.find((s) => s.id_dokter === doc.id_dokter);
      const totalKuota = sched ? sched.kuota : 0;
      const jamMulai = sched ? sched.jam_mulai : '';
      const jamSelesai = sched ? sched.jam_selesai : '';

      // Hitung pasien terdaftar hari ini untuk dokter ini yang status kunjungan & antreannya bukan 'Batal'
      const registeredCount = rawAntreanList.filter((item) => {
        return (
          item.kunjungan &&
          item.kunjungan.id_dokter === doc.id_dokter &&
          item.kunjungan.id_poli === idPoli &&
          item.kunjungan.status_kunjungan !== 'Batal' &&
          item.status_panggil !== 'Batal'
        );
      }).length;

      const sisaKuota = Math.max(0, totalKuota - registeredCount);

      return {
        ...doc,
        sisaKuota,
        totalKuota,
        jamMulai,
        jamSelesai,
      };
    });

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

      // 📥 FETCH CARA BAYAR & ASAL RUJUKAN
      const resCaraBayar = await fetch(`${API_URL}/master-cara-bayar`);
      const dataCaraBayar = await resCaraBayar.json();
      setMasterCaraBayar(Array.isArray(dataCaraBayar) ? dataCaraBayar : []);

      const resAsalRujukan = await fetch(`${API_URL}/master-asal-rujukan`);
      const dataAsalRujukan = await resAsalRujukan.json();
      setMasterAsalRujukan(Array.isArray(dataAsalRujukan) ? dataAsalRujukan : []);

      // 📥 FETCH JADWAL DOKTER UNTUK VALIDASI KUOTA & FILTER JADWAL
      const resJadwal = await fetch(`${API_URL}/jadwal-dokter`);
      const dataJadwal = await resJadwal.json();
      setMasterJadwal(Array.isArray(dataJadwal) ? dataJadwal : []);

      // 📥 FETCH GLOBAL CONFIGURATION FOR DEFAULT CARA BAYAR
      const resSetting = await fetch(`${API_URL}/pengaturan/default_cara_bayar`);
      if (resSetting.ok) {
        const dataSetting = await resSetting.json();
        if (dataSetting && dataSetting.nilai) {
          setDefaultCaraBayarId(dataSetting.nilai);
          // Prapopulasi cara bayar jika state saat ini masih kosong
          setIdCaraBayar((prev) => prev === '' ? dataSetting.nilai : prev);
        }
      }

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



  // 🔄 AUTO RESET: Kembalikan halaman riwayat ke 1 jika pasien yang dipilih berubah/di-reset
  useEffect(() => {
    setCurrentPageRiwayat(1);
  }, [selectedPasienId]);

  // 🔄 VALIDASI DOKTER: Pastikan dokter terpilih berada di poliklinik yang dipilih
  useEffect(() => {
    if (idPoli && masterDokter.length > 0) {
      const filtered = masterDokter.filter((doc) => doc.id_poli === idPoli);
      const isCurrentDoctorValid = filtered.some((doc) => doc.id_dokter === idDokter);
      if (isCurrentDoctorValid) {
        // Tetap gunakan dokter yang terpilih jika dia praktek di poli ini
      } else if (filtered.length > 0) {
        setIdDokter(filtered[0].id_dokter);
      } else {
        setIdDokter('');
      }
    } else {
      setIdDokter('');
    }
  }, [idPoli, masterDokter, idDokter]);

  // Saring dokter untuk filter Terdaftar
  useEffect(() => {
    if (terdaftarFilterPoli === 'SEMUA') {
      setTerdaftarFilteredDokterList(masterDokter);
    } else {
      const filtered = masterDokter.filter((doc) => doc.id_poli === terdaftarFilterPoli);
      setTerdaftarFilteredDokterList(filtered);
    }
    setTerdaftarFilterDokter('SEMUA');
  }, [terdaftarFilterPoli, masterDokter]);

  // Saring dokter untuk filter Batal
  useEffect(() => {
    if (batalFilterPoli === 'SEMUA') {
      setBatalFilteredDokterList(masterDokter);
    } else {
      const filtered = masterDokter.filter((doc) => doc.id_poli === batalFilterPoli);
      setBatalFilteredDokterList(filtered);
    }
    setBatalFilterDokter('SEMUA');
  }, [batalFilterPoli, masterDokter]);

  // Saring dokter untuk filter Riwayat
  useEffect(() => {
    if (riwayatFilterPoli === 'SEMUA') {
      setRiwayatFilteredDokterList(masterDokter);
    } else {
      const filtered = masterDokter.filter((doc) => doc.id_poli === riwayatFilterPoli);
      setRiwayatFilteredDokterList(filtered);
    }
    setRiwayatFilterDokter('SEMUA');
  }, [riwayatFilterPoli, masterDokter]);

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
    if (selectedPasienId && !isEditMode) return; // Jangan overwrite data alamat tersimpan untuk pasien lama yang diload!
    if (!namaWilayah.provinsi && !namaWilayah.kabupaten && !namaWilayah.kecamatan && !namaWilayah.kelurahan && !formPasien.rt_rw) return;

    const rtRwStr = formPasien.rt_rw ? `RT/RW ${formPasien.rt_rw}, ` : '';
    const kelStr = namaWilayah.kelurahan ? `Kel. ${namaWilayah.kelurahan}, ` : '';
    const kecStr = namaWilayah.kecamatan ? `Kec. ${namaWilayah.kecamatan}, ` : '';
    const kabStr = namaWilayah.kabupaten ? `${namaWilayah.kabupaten}, ` : '';
    const provStr = namaWilayah.provinsi ? `Prov. ${namaWilayah.provinsi}` : '';

    const autoAlamat = `${rtRwStr}${kelStr}${kecStr}${kabStr}${provStr}`.replace(/,\s*$/, '').trim();
    setFormPasien((prev) => ({ ...prev, alamat_lengkap: autoAlamat }));
  }, [formPasien.rt_rw, namaWilayah.provinsi, namaWilayah.kabupaten, namaWilayah.kecamatan, namaWilayah.kelurahan, selectedPasienId, isEditMode]);

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
    const tanggalItem = formatLocalDate(item.created_at);
    const cocokTanggal = tanggalItem === filterTanggal;
    const cocokStatus =
      filterStatus === 'SEMUA' || 
      (filterStatus === 'TUNGGU' && item.status_panggil === 'Tunggu') ||
      (filterStatus === 'PANGGIL' && item.status_panggil !== 'Tunggu' && item.status_panggil !== 'Selesai');
    return cocokTanggal && cocokStatus;
  });

  // 2. FILTERING BERLAPIS DATA PASIEN TERDAFTAR (PANEL KANAN)
  const dataPasienTerdaftarHariIni = rawAntreanList.filter((item) => {
    if (item.tipe_antrean !== 'Poli' && item.tipe_antrean !== 'Nurse') return false;

    // Saring keluar jika status antrean atau kunjungan dibatalkan
    if (item.status_panggil === 'Batal' || item.kunjungan?.status_kunjungan === 'Batal') return false;

    const tanggalItem = formatLocalDate(item.created_at);
    const cocokTanggal = tanggalItem === terdaftarFilterTanggal;
    const cocokPoli = terdaftarFilterPoli === 'SEMUA' || item.kunjungan?.id_poli === terdaftarFilterPoli;
    const cocokDokter = terdaftarFilterDokter === 'SEMUA' || item.kunjungan?.id_dokter === terdaftarFilterDokter;

    // Saring berdasarkan Nama Pasien / RM / NIK
    const query = terdaftarSearchNama.trim().toLowerCase();
    const cocokNama = !query || 
      item.kunjungan?.pasien?.nama_lengkap?.toLowerCase().includes(query) ||
      item.kunjungan?.pasien?.no_rm?.toLowerCase().includes(query) ||
      item.kunjungan?.pasien?.nik?.toLowerCase().includes(query);

    return cocokTanggal && cocokPoli && cocokDokter && cocokNama;
  });

  // 3. FILTERING PASIEN BATAL (PANEL KANAN)
  const dataPasienBatalHariIni = rawAntreanList.filter((item) => {
    if (item.tipe_antrean !== 'Poli' && item.tipe_antrean !== 'Nurse') return false;

    // Hanya ambil jika status antrean atau kunjungan dibatalkan
    if (item.status_panggil !== 'Batal' && item.kunjungan?.status_kunjungan !== 'Batal') return false;

    const tanggalItem = formatLocalDate(item.created_at);
    const cocokTanggal = tanggalItem === batalFilterTanggal;
    const cocokPoli = batalFilterPoli === 'SEMUA' || item.kunjungan?.id_poli === batalFilterPoli;
    const cocokDokter = batalFilterDokter === 'SEMUA' || item.kunjungan?.id_dokter === batalFilterDokter;

    // Saring berdasarkan Nama Pasien / RM / NIK
    const query = batalSearchNama.trim().toLowerCase();
    const cocokNama = !query || 
      item.kunjungan?.pasien?.nama_lengkap?.toLowerCase().includes(query) ||
      item.kunjungan?.pasien?.no_rm?.toLowerCase().includes(query) ||
      item.kunjungan?.pasien?.nik?.toLowerCase().includes(query);

    return cocokTanggal && cocokPoli && cocokDokter && cocokNama;
  });

  // 4. FILTERING PASIEN RIWAYAT (DI BAWAH DATA WILAYAH)
  const dataPasienRiwayat = rawAntreanList.filter((item) => {
    if (item.tipe_antrean !== 'Poli' && item.tipe_antrean !== 'Nurse') return false;

    // Saring keluar jika status antrean atau kunjungan dibatalkan
    if (item.status_panggil === 'Batal' || item.kunjungan?.status_kunjungan === 'Batal') return false;

    // Jika ada pasien yang sedang terpilih di formulir, tampilkan hanya riwayat pasien tersebut
    if (selectedPasienId) {
      return item.kunjungan?.pasien?.id_pasien === selectedPasienId;
    }

    // Jika tidak ada pasien terpilih, saring berdasarkan kata kunci pencarian di tabel riwayat
    const query = riwayatSearchNama.trim().toLowerCase();
    const cocokNama = !query || 
      item.kunjungan?.pasien?.nama_lengkap?.toLowerCase().includes(query) ||
      item.kunjungan?.pasien?.no_rm?.toLowerCase().includes(query) ||
      item.kunjungan?.pasien?.nik?.toLowerCase().includes(query);

    return cocokNama;
  }).sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // 📝 Konfigurasi Slicing Pagination Riwayat Pasien (Default 5 records per halaman)
  const itemsPerPage = 5;
  const totalItems = dataPasienRiwayat.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.max(1, Math.min(currentPageRiwayat, totalPages));
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedRiwayat = dataPasienRiwayat.slice(startIndex, startIndex + itemsPerPage);

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

    setIsEditMode(false);
    setIsDetailPasienExpanded(false); // Collapse on selection
    setIsModalOpen(false);
    setSearchHistoryQuery('');
  };

  const handleResetModePasienBaru = () => {
    setSelectedPasienId(null);
    setSelectedNoRm('');
    setIsEditMode(false);
    setIsDetailPasienExpanded(true); // Expand on reset
    setIdPoli('');
    setIdDokter('');
    setIdCaraBayar(defaultCaraBayarId);
    setIdPenjamin('');
    setIdAsalRujukan('');
    setDetailAsalRujukan('');
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

    // 🛡️ VALIDASI FORM CARA BAYAR & PENJAMIN
    if (!idCaraBayar) {
      alert('⚠️ Silakan pilih Cara Bayar terlebih dahulu!');
      return;
    }
    const selectedCaraBayarObj = masterCaraBayar.find(cb => cb.id_cara_bayar === idCaraBayar);
    if (selectedCaraBayarObj && selectedCaraBayarObj.nama_cara_bayar !== 'Umum Pribadi' && !idPenjamin) {
      alert(`⚠️ Cara bayar ${selectedCaraBayarObj.nama_cara_bayar} wajib memilih Penjamin!`);
      return;
    }

    // 🛡️ VALIDASI FORM ASAL RUJUKAN & DETAIL RUJUKAN
    if (!idAsalRujukan) {
      alert('⚠️ Silakan pilih Asal Rujukan terlebih dahulu!');
      return;
    }
    const selectedAsalRujukanObj = masterAsalRujukan.find(ar => ar.id_asal_rujukan === idAsalRujukan);
    if (selectedAsalRujukanObj && selectedAsalRujukanObj.nama_asal_rujukan !== 'Datang Sendiri' && !detailAsalRujukan.trim()) {
      alert(`⚠️ Detail asal rujukan wajib diisi secara manual jika rujukan melalui ${selectedAsalRujukanObj.nama_asal_rujukan}!`);
      return;
    }

    // 🛡️ VALIDASI FORM DOKTER & SISA KUOTA
    if (!idDokter) {
      alert('⚠️ Silakan pilih Dokter Praktik terlebih dahulu!');
      return;
    }
    const selectedDoctorObj = filteredDokter.find((d) => d.id_dokter === idDokter);
    if (selectedDoctorObj && selectedDoctorObj.sisaKuota !== undefined && selectedDoctorObj.sisaKuota <= 0) {
      alert(`⚠️ Kuota pelayanan untuk ${selectedDoctorObj.nama_dokter} hari ini sudah penuh! Silakan pilih dokter lain yang masih memiliki sisa kuota.`);
      return;
    }

    if (!activeAntrean) {
      const konfirmasiLangsung = confirm('Anda memproses pendaftaran langsung tanpa memanggil nomor antrean loket (misal: daftar ulang pasien batal atau walk-in). Lanjutkan pendaftaran?');
      if (!konfirmasiLangsung) return;
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
      } else if (isEditMode) {
        // Update Pasien Lama jika sedang dalam Mode Edit
        const resUpdatePasien = await fetch(`${API_URL}/pasien/${finalPasienId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formPasien),
        });
        if (!resUpdatePasien.ok) throw new Error('Gagal memperbarui rekam medis pasien.');
        setIsEditMode(false);
      }

      // Mengikutsertakan TANGGAL KUNJUNGAN, CARA BAYAR, PENJAMIN, dan RUJUKAN ke Payload
      const resKunjungan = await fetch(`${API_URL}/kunjungan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pasien: finalPasienId,
          id_poli: idPoli,
          id_dokter: idDokter,
          tgl_kunjungan: tglKunjungan,
          id_cara_bayar: idCaraBayar || null,
          id_penjamin: idPenjamin || null,
          id_asal_rujukan: idAsalRujukan || null,
          detail_asal_rujukan: detailAsalRujukan || null,
        }),
      });
      const dataKunjungan = await resKunjungan.json();
      if (!resKunjungan.ok) throw new Error('Gagal memproses pembuatan transaksi kunjungan.');

      // Antrekan ke Nurse Station
      await fetch(`${API_URL}/antrean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: dataKunjungan.id_kunjungan,
          tipe_antrean: 'Nurse',
        }),
      });

      // Selesaikan Antrean Kiosk Loket (bila ada)
      if (activeAntrean) {
        await fetch(`${API_URL}/antrean/${activeAntrean.id_antrean}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status_panggil: 'Selesai' }),
        });
      }

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

  const handleBatalPeriksa = async (item: any) => {
    const konfirmasi = confirm(`Apakah Anda yakin ingin membatalkan pemeriksaan untuk pasien ${item.kunjungan?.pasien?.nama_lengkap}?`);
    if (!konfirmasi) return;

    try {
      // 1. PATCH status antrean ke 'Batal'
      const resAntrean = await fetch(`${API_URL}/antrean/${item.id_antrean}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_panggil: 'Batal' }),
      });

      if (!resAntrean.ok) throw new Error('Gagal membatalkan antrean.');

      // 2. PATCH status kunjungan ke 'Batal'
      if (item.id_kunjungan) {
        const resKunjungan = await fetch(`${API_URL}/kunjungan/${item.id_kunjungan}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status_kunjungan: 'Batal' }),
        });
        if (!resKunjungan.ok) throw new Error('Gagal membatalkan kunjungan.');
      }

      alert('✅ Pemeriksaan pasien berhasil dibatalkan.');
      fetchData();
    } catch (error: any) {
      console.error(error);
      alert(`Gagal membatalkan pemeriksaan: ${error.message}`);
    }
  };

  const handleDaftarUlangPasienBatal = (item: any) => {
    const pasien = item.kunjungan?.pasien;
    if (!pasien) {
      alert("Data pasien tidak ditemukan.");
      return;
    }

    // Set selected patient ID and No. RM
    setSelectedPasienId(pasien.id_pasien);
    setSelectedNoRm(pasien.no_rm);
    setIsEditMode(false);
    setIsDetailPasienExpanded(false); // Collapse on selection from history

    // Set poliklinik and doctor
    if (item.kunjungan?.id_poli) {
      setIdPoli(item.kunjungan.id_poli);
    }
    if (item.kunjungan?.id_dokter) {
      setIdDokter(item.kunjungan.id_dokter);
    }

    // Set payment method and referral fields
    if (item.kunjungan?.id_cara_bayar) {
      setIdCaraBayar(item.kunjungan.id_cara_bayar);
    }
    if (item.kunjungan?.id_penjamin) {
      setIdPenjamin(item.kunjungan.id_penjamin);
    }
    if (item.kunjungan?.id_asal_rujukan) {
      setIdAsalRujukan(item.kunjungan.id_asal_rujukan);
    }
    if (item.kunjungan?.detail_asal_rujukan) {
      setDetailAsalRujukan(item.kunjungan.detail_asal_rujukan);
    }

    // Set social and address form fields
    setFormPasien({
      nik: pasien.nik || "",
      nama_lengkap: pasien.nama_lengkap || "",
      tgl_lahir: pasien.tgl_lahir ? pasien.tgl_lahir.split('T')[0] : '',
      jenis_kelamin: pasien.jenis_kelamin || "L",
      agama: pasien.agama || "",
      pekerjaan: pasien.pekerjaan || "",
      no_kontak: pasien.no_kontak || "",
      id_jenis_alamat: pasien.id_jenis_alamat || "",
      rt_rw: pasien.rt_rw || "",
      id_provinsi: pasien.id_provinsi || "",
      id_kabupaten: pasien.id_kabupaten || "",
      id_kecamatan: pasien.id_kecamatan || "",
      id_kelurahan: pasien.id_kelurahan || "",
      alamat_lengkap: pasien.alamat_lengkap || "",
    });

    setNamaWilayah({
      provinsi: pasien.provinsi?.nama_provinsi || "",
      kabupaten: pasien.kabupaten?.nama_kabupaten || "",
      kecamatan: pasien.kecamatan?.nama_kecamatan || "",
      kelurahan: pasien.kelurahan?.nama_kelurahan || "",
    });

    alert(`📋 Data pasien ${pasien.nama_lengkap} dan ruangan tujuannya berhasil dimuat ke formulir! Petugas loket tinggal menyesuaikan atau langsung klik Simpan.`);
  };

  const handleRtRwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const oldVal = formPasien.rt_rw;
    
    // Hanya ijinkan angka dan karakter '/'
    let cleaned = val.replace(/[^0-9/]/g, '');
    
    // Jika mengetik bertambah panjang (bukan menghapus)
    if (cleaned.length > oldVal.length) {
      // Kasus 1: Tepat 3 angka pertama, sisipkan '/'
      if (cleaned.length === 3 && !cleaned.includes('/')) {
        cleaned = cleaned + '/';
      }
      // Kasus 2: User meng-input 6 angka beruntun tanpa '/' (misal dari paste atau input cepat)
      else if (cleaned.length === 6 && !cleaned.includes('/')) {
        cleaned = cleaned.slice(0, 3) + '/' + cleaned.slice(3, 6);
      }
    }
    
    // Batasi panjang maksimal ke 7 karakter (misal: 002/011)
    if (cleaned.length > 7) {
      cleaned = cleaned.slice(0, 7);
    }
    
    setFormPasien({ ...formPasien, rt_rw: cleaned });
  };

  const nikLength = formPasien.nik.length;

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
                  type="button"
                  onClick={() => {
                    const nextMode = !isEditMode;
                    setIsEditMode(nextMode);
                    if (nextMode) {
                      setIsDetailPasienExpanded(true); // Auto expand when editing
                    }
                  }}
                  className={`font-bold text-[11px] px-3 py-2 rounded-xl transition-all ${
                    isEditMode
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {isEditMode ? '🔓 Batal Edit' : '📝 Edit Data Pasien'}
                </button>
              )}
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
            {selectedPasienId && (
              <div className="md:col-span-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all duration-300">
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold flex items-center justify-center shadow-2xs">
                    👤
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Identitas & Wilayah Pasien Lama</p>
                      <span className="font-mono text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">RM: {selectedNoRm}</span>
                    </div>
                    {!isDetailPasienExpanded ? (
                      <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                        <span className="font-bold">{formPasien.nama_lengkap}</span> • NIK: <span className="font-mono">{formPasien.nik}</span> • Lahir: <span className="font-mono">{formPasien.tgl_lahir}</span> ({formPasien.jenis_kelamin === 'L' ? 'L' : 'P'})
                      </p>
                    ) : (
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">Data rekam medis dimuat. Petugas dapat menyembunyikan panel ini atau mengedit data jika diperlukan.</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailPasienExpanded(!isDetailPasienExpanded)}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-extrabold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer ml-auto sm:ml-0"
                >
                  {isDetailPasienExpanded ? '▲ Sembunyikan Form' : '▼ Tampilkan Form Detail'}
                </button>
              </div>
            )}

            {isDetailPasienExpanded && (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nomor NIK KTP Pasien</label>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full transition-all duration-300 transform scale-100 ${
                  nikLength === 0
                    ? 'bg-slate-100 text-slate-500'
                    : nikLength < 16
                      ? 'bg-amber-50 text-amber-600 animate-pulse'
                      : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {nikLength === 0
                    ? '16 digit diperlukan'
                    : nikLength < 16
                      ? `⚠️ Kurang ${16 - nikLength} digit lagi`
                      : '✓ NIK Lengkap (16 digit)'}
                </span>
              </div>
              <input
                type="text" required maxLength={16} placeholder="Masukkan 16 digit NIK" disabled={isFieldDisabled}
                value={formPasien.nik} 
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, ''); // keep only numbers
                  setFormPasien({ ...formPasien, nik: cleaned });
                }}
                className={`w-full rounded-xl border p-2.5 bg-slate-50 font-mono text-xs focus:bg-white outline-none transition-all duration-300 text-slate-800 disabled:opacity-60 ${
                  nikLength === 0
                    ? 'border-slate-200 focus:ring-2 focus:ring-red-500'
                    : nikLength < 16
                      ? 'border-amber-400 ring-2 ring-amber-100 focus:ring-amber-500'
                      : 'border-emerald-500 ring-2 ring-emerald-100 focus:ring-emerald-500'
                }`}
              />
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1 transition-all duration-300">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    nikLength < 16 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(nikLength / 16) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400 font-bold">NAMA LENGKAP PASIEN</label>
              <input
                type="text" required placeholder="Sesuai kartu identitas" disabled={isFieldDisabled}
                value={formPasien.nama_lengkap} onChange={(e) => setFormPasien({ ...formPasien, nama_lengkap: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-800 disabled:opacity-60"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400 font-bold">TANGGAL LAHIR</label>
              <input
                type="date" required disabled={isFieldDisabled}
                value={formPasien.tgl_lahir} onChange={(e) => setFormPasien({ ...formPasien, tgl_lahir: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-700 disabled:opacity-60"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400 font-bold">JENIS KELAMIN</label>
              <select
                value={formPasien.jenis_kelamin} onChange={(e) => setFormPasien({ ...formPasien, jenis_kelamin: e.target.value })} disabled={isFieldDisabled}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-700 disabled:opacity-60"
              >
                <option value="L">Laki-Laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400 font-bold">AGAMA</label>
              <input
                type="text" required placeholder="Contoh: Islam, Kristen" disabled={isFieldDisabled}
                value={formPasien.agama} onChange={(e) => setFormPasien({ ...formPasien, agama: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-800 disabled:opacity-60"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400 font-bold">PEKERJAAN</label>
              <input
                type="text" required placeholder="Contoh: Karyawan Swasta" disabled={isFieldDisabled}
                value={formPasien.pekerjaan} onChange={(e) => setFormPasien({ ...formPasien, pekerjaan: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-800 disabled:opacity-60"
              />
            </div>
            <div className="space-y-0.5 md:col-span-2">
              <label className="text-[10px] text-slate-400 font-bold">NOMOR KONTAK / WHATSAPP</label>
              <input
                type="text" required placeholder="Contoh: 08123456789" disabled={isFieldDisabled}
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
                    value={formPasien.id_jenis_alamat} disabled={isFieldDisabled}
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
                    type="text" placeholder="Contoh: 002/011" disabled={isFieldDisabled}
                    value={formPasien.rt_rw} onChange={handleRtRwChange}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-800 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-400 font-bold">PROVINSI</label>
                  {isFieldDisabled ? (
                    <input
                      type="text"
                      readOnly
                      value={namaWilayah.provinsi || '-'}
                      className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs text-slate-800 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={formPasien.id_provinsi}
                      onChange={(e) => {
                        const txt = e.target.options[e.target.selectedIndex].text;
                        const isBlank = e.target.value === "";
                        setFormPasien({ ...formPasien, id_provinsi: e.target.value, id_kabupaten: '', id_kecamatan: '', id_kelurahan: '' });
                        setNamaWilayah({ ...namaWilayah, provinsi: isBlank ? '' : txt, kabupaten: '', kecamatan: '', kelurahan: '' });
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-700"
                    >
                      <option value="">-- Pilih Provinsi --</option>
                      {Array.isArray(masterProvinsi) && masterProvinsi.map((p) => <option key={p.id_provinsi} value={p.id_provinsi}>{p.nama_provinsi}</option>)}
                    </select>
                  )}
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-400 font-bold">KABUPATEN / KOTA</label>
                  {isFieldDisabled ? (
                    <input
                      type="text"
                      readOnly
                      value={namaWilayah.kabupaten || '-'}
                      className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs text-slate-800 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={formPasien.id_kabupaten} disabled={!formPasien.id_provinsi}
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
                  )}
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-400 font-bold">KECAMATAN</label>
                  {isFieldDisabled ? (
                    <input
                      type="text"
                      readOnly
                      value={namaWilayah.kecamatan || '-'}
                      className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs text-slate-800 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={formPasien.id_kecamatan} disabled={!formPasien.id_kabupaten}
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
                  )}
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-400 font-bold">KELURAHAN</label>
                  {isFieldDisabled ? (
                    <input
                      type="text"
                      readOnly
                      value={namaWilayah.kelurahan || '-'}
                      className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs text-slate-800 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={formPasien.id_kelurahan} disabled={!formPasien.id_kecamatan}
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
                  )}
                </div>

                <div className="space-y-0.5 md:col-span-2">
                  <label className="text-[10px] text-slate-400 font-bold">ALAMAT LENGKAP (OTOMATIS / BISA DIEDIT MANUAL)</label>
                  <textarea
                    rows={2} placeholder="Sistem otomatis menyusun alamat, ketik nama jalan atau detail di sini..." disabled={isFieldDisabled}
                    value={formPasien.alamat_lengkap} onChange={(e) => setFormPasien({ ...formPasien, alamat_lengkap: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-slate-800 disabled:opacity-60"
                  />
                </div>

              </div>
            </div>
            </>
          )}

          </div>

          {/* TABEL RIWAYAT KUNJUNGAN PASIEN PREVIOUS */}
          {selectedPasienId && (
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    ⏳ Riwayat Kunjungan Pasien Sebelumnya
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Menampilkan riwayat kunjungan khusus pasien terpilih
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-700 text-white font-extrabold border-b border-slate-300 text-[10px] uppercase tracking-wider">
                      <th className="p-2.5">Tgl Regis</th>
                      <th className="p-2.5">No. RM / Pasien</th>
                      <th className="p-2.5">Poli Kunjungan</th>
                      <th className="p-2.5">Nama Dokter</th>
                      <th className="p-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {(!Array.isArray(dataPasienRiwayat) || dataPasienRiwayat.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-[10px] text-slate-400 font-medium">
                          Tidak ada data riwayat kunjungan
                        </td>
                      </tr>
                    ) : (
                      paginatedRiwayat.map((item) => {
                        const namaPoli = (Array.isArray(masterPoliklinik) && masterPoliklinik.find((p) => p.id_poli === item.kunjungan?.id_poli)?.nama_poli) || 'Poliklinik';
                        const namaDokter = (Array.isArray(masterDokter) && masterDokter.find((d) => d.id_dokter === item.kunjungan?.id_dokter)?.nama_dokter) || '-';
                        const tglRegis = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-';
                        return (
                          <tr key={item.id_antrean} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">{tglRegis}</td>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-800">{item.kunjungan?.pasien?.nama_lengkap}</div>
                              <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-semibold">RM: {item.kunjungan?.pasien?.no_rm || '-'}</span>
                            </td>
                            <td className="p-2.5">
                              <div className="text-red-700 font-bold">{namaPoli}</div>
                              {item.kunjungan?.asesmen_keperawatan?.[0]?.keluhan_utama ? (
                                <div className="text-[10px] text-slate-500 italic mt-0.5 max-w-[180px] truncate" title={item.kunjungan.asesmen_keperawatan[0].keluhan_utama}>
                                  💬 {item.kunjungan.asesmen_keperawatan[0].keluhan_utama}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 italic mt-0.5">- Belum ada keluhan -</div>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-600 truncate max-w-[150px] font-semibold">{namaDokter}</td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDaftarUlangPasienBatal(item)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 font-bold py-1 px-2.5 rounded-lg text-[10px] transition-all border border-emerald-200/50 active:scale-95 flex items-center justify-center gap-1 mx-auto shadow-2xs"
                              >
                                🔄 Daftar Lagi
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* 📊 Premium Pagination Controls */}
              {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                  <div className="text-[10px] text-slate-500 font-medium">
                    Menampilkan <span className="font-bold text-slate-700">{startIndex + 1}</span> - <span className="font-bold text-slate-700">{endIndex}</span> dari <span className="font-bold text-slate-700">{totalItems}</span> Riwayat
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safeCurrentPage === 1}
                      onClick={() => setCurrentPageRiwayat((prev) => Math.max(prev - 1, 1))}
                      className={`px-2.5 py-1 flex items-center gap-1 rounded-lg font-bold text-[10px] transition-all border ${
                        safeCurrentPage === 1
                          ? 'bg-slate-50 text-slate-300 border-slate-150 cursor-not-allowed'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 active:scale-95 shadow-2xs'
                      }`}
                    >
                      ‹ Sebelumnya
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPageRiwayat(pageNum)}
                          className={`w-6 h-6 flex items-center justify-center rounded-lg font-bold text-[10px] transition-all ${
                            pageNum === safeCurrentPage
                              ? 'bg-red-600 text-white shadow-xs shadow-red-500/20'
                              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={safeCurrentPage === totalPages}
                      onClick={() => setCurrentPageRiwayat((prev) => Math.min(prev + 1, totalPages))}
                      className={`px-2.5 py-1 flex items-center gap-1 rounded-lg font-bold text-[10px] transition-all border ${
                        safeCurrentPage === totalPages
                          ? 'bg-slate-50 text-slate-300 border-slate-150 cursor-not-allowed'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 active:scale-95 shadow-2xs'
                      }`}
                    >
                      Berikutnya ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
              <SearchableSelect
                options={(Array.isArray(masterPoliklinik) ? masterPoliklinik : []).map((p) => ({
                  value: p.id_poli,
                  label: p.nama_poli,
                }))}
                value={idPoli}
                onChange={(val) => setIdPoli(val)}
                placeholder="-- Pilih Poliklinik --"
                emptyMessage="Poliklinik tidak ditemukan"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-red-600 font-bold">DOKTER PRAKTIK</label>
              <SearchableSelect
                options={(Array.isArray(filteredDokter) ? filteredDokter : []).map((d) => {
                  const sisa = d.sisaKuota !== undefined ? d.sisaKuota : 0;
                  const jam = d.jamMulai && d.jamSelesai ? ` | 🕒 ${d.jamMulai}-${d.jamSelesai}` : '';
                  const statusQuota = sisa > 0 ? ` (Sisa: ${sisa})` : ' (Kuota Penuh)';
                  return {
                    value: d.id_dokter,
                    label: `${d.nama_dokter}${statusQuota}`,
                    sublabel: `${d.sip_dokter || d.sip ? `SIP: ${d.sip_dokter || d.sip}` : ''}${jam}`,
                  };
                })}
                value={idDokter}
                onChange={(val) => setIdDokter(val)}
                placeholder={!idPoli ? '-- Pilih Poliklinik Dahulu --' : '-- Pilih Dokter --'}
                emptyMessage={!idPoli ? 'Pilih poliklinik terlebih dahulu' : 'Tidak ada dokter bertugas hari ini'}
                disabled={!idPoli}
              />
            </div>
          </div>

          {/* 💳 KELOMPOK PEMBAYARAN & RUJUKAN (SEJAJAR & CONDITIONAL DISABLED UNTUK UX STABIL) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-3.5 border-t border-slate-100">
            {/* CARA BAYAR */}
            <div className="space-y-0.5">
              <label className="text-[10px] text-red-600 font-bold">CARA BAYAR</label>
              <SearchableSelect
                options={(Array.isArray(masterCaraBayar) ? masterCaraBayar : []).map((cb) => ({
                  value: cb.id_cara_bayar,
                  label: cb.nama_cara_bayar,
                }))}
                value={idCaraBayar}
                onChange={(val) => {
                  setIdCaraBayar(val);
                  setIdPenjamin(''); // Reset penjamin
                }}
                placeholder="-- Pilih Cara Bayar --"
                emptyMessage="Cara bayar tidak ditemukan"
              />
            </div>
            
            {/* PENJAMIN (JAMINAN) */}
            <div className="space-y-0.5">
              <label className="text-[10px] text-red-600 font-bold">PENJAMIN (JAMINAN)</label>
              <SearchableSelect
                options={(() => {
                  const selectedCaraBayarObj = masterCaraBayar.find(cb => cb.id_cara_bayar === idCaraBayar);
                  const isUmum = selectedCaraBayarObj?.nama_cara_bayar === 'Umum Pribadi';
                  if (!idCaraBayar || isUmum) return [];
                  return (selectedCaraBayarObj?.penjamin || []).map((pj: any) => ({
                    value: pj.id_penjamin,
                    label: pj.nama_penjamin,
                  }));
                })()}
                value={idPenjamin}
                onChange={(val) => setIdPenjamin(val)}
                placeholder={
                  !idCaraBayar 
                    ? '-- Pilih Cara Bayar Dahulu --' 
                    : (masterCaraBayar.find(cb => cb.id_cara_bayar === idCaraBayar)?.nama_cara_bayar === 'Umum Pribadi')
                      ? 'Tidak Perlu Penjamin'
                      : '-- Pilih Penjamin --'
                }
                emptyMessage="Penjamin tidak ditemukan"
                disabled={
                  !idCaraBayar || 
                  (masterCaraBayar.find(cb => cb.id_cara_bayar === idCaraBayar)?.nama_cara_bayar === 'Umum Pribadi')
                }
              />
            </div>

            {/* ASAL RUJUKAN */}
            <div className="space-y-0.5">
              <label className="text-[10px] text-red-600 font-bold">ASAL RUJUKAN</label>
              <SearchableSelect
                options={(Array.isArray(masterAsalRujukan) ? masterAsalRujukan : []).map((ar) => ({
                  value: ar.id_asal_rujukan,
                  label: ar.nama_asal_rujukan,
                }))}
                value={idAsalRujukan}
                onChange={(val) => {
                  setIdAsalRujukan(val);
                  if (masterAsalRujukan.find(ar => ar.id_asal_rujukan === val)?.nama_asal_rujukan === 'Datang Sendiri') {
                    setDetailAsalRujukan(''); // Reset detail jika Datang Sendiri
                  }
                }}
                placeholder="-- Pilih Asal Rujukan --"
                emptyMessage="Asal rujukan tidak ditemukan"
              />
            </div>

            {/* DETAIL ASAL RUJUKAN */}
            <div className="space-y-0.5">
              <label className="text-[10px] text-red-600 font-bold">DETAIL ASAL RUJUKAN</label>
              <input
                type="text"
                value={detailAsalRujukan}
                onChange={(e) => setDetailAsalRujukan(e.target.value)}
                placeholder={
                  !idAsalRujukan
                    ? '-- Pilih Asal Rujukan Dahulu --'
                    : (masterAsalRujukan.find(ar => ar.id_asal_rujukan === idAsalRujukan)?.nama_asal_rujukan === 'Datang Sendiri')
                      ? 'Tidak Perlu Detail Rujukan'
                      : 'Masukkan nama faskes / instansi detail...'
                }
                disabled={
                  !idAsalRujukan ||
                  (masterAsalRujukan.find(ar => ar.id_asal_rujukan === idAsalRujukan)?.nama_asal_rujukan === 'Datang Sendiri')
                }
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800 font-bold outline-none text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-500/10 hover:bg-red-700 transition-all active:scale-98 disabled:bg-slate-300 flex justify-center items-center gap-2 text-xs"
          >
            {loading ? '⏳ MEMPROSES STRUK KUNJUNGAN...' : '💾 SIMPAN TRANSAKSI & TERUSKAN KE NURSE STATION'}
          </button>
        </form>

        {/* 3. PANEL KANAN: LIVE MONITORING TERDAFTAR & BATAL (2 KOLOM) */}
        <div className="col-span-12 xl:col-span-2 lg:col-span-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          
          {/* SEGMENTED TAB BUTTONS */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => setActiveTabPanel('terdaftar')}
              className={`py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTabPanel === 'terdaftar'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>✅ Terdaftar</span>
              <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
                {Array.isArray(dataPasienTerdaftarHariIni) ? dataPasienTerdaftarHariIni.length : 0}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabPanel('batal')}
              className={`py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTabPanel === 'batal'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <span>❌ Batal</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                activeTabPanel === 'batal' ? 'bg-rose-700/50 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {Array.isArray(dataPasienBatalHariIni) ? dataPasienBatalHariIni.length : 0}
              </span>
            </button>
          </div>

          {/* TAB PANEL CONTENT */}
          {activeTabPanel === 'terdaftar' && (
            <div className="space-y-3">
              {/* TERDAFTAR SEARCH & FILTERS */}
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px]">
                <div>
                  <label className="text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Cari Pasien</label>
                  <input
                    type="text"
                    placeholder="🔍 Nama, RM, atau NIK..."
                    value={terdaftarSearchNama}
                    onChange={(e) => setTerdaftarSearchNama(e.target.value)}
                    className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Filter Tanggal</label>
                  <input
                    type="date"
                    value={terdaftarFilterTanggal}
                    onChange={(e) => setTerdaftarFilterTanggal(e.target.value)}
                    className="w-full p-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Filter Ruangan</label>
                  <select
                    value={terdaftarFilterPoli}
                    onChange={(e) => setTerdaftarFilterPoli(e.target.value)}
                    className="w-full font-bold p-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="SEMUA">✨ Semua Poliklinik</option>
                    {Array.isArray(masterPoliklinik) && masterPoliklinik.map((p) => (
                      <option key={p.id_poli} value={p.id_poli}>📍 {p.nama_poli}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Filter Dokter</label>
                  <select
                    value={terdaftarFilterDokter}
                    onChange={(e) => setTerdaftarFilterDokter(e.target.value)}
                    className="w-full font-bold p-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="SEMUA">👨‍⚕️ Semua Dokter</option>
                    {Array.isArray(terdaftarFilteredDokterList) && terdaftarFilteredDokterList.map((d) => (
                      <option key={d.id_dokter} value={d.id_dokter}>{d.nama_dokter}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LIST MONITOR TERDAFTAR */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-0.5">
                {(!Array.isArray(dataPasienTerdaftarHariIni) || dataPasienTerdaftarHariIni.length === 0) ? (
                  <p className="text-center py-8 text-[10px] text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">Tidak ada pasien...</p>
                ) : (
                  dataPasienTerdaftarHariIni.map((item) => {
                    const namaPoli = (Array.isArray(masterPoliklinik) && masterPoliklinik.find((p) => p.id_poli === item.kunjungan?.id_poli)?.nama_poli) || 'Poliklinik';
                    const docObj = Array.isArray(masterDokter) && masterDokter.find((d) => d.id_dokter === item.kunjungan?.id_dokter);
                    return (
                      <div key={item.id_antrean} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 text-[11px] space-y-1.5 transition-all hover:bg-slate-50 shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-red-600 text-[10px]">{item.kunjungan?.no_kunjungan || 'KUNJ-XXXX'}</span>
                          <span className="bg-slate-200 text-slate-700 font-mono font-extrabold px-1 rounded text-[8px]">{item.no_antrean}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 truncate">{item.kunjungan?.pasien?.nama_lengkap}</p>
                          <p className="text-[9.5px] text-red-700 font-bold truncate">{namaPoli}</p>
                          {docObj?.nama_dokter && (
                            <p className="text-[9px] text-slate-500 truncate">👨‍⚕️ {docObj.nama_dokter}</p>
                          )}
                          
                          {/* 💳 METODE BAYAR BADGE */}
                          {item.kunjungan?.cara_bayar && (
                            <p className="text-[8.5px] text-slate-600 truncate mt-1 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-md font-semibold">
                              <span>💳</span>
                              <span className="font-extrabold text-slate-800">{item.kunjungan.cara_bayar.nama_cara_bayar}</span>
                              {item.kunjungan.penjamin && (
                                <span className="text-[8px] text-slate-500 bg-white px-1 rounded-sm border border-slate-200">{item.kunjungan.penjamin.nama_penjamin}</span>
                              )}
                            </p>
                          )}

                          {/* 📥 RUJUKAN BADGE */}
                          {item.kunjungan?.asal_rujukan && (
                            <p className="text-[8.5px] text-slate-600 truncate mt-0.5 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-md font-semibold">
                              <span>📥</span>
                              <span className="font-extrabold text-slate-800">{item.kunjungan.asal_rujukan.nama_asal_rujukan}</span>
                              {item.kunjungan.detail_asal_rujukan && (
                                <span className="text-[8px] text-slate-500 bg-white px-1 rounded-sm border border-slate-200 truncate">{item.kunjungan.detail_asal_rujukan}</span>
                              )}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBatalPeriksa(item)}
                          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold py-1 rounded-lg text-[9px] transition-all flex justify-center items-center gap-1 border border-rose-100/50"
                        >
                          ❌ Batal Periksa
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTabPanel === 'batal' && (
            <div className="space-y-3">
              {/* BATAL SEARCH & FILTERS */}
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px]">
                <div>
                  <label className="text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Cari Pasien Batal</label>
                  <input
                    type="text"
                    placeholder="🔍 Nama, RM, atau NIK..."
                    value={batalSearchNama}
                    onChange={(e) => setBatalSearchNama(e.target.value)}
                    className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Filter Tanggal</label>
                  <input
                    type="date"
                    value={batalFilterTanggal}
                    onChange={(e) => setBatalFilterTanggal(e.target.value)}
                    className="w-full p-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Filter Ruangan</label>
                  <select
                    value={batalFilterPoli}
                    onChange={(e) => setBatalFilterPoli(e.target.value)}
                    className="w-full font-bold p-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="SEMUA">✨ Semua Poliklinik</option>
                    {Array.isArray(masterPoliklinik) && masterPoliklinik.map((p) => (
                      <option key={p.id_poli} value={p.id_poli}>📍 {p.nama_poli}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Filter Dokter</label>
                  <select
                    value={batalFilterDokter}
                    onChange={(e) => setBatalFilterDokter(e.target.value)}
                    className="w-full font-bold p-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="SEMUA">👨‍⚕️ Semua Dokter</option>
                    {Array.isArray(batalFilteredDokterList) && batalFilteredDokterList.map((d) => (
                      <option key={d.id_dokter} value={d.id_dokter}>{d.nama_dokter}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LIST MONITOR PASIEN BATAL */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-0.5">
                {(!Array.isArray(dataPasienBatalHariIni) || dataPasienBatalHariIni.length === 0) ? (
                  <p className="text-center py-8 text-[10px] text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">Tidak ada pasien batal...</p>
                ) : (
                  dataPasienBatalHariIni.map((item) => {
                    const namaPoli = (Array.isArray(masterPoliklinik) && masterPoliklinik.find((p) => p.id_poli === item.kunjungan?.id_poli)?.nama_poli) || 'Poliklinik';
                    const docObj = Array.isArray(masterDokter) && masterDokter.find((d) => d.id_dokter === item.kunjungan?.id_dokter);
                    return (
                      <div key={item.id_antrean} className="p-2.5 rounded-xl border border-rose-100 bg-rose-50/20 text-[11px] space-y-1.5 opacity-90 transition-all hover:opacity-100 hover:bg-rose-50/30 shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-rose-600 text-[10px]">{item.kunjungan?.no_kunjungan || 'KUNJ-XXXX'}</span>
                          <span className="bg-rose-100 text-rose-700 font-mono font-extrabold px-1 rounded text-[8px]">{item.no_antrean}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-600 line-through truncate">{item.kunjungan?.pasien?.nama_lengkap}</p>
                          <p className="text-[9.5px] text-rose-800 font-medium truncate">{namaPoli} (Batal)</p>
                          {docObj?.nama_dokter && (
                            <p className="text-[9px] text-slate-500 truncate">👨‍⚕️ {docObj.nama_dokter}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDaftarUlangPasienBatal(item)}
                          className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 font-bold py-1 rounded-lg text-[9px] transition-all flex justify-center items-center gap-1 border border-emerald-100"
                        >
                          🔄 Daftar Ulang
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}



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
                    <tr className="bg-slate-700 text-white text-[10px] font-extrabold uppercase border-b border-slate-300 tracking-wider">
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