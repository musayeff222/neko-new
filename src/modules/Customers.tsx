import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Phone, 
  MapPin, 
  CreditCard, 
  Coins, 
  X, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  History, 
  Calendar, 
  Gem, 
  Tag, 
  Info, 
  User, 
  Scale, 
  Barcode, 
  DollarSign, 
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Customer, Sale } from '@/types';

interface CustomersProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<any>>;
  sales: Sale[];
}

const CustomersModule: React.FC<CustomersProps> = ({ customers, setCustomers, sales }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [selectedSaleInfo, setSelectedSaleInfo] = useState<Sale | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'debtor'>('all');
  const [newCustomer, setNewCustomer] = useState({
    fullName: '',
    phone: '',
    address: '',
    title: ''
  });

  const filtered = customers.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm);
    const matchesFilter = selectedFilter === 'debtor' ? (c.cashDebt > 0 || c.goldDebt > 0) : true;
    return matchesSearch && matchesFilter;
  });

  const customerHistory = viewingCustomer 
    ? (Array.isArray(sales) ? sales : []).filter(s => {
        const matchesCustomer = s.customerName === viewingCustomer.fullName;
        if (!matchesCustomer) return false;
        
        const term = historySearchTerm.toLowerCase();
        return (
          s.productName.toLowerCase().includes(term) ||
          s.productCode.toLowerCase().includes(term) ||
          s.weight?.toString().includes(term)
        );
      })
    : [];

  const totalSpent = viewingCustomer 
    ? (Array.isArray(sales) ? sales : []).filter(s => s.customerName === viewingCustomer.fullName && s.status !== 'returned').reduce((acc, s) => acc + s.total, 0)
    : 0;

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.fullName || !newCustomer.phone) return;

    const customerToAdd: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: newCustomer.fullName,
      phone: newCustomer.phone,
      address: newCustomer.address,
      title: newCustomer.title,
      cashDebt: 0,
      goldDebt: 0
    };

    setCustomers(prev => [customerToAdd, ...prev]);
    setShowAddModal(false);
    setNewCustomer({ fullName: '', phone: '', address: '', title: '' });
  };

  const deleteCustomer = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (confirm('Bu müştərini silmək istədiyinizə əminsiniz?')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  if (viewingCustomer) {
    return (
      <div className="space-y-4 md:space-y-6 animate-in slide-in-from-right duration-500 pb-24 md:pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] shadow-xl border border-stone-100 gap-4">
          <div className="flex items-center space-x-4 md:space-x-6">
            <button 
              onClick={() => { setViewingCustomer(null); setHistorySearchTerm(''); }}
              className="p-3 md:p-4 bg-stone-50 hover:bg-stone-100 rounded-xl md:rounded-2xl text-stone-400 transition-all active:scale-90"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl gold-gradient flex items-center justify-center text-amber-950 font-black text-lg md:text-2xl shadow-xl">
                {viewingCustomer.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-black text-stone-900 tracking-tighter uppercase leading-none mb-1">{viewingCustomer.fullName}</h2>
                <div className="flex flex-col md:flex-row md:items-center md:space-x-3">
                  <span className="text-[10px] md:text-xs font-bold text-amber-600 uppercase tracking-widest">{viewingCustomer.phone}</span>
                  <span className="hidden md:block w-1 h-1 bg-stone-300 rounded-full"></span>
                  <span className="text-[10px] md:text-xs font-medium text-stone-400 truncate max-w-[150px] md:max-w-none">{viewingCustomer.address || 'Ünvan yoxdur'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-around md:justify-end space-x-4 md:space-x-8 pt-4 md:pt-0 border-t md:border-t-0 border-stone-50">
            <div className="text-center md:text-right">
              <p className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest">Cəmi Alış</p>
              <p className="text-lg md:text-2xl font-black text-stone-900 leading-none">{totalSpent.toLocaleString()} ₼</p>
            </div>
            <div className="hidden md:block w-px h-10 bg-stone-100"></div>
            <div className="text-center md:text-right">
              <p className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest">Əməliyyat</p>
              <p className="text-lg md:text-2xl font-black text-amber-500 leading-none">{customerHistory.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
          <div className="lg:col-span-8 space-y-4 md:space-y-6">
            <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-2xl border border-stone-100 overflow-hidden flex flex-col min-h-[400px]">
               <div className="p-4 md:p-8 border-b border-stone-100 bg-stone-50/50 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <h3 className="text-base md:text-lg font-black text-stone-800 tracking-tighter flex items-center uppercase">
                    <History className="w-5 h-5 mr-3 text-amber-500" /> Tarixçə
                  </h3>
                  <div className="relative group w-full md:max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Məhsul, kod..." 
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="w-full bg-white border-stone-200 border rounded-xl md:rounded-2xl py-2 md:py-2.5 pl-10 pr-4 focus:ring-4 focus:ring-amber-100 focus:outline-none shadow-sm text-xs font-bold"
                    />
                  </div>
               </div>
               <div className="overflow-x-auto flex-1">
                 <table className="w-full text-left min-w-[500px] md:min-w-0">
                    <thead>
                      <tr className="bg-stone-50/30">
                        <th className="px-4 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest">Məhsul</th>
                        <th className="px-4 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest">Tarix</th>
                        <th className="px-4 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Məbləğ</th>
                        <th className="px-4 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {customerHistory.map((s) => (
                        <tr key={s.id} className="hover:bg-amber-50/20 transition-all group">
                          <td className="px-4 md:px-8 py-4 md:py-5">
                            <div className="flex items-center space-x-3 md:space-x-4">
                               <div className="w-10 h-10 md:w-12 md:h-12 bg-white border border-stone-100 rounded-xl flex items-center justify-center text-amber-500 shadow-sm overflow-hidden p-1">
                                  {s.imageUrl ? (
                                    <img src={s.imageUrl} alt={s.productName} className="w-full h-full object-cover rounded-md" />
                                  ) : (
                                    <Gem size={20} />
                                  )}
                               </div>
                               <div className="max-w-[120px] md:max-w-none">
                                  <p className="text-xs md:text-sm font-black text-stone-800 uppercase truncate">{s.productName}</p>
                                  <p className="text-[8px] md:text-[9px] font-bold text-stone-400 uppercase truncate">
                                    {s.productCode} | {s.weight} qr
                                  </p>
                               </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5">
                             <div className="flex items-center text-stone-500 text-[10px] md:text-xs font-bold whitespace-nowrap">
                               <Calendar className="w-3 md:w-3.5 h-3 md:h-3.5 mr-1.5 text-stone-300" />
                               {new Date(s.date).toLocaleDateString('az-AZ')}
                             </div>
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5 text-right">
                             <p className="text-sm md:text-lg font-black text-stone-900 tracking-tighter">{s.total.toLocaleString()} ₼</p>
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5 text-center">
                             <button 
                               onClick={() => setSelectedSaleInfo(s)}
                               className="p-2 md:p-2.5 bg-amber-50 text-amber-600 rounded-lg md:rounded-xl hover:bg-amber-100 transition-all"
                             >
                               <Info size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4 md:space-y-6">
            <div className="bg-stone-900 text-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 shadow-2xl relative overflow-hidden group">
               <h3 className="text-[9px] md:text-[10px] font-black text-stone-500 uppercase tracking-[0.3em] mb-4 md:mb-6">Maliyyə</h3>
               <div className="space-y-4 md:space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[2rem] p-4 md:p-6">
                     <p className="text-[8px] md:text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 md:mb-2">Nəqd Borc</p>
                     <div className="flex items-baseline space-x-1 md:space-x-2">
                        <span className="text-2xl md:text-4xl font-black text-red-400 tracking-tighter">{viewingCustomer.cashDebt.toLocaleString()}</span>
                        <span className="text-sm md:text-lg font-bold text-stone-600 uppercase">₼</span>
                     </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[2rem] p-4 md:p-6">
                     <p className="text-[8px] md:text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 md:mb-2">Qızıl Borcu</p>
                     <div className="flex items-baseline space-x-1 md:space-x-2">
                        <span className="text-2xl md:text-4xl font-black text-amber-500 tracking-tighter">{viewingCustomer.goldDebt}</span>
                        <span className="text-sm md:text-lg font-bold text-stone-600 uppercase">qr</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Selected Sale Detail Modal (Optimized) */}
        {selectedSaleInfo && (
          <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-lg z-[70] flex items-center justify-center p-2 md:p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 flex flex-col md:flex-row h-[90vh] md:h-auto overflow-y-auto scrollbar-hide">
               
               <div className="w-full md:w-5/12 bg-stone-50/50 flex flex-col items-center justify-center p-8 md:p-12 border-b md:border-b-0 md:border-r border-stone-100">
                  {selectedSaleInfo.imageUrl ? (
                    <img src={selectedSaleInfo.imageUrl} className="w-full h-full object-contain max-h-[250px] md:max-h-none" />
                  ) : (
                    <ImageIcon size={80} strokeWidth={0.5} className="text-stone-200" />
                  )}
                  <div className="mt-4 md:mt-6 bg-amber-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {selectedSaleInfo.carat}K Ayar
                  </div>
               </div>

               <div className="flex-1 flex flex-col p-6 md:p-12 space-y-6 md:space-y-8 bg-white">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500"><Gem size={24} /></div>
                    <div>
                        <h4 className="text-xl md:text-2xl font-black text-stone-900 uppercase tracking-tighter leading-none">{selectedSaleInfo.productName}</h4>
                        <p className="text-[10px] font-bold text-stone-400 mt-1">{selectedSaleInfo.productCode}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                     {[
                       { label: 'Tarix', val: new Date(selectedSaleInfo.date).toLocaleDateString(), icon: Clock },
                       { label: 'Çəki', val: `${selectedSaleInfo.weight} gr`, icon: Scale },
                       { label: 'Növ', val: selectedSaleInfo.type, icon: Tag },
                       { label: 'Qiymət', val: `${selectedSaleInfo.price.toLocaleString()} ₼`, icon: DollarSign }
                     ].map((it, i) => (
                       <div key={i} className="p-3 md:p-4 bg-stone-50/50 rounded-xl border border-stone-100/50 flex items-center space-x-3">
                          <it.icon size={14} className="text-stone-300" />
                          <div>
                            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{it.label}</p>
                            <p className="text-[10px] md:text-xs font-bold text-stone-800 truncate">{it.val}</p>
                          </div>
                       </div>
                     ))}
                  </div>

                  <div className="mt-auto bg-stone-900 text-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] flex justify-between items-center">
                     <div>
                        <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">YEKUN ÖDƏNİŞ</p>
                        <h4 className="text-2xl md:text-4xl font-black tracking-tighter text-amber-500">{selectedSaleInfo.total.toLocaleString()} ₼</h4>
                     </div>
                     <button onClick={() => setSelectedSaleInfo(null)} className="p-3 bg-white/5 rounded-xl text-white/50 hover:text-white transition-colors"><X size={20}/></button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Ad və ya nömrə..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-stone-200 border rounded-xl md:rounded-2xl py-3 pl-10 pr-4 focus:ring-4 focus:ring-amber-100 focus:outline-none shadow-sm text-sm font-medium"
            />
          </div>
          <div className="flex bg-white rounded-xl p-1 border border-stone-200 shadow-sm self-start">
             <button 
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all ${selectedFilter === 'all' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
             >
               Hamısı
             </button>
             <button 
              onClick={() => setSelectedFilter('debtor')}
              className={`px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all ${selectedFilter === 'debtor' ? 'bg-amber-500 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
             >
               Borclular
             </button>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-amber-500 text-amber-950 px-6 md:px-8 py-3.5 rounded-xl md:rounded-2xl font-black text-[11px] md:text-sm hover:bg-amber-400 transition-all flex items-center justify-center shadow-lg active:scale-95 uppercase"
        >
          <UserPlus className="w-4 md:w-5 h-4 md:h-5 mr-2" /> YENİ MÜŞTƏRİ
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filtered.map((customer) => (
          <div 
            key={customer.id} 
            onClick={() => setViewingCustomer(customer)}
            className="bg-white rounded-2xl md:rounded-[2.5rem] border border-stone-100 shadow-xl hover:shadow-amber-200/20 hover:border-amber-200 transition-all group overflow-hidden flex flex-col cursor-pointer active:scale-95 duration-300"
          >
            <div className="p-5 md:p-6 pb-4">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl gold-gradient flex items-center justify-center text-amber-950 font-black text-lg md:text-xl shadow-lg">
                  {customer.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex items-center space-x-1 opacity-40 group-hover:opacity-100">
                  <button onClick={(e) => deleteCustomer(e, customer.id)} className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-black text-stone-800 truncate uppercase">{customer.fullName}</h3>
              <p className="text-[10px] md:text-xs font-bold text-stone-400 mt-1">{customer.phone}</p>
            </div>
            <div className="mt-auto bg-stone-50 p-4 md:p-6 flex justify-between items-center border-t border-stone-100">
               <div className="flex flex-col">
                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Nəqd Borc</p>
                  <p className={`text-sm md:text-base font-black ${customer.cashDebt > 0 ? 'text-red-600' : 'text-stone-300'}`}>{customer.cashDebt.toLocaleString()} ₼</p>
               </div>
               <ChevronRight size={16} className="text-stone-200 group-hover:text-amber-500 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-full md:zoom-in-95">
            <div className="p-6 md:p-8 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
              <h3 className="text-xl md:text-2xl font-black text-stone-800 uppercase tracking-tighter">Yeni Müştəri</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-stone-400"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-6 md:p-8 space-y-4 md:space-y-6">
              <div className="space-y-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-stone-400 uppercase ml-3">Tam Ad</label><input required type="text" value={newCustomer.fullName} onChange={(e) => setNewCustomer({...newCustomer, fullName: e.target.value})} placeholder="Ad Soyad" className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-bold" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-stone-400 uppercase ml-3">Telefon</label><input required type="text" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="050..." className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-bold" /></div>
              </div>
              <button type="submit" className="w-full bg-stone-900 text-white py-5 md:py-6 rounded-2xl font-black text-base md:text-lg uppercase tracking-widest flex items-center justify-center shadow-2xl">
                YADDA SAXLA <CheckCircle2 className="ml-3 w-6 h-6 text-amber-500" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersModule;