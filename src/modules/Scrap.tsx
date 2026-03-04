
import React, { useState, useRef } from 'react';
import { 
  Flame, 
  History, 
  TrendingUp, 
  Save, 
  User, 
  Scale, 
  Wallet, 
  CheckCircle2, 
  Camera, 
  X, 
  Image as ImageIcon,
  Phone,
  CreditCard,
  UserSquare2,
  PlusCircle,
  Trash2,
  Fingerprint,
  Box,
  LayoutGrid,
  ClipboardList
} from 'lucide-react';
import { ScrapGold, ScrapPhone, ScrapItem } from '@/types';

interface ScrapProps {
  scraps: ScrapGold[];
  setScraps: React.Dispatch<React.SetStateAction<any>>;
}

const ScrapModule: React.FC<ScrapProps> = ({ scraps, setScraps }) => {
  const [activeTab, setActiveTab] = useState<'purchase' | 'history'>('purchase');
  const [form, setForm] = useState({
    customer: '',
    idCardFin: '',
    phones: [{ number: '', owner: '' }] as ScrapPhone[],
    items: [{ name: '', weight: 0, carat: 583, image: '' }] as ScrapItem[],
    personImage: '',
    idCardImage: '',
    pricePerGram: 0
  });

  const [activeCamera, setActiveCamera] = useState<{ type: string; index?: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async (type: string, index?: number) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setActiveCamera({ type, index });
    } catch (err) {
      alert("Kameraya giriş icazəsi verilmlədi.");
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    setActiveCamera(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && activeCamera) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        
        if (activeCamera.type === 'item' && activeCamera.index !== undefined) {
          const newItems = [...form.items];
          newItems[activeCamera.index].image = dataUrl;
          setForm({ ...form, items: newItems });
        } else {
          setForm(prev => ({ ...prev, [`${activeCamera.type}Image`]: dataUrl }));
        }
        stopCamera();
      }
    }
  };

  const addPhone = () => setForm({ ...form, phones: [...form.phones, { number: '', owner: '' }] });
  const removePhone = (idx: number) => setForm({ ...form, phones: form.phones.filter((_, i) => i !== idx) });
  
  const addItem = () => setForm({ ...form, items: [...form.items, { name: '', weight: 0, carat: 583, image: '' }] });
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const updatePhone = (idx: number, field: keyof ScrapPhone, val: string) => {
    const newPhones = [...form.phones];
    newPhones[idx][field] = val;
    setForm({ ...form, phones: newPhones });
  };

  const updateItem = (idx: number, field: keyof ScrapItem, val: any) => {
    const newItems = [...form.items];
    (newItems[idx] as any)[field] = val;
    setForm({ ...form, items: newItems });
  };

  const totalWeight = form.items.reduce((acc, item) => acc + (Number(item.weight) || 0), 0);
  const totalPrice = totalWeight * form.pricePerGram;

  const handleSave = () => {
    if (!form.customer || form.phones[0].number === '' || totalWeight <= 0 || form.pricePerGram <= 0) {
        alert("Zəhmət olmasa məcburi sahələri (Müştəri, Nömrə, Malın Çəkisi, Qram Qiyməti) daxil edin.");
        return;
    }
    
    const newScrap: ScrapGold = {
      id: Math.random().toString(36).substr(2, 9),
      customerName: form.customer,
      idCardFin: form.idCardFin,
      phones: form.phones,
      items: form.items,
      pricePerGram: form.pricePerGram,
      totalPrice: totalPrice,
      personImage: form.personImage,
      idCardImage: form.idCardImage,
      isMelted: false,
      date: new Date().toISOString()
    };
    
    setScraps([newScrap, ...scraps]);
    setForm({ customer: '', idCardFin: '', phones: [{ number: '', owner: '' }], items: [{ name: '', weight: 0, carat: 583, image: '' }], personImage: '', idCardImage: '', pricePerGram: 0 });
    alert("Hurda alışı uğurla qeydə alındı.");
    setActiveTab('history');
  };

  return (
    <div className="flex flex-col space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-10">
      
      {/* ÜST TAB NAVİQASİYA */}
      <div className="flex justify-center">
        <div className="bg-white p-2 rounded-[2rem] shadow-xl border border-stone-100 flex space-x-2">
          <button 
            onClick={() => setActiveTab('purchase')}
            className={`px-8 md:px-12 py-3 md:py-4 rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-widest transition-all flex items-center space-x-3 ${activeTab === 'purchase' ? 'bg-stone-900 text-amber-500 shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            <PlusCircle size={20} />
            <span>ALİŞ SƏHİFƏSİ</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-8 md:px-12 py-3 md:py-4 rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-widest transition-all flex items-center space-x-3 ${activeTab === 'history' ? 'bg-stone-900 text-amber-500 shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            <History size={20} />
            <span>SON ALIŞLAR</span>
          </button>
        </div>
      </div>

      {activeTab === 'purchase' ? (
        /* ALİŞ SƏHİFƏSİ (FORM) */
        <div className="max-w-4xl mx-auto w-full animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white rounded-[3rem] border border-stone-200 shadow-2xl p-6 md:p-12 space-y-12">
            
            <header className="flex items-center space-x-4">
               <div className="w-14 h-14 bg-amber-500 text-stone-950 rounded-2xl flex items-center justify-center shadow-lg">
                  <Flame size={32} />
               </div>
               <div>
                  <h2 className="text-2xl md:text-3xl font-black text-stone-900 uppercase tracking-tighter">Yeni Hurda Qeydiyyatı</h2>
                  <p className="text-[10px] md:text-xs font-bold text-stone-500 uppercase tracking-widest mt-1">Sənədləri və malları dəqiq daxil edin</p>
               </div>
            </header>

            {/* Müştəri və Vəsiqə */}
            <section className="space-y-6">
              <div className="flex items-center space-x-3 text-stone-400">
                 <User size={18} />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">1. Müştəri & Şəxsiyyət Sənədi</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-600 uppercase ml-4">Tam Ad Soyad</label>
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5 group-focus-within:text-amber-600 transition-colors" />
                      <input type="text" value={form.customer} onChange={(e) => setForm({...form, customer: e.target.value})} className="w-full bg-white border-2 border-stone-300 rounded-2xl py-4 pl-14 pr-6 font-bold text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 transition-all" placeholder="Məs: Əli Vəliyev" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-600 uppercase ml-4">Vəsiqə FİN Kodu</label>
                    <div className="relative group">
                      <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5 group-focus-within:text-amber-600 transition-colors" />
                      <input type="text" value={form.idCardFin} onChange={(e) => setForm({...form, idCardFin: e.target.value.toUpperCase()})} className="w-full bg-white border-2 border-stone-300 rounded-2xl py-4 pl-14 pr-6 font-black uppercase tracking-[0.3em] text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 transition-all" placeholder="ABC1234" maxLength={7} />
                    </div>
                 </div>
              </div>
            </section>

            {/* Dinamik Telefonlar */}
            <section className="space-y-6">
               <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3 text-stone-400">
                    <Phone size={18} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">2. Əlaqə Nömrələri</p>
                  </div>
                  <button onClick={addPhone} className="bg-amber-100 text-amber-700 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-amber-200 transition-all shadow-sm">
                     <PlusCircle size={16} className="mr-2" /> Nömrə Əlavə Et
                  </button>
               </div>
               <div className="grid grid-cols-1 gap-4">
                  {form.phones.map((p, idx) => (
                     <div key={idx} className="flex flex-col md:flex-row gap-4 md:items-center bg-stone-100 p-4 rounded-3xl border border-stone-200 animate-in slide-in-from-left-4 duration-300">
                        <div className="flex-1 relative group">
                           <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 w-4 h-4 group-focus-within:text-amber-600" />
                           <input type="text" value={p.number} onChange={(e) => updatePhone(idx, 'number', e.target.value)} placeholder="050-000-00-00" className="w-full bg-white border-2 border-stone-300 rounded-xl py-3 pl-12 text-sm font-black text-stone-900 placeholder:text-stone-400" />
                        </div>
                        <div className="flex-1 relative group">
                           <UserSquare2 className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 w-4 h-4 group-focus-within:text-amber-600" />
                           <input type="text" value={p.owner} onChange={(e) => updatePhone(idx, 'owner', e.target.value)} placeholder="Nömrə kimə aiddir? (Məs: Özü)" className="w-full bg-white border-2 border-stone-300 rounded-xl py-3 pl-12 text-sm font-bold text-stone-900 placeholder:text-stone-400" />
                        </div>
                        {idx > 0 && (
                          <button onClick={() => removePhone(idx)} className="p-3 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20} /></button>
                        )}
                     </div>
                  ))}
               </div>
            </section>

            {/* Dinamik Mallar */}
            <section className="space-y-6">
               <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3 text-stone-400">
                    <Box size={18} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">3. Malların Siyahısı</p>
                  </div>
                  <button onClick={addItem} className="bg-stone-950 text-amber-500 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-black transition-all shadow-lg">
                     <PlusCircle size={16} className="mr-2" /> Mal Əlavə Et
                  </button>
               </div>
               <div className="grid grid-cols-1 gap-6">
                  {form.items.map((item, idx) => (
                     <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-amber-50 p-6 rounded-[2.5rem] border-2 border-amber-200 relative group animate-in zoom-in-95 duration-300">
                        {idx > 0 && (
                           <button onClick={() => removeItem(idx)} className="absolute -top-3 -right-3 w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 z-10 border-4 border-white"><X size={20}/></button>
                        )}
                        
                        {/* Malın Şəkli */}
                        <div className="md:col-span-4">
                           <button 
                            onClick={() => startCamera('item', idx)}
                            className="w-full aspect-square bg-white rounded-[2rem] border-4 border-dashed border-amber-300 flex flex-col items-center justify-center overflow-hidden relative group/img shadow-md hover:border-amber-500 transition-all"
                           >
                              {item.image ? (
                                 <img src={item.image} className="w-full h-full object-cover" />
                              ) : (
                                 <>
                                   <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-3 group-hover/img:scale-110 transition-transform">
                                      <Camera size={32} className="text-amber-600" />
                                   </div>
                                   <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">ŞƏKİL ÇƏK</span>
                                 </>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all">
                                 <Camera className="text-white w-10 h-10" />
                              </div>
                           </button>
                        </div>

                        <div className="md:col-span-8 space-y-5 flex flex-col justify-center">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-stone-700 uppercase ml-4">Malın Adı / Təsviri</label>
                              <input type="text" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} placeholder="Məs: Qızıl qolbaq (qırılmış)" className="w-full bg-white border-2 border-stone-300 rounded-2xl py-4 px-6 text-sm font-black text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-stone-700 uppercase ml-4">Çəki (gr)</label>
                                 <div className="relative group">
                                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 w-5 h-5 group-focus-within:text-amber-600" />
                                    <input type="number" step="0.001" value={item.weight || ''} onChange={(e) => updateItem(idx, 'weight', Number(e.target.value))} className="w-full bg-stone-950 text-amber-500 border-none rounded-2xl py-4 pl-12 pr-4 font-black text-xl" placeholder="0.000" />
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-stone-700 uppercase ml-4">Əyar</label>
                                 <select value={item.carat} onChange={(e) => updateItem(idx, 'carat', Number(e.target.value))} className="w-full bg-white border-2 border-stone-300 rounded-2xl py-4 px-4 font-black text-base text-stone-900 outline-none cursor-pointer">
                                    <option value={583}>14K / 583</option>
                                    <option value={750}>18K / 750</option>
                                    <option value={22}>22K</option>
                                    <option value={24}>24K</option>
                                 </select>
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            {/* Digər Sənədlər (Şəxs və Vəsiqə) */}
            <section className="space-y-6">
               <div className="flex items-center space-x-3 text-stone-400">
                 <CreditCard size={18} />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">4. Şəxs və Vəsiqə Foto</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: 'person', label: 'ŞƏXİN ŞƏKİLİ', icon: UserSquare2 },
                    { key: 'idCard', label: 'VƏSİQƏ ŞƏKİLİ', icon: CreditCard }
                  ].map(it => (
                    <button 
                      key={it.key}
                      onClick={() => startCamera(it.key)}
                      className="flex items-center justify-between p-6 bg-stone-100 border-2 border-stone-300 rounded-[2rem] hover:border-amber-500 hover:bg-amber-50 transition-all text-left group"
                    >
                      <div className="flex items-center space-x-5">
                        <div className="w-16 h-16 bg-white rounded-2xl border-2 border-stone-300 flex items-center justify-center overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                           {form[`${it.key}Image` as keyof typeof form] ? (
                             <img src={form[`${it.key}Image` as keyof typeof form] as string} className="w-full h-full object-cover" />
                           ) : <it.icon size={28} className="text-stone-400" />}
                        </div>
                        <div>
                           <p className="text-sm font-black text-stone-900 uppercase tracking-widest leading-none">{it.label}</p>
                           <p className="text-[9px] font-bold text-stone-500 mt-2 uppercase">Kliklə və Şəkil Çək</p>
                        </div>
                      </div>
                      <Camera size={20} className="text-stone-400 group-hover:text-amber-600 transition-colors" />
                    </button>
                  ))}
               </div>
            </section>

            {/* Qram Qiyməti və Yekun Bölməsi */}
            <section className="bg-stone-950 text-white rounded-[3rem] p-8 md:p-12 space-y-10 relative overflow-hidden shadow-2xl border border-white/5">
               <div className="absolute top-0 right-0 w-64 h-64 gold-gradient opacity-[0.05] rounded-full blur-[100px] -mr-32 -mt-32"></div>
               
               <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                  <div className="w-full md:w-1/2 space-y-3">
                     <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.4em] mb-2 ml-4">1 qr ALİŞ QİYMƏTİ (₼)</p>
                     <div className="relative group">
                        <Wallet className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-600 w-8 h-8 group-focus-within:text-amber-500 transition-colors" />
                        <input 
                          type="number" 
                          value={form.pricePerGram || ''} 
                          onChange={(e) => setForm({...form, pricePerGram: Number(e.target.value)})} 
                          className="w-full bg-white/5 border-2 border-white/10 rounded-[2rem] py-6 pl-18 pr-6 text-4xl font-black text-amber-500 placeholder:text-stone-700 outline-none focus:bg-white/10 focus:border-amber-500/50 transition-all" 
                          placeholder="0.00" 
                        />
                     </div>
                  </div>
                  
                  <div className="text-center md:text-right flex flex-col items-center md:items-end">
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.5em] mb-3">YEKUN ÖDƏNİLƏCƏK MƏBLƏĞ</p>
                     <div className="flex items-baseline space-x-3">
                        <h4 className="text-5xl md:text-7xl font-black text-amber-500 tracking-tighter leading-none">
                           {totalPrice.toLocaleString()}
                        </h4>
                        <span className="text-3xl font-bold text-amber-700">₼</span>
                     </div>
                     <div className="inline-flex items-center bg-white/5 px-5 py-2 rounded-full border border-white/5 mt-6">
                        <Scale size={14} className="mr-3 text-stone-500" />
                        <span className="text-[11px] font-black text-stone-300 uppercase tracking-widest">{totalWeight.toFixed(3)} qr CƏMİ</span>
                     </div>
                  </div>
               </div>

               <button 
                onClick={handleSave} 
                className="w-full bg-amber-500 text-stone-950 py-6 md:py-8 rounded-[2.5rem] font-black text-xl md:text-2xl hover:bg-amber-400 hover:scale-[1.01] transition-all shadow-2xl active:scale-95 uppercase tracking-[0.3em] flex items-center justify-center border-b-[8px] border-amber-700 mt-6"
               >
                 <CheckCircle2 className="w-8 h-8 mr-6" /> ALIŞI TƏSDİQLƏ VƏ BİTİR
               </button>
            </section>
          </div>
        </div>
      ) : (
        /* SON ALIŞLAR (TARİXÇƏ VƏ STATİSTİKA) */
        <div className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-8 duration-500 max-w-7xl mx-auto w-full">
          
          {/* STATİSTİKA KARTLARI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-stone-950 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 gold-gradient opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex justify-between items-start mb-6">
                   <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest relative z-10">Ümumi Hurda Çəkisi</p>
                   <Scale className="text-amber-500/20 w-10 h-10" />
                </div>
                <h4 className="text-4xl font-black text-amber-500 tracking-tighter relative z-10">
                  {scraps.reduce((acc,s) => acc + s.items.reduce((a,i)=>a+i.weight, 0), 0).toFixed(2)} 
                  <span className="text-xl text-amber-800 ml-2">qr</span>
                </h4>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border-2 border-stone-200 shadow-xl flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                <div className="flex justify-between items-start mb-6">
                   <p className="text-[10px] font-black text-stone-600 uppercase tracking-widest relative z-10">Bugünkü Alışlar</p>
                   <TrendingUp className="text-amber-600/20 w-10 h-10" />
                </div>
                <h4 className="text-4xl font-black text-stone-900 tracking-tighter relative z-10">
                   {scraps.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length} 
                   <span className="text-xl text-stone-400 ml-2">ƏMƏLİYYAT</span>
                </h4>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border-2 border-stone-200 shadow-xl flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                   <p className="text-[10px] font-black text-stone-600 uppercase tracking-widest">Cəmi Ödəniş</p>
                   <Wallet className="text-red-600/20 w-10 h-10" />
                </div>
                <h4 className="text-4xl font-black text-stone-900 tracking-tighter relative z-10">
                   {scraps.reduce((acc,s) => acc + s.totalPrice, 0).toLocaleString()} 
                   <span className="text-xl text-stone-400 ml-2">₼</span>
                </h4>
             </div>
          </div>

          {/* TARİXÇƏ CƏDVƏLİ */}
          <div className="bg-white rounded-[3rem] border-2 border-stone-200 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
             <div className="p-8 md:p-10 border-b-2 border-stone-200 flex items-center justify-between bg-stone-100/50">
                <div className="flex items-center space-x-4">
                   <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shadow-inner">
                      <ClipboardList size={24} />
                   </div>
                   <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter leading-none">Alış Tarixçəsi</h3>
                </div>
                <div className="bg-white px-5 py-2 rounded-xl border-2 border-stone-200 text-[10px] font-black text-stone-600 uppercase tracking-widest">
                   Cəmi {scraps.length} qeyd
                </div>
             </div>

             <div className="overflow-x-auto flex-1 scrollbar-hide">
                <table className="w-full text-left min-w-[900px]">
                  <thead className="bg-stone-200/50 sticky top-0 z-10 border-b-2 border-stone-200">
                    <tr>
                      <th className="px-10 py-6 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em]">Müştəri & Sənəd</th>
                      <th className="px-10 py-6 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em]">Foto Arxiv</th>
                      <th className="px-10 py-6 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em]">Mallar & Çəki</th>
                      <th className="px-10 py-6 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em] text-right">Ödəniş</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-stone-100">
                    {scraps.map(s => (
                      <tr key={s.id} className="hover:bg-amber-50/40 transition-all group">
                         <td className="px-10 py-8">
                            <div className="flex flex-col space-y-2">
                              <p className="text-base font-black text-stone-950 uppercase leading-none tracking-tight">{s.customerName}</p>
                              <div className="flex items-center space-x-2">
                                 <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-widest border border-amber-200">FİN: {s.idCardFin || 'N/A'}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                 {s.phones.map((p, i) => (
                                   <span key={i} className="text-[10px] font-black bg-white text-stone-800 border-2 border-stone-200 px-2 py-1 rounded-lg uppercase shadow-sm">
                                      <Phone size={10} className="inline mr-1 text-amber-600" /> {p.number} ({p.owner})
                                   </span>
                                 ))}
                              </div>
                            </div>
                         </td>
                         <td className="px-10 py-8">
                            <div className="flex -space-x-4">
                               {[s.personImage, s.idCardImage].map((img, i) => (
                                  <div key={i} className={`w-14 h-14 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-stone-100 flex items-center justify-center transition-transform hover:scale-110 hover:z-20 ${img ? '' : 'opacity-40'}`}>
                                     {img ? <img src={img} className="w-full h-full object-cover" /> : <UserSquare2 size={24} className="text-stone-400"/>}
                                  </div>
                               ))}
                            </div>
                            <p className="text-[10px] font-black text-stone-500 mt-3 uppercase tracking-widest">{new Date(s.date).toLocaleString('az-AZ')}</p>
                         </td>
                         <td className="px-10 py-8">
                            <div className="flex flex-wrap gap-2 mb-3">
                               {s.items.map((item, i) => (
                                  <div key={i} className="group/item relative h-12 w-12 rounded-xl border-2 border-white bg-stone-100 overflow-hidden shadow-lg hover:w-20 transition-all duration-300">
                                     {item.image ? (
                                        <img src={item.image} className="h-full w-full object-cover" />
                                     ) : <Box size={16} className="m-auto text-stone-300 mt-4" />}
                                     <div className="absolute inset-0 bg-stone-950/80 opacity-0 group-hover/item:opacity-100 flex items-center justify-center transition-opacity">
                                        <span className="text-[10px] font-black text-amber-500">{item.weight}g</span>
                                     </div>
                                  </div>
                               ))}
                            </div>
                            <div className="inline-flex items-center bg-stone-900 text-white px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                               <Scale size={14} className="mr-3 text-amber-500" />
                               <span className="text-sm font-black tracking-tight">{s.items.reduce((a,it)=>a+it.weight,0).toFixed(3)} gr</span>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-right">
                            <p className="text-2xl font-black text-stone-950 tracking-tighter leading-none">{s.totalPrice.toLocaleString()} ₼</p>
                            <div className="flex items-center justify-end mt-2 space-x-2">
                               <span className="text-[10px] font-black text-stone-500 uppercase">{s.pricePerGram} ₼ / qr</span>
                               <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                               <span className="text-[10px] font-black text-amber-700 uppercase">{s.items[0]?.carat}K</span>
                            </div>
                         </td>
                      </tr>
                    ))}
                    {scraps.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-10 py-40 text-center opacity-40">
                           <div className="flex flex-col items-center space-y-6">
                              <div className="w-32 h-32 bg-stone-100 rounded-full flex items-center justify-center text-stone-200 shadow-inner animate-pulse">
                                 <Flame size={64} />
                              </div>
                              <p className="text-sm font-black uppercase tracking-[0.5em] text-stone-500">Heç bir alış tapılmadı</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* KAMERA MODALI (HƏR İKİ BÖLMƏ ÜÇÜN ORTAQ) */}
      {activeCamera && (
        <div className="fixed inset-0 bg-stone-950/98 z-[150] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="w-full max-w-2xl bg-black rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10 relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-auto aspect-[4/3] object-cover" />
              <div className="absolute inset-0 border-[60px] md:border-[80px] border-black/50 pointer-events-none"></div>
              
              <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
                 <div className="bg-amber-500 text-stone-950 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center">
                    <Camera size={16} className="mr-3" /> 
                    {activeCamera.type === 'item' ? `MALIN ŞƏKİLİ (${activeCamera.index! + 1})` : activeCamera.type === 'person' ? 'ŞƏXİN ŞƏKİLİ' : 'VƏSİQƏ ŞƏKİLİ'}
                 </div>
                 <button onClick={stopCamera} className="bg-white/10 backdrop-blur-md text-white p-4 rounded-full hover:bg-white/20 transition-all border border-white/20">
                    <X size={24} />
                 </button>
              </div>

              <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center space-y-6">
                 <button onClick={capturePhoto} className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.4)] active:scale-90 transition-all group">
                    <div className="w-20 h-20 rounded-full border-4 border-black/10 flex items-center justify-center group-hover:scale-95 transition-transform">
                       <div className="w-16 h-16 bg-amber-500 rounded-full"></div>
                    </div>
                 </button>
                 <p className="text-white/70 text-[11px] font-black uppercase tracking-[0.4em]">TƏSDİQLƏMƏK ÜÇÜN BASIN</p>
              </div>
           </div>
           <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default ScrapModule;
