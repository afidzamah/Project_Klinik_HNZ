'use client';

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import MasterLayout from '@/components/MasterLayout';

interface Komponen {
  id_komponen: string;
  nama_komponen: string;
  nilai_tarif: string | number;
}

interface TagihanDetail {
  id_tagihan_detail: string;
  id_tagihan: string;
  item_layanan: string;
  kategori_biaya: string;
  harga_satuan: string | number;
  kuantitas: number;
  subtotal: string | number;
  tagihan_detail_komponen?: Komponen[];
}

interface Pasien {
  id_pasien: string;
  nama_lengkap: string;
  no_rm: string;
  nik: string;
  no_kontak: string;
  jenis_kelamin: string;
}

interface Kunjungan {
  id_kunjungan: string;
  no_kunjungan: string;
  tgl_kunjungan: string;
  pasien?: Pasien;
}

interface Tagihan {
  id_tagihan: string;
  id_kunjungan: string;
  no_invoice: string;
  total_bruto: string | number;
  total_diskon: string | number;
  total_netto: string | number;
  metode_pembayaran: string | null;
  status_bayar: string;
  waktu_bayar: string | null;
  kunjungan?: Kunjungan;
  tagihan_detail: TagihanDetail[];
}

export default function KasirPage() {
  const [tagihanList, setTagihanList] = useState<Tagihan[]>([]);
  const [activeTagihan, setActiveTagihan] = useState<Tagihan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'BELUM_BAYAR' | 'Lunas'>('BELUM_BAYAR');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Pembayaran States
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Tunai');
  const [cashReceived, setCashReceived] = useState<string>('');
  
  // Modal Print Kuitansi State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<Tagihan | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  const fetchTagihan = async () => {
    try {
      const res = await fetch(`${API_URL}/tagihan`);
      if (res.ok) {
        const data = await res.json();
        setTagihanList(data);
      }
    } catch (err: any) {
      showNotification('error', 'Gagal terhubung ke database kasir.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTagihan();
    const interval = setInterval(fetchTagihan, 5000); // Polling realtime tiap 5 detik
    return () => clearInterval(interval);
  }, []);

  const handleSelectInvoice = (invoice: Tagihan) => {
    setActiveTagihan(invoice);
    setDiscountAmount(Number(invoice.total_diskon || 0));
    setPaymentMethod(invoice.metode_pembayaran || 'Tunai');
    setCashReceived('');
  };

  // Kalkulasi Real-Time
  const getBruto = () => {
    if (!activeTagihan) return 0;
    return Number(activeTagihan.total_bruto || 0);
  };

  const getNetto = () => {
    const bruto = getBruto();
    const netto = bruto - discountAmount;
    return netto < 0 ? 0 : netto;
  };

  const getChangeAmount = () => {
    const cash = parseFloat(cashReceived) || 0;
    const netto = getNetto();
    const change = cash - netto;
    return change < 0 ? 0 : change;
  };

  // Submit Proses Pembayaran
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTagihan) return;

    const bruto = getBruto();
    const netto = getNetto();

    if (paymentMethod === 'Tunai') {
      const cash = parseFloat(cashReceived) || 0;
      if (cash < netto) {
        showNotification('error', 'Jumlah uang yang diterima kurang dari total tagihan!');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/tagihan/${activeTagihan.id_tagihan}/bayar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metode_pembayaran: paymentMethod,
          total_diskon: discountAmount,
          total_netto: netto,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Gagal menyimpan transaksi pembayaran.');
      }

      const completedInvoice = await res.json();
      
      showNotification('success', `Pembayaran Invoice ${completedInvoice.no_invoice} berhasil diproses!`);
      
      // Simpan data untuk cetak etiket struk kuitansi thermal
      setReceiptData(completedInvoice);
      setShowReceiptModal(true);

      setActiveTagihan(null);
      setDiscountAmount(0);
      setPaymentMethod('Tunai');
      setCashReceived('');

      // Reload
      fetchTagihan();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter List Invoices
  const invoicesTerfilter = tagihanList.filter((item) => {
    const statusMatch = filterStatus === 'BELUM_BAYAR' 
      ? item.status_bayar === 'BELUM_BAYAR' 
      : item.status_bayar === 'Lunas';

    const query = searchQuery.toLowerCase();
    const RM = item.kunjungan?.pasien?.no_rm?.toLowerCase() || '';
    const nama = item.kunjungan?.pasien?.nama_lengkap?.toLowerCase() || '';
    const invoiceNo = item.no_invoice.toLowerCase();

    const searchMatch = RM.includes(query) || nama.includes(query) || invoiceNo.includes(query);

    return statusMatch && searchMatch;
  });

  return (
    <MasterLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        
        {/* ======================== HEADER SECTION ======================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              💵 Kasir & Billing Pembayaran Pasien
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Kelola pembayaran kunjungan pasien, diskon, metode bayar, pecahan jasa komponen biaya, dan cetak kuitansi.
            </p>
          </div>
          
          <div className="bg-slate-150 p-1 rounded-xl flex gap-1 font-bold text-xs">
            <button
              onClick={() => setFilterStatus('BELUM_BAYAR')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'BELUM_BAYAR'
                  ? 'bg-gradient-to-r from-red-650 to-rose-600 text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              ⏳ Antrean Tagihan ({tagihanList.filter((t) => t.status_bayar === 'BELUM_BAYAR').length})
            </button>
            <button
              onClick={() => setFilterStatus('Lunas')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'Lunas'
                  ? 'bg-gradient-to-r from-red-650 to-rose-600 text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              ✅ Riwayat Lunas ({tagihanList.filter((t) => t.status_bayar === 'Lunas').length})
            </button>
          </div>
        </div>

        {/* ======================== ALERT NOTIFICATION ======================== */}
        {alert && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl transition-all duration-300 transform border text-xs font-bold ${
              alert.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 animate-slide-in'
                : 'bg-rose-50 text-rose-800 border-rose-200 animate-slide-in'
            }`}
          >
            <span>{alert.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{alert.message}</span>
          </div>
        )}

        {/* ======================== MAIN SPLIT GRID ======================== */}
        {isLoading ? (
          <div className="py-28 text-center space-y-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent"></div>
            <div className="text-xs text-slate-400 font-bold">Menghubungkan ke Modul Transaksi Kasir...</div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6 items-start">
            
            {/* PANEL KIRI: DAFTAR INVOICE (5 KOLOM) */}
            <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-xl p-5 space-y-4">
              <div className="border-b border-slate-50 pb-2">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                  📄 List Tagihan Pasien
                </h3>
              </div>

              {/* Cari Invoice */}
              <input
                type="text"
                placeholder="Cari RM, Nama Pasien, atau No. Invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50/50 text-slate-800 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
              />

              {/* Card List Container */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {invoicesTerfilter.length === 0 ? (
                  <div className="text-center py-14 text-xs text-slate-400 font-bold italic bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                    Tidak ada antrean tagihan pembayaran...
                  </div>
                ) : (
                  invoicesTerfilter.map((invoice) => {
                    const pasien = invoice.kunjungan?.pasien;
                    const totalNet = Number(invoice.total_netto || 0);

                    return (
                      <div
                        key={invoice.id_tagihan}
                        onClick={() => handleSelectInvoice(invoice)}
                        className={`p-4 rounded-2xl border cursor-pointer relative overflow-hidden transition-all duration-200 ${
                          activeTagihan?.id_tagihan === invoice.id_tagihan
                            ? 'border-red-500 bg-red-50/20 shadow-md ring-1 ring-red-500'
                            : 'border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        {/* Status Ribbon */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            invoice.status_bayar === 'Lunas' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />

                        <div className="pl-2 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 font-mono">
                              {invoice.no_invoice}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                invoice.status_bayar === 'Lunas'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {invoice.status_bayar === 'BELUM_BAYAR' ? 'BELUM BAYAR' : 'LUNAS'}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                            {pasien?.nama_lengkap || 'Pasien Umum'}
                          </h4>

                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2">
                            <span>RM: <b className="font-mono text-slate-700">{pasien?.no_rm || 'UMUM'}</b></span>
                            <span className="font-mono text-xs text-red-750 font-black">
                              Rp {totalNet.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* PANEL KANAN: DETAIL CHECKOUT / KASIR (7 KOLOM) */}
            <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8 min-h-[400px]">
              {activeTagihan ? (
                <form onSubmit={handleProcessPayment} className="space-y-6">
                  
                  {/* Header Detail Pasien */}
                  <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
                    <div>
                      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        INVOICE: {activeTagihan.no_invoice}
                      </span>
                      <h2 className="text-base font-black text-slate-900 mt-0.5">
                        {activeTagihan.kunjungan?.pasien?.nama_lengkap}
                      </h2>
                      <span className="inline-block mt-2 bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg text-[9px] font-bold">
                        💳 RM: {activeTagihan.kunjungan?.pasien?.no_rm}
                      </span>
                    </div>
                    
                    {activeTagihan.status_bayar === 'Lunas' && (
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptData(activeTagihan);
                          setShowReceiptModal(true);
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 px-3.5 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer"
                      >
                        🖨️ Cetak Kuitansi
                      </button>
                    )}
                  </div>

                  {/* List Item Billing & Components */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-red-650 uppercase tracking-widest pl-1 block">Rincian Item & Tindakan</label>
                    
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {activeTagihan.tagihan_detail?.map((detail) => (
                        <div key={detail.id_tagihan_detail} className="p-3 bg-slate-50 rounded-2xl border border-slate-150 relative">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">{detail.kategori_biaya}</span>
                              <span className="block text-xs font-black text-slate-800 leading-tight mt-0.5">{detail.item_layanan}</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-[9px] font-bold text-slate-400 leading-none">Qty: {detail.kuantitas}</span>
                              <span className="block text-xs font-mono font-black text-slate-800 mt-1">
                                Rp {Number(detail.subtotal).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>

                          {/* Render Snapshot Component Breakdown if exists */}
                          {detail.tagihan_detail_komponen && detail.tagihan_detail_komponen.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-slate-200/60 border-dashed">
                              <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Pecahan Jasa Komponen Biaya:</span>
                              <div className="grid grid-cols-2 gap-1.5">
                                {detail.tagihan_detail_komponen.map((komp) => (
                                  <div key={komp.id_komponen} className="flex justify-between items-center bg-white px-2 py-1.5 rounded-lg border border-slate-100 text-[9px] font-bold text-slate-600">
                                    <span className="truncate pr-1">{komp.nama_komponen}</span>
                                    <span className="font-mono text-slate-900 font-black">Rp {Number(komp.nilai_tarif).toLocaleString('id-ID')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FORM PEMBAYARAN & CASHIER WORKSPACE */}
                  {activeTagihan.status_bayar === 'BELUM_BAYAR' ? (
                    <div className="bg-slate-50 border border-slate-150 p-5 rounded-3xl space-y-4">
                      
                      {/* Kalkulasi Input */}
                      <div className="grid grid-cols-2 gap-4">
                        
                        {/* Input Diskon */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Nominal Diskon (Rupiah)</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-xs font-black text-slate-400">Rp</span>
                            <input
                              type="text"
                              value={discountAmount === 0 ? '' : discountAmount}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d+$/.test(val)) {
                                  setDiscountAmount(Number(val) || 0);
                                }
                              }}
                              className="w-full rounded-xl border border-slate-200 py-2.5 pl-8 pr-3 bg-white text-right text-xs font-black text-slate-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Metode Pembayaran */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Metode Bayar</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => {
                              setPaymentMethod(e.target.value);
                              setCashReceived('');
                            }}
                            className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500 transition-all cursor-pointer"
                          >
                            <option value="Tunai">💵 Tunai (Cash)</option>
                            <option value="Debit">💳 Kartu Debit</option>
                            <option value="Kredit">💳 Kartu Kredit</option>
                            <option value="QRIS">📱 QRIS / E-Wallet</option>
                            <option value="BPJS">🏥 BPJS Kesehatan</option>
                            <option value="Asuransi Swasta">🏥 Asuransi Swasta</option>
                          </select>
                        </div>
                      </div>

                      {/* Input Uang Diterima & Kembalian (Jika metode TUNAI) */}
                      {paymentMethod === 'Tunai' && (
                        <div className="grid grid-cols-2 gap-4 border-t border-dashed border-slate-200 pt-3">
                          
                          {/* Uang Diterima */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Uang Diterima</label>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-xs font-black text-slate-400">Rp</span>
                              <input
                                type="text"
                                required
                                value={cashReceived}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d+$/.test(val)) {
                                    setCashReceived(val);
                                  }
                                }}
                                className="w-full rounded-xl border border-slate-200 py-2.5 pl-8 pr-3 bg-white text-right text-xs font-black text-slate-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                placeholder="Masukkan nominal..."
                              />
                            </div>
                          </div>

                          {/* Uang Kembali */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Uang Kembalian</label>
                            <div className="bg-white rounded-xl border border-slate-150 p-2.5 text-right font-mono text-xs font-black text-slate-800 min-h-[38px] flex items-center justify-end">
                              Rp {getChangeAmount().toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUMMARY NETTO BOX */}
                      <div className="bg-gradient-to-br from-red-650 to-rose-600 text-white rounded-2xl p-4 shadow-lg shadow-red-150 flex items-center justify-between mt-2">
                        <div>
                          <span className="block text-[8px] font-black text-red-100 uppercase tracking-widest">Total Bayar Pasien (Netto)</span>
                          <span className="block text-[9px] text-red-200 font-semibold italic mt-0.5">Sudah termasuk potongan diskon</span>
                        </div>
                        <span className="text-xl font-mono font-black">
                          Rp {getNetto().toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Tombol Proses Bayar */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-650 to-rose-600 hover:from-red-750 hover:to-rose-750 text-white text-xs font-bold py-3.5 px-4 shadow-lg shadow-red-100 hover:shadow-red-200 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? 'Memproses Transaksi...' : '💵 PROSES PEMBAYARAN & CETAK STRUK'}
                      </button>

                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center font-bold text-xs text-emerald-800 flex items-center justify-center gap-2">
                      <span>🎉 Invoice ini telah Lunas Terbayar pada {activeTagihan.waktu_bayar ? new Date(activeTagihan.waktu_bayar).toLocaleString('id-ID') : '-'} WIB menggunakan metode {activeTagihan.metode_pembayaran}.</span>
                    </div>
                  )}

                </form>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <span className="text-4xl">🧾</span>
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Workspace Kasir</h3>
                    <p className="text-[10px] text-slate-400 font-semibold max-w-xs">
                      Silakan pilih salah satu invoice antrean pendaftaran/tindakan di panel kiri untuk memulai proses transaksi keuangan.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ======================== THERMAL RECEIPT MODAL ======================== */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 space-y-6">
            
            {/* thermal body print area container */}
            <div id="thermal-receipt" className="font-mono text-[10px] text-slate-800 space-y-4 p-4 border border-slate-200 bg-slate-50/50 rounded-2xl shadow-inner max-h-[460px] overflow-y-auto">
              
              {/* Receipt Header */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-350 pb-3">
                <h2 className="text-xs font-bold text-slate-900">🏥 KLINIK HNZ PREMIUM</h2>
                <p className="text-[8px] text-slate-500 leading-none">Ruko Kebon Jeruk Indah No. 12, Jakarta</p>
                <p className="text-[8px] text-slate-500 leading-none">Telp: (021) 5369-1234 / WA: 0812-3456-7890</p>
              </div>

              {/* Patient and Invoice Info */}
              <div className="space-y-1 border-b border-dashed border-slate-350 pb-3">
                <div className="flex justify-between"><span>No Inv:</span> <span className="font-bold">{receiptData.no_invoice}</span></div>
                <div className="flex justify-between"><span>Tanggal:</span> <span>{new Date(receiptData.waktu_bayar || Date.now()).toLocaleDateString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Pasien:</span> <span className="font-bold truncate max-w-[120px]">{receiptData.kunjungan?.pasien?.nama_lengkap}</span></div>
                <div className="flex justify-between"><span>No RM:</span> <span className="font-bold">{receiptData.kunjungan?.pasien?.no_rm}</span></div>
                <div className="flex justify-between"><span>Metode:</span> <span>{receiptData.metode_pembayaran}</span></div>
              </div>

              {/* Itemized Table */}
              <div className="space-y-2 border-b border-dashed border-slate-350 pb-3">
                <span className="block font-bold">Layanan / Item Tindakan:</span>
                {receiptData.tagihan_detail?.map((detail) => (
                  <div key={detail.id_tagihan_detail} className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="truncate max-w-[150px]">{detail.item_layanan}</span>
                      <span>Rp {Number(detail.subtotal).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-[8px] text-slate-500 pl-1">
                      Qty: {detail.kuantitas} x Rp {Number(detail.harga_satuan).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="space-y-1">
                <div className="flex justify-between"><span>Total Bruto:</span> <span>Rp {Number(receiptData.total_bruto).toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-rose-600"><span>Diskon:</span> <span>- Rp {Number(receiptData.total_diskon).toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5 text-xs">
                  <span>TOTAL NETTO:</span> 
                  <span>Rp {Number(receiptData.total_netto).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Barcode representation */}
              <div className="text-center pt-3 border-t border-dashed border-slate-350 space-y-1 pb-1">
                <div className="font-mono text-[9px] tracking-[4px] text-slate-400 select-none">||||| | ||||| || ||||</div>
                <p className="text-[8px] text-slate-400">Terima kasih atas kunjungan Anda</p>
                <p className="text-[8px] text-slate-400">Semoga Lekas Sembuh</p>
              </div>

            </div>

            {/* Print Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const printContents = document.getElementById('thermal-receipt')?.innerHTML;
                  const originalContents = document.body.innerHTML;
                  if (printContents) {
                    document.body.innerHTML = printContents;
                    window.print();
                    document.body.innerHTML = originalContents;
                    // Reload to recover state
                    window.location.reload();
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-colors shadow-lg shadow-red-100 text-center"
              >
                🖨️ Cetak Fisik
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setReceiptData(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-colors text-center border border-slate-200"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </MasterLayout>
  );
}
