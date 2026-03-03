import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Calendar, 
  Printer, 
  Download,
  FileText,
  ChevronRight,
  Wallet,
  Coins
} from 'lucide-react';
import { Sale, Product, ScrapGold, Customer } from '@/types';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  scraps: ScrapGold[];
  customers: Customer[];
}

const ReportsModule: React.FC<ReportsProps> = ({ sales, products, scraps, customers }) => {
  const safeSales = Array.isArray(sales) ? sales : [];
  const totalRevenue = safeSales.filter(s => s.status !== 'returned').reduce((acc, s) => acc + s.total, 0);
  const dailySales = safeSales.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && s.status !== 'returned');
  const dailyRevenue = dailySales.reduce((acc, s) => acc + s.total, 0);
  
  const totalScrapPay = scraps.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalReceivables = customers.reduce((acc, c) => acc + c.cashDebt, 0);

  const stats = [
    { label: 'Bugünkü Satış', value: `${dailyRevenue.toLocaleString()} ₼`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50', sub: `${dailySales.length} Satış` },
    { label: 'Aylıq Dövriyyə', value: `${totalRevenue.toLocaleString()} ₼`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50', sub: 'Ümumi Brüt' },
    { label: 'Cəmi Alacaqlar', value: `${totalReceivables.toLocaleString()} ₼`, icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-50', sub: 'Borclar Cəmi' },
    { label: 'Lom Ödənişləri', value: `${totalScrapPay.toLocaleString()} ₼`, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', sub: 'Alınan Hurda' },
  ];

  return (
    <div className="space-y-6 md:space-y-10 pb-24 md:pb-10 animate-in fade-in duration-700">
      {/* Sürətli Statistika */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-stone-50 rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 relative z-10">
              <div className={`p-3 md:p-4 ${stat.bg} ${stat.color} rounded-xl md:rounded-2xl shadow-inner`}>
                <stat.icon size={20} className="md:w-6 md:h-6" />
              </div>
              <p className="hidden md:block text-[8px] font-black text-stone-300 uppercase tracking-widest">{stat.sub}</p>
            </div>
            <p className="text-[8px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest relative z-10">{stat.label}</p>
            <h4 className="text-sm md:text-2xl font-black text-stone-900 mt-1 relative z-10 tracking-tighter">{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        {/* Z Hesabatı Bölməsi */}
        <div className="bg-stone-900 text-white rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 gold-gradient opacity-10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:opacity-20 transition-all duration-1000"></div>
           <div className="relative z-10 space-y-8 md:space-y-12">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl md:text-2xl font-black flex items-center tracking-tighter uppercase leading-none">
                    <Calendar className="mr-3 md:mr-4 text-amber-500 w-6 h-6 md:w-8 md:h-8" /> Z Hesabatı
                 </h3>
                 <div className="bg-white/5 px-4 py-1.5 rounded-xl border border-white/10 text-[10px] md:text-xs font-black uppercase tracking-widest text-stone-400">
                    {new Date().toLocaleDateString('az-AZ')}
                 </div>
              </div>

              <div className="space-y-4 md:space-y-6">
                 <div className="flex justify-between items-center border-b border-white/5 pb-4 md:pb-6">
                    <span className="text-[10px] md:text-sm font-black text-stone-500 uppercase tracking-widest">Nəqd Satışlar</span>
                    <span className="text-lg md:text-2xl font-black tracking-tighter">{(dailyRevenue * 0.7).toLocaleString()} <span className="text-xs text-stone-600">₼</span></span>
                 </div>
                 <div className="flex justify-between items-center border-b border-white/5 pb-4 md:pb-6">
                    <span className="text-[10px] md:text-sm font-black text-stone-500 uppercase tracking-widest">Bank / Kart</span>
                    <span className="text-lg md:text-2xl font-black tracking-tighter">{(dailyRevenue * 0.3).toLocaleString()} <span className="text-xs text-stone-600">₼</span></span>
                 </div>
                 <div className="flex justify-between items-center pt-4 md:pt-6">
                    <span className="text-xs md:text-sm font-black text-amber-500 uppercase tracking-[0.2em]">YEKUN CƏM</span>
                    <span className="text-3xl md:text-5xl font-black text-amber-500 tracking-tighter">{dailyRevenue.toLocaleString()} <span className="text-base md:text-xl text-amber-800">₼</span></span>
                 </div>
              </div>

              <button className="w-full bg-amber-500 text-amber-950 py-5 md:py-7 rounded-[2rem] font-black text-base md:text-xl hover:bg-amber-400 transition-all flex items-center justify-center shadow-xl active:scale-95 uppercase tracking-[0.2em]">
                 <Printer className="w-6 h-6 md:w-8 md:h-8 mr-4" /> HESABATI ÇAP ET
              </button>
           </div>
        </div>

        {/* Son İşləmlər Cədvəli */}
        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-stone-100 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-6 md:p-10 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
             <h3 className="text-base md:text-lg font-black text-stone-800 uppercase tracking-tighter flex items-center leading-none">
                <FileText className="w-5 h-5 mr-3 text-amber-600" /> Son Əməliyyatlar
             </h3>
             <button className="text-[10px] md:text-xs font-black text-stone-400 hover:text-amber-500 transition-colors uppercase tracking-widest">Arxiv</button>
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[400px] scrollbar-hide">
            <table className="w-full text-left min-w-[350px]">
              <thead className="bg-stone-50 sticky top-0 z-10 border-b border-stone-100">
                <tr>
                  <th className="px-6 md:px-10 py-4 text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest">Məhsul</th>
                  <th className="px-6 md:px-10 py-4 text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Məbləğ</th>
                  <th className="px-6 md:px-10 py-4 text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {safeSales.slice(0, 10).map(s => (
                  <tr key={s.id} className="hover:bg-amber-50/20 transition-all group">
                    <td className="px-6 md:px-10 py-4 md:py-6">
                      <p className="text-sm font-black text-stone-800 uppercase leading-none truncate max-w-[120px] md:max-w-none">{s.productName}</p>
                      <p className="text-[10px] text-stone-400 font-bold mt-1 uppercase tracking-widest">{s.customerName}</p>
                    </td>
                    <td className="px-6 md:px-10 py-4 md:py-6 text-right">
                       <p className="text-sm md:text-lg font-black text-stone-900 tracking-tighter">{s.total.toLocaleString()} ₼</p>
                    </td>
                    <td className="px-6 md:px-10 py-4 md:py-6 text-center">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${s.status === 'returned' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                        {s.status === 'returned' ? 'İADƏ' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule;