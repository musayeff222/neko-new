
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  CheckCircle2, 
  Printer, 
  X, 
  ShoppingCart, 
  ArrowLeft, 
  Sparkles, 
  Gem, 
  ArrowRight, 
  UserCircle, 
  Users, 
  PlusCircle,
  Trash2,
  PackagePlus,
  ChevronRight,
  UserPlus,
  CalendarDays,
  Coins,
  Wallet,
  Barcode,
  Scale,
  CreditCard,
  AlertTriangle,
  History,
  User,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { Product, ProductType, Sale, Customer, AppSettings } from '@/types';

interface SalesProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<any>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<any>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<any>>;
  settings: AppSettings;
  cart: Product[];
  setCart: React.Dispatch<React.SetStateAction<Product[]>>;
}

const SalesModule: React.FC<SalesProps> = ({ products, setProducts, sales, setSales, customers, setCustomers, settings, cart, setCart }) => {
  const [step, setStep] = useState(1);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [previouslySoldItem, setPreviouslySoldItem] = useState<Sale | null>(null);
  const [discount, setDiscount] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({ id: '', fullName: '', phone: '', title: '', address: '' });
  const [searchCode, setSearchCode] = useState('');
  
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustForm, setNewCustForm] = useState({ fullName: '', phone: '', address: '' });

  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditDownPayment, setCreditDownPayment] = useState<number>(0);
  const [creditMonths, setCreditMonths] = useState<number>(3);

  const [lastTransaction, setLastTransaction] = useState<{
    sales: Sale[];
    customer: any;
    date: string;
    subtotal: number;
    discount: number;
    total: number;
  } | null>(null);

  const handleProductSearch = () => {
    const code = searchCode.trim().toLowerCase();
    if (!code) return;

    // 1. Aktiv stokda tapmağa çalışırıq
    const found = products.find(p => 
      p.code.toLowerCase() === code && 
      p.stockCount === 1 &&
      !cart.some(item => item.id === p.id)
    );

    if (found) {
      setCurrentProduct(found);
      setPreviouslySoldItem(null);
    } else {
      // 2. Stokda yoxdursa, satış tarixçəsində yoxlayırıq
      const sold = sales.find(s => s.productCode.toLowerCase() === code);
      if (sold) {
        setPreviouslySoldItem(sold);
        setCurrentProduct(null);
      } else {
        alert(`'${searchCode}' kodlu aktiv məhsul tapılmadı!`);
        setCurrentProduct(null);
        setPreviouslySoldItem(null);
      }
    }
  };

  const addToCart = () => {
    if (currentProduct) {
      if (cart.find(item => item.id === currentProduct.id)) {
        alert("Bu məhsul artıq səbətdədir!");
        return;
      }
      setCart([...cart, currentProduct]);
      setCurrentProduct(null);
      setPreviouslySoldItem(null);
      setSearchCode('');
      setStep(1);
    }
  };

  const directToPayment = () => {
    if (currentProduct) {
      const alreadyInCart = cart.find(item => item.id === currentProduct.id);
      if (!alreadyInCart) {
        setCart([...cart, currentProduct]);
      }
      setCurrentProduct(null);
      setPreviouslySoldItem(null);
      setSearchCode('');
      setStep(3);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleCompleteSale = (isCredit: boolean = false) => {
    if (cart.length === 0) return;
    if (isCredit && !customerInfo.fullName) {
        alert("Kreditlə satış üçün müştəri seçilməlidir!");
        return;
    }

    const transactionId = Math.random().toString(36).substr(2, 6).toUpperCase();
    const date = new Date().toISOString();
    
    const subtotalValue = cart.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
    const finalTotalValue = subtotalValue - discount;

    const newSalesRecords: Sale[] = cart.map((product, index) => ({
      id: `${transactionId}-${index + 1}`,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      type: product.type,
      customerName: customerInfo.fullName || 'Anonim Müştəri',
      price: Number(product.price) || 0,
      discount: index === 0 ? discount : 0,
      total: index === 0 ? (Number(product.price) || 0) - discount : (Number(product.price) || 0),
      date: date,
      status: 'completed',
      weight: Number(product.weight) || 0,
      carat: product.carat,
      supplier: product.supplier,
      brilliant: product.brilliant,
      imageUrl: product.imageUrl
    }));

    setLastTransaction({
      sales: newSalesRecords,
      customer: customerInfo,
      date: date,
      subtotal: subtotalValue,
      discount: discount,
      total: finalTotalValue
    });

    if (isCredit && customerInfo.id) {
        const debtToAdd = finalTotalValue - creditDownPayment;
        setCustomers(prev => prev.map(c => 
            c.id === customerInfo.id ? { ...c, cashDebt: c.cashDebt + debtToAdd } : c
        ));
    }

    setSales([...newSalesRecords, ...sales]);
    
    const cartIds = cart.map(p => p.id);
    setProducts(prevProducts => prevProducts.map(p => 
      cartIds.includes(p.id) ? { ...p, stockCount: 0 } : p
    ));

    setShowCreditModal(false);
    setStep(4);
  };

  const resetForm = () => {
    setStep(1);
    setCart([]);
    setCurrentProduct(null);
    setPreviouslySoldItem(null);
    setDiscount(0);
    setCustomerInfo({ id: '', fullName: '', phone: '', title: '', address: '' });
    setSearchCode('');
    setLastTransaction(null);
  };

  const selectExistingCustomer = (c: Customer) => {
    setCustomerInfo({
      id: c.id,
      fullName: c.fullName,
      phone: c.phone,
      title: c.title || '',
      address: c.address || ''
    });
    setShowCustomerSelector(false);
    setCustomerSearchTerm('');
  };

  const handleQuickCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustForm.fullName || !newCustForm.phone) return;

    const newC: Customer = {
      id: Date.now().toString(36),
      fullName: newCustForm.fullName,
      phone: newCustForm.phone,
      address: newCustForm.address,
      cashDebt: 0,
      goldDebt: 0,
      title: ''
    };

    setCustomers(prev => [...prev, newC]);
    setCustomerInfo({
      id: newC.id,
      fullName: newC.fullName,
      phone: newC.phone,
      title: '',
      address: newC.address || ''
    });
    
    setIsAddingNewCustomer(false);
    setShowCustomerSelector(false);
    setNewCustForm({ fullName: '', phone: '', address: '' });
  };

  const handlePrint = () => {
    if (!lastTransaction) return;
    window.focus();
    setTimeout(() => {
        window.print();
    }, 10);
  };

  const subtotalValue = cart.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  const totalValue = subtotalValue - discount;

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    c.phone.includes(customerSearchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col space-y-4 animate-in fade-in duration-700">
      
      {/* ÇAP KONTEYNERİ (PORTAL) */}
      {lastTransaction && createPortal(
        <div id="receipt-print">
            <div className="receipt-content" style={{ background: 'white', color: 'black', fontWeight: settings.receiptFontWeight }}>
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0' }}>NEKO GOLD</h1>
                    <p style={{ margin: '2px 0', fontSize: '10px', textTransform: 'uppercase' }}>Zərgərlik Satış Mərkəzi</p>
                    <p style={{ margin: '0', fontSize: '9px' }}>{new Date(lastTransaction.date).toLocaleString('az-AZ')}</p>
                </div>
                
                <div style={{ borderBottom: '1px dashed black', margin: '10px 0' }}></div>
                
                <div style={{ marginBottom: '10px', fontSize: '11px' }}>
                    <p style={{ margin: '2px 0' }}><strong>Müştəri:</strong> {lastTransaction.customer.fullName || 'Anonim'}</p>
                    <p style={{ margin: '2px 0' }}><strong>Tel:</strong> {lastTransaction.customer.phone || '-'}</p>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid black' }}>
                            <th style={{ textAlign: 'left', padding: '4px 0' }}>Məhsul</th>
                            <th style={{ textAlign: 'right', padding: '4px 0' }}>Qiymət</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lastTransaction.sales.map((item, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '6px 0' }}>
                                    <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                                    <div style={{ fontSize: '9px' }}>{item.productCode} | {item.weight} gr</div>
                                </td>
                                <td style={{ textAlign: 'right', padding: '6px 0', fontWeight: 'bold' }}>
                                    {item.total.toLocaleString()} ₼
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ marginTop: '10px', textAlign: 'right', borderTop: '1px solid black', paddingTop: '8px' }}>
                    <p style={{ fontSize: '10px', margin: '2px 0' }}>Cəmi: {lastTransaction.subtotal.toLocaleString()} ₼</p>
                    <p style={{ fontSize: '10px', margin: '2px 0' }}>Endirim: -{lastTransaction.discount.toLocaleString()} ₼</p>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '5px 0' }}>YEKUN: {lastTransaction.total.toLocaleString()} ₼</h2>
                </div>

                <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '9px' }}>
                    <p style={{ fontWeight: 'bold' }}>Təşəkkür edirik!</p>
                </div>
            </div>
        </div>,
        document.body
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col space-y-4 md:space-y-6 animate-in slide-in-from-right-12 duration-500 no-print">
          <div className="flex items-center justify-between bg-white p-3 md:p-4 rounded-2xl md:rounded-[2rem] shadow-xl border border-stone-100">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="p-3 md:p-4 bg-amber-50 rounded-xl md:rounded-2xl text-amber-500">
                <Barcode className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="text-base md:text-xl font-black text-stone-900 uppercase leading-none">Məhsul Axtarışı</h3>
                <p className="text-[9px] md:text-[10px] text-stone-400 font-bold uppercase tracking-widest">Kodu daxil edin</p>
              </div>
            </div>
            {cart.length > 0 && (
              <button onClick={() => setStep(3)} className="bg-amber-950 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-black transition-all">
                SƏBƏT ({cart.length}) <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl md:rounded-[3rem] p-4 md:p-8 shadow-2xl border border-stone-100 flex flex-col items-center justify-start pt-8 md:pt-12 min-h-[400px] overflow-y-auto">
            <div className="w-full max-w-2xl relative mb-6">
              <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5 md:w-8 md:h-8" />
              <input 
                type="text" autoFocus value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleProductSearch()}
                placeholder="Məhsul kodu..."
                className="w-full bg-stone-50 border-none rounded-2xl md:rounded-[1.5rem] py-5 md:py-7 pl-12 md:pl-16 pr-24 md:pr-40 text-lg md:text-2xl font-bold text-stone-800 focus:ring-8 focus:ring-amber-50 focus:bg-white transition-all shadow-inner"
              />
              <button onClick={handleProductSearch} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-amber-500 text-amber-950 px-4 md:px-10 py-2 md:py-4 rounded-xl font-black text-[10px] md:text-sm uppercase tracking-widest transition-all active:scale-95">
                AXTAR
              </button>
            </div>

            {/* BU HİSSƏ: ƏVVƏLLƏR SATILAN MƏHSUL XƏBƏRDARLIĞI */}
            {previouslySoldItem && (
              <div className="w-full max-w-3xl bg-red-50 border-2 md:border-4 border-white shadow-2xl rounded-3xl md:rounded-[3rem] p-6 md:p-10 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-10 animate-in zoom-in-95">
                 <div className="relative">
                    <div className="w-32 h-32 md:w-48 md:h-48 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center p-2 shadow-xl border-2 border-red-100 overflow-hidden group">
                        {previouslySoldItem.imageUrl ? (
                          <img src={previouslySoldItem.imageUrl} className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="text-red-100 w-16 h-16" />
                        )}
                        <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                           <AlertTriangle size={64} className="text-red-600/20" />
                        </div>
                    </div>
                    <div className="absolute -top-4 -right-4 bg-red-600 text-white p-2 rounded-full shadow-lg border-4 border-white">
                       <History size={20} />
                    </div>
                 </div>

                 <div className="flex-1 text-center md:text-left space-y-3">
                    <div className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                       <X size={14} strokeWidth={3} />
                       <span>BU KOD ARTIQ SATILIB</span>
                    </div>
                    <h4 className="text-2xl md:text-4xl font-black text-stone-900 uppercase tracking-tighter leading-none">{previouslySoldItem.productName}</h4>
                    
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-red-100">
                       <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg text-red-500 shadow-sm"><User size={16}/></div>
                          <div className="text-left">
                             <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">ALAN MÜŞTƏRİ</p>
                             <p className="text-[11px] font-black text-stone-800 uppercase">{previouslySoldItem.customerName}</p>
                          </div>
                       </div>
                       <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg text-red-500 shadow-sm"><Clock size={16}/></div>
                          <div className="text-left">
                             <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">SATIŞ TARİXİ</p>
                             <p className="text-[11px] font-black text-stone-800 uppercase">{new Date(previouslySoldItem.date).toLocaleDateString()}</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                       <div>
                          <p className="text-[9px] font-black text-stone-400 uppercase">SATIŞ MƏBLƏĞİ</p>
                          <p className="text-2xl font-black text-red-600 tracking-tighter">{previouslySoldItem.total.toLocaleString()} ₼</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-stone-400 uppercase">ÇƏKİ / ƏYAR</p>
                          <p className="text-sm font-black text-stone-800 uppercase">{previouslySoldItem.weight} gr | {previouslySoldItem.carat}K</p>
                       </div>
                    </div>

                    <button 
                       onClick={() => {setPreviouslySoldItem(null); setSearchCode('');}} 
                       className="w-full bg-white border border-red-100 text-stone-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all mt-4"
                    >
                       Axtarışı Təmizlə
                    </button>
                 </div>
              </div>
            )}

            {currentProduct && (
              <div className="w-full max-w-3xl bg-amber-50 mt-4 rounded-3xl md:rounded-[3rem] p-4 md:p-10 border-2 md:border-4 border-white shadow-2xl flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-10 animate-in zoom-in-95">
                 <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center p-2 shadow-sm border border-stone-100 overflow-hidden">
                    {currentProduct.imageUrl ? <img src={currentProduct.imageUrl} className="w-full h-full object-contain" /> : <Sparkles className="text-amber-200 w-8 h-8 md:w-12 md:h-12" />}
                 </div>
                 <div className="flex-1 text-center md:text-left space-y-2 md:space-y-4">
                    <h4 className="text-xl md:text-3xl font-black text-stone-900 uppercase tracking-tighter leading-none">{currentProduct.name}</h4>
                    <p className="text-[10px] md:text-[11px] font-bold text-stone-400 uppercase tracking-widest">{currentProduct.code} | {currentProduct.weight} gr | {currentProduct.carat}K</p>
                    <p className="text-3xl md:text-5xl font-black text-amber-600 tracking-tighter">{(Number(currentProduct.price) || 0).toLocaleString()} <span className="text-xl md:text-2xl text-amber-400">₼</span></p>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                       <button onClick={addToCart} className="flex-1 bg-stone-900 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase hover:bg-black transition-all shadow-xl flex items-center justify-center">
                          <PackagePlus size={18} className="mr-2 md:mr-3" /> SƏBƏTƏ AT
                       </button>
                       <button onClick={directToPayment} className="flex-1 bg-amber-500 text-amber-950 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase hover:bg-amber-400 transition-all shadow-xl flex items-center justify-center">
                          <CreditCard size={18} className="mr-2 md:mr-3" /> BİRDƏFƏLİK ÖDƏ
                       </button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 animate-in slide-in-from-right-12 duration-500 no-print">
          <div className="lg:col-span-8 space-y-4 md:space-y-6">
            <div className="bg-white rounded-3xl md:rounded-[3rem] p-4 md:p-8 shadow-xl border border-stone-100 flex flex-col">
               <div className="flex items-center justify-between mb-4 md:mb-8 pb-4 md:pb-6 border-b border-stone-100">
                  <div className="flex items-center space-x-3 md:space-x-4">
                    <button onClick={() => setStep(1)} className="p-3 md:p-4 bg-stone-50 rounded-xl md:rounded-2xl text-stone-400"><ArrowLeft size={20}/></button>
                    <h3 className="text-xl md:text-2xl font-black text-stone-900 uppercase tracking-tighter">SƏBƏT</h3>
                  </div>
               </div>

               <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-hide max-h-[40vh] md:max-h-none">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 md:p-6 bg-stone-50 rounded-2xl md:rounded-[2rem] border border-stone-100">
                       <div className="flex items-center space-x-3 md:space-x-5">
                          <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl flex items-center justify-center text-amber-500 border border-stone-100">
                             <Gem size={20}/>
                          </div>
                          <div className="max-w-[120px] md:max-w-none">
                            <p className="font-black text-stone-800 uppercase text-xs md:text-base truncate">{item.name}</p>
                            <p className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest">{item.code} | {item.weight} gr</p>
                          </div>
                       </div>
                       <div className="flex items-center space-x-3 md:space-x-6">
                          <p className="text-lg md:text-2xl font-black text-stone-900 tracking-tighter">{(Number(item.price) || 0).toLocaleString()} ₼</p>
                          <button onClick={() => removeFromCart(item.id)} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                       </div>
                    </div>
                  ))}
                  {cart.length === 0 && <p className="text-center py-10 text-stone-400 font-bold uppercase tracking-widest text-xs">Səbət boşdur</p>}
               </div>

               <div className="mt-6 md:mt-10 pt-4 md:pt-8 border-t border-stone-100">
                  <p className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 md:mb-4">MÜŞTƏRİ</p>
                  <button onClick={() => setShowCustomerSelector(true)} className="w-full bg-stone-50 border-2 border-dashed border-stone-200 p-4 md:p-6 rounded-2xl md:rounded-[2rem] flex items-center justify-between hover:bg-amber-50 hover:border-amber-200 transition-all">
                     {customerInfo.fullName ? (
                        <div className="flex items-center space-x-3 md:space-x-4">
                           <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center font-black">
                              {customerInfo.fullName[0]}
                           </div>
                           <div className="text-left">
                              <p className="font-black text-stone-800 uppercase leading-none text-xs md:text-base">{customerInfo.fullName}</p>
                              <p className="text-[10px] md:text-xs font-bold text-amber-600 mt-1">{customerInfo.phone}</p>
                           </div>
                        </div>
                     ) : (
                        <div className="flex items-center text-stone-400">
                           <UserCircle size={24} className="mr-3 md:mr-4" />
                           <span className="font-bold uppercase text-[10px] md:text-sm">Müştəri Seçin</span>
                        </div>
                     )}
                     <ChevronRight className="text-stone-300" />
                  </button>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col space-y-4 md:space-y-6">
             <div className="bg-stone-900 text-white rounded-3xl md:rounded-[3rem] p-6 md:p-10 shadow-2xl flex-1 flex flex-col justify-between">
                <div className="space-y-6 md:space-y-8">
                   <div>
                      <p className="text-[9px] md:text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3 md:mb-4">ENDİRİM (₼)</p>
                      <input 
                        type="number" 
                        value={discount} 
                        onChange={(e) => setDiscount(Number(e.target.value))} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl py-4 md:py-5 px-5 md:px-6 font-black text-2xl md:text-3xl text-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all" 
                      />
                   </div>
                   <div className="space-y-2 md:space-y-4 pt-4 md:pt-6 border-t border-white/5">
                      <div className="flex justify-between items-end">
                         <p className="text-[10px] md:text-xs font-black text-stone-400 uppercase tracking-widest mb-1">YEKUN</p>
                         <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">{totalValue.toLocaleString()} <span className="text-xl md:text-2xl text-stone-600">₼</span></h2>
                      </div>
                   </div>
                </div>

                <div className="space-y-3 md:space-y-4 pt-8 md:pt-12">
                   <button 
                     onClick={() => handleCompleteSale(false)} 
                     className="w-full bg-amber-500 text-amber-950 py-5 md:py-7 rounded-2xl md:rounded-[2.5rem] font-black text-xl md:text-2xl hover:bg-amber-400 transition-all shadow-xl active:scale-95 uppercase tracking-widest flex items-center justify-center"
                   >
                     ÖDƏ <Wallet className="ml-3 md:ml-4 w-6 h-6 md:w-8 md:h-8" />
                   </button>
                   <button 
                     onClick={() => setShowCreditModal(true)} 
                     className="w-full bg-white/5 border border-white/10 text-white py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-sm md:text-lg hover:bg-white/10 transition-all active:scale-95 uppercase tracking-widest"
                   >
                     KREDİTLƏ SATIŞ
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 animate-in zoom-in-95 duration-1000 no-print">
          <div className="w-32 h-32 md:w-56 md:h-56 bg-green-100 text-green-500 rounded-full flex items-center justify-center border-8 md:border-[12px] border-white shadow-2xl mb-6 md:mb-10">
            <CheckCircle2 className="w-20 h-20 md:w-32 md:h-32" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-stone-900 mb-2 md:mb-3 tracking-tighter uppercase">SATIŞ BİTDİ!</h2>
          <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-10 md:mb-16">UĞURLA YADDA SAXLANILDI</p>
          
          <div className="flex flex-col sm:flex-row gap-4 md:gap-8 w-full max-w-3xl">
            <button 
              onClick={handlePrint} 
              className="flex-1 bg-white border-4 border-amber-500 text-amber-600 py-5 md:py-8 rounded-2xl md:rounded-[2rem] font-black hover:bg-amber-50 transition-all flex items-center justify-center text-lg md:text-2xl shadow-2xl active:scale-95 uppercase tracking-widest"
            >
              <Printer className="mr-3 md:mr-6 w-6 h-6 md:w-10 md:h-10" /> QƏBZ
            </button>
            <button 
              onClick={resetForm} 
              className="flex-1 bg-stone-900 text-white py-5 md:py-8 rounded-2xl md:rounded-[2rem] font-black hover:bg-black transition-all text-lg md:text-2xl shadow-2xl active:scale-95 uppercase tracking-widest"
            >
              YENİ SATIŞ
            </button>
          </div>
        </div>
      )}

      {/* MODALLAR */}
      {showCustomerSelector && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in no-print">
           <div className="bg-white rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[85vh] md:h-auto md:max-h-[90vh]">
              <div className="p-6 md:p-8 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                 <h3 className="text-xl md:text-2xl font-black text-stone-800 tracking-tighter uppercase">{isAddingNewCustomer ? 'Yeni Müştəri' : 'Müştəri Seç'}</h3>
                 <button onClick={() => { setShowCustomerSelector(false); setIsAddingNewCustomer(false); }} className="p-2 text-stone-400"><X size={24} /></button>
              </div>
              <div className="p-6 md:p-8 flex-1 overflow-y-auto scrollbar-hide">
                 {!isAddingNewCustomer ? (
                   <div className="space-y-4 md:space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="relative flex-1">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                           <input type="text" autoFocus value={customerSearchTerm} onChange={(e) => setCustomerSearchTerm(e.target.value)} placeholder="Axtar..." className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 pl-12 pr-4 font-bold text-stone-800 outline-none" />
                        </div>
                        <button onClick={() => setIsAddingNewCustomer(true)} className="bg-amber-500 text-amber-950 p-4 rounded-xl shadow-lg hover:bg-amber-400 transition-all active:scale-90"><UserPlus size={24} /></button>
                      </div>
                      <div className="space-y-2 md:space-y-3">
                         {filteredCustomers.map(c => (
                           <button key={c.id} onClick={() => selectExistingCustomer(c)} className="w-full p-4 md:p-6 bg-white border border-stone-100 rounded-2xl md:rounded-3xl hover:border-amber-400 hover:bg-amber-50/50 transition-all flex items-center justify-between shadow-sm">
                             <div className="flex items-center space-x-3 md:space-x-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-black">{c.fullName[0]}</div>
                                <div className="text-left"><p className="text-sm md:text-base font-black text-stone-800 leading-none">{c.fullName}</p><p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-widest">{c.phone}</p></div>
                             </div>
                             <ChevronRight className="text-stone-200" size={20} />
                           </button>
                         ))}
                      </div>
                   </div>
                 ) : (
                   <form onSubmit={handleQuickCreateCustomer} className="space-y-4 md:space-y-6">
                      <div className="space-y-3 md:space-y-4">
                         <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase ml-4">Tam Adı</label><input required type="text" value={newCustForm.fullName} onChange={(e) => setNewCustForm({...newCustForm, fullName: e.target.value})} placeholder="Ad Soyad" className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-6 font-bold" /></div>
                         <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase ml-4">Telefon</label><input required type="text" value={newCustForm.phone} onChange={(e) => setNewCustForm({...newCustForm, phone: e.target.value})} placeholder="050..." className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-6 font-bold" /></div>
                      </div>
                      <button type="submit" className="w-full bg-amber-500 text-amber-950 py-5 rounded-xl md:rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-lg">YADDA SAXLA</button>
                   </form>
                 )}
              </div>
           </div>
        </div>
      )}

      {showCreditModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[70] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in no-print">
            <div className="bg-white rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden h-[70vh] md:h-auto">
                <div className="p-6 md:p-8 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                    <h3 className="text-xl md:text-2xl font-black text-stone-800 tracking-tighter uppercase">KREDİT SATIŞI</h3>
                    <button onClick={() => setShowCreditModal(false)} className="p-2 text-stone-400"><X size={24} /></button>
                </div>
                <div className="p-6 md:p-8 space-y-6 md:space-y-8">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-stone-400 uppercase ml-4">İlkin Ödəniş (₼)</label>
                        <input type="number" value={creditDownPayment} onChange={(e) => setCreditDownPayment(Number(e.target.value))} className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-6 font-black text-2xl focus:ring-4 focus:ring-amber-50 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-stone-400 uppercase ml-4">Müddət (Ay)</label>
                        <div className="flex space-x-2">
                            {[3, 6, 12, 24].map(m => (
                                <button key={m} onClick={() => setCreditMonths(m)} className={`flex-1 py-3 md:py-4 rounded-xl font-black text-xs md:text-sm border-2 ${creditMonths === m ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-stone-100 text-stone-400'}`}>{m} Ay</button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => handleCompleteSale(true)} className="w-full bg-stone-900 text-white py-5 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-xl hover:bg-black transition-all shadow-xl uppercase tracking-widest">KREDİTİ TƏSDİQLƏ</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SalesModule;
