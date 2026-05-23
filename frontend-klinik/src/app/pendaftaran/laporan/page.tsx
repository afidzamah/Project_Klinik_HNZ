"use client";
import { API_URL } from '@/lib/api';

import { useState, useEffect } from "react";
import Link from "next/link";
import MasterLayout from "@/components/MasterLayout";

const formatLocalDate = (dateInput?: string | Date) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function LaporanPasienLengkap() {
  const [trackingData, setTrackingData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>(
    formatLocalDate(),
  );
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTracking = async () => {
    try {
      const res = await fetch(`${API_URL}/kunjungan/tracking`);
      const data = await res.json();
      setTrackingData(data);
    } catch (error) {
      console.error("Gagal mengambil log audit trail:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 10000); // Sinkronisasi otomatis berkala
    return () => clearInterval(interval);
  }, []);

  // Fungsi Hitung Usia Dinamis Pasien
  const hitungUsia = (tglLahir: string) => {
    if (!tglLahir) return "-";
    const lahir = new Date(tglLahir);
    const sekarang = new Date();
    let umur = sekarang.getFullYear() - lahir.getFullYear();
    const m = sekarang.getMonth() - lahir.getMonth();
    if (m < 0 || (m === 0 && sekarang.getDate() < lahir.getDate())) umur--;
    return `${umur} Thn`;
  };

  // Format Waktu ke Jam Menit Detik WIB Lokal
  const formatJam = (timestamp: string | null) => {
    if (!timestamp) return "⏳ Antre";
    return (
      new Date(timestamp).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB"
    );
  };

  // Logika Filter Berlapis Data Table
  const dataTerfilter = Array.isArray(trackingData)
    ? trackingData.filter((k) => {
        const query = searchQuery.toLowerCase();
        const cocokSearch =
          k.id_kunjungan?.toLowerCase().includes(query) ||
          k.pasien?.no_rm?.toLowerCase().includes(query) ||
          k.pasien?.nama_lengkap?.toLowerCase().includes(query) ||
          k.pasien?.nik?.toLowerCase().includes(query);

        const tglKunjungan = k.created_at
          ? formatLocalDate(k.created_at)
          : "";
        const cocokTanggal = tglKunjungan === filterDate;

        return cocokSearch && cocokTanggal;
      })
    : [];

  return (
    <MasterLayout>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        {/* HEADER DASHBOARD LAPORAN */}
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/pendaftaran"
                className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl hover:bg-slate-200 font-bold transition-all"
              >
                ← Kembali ke Loket
              </Link>
              <h2 className="font-bold text-slate-800 text-lg">
                📊 Log Rekam Jejak Pelayanan Pasien (Audit Trail)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Pemantauan waktu sentuh operasional pasien dari loket cetak hingga
              ruang periksa dokter spesialis.
            </p>
          </div>

          <div className="flex gap-2 items-center text-xs">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="p-2.5 border border-slate-200 bg-slate-50 font-bold rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="text"
              placeholder="Cari No. Kunjungan, RM, NIK, Nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2.5 border border-slate-200 bg-slate-50 font-medium rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-red-500 w-64 shadow-inner"
            />
          </div>
        </div>

        {/* DATA TABLE AREA */}
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center py-16 text-xs font-bold text-slate-400 animate-pulse">
              ⏳ Menghubungkan log data transaksi klinik...
            </p>
          ) : dataTerfilter.length === 0 ? (
            <p className="text-center py-16 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50">
              Tidak ada rekam transaksi log pasien pada tanggal ini.
            </p>
          ) : (
            <table className="w-full text-left border-collapse min-w-[120px]">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                  <th className="p-3 rounded-l-xl">No. Kunjungan</th>
                  <th className="p-3 text-center">No. RM</th>
                  <th className="p-3">Identitas Pasien</th>
                  <th className="p-3">Demografi</th>
                  <th className="p-3 text-center bg-slate-800">
                    ⏱️ Ambil Tiket
                  </th>
                  <th className="p-3 text-center bg-red-950">
                    ⏱️ Selesai Loket
                  </th>
                  <th className="p-3 text-center bg-slate-800">
                    ⏱️ Cek Perawat
                  </th>
                  <th className="p-3 text-center bg-red-950 rounded-r-xl">
                    ⏱️ Selesai Dokter
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-600 divide-y divide-slate-100 font-medium">
                {dataTerfilter.map((k, idx) => {
                  // Ekstraksi Waktu Hulu ke Hilir
                  const jamAmbilKiosk =
                    k.antrean?.find((a: any) => a.tipe_antrean === "Loket")
                      ?.created_at || k.created_at;
                  const jamSelesaiLoket = k.created_at;
                  const jamPerawat =
                    k.asesmen_keperawatan?.[0]?.waktu_periksa ||
                    k.asesmen_keperawatan?.[0]?.created_at ||
                    null;
                  const jamDokter =
                    k.pemeriksaan_dokter?.[0]?.created_at || null;

                  const isKunjunganBatal = k.status_kunjungan === 'Batal' || k.antrean?.some((a: any) => a.status_panggil === 'Batal');

                  return (
                    <tr
                      key={k.id_kunjungan}
                      className="hover:bg-slate-50/80 transition-all"
                    >
                      <td className="p-3 font-mono font-bold text-slate-700 text-xs">
                        {k.no_kunjungan || "KUNJ-LAMA"}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-red-600 text-sm">
                        {k.pasien?.no_rm}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-900 text-sm">
                              {k.pasien?.nama_lengkap}
                            </p>
                            {isKunjunganBatal ? (
                              <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-2 py-0.5 rounded-md border border-rose-200">
                                ❌ Batal
                              </span>
                            ) : k.status_kunjungan === 'Selesai Perawat' ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-md border border-emerald-200">
                                🟢 Selesai Perawat
                              </span>
                            ) : jamDokter ? (
                              <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-2 py-0.5 rounded-md border border-blue-200">
                                🔵 Selesai Dokter
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-md border border-amber-200 animate-pulse">
                                ⏳ Antre Poli
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[10px] text-slate-400">
                            NIK: {k.pasien?.nik}
                          </p>
                          
                          {/* 💳 METODE BAYAR & RUJUKAN */}
                          <div className="flex gap-1.5 flex-wrap mt-1 text-[9px] font-bold">
                            {k.cara_bayar && (
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200">
                                💳 {k.cara_bayar.nama_cara_bayar}
                                {k.penjamin ? ` (${k.penjamin.nama_penjamin})` : ''}
                              </span>
                            )}
                            {k.asal_rujukan && (
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200">
                                📥 {k.asal_rujukan.nama_asal_rujukan}
                                {k.detail_asal_rujukan ? ` (${k.detail_asal_rujukan})` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-500 space-y-0.5">
                        <p>
                          Usia:{" "}
                          <b className="text-slate-700">
                            {hitungUsia(k.pasien?.tgl_lahir)}
                          </b>{" "}
                          ({k.pasien?.jenis_kelamin})
                        </p>
                        <p className="text-[10px]">
                          Kerja: {k.pasien?.pekerjaan} | {k.pasien?.agama}
                        </p>
                      </td>

                      {/* POS TIME LOG 1: KIOSK */}
                      <td className="p-3 text-center font-mono bg-slate-50/50 font-bold text-slate-700">
                        {formatJam(jamAmbilKiosk)}
                      </td>

                      {/* POS TIME LOG 2: COUNTER PENDAFTARAN */}
                      <td className="p-3 text-center font-mono bg-red-50/20 font-bold text-red-700">
                        {formatJam(jamSelesaiLoket)}
                      </td>

                      {/* POS TIME LOG 3: NURSE STATION */}
                      <td className="p-3 text-center font-mono bg-slate-50/50">
                        {isKunjunganBatal ? (
                          <span className="text-rose-700 font-extrabold bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100 block">
                            ❌ Dibatalkan
                          </span>
                        ) : k.status_kunjungan === 'Selesai Perawat' || jamPerawat ? (
                          <div className="flex flex-col items-center gap-1.5 justify-center">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-200 shadow-sm flex items-center gap-0.5 shrink-0">
                              ✓ Selesai Pelayanan
                            </span>
                            {jamPerawat && (
                              <span className="text-emerald-700 font-black font-mono text-[10px]">
                                {formatJam(jamPerawat)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 animate-pulse block">
                            ⏳ Antre Poli
                          </span>
                        )}
                      </td>

                      {/* POS TIME LOG 4: DOCTOR CONSULTATION */}
                      <td className="p-3 text-center font-mono bg-red-50/20">
                        {isKunjunganBatal ? (
                          <span className="text-rose-700 font-extrabold bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100 block">
                            ❌ Dibatalkan
                          </span>
                        ) : jamDokter ? (
                          <span className="text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                            {formatJam(jamDokter)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                            ⏳ Antre Dokter
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* FOOTER */}
        <div className="text-right text-[10px] text-slate-400 font-medium pt-3 border-t border-slate-100">
          Total Terdata: {dataTerfilter.length} Log Pelayanan Aktif
        </div>
      </div>
    </MasterLayout>
  );
}
