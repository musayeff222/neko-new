import React, { useState } from 'react';
import { UserPlus, Search, Wallet, Coins, History, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { Customer } from '@/types';

interface DebtProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const DebtModule: React.FC<DebtProps> = ({ customers, setCustomers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filtered = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Müştəri axtar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-stone-200 border rounded-xl md:rounded-2xl py-3 pl-10 pr-4 focus:ring-4 focus:ring-amber-100 outline-none shadow-sm text-sm"
          />
        </div>
        <button className="hidden sm:flex bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-amber-600 transition-all items-center shadow-lg shadow-amber-200">
          <UserPlus className="w-5 h-5 mr-2" /> Yeni Müştəri
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Müştəri Siyahısı */}
        <div className={`${selectedCustomer ? 'hidden lg:block' : 'block'} lg:col-span-2 space-y-4`}>
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Borclu Müştərilər</h3>
          <div className="bg-white rounded-2xl md:rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-stone-100">
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={`w-full flex items-center justify-between p-4 md:p-6 hover:bg-stone-50 transition-all text-left ${selectedCustomer?.id === c.id ? 'bg-amber-50 border-l-4 border-l-amber-500' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600 font-black text-xs md:text-sm mr-3 md:mr-4">
                      {c.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-black text-stone-800 text-sm md:text-base uppercase">{c.fullName}</p>
                      <p className="text-[10px] md:text-xs text-stone-400 font-bold">{c.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] md:text-[9px] text-stone-400 font-black uppercase mb-1">Cəmi Borc</p>
                    <div className="flex flex-col md:flex-row md:space-x-4 space-y-1 md:space-y-0">
                      <div className="flex items-center text-red-600 font-black text-xs md:text-sm">
                        <Wallet className="w-3 h-3 md:w-4 md:h-4 mr-1 opacity-50" /> {c.cashDebt.toLocaleString()} ₼
                      </div>
                      <div className="flex items-center text-amber-600 font-black text-xs md:text-sm">
                        <Coins className="w-3 h-3 md:w-4 md:h-4 mr-1 opacity-50" /> {c.goldDebt} qr
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-12 text-center text-stone-300 italic text-sm">Borclu müştəri tapılmadı.</div>
              )}
            </div>
          </div>
        </div>

        {/* Seçilmiş Detallar - Mobil üçün ayrıca görünüş */}
        <div className={`${selectedCustomer ? 'block' : 'hidden lg:block'} space-y-4`}>
          <div className="flex items-center justify-between lg:hidden mb-2">
             <button onClick={() => setSelectedCustomer(null)} className="flex items-center text-stone-400 font-bold text-xs uppercase"><ArrowLeft size={16} className="mr-2"/> Geri</button>
             <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Müştəri Detalı</h3>
          </div>
          <h3 className="hidden lg:block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Borc Detalı</h3>
          
          {selectedCustomer ? (
            <div className="bg-white rounded-2xl md:rounded-3xl border border-stone-200 shadow-xl p-5 md:p-8 space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="text-center pb-6 border-b border-stone-100">
                 <div className="w-16 h-16 md:w-20 md:h-20 rounded-full gold-gradient flex items-center justify-center text-xl md:text-2xl font-black text-amber-900 mx-auto mb-4 shadow-xl">
                    {selectedCustomer.fullName[0]}
                 </div>
                 <h4 className="text-xl font-black text-stone-800 uppercase tracking-tighter">{selectedCustomer.fullName}</h4>
                 <p className="text-xs md:text-sm text-stone-400 font-bold">{selectedCustomer.phone}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-stone-50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-stone-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest">Nəqd Borc</span>
                    <Wallet className="w-4 h-4 text-red-300" />
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-red-600 tracking-tighter">{selectedCustomer.cashDebt.toLocaleString()} <span className="text-sm font-bold text-stone-400 uppercase">₼</span></p>
                </div>
                <div className="bg-amber-50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-amber-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] md:text-[10px] font-black text-amber-600/50 uppercase tracking-widest">Qızıl Borcu</span>
                    <Coins className="w-4 h-4 text-amber-300" />
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-amber-700 tracking-tighter">{selectedCustomer.goldDebt} <span className="text-sm font-bold text-amber-500 uppercase">qr</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 pt-4">
                <button className="w-full bg-stone-900 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-xs md:text-sm hover:bg-black transition-all shadow-xl uppercase tracking-widest flex items-center justify-center">
                  ÖDƏNİŞ QƏBUL ET
                </button>
                <button className="w-full bg-white border-2 border-stone-200 text-stone-600 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-xs md:text-sm hover:bg-stone-50 transition-all flex items-center justify-center uppercase tracking-widest">
                  <History className="w-4 h-4 mr-2" /> TARİXÇƏ
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex bg-stone-100 rounded-3xl border-2 border-dashed border-stone-200 h-64 flex-col items-center justify-center text-stone-400 p-8 text-center">
              <Wallet className="w-12 h-12 mb-4 opacity-10" />
              <p className="text-xs font-black uppercase tracking-widest">Müştəri Seçin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtModule;