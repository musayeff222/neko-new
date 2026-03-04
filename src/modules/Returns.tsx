
import React, { useState } from 'react';
import { 
  Search, 
  RotateCcw, 
  AlertTriangle, 
  ArrowRightLeft, 
  Package, 
  Gem, 
  X,
  Barcode,
  CheckCircle2,
  Settings,
  RefreshCw,
  Save,
  Tag,
  User
} from 'lucide-react';
import { Sale, Product } from '@/types';

interface ReturnsProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<any>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<any>>;
}

const ReturnsModule: React.FC<ReturnsProps> = ({ sales, setSales, products, setProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  // Refund Option States
  const [showRefundOptions, setShowRefundOptions] = useState(false);
  const [returnCodeOption, setReturnCodeOption] = useState<'same' | 'new'>('same');
  const [newCodeInput, setNewCodeInput] = useState('');

  const filtered = (Array.isArray(sales) ? sales : []).filter(s => 
    s.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartRefund = () => {
    setReturnCodeOption('same');
    setNewCodeInput(selectedSale?.productCode || '');
    setShowRefundOptions(true);
  };

  const finalizeReturn = (isExchange: boolean) => {
    if (!selectedSale) return;

    let finalCode = selectedSale.productCode;
    let note = isExchange 
      ? "Bu mal başqa mal ilə dəyişdirilmişdir" 
      : "Bu kod geri qaytarıldı öz kodu ilə";

    if (!isExchange && returnCodeOption === 'new') {
        if (!newCodeInput.trim()) {
            alert("Yeni kodu daxil edin!");
            return;
        }
        finalCode = newCodeInput.trim();
        note = `Bu kod geri qaytarıldı və yeni kodu budur: ${finalCode}`;
    }

    const actionText = isExchange ? 'DƏYİŞİLMƏ' : 'GERİ QAYTARMA';
    const finalStatus = isExchange ? 'exchanged' : 'returned';

    // 1. Satış tarixçəsini yenilə
    setSales(prev => prev.map(s => 
      s.id === selectedSale.id ? { ...s, status: finalStatus, returnNote: note } : s
    ));
    
    // 2. Məhsulu stoka əlavə et
    setProducts(prev => prev.map(p => {
        if (p.id === selectedSale.productId) {
            return { 
                ...p, 
                stockCount: p.stockCount + 1, 
                code: finalCode,
                logs: [{ date: new Date().toISOString(), action: `${actionText} prosesi ilə geri qayıtdı. ${note}` }, ...(p.logs || [])]
            };
        }
        return p;
    }));

    alert(`${actionText} tamamlandı. Məhsul ${finalCode} kodu ilə stoka geri əlavə edildi.`);
    setShowRefundOptions(false);
    setSelectedSale(null);
    setSearchTerm('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 pb-24 md:pb-10 animate-in fade-in duration-500 relative">
      
      {/* SOL TƏRƏF: KODLA AXTARIŞ VƏ SİYAHI */}
      <div className="space-y-4 md:space-y-6 flex flex-col h-full">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Məhsul Kodu ilə Axtarış</h3>
            <span className="text-[9px] font-bold text-stone-300 uppercase">{(Array.isArray(sales) ? sales : []).length} Satış Mövcuddur</span>
        </div>
        
        <div className="relative group">
          <Barcode className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 w-6 h-6 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Malın kodunu daxil edin (məs: YZ-101)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-stone-100 rounded-2xl md:rounded-[2rem] py-5 md:py-6 pl-16 pr-6 focus:ring-8 focus:ring-amber-50 outline-none shadow-xl text-base font-black tracking-tight placeholder:text-stone-300 placeholder:font-medium"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors">
                <X size={24}/>
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl md:rounded-[3rem] border border-stone-100 shadow-2xl flex-1 overflow-hidden flex flex-col min-h-[500px]">
          <div className="divide-y divide-stone-50 overflow-y-auto scrollbar-hide">
            {filtered.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSale(s)}
                className={`w-full flex items-center justify-between p-6 md:p-8 hover:bg-amber-50/50 transition-all text-left border-l-[8px] ${selectedSale?.id === s.id ? 'bg-amber-50 border-amber-500' : 'border-transparent'}`}
              >
                <div className="flex items-center space-x-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${s.status === 'returned' || s.status === 'exchanged' ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-stone-50 border-stone-100 text-stone-300 group-hover:text-amber-500'}`}>
                    {s.status === 'returned' ? <RotateCcw size={24} /> : s.status === 'exchanged' ? <ArrowRightLeft size={24} /> : <Gem size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1.5">
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-widest">{s.productCode}</span>
                      {s.status === 'returned' && (
                        <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase border border-red-100 tracking-tighter">QAYTARILIB</span>
                      )}
                      {s.status === 'exchanged' && (
                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase border border-amber-100 tracking-tighter">DƏYİŞDİRİLİB</span>
                      )}
                    </div>
                    <p className="font-black text-stone-800 uppercase text-sm md:text-lg leading-none">{s.productName}</p>
                    <p className="text-[10px] text-stone-400 font-bold mt-2 uppercase tracking-widest flex items-center">
                        <User size={12} className="mr-1.5" /> {s.customerName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-stone-900 tracking-tighter text-lg md:text-2xl">{s.total.toLocaleString()} ₼</p>
                  <p className="text-[10px] text-stone-300 font-bold uppercase mt-1">{new Date(s.date).toLocaleDateString('az-AZ')}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SAĞ TƏRƏF: SEÇİLMİŞ MAL ÜÇÜN ƏMƏLİYYAT PANELİ */}
      <div className="space-y-4 md:space-y-6">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">İadə və ya Dəyişmə Əməliyyatı</h3>
        
        {selectedSale ? (
          <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-stone-100 shadow-2xl p-8 md:p-12 space-y-10 animate-in slide-in-from-right duration-300">
            
            {/* Məhsul Kartı */}
            <div className="bg-stone-50 border-2 border-dashed border-stone-200 p-8 rounded-[2rem] relative group">
              <button 
                onClick={() => setSelectedSale(null)} 
                className="absolute top-6 right-6 p-3 bg-white text-stone-300 hover:text-red-500 rounded-xl shadow-sm transition-all hover:rotate-90"
              >
                <X size={20}/>
              </button>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center space-x-6">
                   <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-amber-500 border border-stone-100 overflow-hidden p-2">
                      {selectedSale.imageUrl ? (
                        <img src={selectedSale.imageUrl} className="w-full h-full object-contain" />
                      ) : (
                        <Gem size={40} strokeWidth={1.5} />
                      )}
                   </div>
                   <div>
                      <h4 className="text-2xl md:text-3xl font-black text-stone-900 leading-tight uppercase tracking-tighter">{selectedSale.productName}</h4>
                      <div className="flex items-center space-x-3 mt-2">
                         <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest">{selectedSale.productCode}</span>
                         <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                         <span className="text-[11px] font-bold text-stone-400 uppercase">{selectedSale.weight} gr</span>
                      </div>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="bg-stone-900 text-amber-500 px-8 py-4 rounded-2xl text-3xl font-black tracking-tighter shadow-2xl border border-stone-800">
                      {selectedSale.total.toLocaleString()} ₼
                   </div>
                   <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-2 px-2 flex items-center">
                     <CheckCircle2 size={12} className="mr-1.5 text-green-500" /> Sənəd: #{selectedSale.id.toUpperCase()}
                   </p>
                </div>
              </div>
            </div>

            {/* Əsas Düymələr */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={handleStartRefund}
                disabled={selectedSale.status !== 'completed'}
                className={`flex flex-col items-center justify-center py-10 md:py-14 rounded-[2.5rem] font-black text-xs md:text-sm transition-all active:scale-95 group relative overflow-hidden ${selectedSale.status !== 'completed' ? 'bg-stone-50 text-stone-200 border-stone-100 cursor-not-allowed shadow-none' : 'bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-500 hover:text-white hover:border-red-500 shadow-xl'}`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 opacity-20 rounded-full -mr-12 -mt-12"></div>
                <RotateCcw className="w-12 h-12 mb-4 group-hover:rotate-[-45deg] transition-transform duration-500" />
                <span className="uppercase tracking-[0.2em]">GERİ QAYTARILMA</span>
                <span className="text-[9px] font-bold opacity-60 mt-2">(Pulu Geri Verilir)</span>
              </button>
              
              <button 
                onClick={() => finalizeReturn(true)}
                disabled={selectedSale.status !== 'completed'}
                className={`flex flex-col items-center justify-center py-10 md:py-14 rounded-[2.5rem] font-black text-xs md:text-sm transition-all active:scale-95 group relative overflow-hidden ${selectedSale.status !== 'completed' ? 'bg-stone-50 text-stone-200 border-stone-100 cursor-not-allowed shadow-none' : 'bg-stone-900 text-amber-500 border-2 border-stone-800 hover:bg-black hover:scale-[1.02] shadow-2xl shadow-amber-900/10'}`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500 opacity-5 rounded-full -mr-12 -mt-12"></div>
                <ArrowRightLeft className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform duration-500" />
                <span className="uppercase tracking-[0.2em]">MALIN DƏYİŞİLMƏSİ</span>
                <span className="text-[9px] font-bold opacity-60 mt-2">(Başqa Malla Dəyiş)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-stone-100/30 rounded-[3rem] border-4 border-dashed border-stone-100 h-full min-h-[400px] flex flex-col items-center justify-center text-stone-300 p-12 text-center shadow-inner group">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl border border-stone-50 group-hover:scale-110 transition-transform duration-700">
                <RotateCcw className="w-12 h-12 text-stone-200" />
            </div>
            <p className="text-sm md:text-base font-black uppercase tracking-[0.4em] text-stone-400">Mal Seçilməyib</p>
          </div>
        )}
      </div>

      {/* GERİ QAYTARMA OPSİYALARI MODALI */}
      {showRefundOptions && selectedSale && (
        <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95">
              <header className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                 <div className="flex items-center space-x-3 text-red-600">
                    <AlertTriangle size={24} />
                    <h3 className="text-lg font-black uppercase tracking-tighter">İadə Seçimləri</h3>
                 </div>
                 <button onClick={() => setShowRefundOptions(false)} className="p-2 text-stone-300 hover:text-stone-900 transition-colors">
                    <X size={24} />
                 </button>
              </header>

              <main className="p-8 space-y-8">
                 <p className="text-xs font-bold text-stone-500 uppercase text-center leading-relaxed">
                   Məhsul stoka geri əlavə edilərkən kodunun necə saxlanılacağını seçin:
                 </p>

                 <div className="grid grid-cols-1 gap-4">
                    <button 
                        onClick={() => setReturnCodeOption('same')}
                        className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${returnCodeOption === 'same' ? 'bg-amber-50 border-amber-500 shadow-md' : 'bg-stone-50 border-stone-100 text-stone-400 hover:border-amber-200'}`}
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl ${returnCodeOption === 'same' ? 'bg-amber-500 text-stone-900' : 'bg-stone-200 text-stone-500'}`}><RefreshCw size={20}/></div>
                            <div className="text-left">
                                <p className="font-black text-xs uppercase tracking-widest">Köhnə Kodla Qalsın</p>
                                <p className="text-[10px] font-bold opacity-60">Stoka {selectedSale.productCode} kodu ilə qayıdır</p>
                            </div>
                        </div>
                        {returnCodeOption === 'same' && <CheckCircle2 className="text-amber-500" />}
                    </button>

                    <button 
                        onClick={() => setReturnCodeOption('new')}
                        className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${returnCodeOption === 'new' ? 'bg-amber-50 border-amber-500 shadow-md' : 'bg-stone-50 border-stone-100 text-stone-400 hover:border-amber-200'}`}
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl ${returnCodeOption === 'new' ? 'bg-amber-500 text-stone-900' : 'bg-stone-200 text-stone-500'}`}><Settings size={20}/></div>
                            <div className="text-left">
                                <p className="font-black text-xs uppercase tracking-widest">Yeni Kod Təyin Et</p>
                                <p className="text-[10px] font-bold opacity-60">Stoka fərqli kodla əlavə olunacaq</p>
                            </div>
                        </div>
                        {returnCodeOption === 'new' && <CheckCircle2 className="text-amber-500" />}
                    </button>
                 </div>

                 {returnCodeOption === 'new' && (
                    <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">YENİ KODU DAXİL EDİN</label>
                        <div className="relative">
                            <Barcode className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" />
                            <input 
                                type="text" 
                                value={newCodeInput}
                                onChange={(e) => setNewCodeInput(e.target.value)}
                                className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 pl-14 pr-4 font-black text-stone-800 outline-none focus:border-amber-500 transition-all"
                                placeholder="Məs: YZ-101-R"
                            />
                        </div>
                    </div>
                 )}
              </main>

              <footer className="p-8 bg-stone-50/50 border-t border-stone-100 flex space-x-4">
                 <button 
                    onClick={() => setShowRefundOptions(false)}
                    className="flex-1 py-4 font-black text-[10px] text-stone-400 uppercase tracking-widest border border-stone-200 rounded-xl hover:bg-white"
                 >
                    Ləğv Et
                 </button>
                 <button 
                    onClick={() => finalizeReturn(false)}
                    className="flex-[2] py-4 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl hover:bg-red-600 transition-all flex items-center justify-center border-b-4 border-red-700"
                 >
                    <Save size={16} className="mr-2" /> TƏSDİQLƏ VƏ İADƏ ET
                 </button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsModule;
