"use client";
import { API_URL } from '@/lib/api';

import { useState, useEffect } from "react";
import Link from "next/link";
import MasterLayout from "@/components/MasterLayout";

export default function LaporanPasienLengkap() {
  const [trackingData, setTrackingData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>(
    new Date().toISOString().split("T")[0],
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
  // 🌟 PERBAIKAN: Gunakan validasi Array.isArray sebelum mengeksekusi .filter
  const dataTerfilter = Array.isArray(trackingData)
    ? trackingData.filter((k) => {
        const query = searchQuery.toLowerCase();
        const cocokSearch =
          k.id_kunjungan?.toLowerCase().includes(query) ||
          k.pasien?.no_rm?.toLowerCase().includes(query) ||
          k.pasien?.nama_lengkap?.toLowerCase().includes(query) ||
          k.pasien?.nik?.toLowerCase().includes(query);

        const tglKunjungan = k.created_at
          ? new Date(k.created_at).toISOString().split("T")[0]
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
                        <p className="font-bold text-slate-900 text-sm">
                          {k.pasien?.nama_lengkap}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">
                          NIK: {k.pasien?.nik}
                        </p>
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
                        {jamPerawat ? (
                          <span className="text-green-700 font-bold bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                            {formatJam(jamPerawat)}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 animate-pulse">
                            ⏳ Antre Poli
                          </span>
                        )}
                      </td>

                      {/* POS TIME LOG 4: DOCTOR CONSULTATION */}
                      <td className="p-3 text-center font-mono bg-red-50/20">
                        {jamDokter ? (
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
