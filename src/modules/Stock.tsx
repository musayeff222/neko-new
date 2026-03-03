
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Folder, 
  Edit2, 
  Trash2, 
  X, 
  Plus, 
  Image as ImageIcon, 
  Upload, 
  Camera,
  Gem,
  Search,
  Scale,
  Sparkles,
  Filter,
  Calendar,
  History,
  Save,
  Tag,
  Clock,
  ArrowLeft,
  ChevronRight,
  Info,
  Layers,
  ShoppingBag,
  Zap,
  Printer,
  Box,
  Maximize2,
  AlertCircle,
  User
} from 'lucide-react';
import { Product, ProductType, AppSettings, ProductLog, Sale } from '@/types';
import { LabelPrint } from '@/components/LabelPrint';

interface StockProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<any>>;
  settings: AppSettings;
  sales: Sale[];
}

const StockModule: React.FC<StockProps> = ({ products, setProducts, settings, sales }) => {
  const [activeFolder, setActiveFolder] = useState<ProductType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);
  
  // Təkrarlanan kod üçün xəta halları
  const [duplicateInStock, setDuplicateInStock] = useState<Product | null>(null);
  const [duplicateInSales, setDuplicateInSales] = useState<Sale | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    carat: 583,
    type: settings.productTypes[0] || '',
    supplier: settings.suppliers[0] || '',
    brilliant: '',
    weight: '' as string | number,
    price: '' as string | number,
    imageUrl: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const [autoPrint, setAutoPrint] = useState(true);
  const [bulkPricePerGram, setBulkPricePerGram] = useState<number | ''>('');
  const [bulkPrintList, setBulkPrintList] = useState<Product[]>([]);

  const [editForm, setEditForm] = useState<Partial<Product>>({});

  const handleBulkPrint = () => {
    if (!bulkPricePerGram || !activeFolder) return;
    
    const pricePerGram = Number(bulkPricePerGram);
    const productsInFolder = products.filter(p => p.type === activeFolder);
    
    // Update products in state
    const updatedProducts = products.map(p => {
      if (p.type === activeFolder) {
        const newPrice = Math.round((Number(p.weight) * pricePerGram) / 10) * 10;
        return { ...p, price: newPrice };
      }
      return p;
    });
    
    setProducts(updatedProducts);
    
    // Prepare for printing
    const printList = productsInFolder.map(p => {
      const newPrice = Math.round((Number(p.weight) * pricePerGram) / 10) * 10;
      return { ...p, price: newPrice };
    });
    
    setBulkPrintList(printList);
    
    // Trigger print
    setTimeout(() => {
      window.print();
      // Clear list after print dialog closes
      setTimeout(() => {
        setBulkPrintList([]);
        setBulkPricePerGram('');
      }, 2000);
    }, 1000);
  };

  const getPrefix = (type: string) => {
    switch (type) {
      case 'Üzük': return 'U';
      case 'Sırğa': return 'S';
      case 'Saat': return 'ST';
      case 'Sep': return 'SP';
      case 'Boyunbağı': return 'B';
      case 'Qolbaq': return 'Q';
      case 'Dəst': return 'D';
      case 'Zəncir': return 'Z';
      case 'Set': return 'SET';
      case 'Külçə': return 'K';
      default: return '';
    }
  };

  useEffect(() => {
    if (isAddingNew && !newProduct.code) {
      setNewProduct(prev => ({ ...prev, code: getPrefix(prev.type) }));
    }
  }, [newProduct.type, isAddingNew]);

  // Yalnız stokda olan (1 ədəd) məhsulları süzgəcdən keçiririk
  const activeProducts = products.filter(p => p.stockCount === 1);

  useEffect(() => {
    if (newProduct.weight !== '' && !isNaN(Number(newProduct.weight))) {
      const rawPrice = Number(newProduct.weight) * settings.pricePerGram;
      const roundedPrice = Math.round(rawPrice / 10) * 10; 
      setNewProduct(prev => ({ ...prev, price: roundedPrice }));
    } else {
      setNewProduct(prev => ({ ...prev, price: '' }));
    }
  }, [newProduct.weight, settings.pricePerGram]);

  useEffect(() => {
    const code = newProduct.code.trim().toLowerCase();
    if (!code) {
      setDuplicateInStock(null);
      setDuplicateInSales(null);
      return;
    }

    // 1. Aktiv stokda yoxla
    const inStock = activeProducts.find(p => p.code.trim().toLowerCase() === code);
    setDuplicateInStock(inStock || null);

    // 2. Satış tarixçəsində yoxla (Əgər stokda yoxdursa)
    if (!inStock) {
      const inSales = (Array.isArray(sales) ? sales : []).find(s => s.productCode.trim().toLowerCase() === code);
      setDuplicateInSales(inSales || null);
    } else {
      setDuplicateInSales(null);
    }
  }, [newProduct.code, products, sales]);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.code || !newProduct.name || duplicateInStock || duplicateInSales) return;

    const prefix = getPrefix(newProduct.type);
    let finalCode = newProduct.code.trim();
    
    // Əgər istifadəçi prefixi yazmayıbsa, biz əlavə edirik (amma adətən inputda olacaq)
    if (prefix && !finalCode.startsWith(prefix)) {
        finalCode = prefix + finalCode;
    }

    const productToAdd: Product = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      code: finalCode,
      name: newProduct.name.trim(),
      carat: Number(newProduct.carat),
      type: newProduct.type,
      supplier: newProduct.supplier,
      brilliant: newProduct.brilliant || undefined,
      weight: newProduct.weight === '' ? 0 : Number(newProduct.weight),
      price: newProduct.price === '' ? 0 : Number(newProduct.price),
      imageUrl: newProduct.imageUrl,
      supplierPrice: 0, 
      stockCount: 1, 
      purchaseDate: newProduct.purchaseDate,
      logs: [{ date: new Date().toISOString(), action: 'Sistemə əlavə edildi' }]
    };

    setProducts(prev => [productToAdd, ...prev]);
    setLastAddedProduct(productToAdd);
    
    // Trigger print if autoPrint is enabled
    if (autoPrint) {
      setTimeout(() => {
          window.print();
          // Clear after print dialog
          setTimeout(() => setLastAddedProduct(null), 2000);
      }, 1000);
    }

    setIsAddingNew(false);
    resetForm();
    setActiveFolder(productToAdd.type);
  };

  const resetForm = () => {
    const defaultType = settings.productTypes[0] || '';
    setNewProduct({
      code: getPrefix(defaultType), name: '', carat: 583,
      type: defaultType, supplier: settings.suppliers[0] || '',
      brilliant: '', weight: '', price: '', imageUrl: '',
      purchaseDate: new Date().toISOString().split('T')[0]
    });
    setDuplicateInStock(null);
    setDuplicateInSales(null);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setIsCameraOpen(true);
    } catch (err) {
      alert("Kameraya giriş icazəsi verilmədi.");
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    setIsCameraOpen(false);
  };

  const capturePhoto = (isEdit: boolean = false) => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        if (isEdit) setEditForm(prev => ({ ...prev, imageUrl: dataUrl }));
        else setNewProduct(prev => ({ ...prev, imageUrl: dataUrl }));
        stopCamera();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
          if (isEdit) setEditForm(prev => ({ ...prev, imageUrl: reader.result as string }));
          else setNewProduct(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({ ...product });
    setShowDetailModal(true);
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !editForm.code || !editForm.name) return;

    const updatedProduct: Product = { ...selectedProduct, ...editForm } as Product;
    setProducts(prev => prev.map(p => p.id === selectedProduct.id ? updatedProduct : p));
    setSelectedProduct(updatedProduct);
    alert("Məhsul məlumatları uğurla yeniləndi.");
  };

  const getFilteredProducts = () => {
    let list = activeFolder ? activeProducts.filter(p => p.type === activeFolder) : activeProducts;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p => 
        p.code.toLowerCase().includes(term) || p.name.toLowerCase().includes(term) || p.weight?.toString().includes(term)
      );
    }
    return list;
  };

  const filteredProducts = getFilteredProducts();

  if (isAddingNew) {
    return (
      <div className="flex flex-col animate-in slide-in-from-right duration-300 min-h-full">
        <div className="bg-white rounded-3xl shadow-2xl border border-stone-100 flex flex-col overflow-hidden max-h-[calc(100vh-48px)]">
            <div className="flex items-center justify-between p-4 border-b border-stone-50 bg-stone-50/30">
              <div className="flex items-center space-x-4">
                  <button onClick={() => { setIsAddingNew(false); resetForm(); }} className="p-2.5 bg-white border border-stone-200 rounded-xl text-stone-400 hover:text-stone-900 transition-all shadow-sm active:scale-95"><ArrowLeft size={18} /></button>
                  <h2 className="text-lg font-black text-stone-900 uppercase tracking-tighter leading-none">Yeni Məhsul</h2>
              </div>
            </div>

            <form id="ultraCompactForm" onSubmit={handleAddProduct} className="flex-1 p-4 md:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto scrollbar-hide">
              <div className="lg:col-span-5 space-y-3">
                <div className="relative aspect-square md:aspect-auto md:h-72 border-2 border-dashed border-stone-100 rounded-2xl bg-stone-50/50 flex items-center justify-center overflow-hidden shadow-inner">
                  {isCameraOpen ? (
                    <div className="absolute inset-0 bg-black flex flex-col">
                       <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                       <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-3 px-4">
                          <button type="button" onClick={() => capturePhoto(false)} className="bg-amber-500 text-stone-950 px-5 py-3 rounded-xl shadow-xl font-black text-[10px] uppercase flex items-center space-x-2"><Camera size={14} /> <span>FOTO ÇƏK</span></button>
                          <button type="button" onClick={stopCamera} className="bg-white/20 backdrop-blur-md text-white p-3 rounded-xl"><X size={14} /></button>
                       </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4" onClick={startCamera}>
                      {newProduct.imageUrl ? (
                        <img src={newProduct.imageUrl} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-center text-stone-200"><Camera size={48} strokeWidth={1} className="mx-auto mb-2 opacity-20" /><p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Kameranı Aç</p></div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                   <button type="button" onClick={startCamera} className="flex-1 bg-stone-900 text-white py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center space-x-2"><Camera size={14} /> <span>KAMERA</span></button>
                   <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white text-stone-600 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest border border-stone-100 flex items-center justify-center space-x-2"><Upload size={14} /> <span>YÜKLƏ</span></button>
                </div>
                <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, false)} accept="image/*" className="hidden" />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="lg:col-span-7 space-y-4">
                {/* TƏKRAR KOD XƏTASI (SATIŞDA OLAN) */}
                {duplicateInSales && (
                  <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-5 space-y-4 animate-in fade-in zoom-in-95">
                     <div className="flex items-start space-x-4">
                        <div className="bg-red-500 text-white p-2 rounded-xl"><AlertCircle size={20}/></div>
                        <div>
                           <h4 className="font-black text-red-600 text-sm uppercase tracking-tighter">BU KOD ARTIQ SATILIB!</h4>
                           <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">Bu kod tarixçədə başqa bir satışa məxsusdur.</p>
                        </div>
                     </div>
                     <div className="flex items-center space-x-4 bg-white/50 p-3 rounded-2xl border border-red-50">
                        <div className="w-16 h-16 bg-white rounded-xl border border-red-100 flex items-center justify-center overflow-hidden">
                           {duplicateInSales.imageUrl ? <img src={duplicateInSales.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-red-100"/>}
                        </div>
                        <div className="flex-1">
                           <p className="text-[10px] font-black text-stone-900 uppercase">{duplicateInSales.productName}</p>
                           <div className="flex flex-wrap gap-2 mt-1">
                              <span className="flex items-center text-[8px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded uppercase"><User size={8} className="mr-1"/> {duplicateInSales.customerName}</span>
                              <span className="flex items-center text-[8px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded uppercase"><Calendar size={8} className="mr-1"/> {new Date(duplicateInSales.date).toLocaleDateString()}</span>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* TƏKRAR KOD XƏTASI (STOKDA OLAN) */}
                {duplicateInStock && (
                  <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-5 space-y-4 animate-in fade-in zoom-in-95">
                     <div className="flex items-start space-x-4">
                        <div className="bg-amber-500 text-white p-2 rounded-xl"><AlertCircle size={20}/></div>
                        <div>
                           <h4 className="font-black text-amber-600 text-sm uppercase tracking-tighter">BU KOD STOKDA VAR!</h4>
                           <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-1">Eyni kodu təkrar istifadə etmək mümkün deyil.</p>
                        </div>
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1"><label className="text-[9px] font-black text-stone-400 uppercase ml-2">Məhsul Kodu</label><input type="text" required value={newProduct.code} onChange={(e) => setNewProduct({...newProduct, code: e.target.value})} className={`w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 font-bold text-base text-stone-800 focus:border-amber-400 outline-none ${(duplicateInStock || duplicateInSales) ? 'border-red-300 bg-red-50' : ''}`} placeholder="YZ-101" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-stone-400 uppercase ml-2">Məhsul Adı</label><input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 font-bold text-base text-stone-800 focus:border-amber-400 outline-none" placeholder="Üzük" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-stone-400 uppercase ml-2">Kateqoriya</label><select value={newProduct.type} onChange={(e) => {
                    const newType = e.target.value;
                    const oldPrefix = getPrefix(newProduct.type);
                    const newPrefix = getPrefix(newType);
                    let currentCode = newProduct.code;
                    
                    if (oldPrefix && currentCode.startsWith(oldPrefix)) {
                        currentCode = currentCode.substring(oldPrefix.length);
                    }
                    
                    setNewProduct({...newProduct, type: newType, code: newPrefix + currentCode});
                  }} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 font-bold text-base text-stone-800 outline-none cursor-pointer">{settings.productTypes.map(t => <option key={t}>{t}</option>)}</select></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-stone-400 uppercase ml-2">Tədarükçü</label><select value={newProduct.supplier} onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 font-bold text-base text-stone-800 outline-none cursor-pointer">{settings.suppliers.map(s => <option key={s}>{s}</option>)}</select></div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[9px] font-black text-stone-400 uppercase ml-2">Əyar</label>
                    <div className="flex gap-2">
                       {[583, '14K', 750, 22].map(c => (
                          <button key={c} type="button" onClick={() => setNewProduct({...newProduct, carat: typeof c === 'string' ? 14 : c})} className={`flex-1 py-3 rounded-xl font-black text-[11px] border transition-all ${ (typeof c === 'string' && newProduct.carat === 14) || newProduct.carat === c ? 'bg-amber-500 border-amber-500 text-stone-950 shadow-md' : 'bg-stone-50 border-stone-100 text-stone-400'}`}>{c}{typeof c === 'number' && c < 100 ? 'K' : ''}</button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[9px] font-black text-amber-600 uppercase ml-2">Çəki (gr)</label><div className="relative"><Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" /><input type="number" step="0.001" required value={newProduct.weight} onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})} className="w-full bg-stone-900 border-none rounded-2xl py-4 pl-12 pr-4 font-black text-2xl text-white outline-none" placeholder="0.00" /></div></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-amber-600 uppercase ml-2">Daş</label><div className="relative"><Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" /><input type="text" value={newProduct.brilliant} onChange={(e) => setNewProduct({...newProduct, brilliant: e.target.value})} className="w-full bg-stone-900 border-none rounded-2xl py-4 pl-12 pr-4 font-black text-lg text-white outline-none" placeholder="ct VS" /></div></div>
                </div>

                <div className="space-y-1 bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
                  <label className="text-[9px] font-black text-amber-500 uppercase text-center block tracking-[0.2em] mb-1">QİYMƏT</label>
                  <div className="flex items-center justify-center space-x-2"><input type="number" required value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full max-w-[200px] bg-white border-2 border-amber-200 rounded-xl py-2 px-4 font-black text-2xl text-amber-900 outline-none text-center shadow-sm" /><span className="text-lg font-black text-amber-300">₼</span></div>
                </div>

                <div className="flex items-center space-x-2 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                  <input 
                    type="checkbox" 
                    id="autoPrint" 
                    checked={autoPrint} 
                    onChange={(e) => setAutoPrint(e.target.checked)} 
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="autoPrint" className="text-[10px] font-black text-stone-600 uppercase cursor-pointer select-none">Avtomatik Etiket Çapı</label>
                </div>

                <div className="flex space-x-4 pt-1">
                   <button type="button" onClick={() => { setIsAddingNew(false); resetForm(); }} className="flex-1 py-4 rounded-xl font-black text-stone-400 uppercase text-[10px] border border-stone-200 hover:bg-stone-50 transition-all tracking-widest">İMTİNA</button>
                   <button 
                    type="button"
                    onClick={() => {
                      // We need to construct a temporary product object to print
                      const tempProduct: Product = {
                        id: 'temp',
                        code: newProduct.code,
                        name: newProduct.name,
                        carat: Number(newProduct.carat),
                        type: newProduct.type,
                        supplier: newProduct.supplier,
                        brilliant: newProduct.brilliant || undefined,
                        weight: newProduct.weight === '' ? 0 : Number(newProduct.weight),
                        price: newProduct.price === '' ? 0 : Number(newProduct.price),
                        imageUrl: newProduct.imageUrl,
                        supplierPrice: 0,
                        stockCount: 1,
                        purchaseDate: newProduct.purchaseDate,
                        logs: []
                      };
                      setLastAddedProduct(tempProduct);
                      setTimeout(() => {
                        window.print();
                        setTimeout(() => setLastAddedProduct(null), 2000);
                      }, 1000);
                    }}
                    className="flex-1 py-4 rounded-xl font-black text-amber-600 uppercase text-[10px] border border-amber-200 hover:bg-amber-50 transition-all tracking-widest flex items-center justify-center"
                   >
                     <Tag className="mr-2 w-4 h-4" /> ÇAP ET
                   </button>
                   <button 
                    form="ultraCompactForm" 
                    type="submit" 
                    disabled={!!duplicateInStock || !!duplicateInSales}
                    className={`flex-[2] py-4 rounded-xl font-black uppercase text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center border-b-4 tracking-widest ${ (duplicateInStock || duplicateInSales) ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed' : 'bg-amber-500 text-stone-950 border-amber-700 hover:bg-amber-400'}`}
                   >
                     <Save className="mr-2 w-4 h-4" /> YADDA SAXLA
                   </button>
                </div>
              </div>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-sm">
          <button onClick={() => {setActiveFolder(null); setSearchTerm('');}} className={`font-black uppercase tracking-tighter ${!activeFolder ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>Stok</button>
          {activeFolder && <><span className="text-stone-300">/</span><span className="text-stone-800 font-black uppercase tracking-tighter">{activeFolder}</span></>}
        </div>
        <button onClick={() => { setDuplicateInStock(null); setDuplicateInSales(null); setIsAddingNew(true); }} className="w-full sm:w-auto bg-stone-900 text-amber-500 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all flex items-center justify-center shadow-xl"><Plus className="w-5 h-5 mr-2" /> Yeni Məhsul</button>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5 group-focus-within:text-amber-500 transition-colors" />
        <input type="text" placeholder="Kod və ya çəki ilə axtarış..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border-2 border-stone-100 rounded-2xl md:rounded-[2.5rem] py-5 md:py-6 pl-16 pr-6 focus:ring-8 focus:ring-amber-50 outline-none shadow-xl text-sm font-bold" />
      </div>

      {!activeFolder && !searchTerm ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
          {settings.productTypes.map((type) => {
            const countInStock = activeProducts.filter(p => p.type === type).length;
            return (
              <button key={type} onClick={() => setActiveFolder(type)} className="bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-sm hover:shadow-2xl hover:border-amber-300 transition-all flex flex-col items-center group relative overflow-hidden">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-stone-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 group-hover:bg-amber-50 transition-all"><Folder className="w-8 h-8 md:w-10 md:h-10" /></div>
                <h4 className="font-black text-stone-800 text-xs md:text-sm uppercase tracking-tighter">{type}</h4>
                <p className={`text-[10px] mt-1 font-bold ${countInStock > 0 ? 'text-amber-600' : 'text-stone-300'}`}>{countInStock} Çeşid</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {activeFolder && (
            <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                  <Printer size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Toplu Qiymət & Çap</h3>
                  <p className="text-[10px] font-bold text-stone-400 uppercase mt-1">Bütün "{activeFolder}" kateqoriyası üçün</p>
                </div>
              </div>
              
              <div className="flex flex-1 max-w-md items-center space-x-3">
                <div className="relative flex-1">
                  <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                  <input 
                    type="number" 
                    placeholder="1 qr Qiyməti (₼)" 
                    value={bulkPricePerGram}
                    onChange={(e) => setBulkPricePerGram(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-3 pl-10 pr-4 font-black text-sm outline-none focus:border-amber-400 transition-all"
                  />
                </div>
                <button 
                  onClick={handleBulkPrint}
                  disabled={!bulkPricePerGram}
                  className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center space-x-2 ${bulkPricePerGram ? 'bg-stone-900 text-amber-500 hover:bg-black' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`}
                >
                  <Zap size={16} />
                  <span>Toplu Çap Et</span>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Şəkil</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Kod</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Məhsul Adı</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Çəki</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Qiymət</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredProducts.map((p) => (
                  <tr key={p.id} onClick={() => openDetailModal(p)} className="hover:bg-amber-50/20 transition-all group cursor-pointer">
                    <td className="px-8 py-5">{p.imageUrl ? <img src={p.imageUrl} className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-md" /> : <div className="w-14 h-14 rounded-xl bg-stone-50 flex items-center justify-center text-stone-200"><ImageIcon size={24} /></div>}</td>
                    <td className="px-8 py-5 font-black text-stone-500 text-xs uppercase tracking-widest">{p.code}</td>
                    <td className="px-8 py-5"><p className="font-black text-stone-800 text-sm uppercase leading-none">{p.name}</p>{p.brilliant && <p className="text-[10px] text-amber-600 font-bold mt-1.5 flex items-center"><Gem size={12} className="mr-1.5"/> {p.brilliant}</p>}</td>
                    <td className="px-8 py-5 font-black text-stone-900 text-sm text-center">{p.weight} gr</td>
                    <td className="px-8 py-5 text-stone-900 font-black text-right text-xl tracking-tighter">{(Number(p.price) || 0).toLocaleString()} ₼</td>
                    <td className="px-8 py-5 text-center"><button onClick={(e) => { e.stopPropagation(); openDetailModal(p); }} className="p-4 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-2xl transition-all shadow-sm"><Edit2 size={20} /></button></td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && <tr><td colSpan={6} className="px-10 py-20 text-center"><p className="text-stone-300 font-black uppercase text-xs tracking-widest">Məlumat tapılmadı</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95">
            <header className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter">Redaktə: {selectedProduct.code}</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 text-stone-300 hover:text-stone-900 transition-colors"><X size={24} /></button>
            </header>
            <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
               <form id="fullEditForm" onSubmit={handleUpdateProduct} className="space-y-8">
                  <div className="flex flex-col items-center space-y-4">
                    <div onClick={() => (editForm.imageUrl || selectedProduct.imageUrl) && setZoomedImage(editForm.imageUrl || selectedProduct.imageUrl || null)} className="relative w-48 h-48 border-4 border-dashed border-stone-100 rounded-[2rem] bg-stone-50 flex items-center justify-center overflow-hidden cursor-zoom-in group">{editForm.imageUrl || selectedProduct.imageUrl ? <img src={editForm.imageUrl || selectedProduct.imageUrl} className="w-full h-full object-contain p-4" /> : <ImageIcon size={48} className="text-stone-200" />}</div>
                    <button type="button" onClick={() => editFileInputRef.current?.click()} className="bg-stone-100 px-6 py-2 rounded-xl text-[10px] font-black text-stone-600 hover:bg-amber-100 transition-all uppercase">Şəkli Dəyiş</button>
                    <input type="file" ref={editFileInputRef} onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase ml-2">Ad</label><input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-black text-stone-800 outline-none" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase ml-2">Çəki (gr)</label><input type="number" step="0.001" value={editForm.weight || ''} onChange={(e) => setEditForm({...editForm, weight: Number(e.target.value)})} className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-black text-stone-800 outline-none" /></div>
                       <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-amber-600 uppercase ml-2">Qiymət (₼)</label><input type="number" value={editForm.price || ''} onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})} className="w-full bg-amber-50 border-2 border-amber-200 rounded-xl py-6 px-6 font-black text-4xl text-amber-900 text-center outline-none" /></div>
                  </div>
               </form>
            </main>
            <footer className="px-8 py-6 border-t border-stone-100 bg-stone-50/50 flex space-x-4">
              <button 
                type="button" 
                onClick={() => {
                  setLastAddedProduct(selectedProduct);
                  setTimeout(() => {
                    window.print();
                    setTimeout(() => setLastAddedProduct(null), 2000);
                  }, 1000);
                }} 
                className="px-6 py-4 bg-white border border-stone-200 rounded-xl font-black text-stone-600 hover:bg-stone-50 transition-all uppercase text-[10px] flex items-center"
              >
                <Tag className="mr-2 w-4 h-4" /> ETİKET ÇAP ET
              </button>
              <button type="button" onClick={() => setShowDetailModal(false)} className="flex-1 px-8 py-4 rounded-xl font-black text-stone-400 uppercase tracking-widest text-[11px] border border-stone-200 hover:bg-white transition-all">Ləğv Et</button>
              <button form="fullEditForm" type="submit" className="flex-[2] px-8 py-4 bg-amber-500 text-stone-950 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl">Yadda Saxla</button>
            </footer>
          </div>
        </div>
      )}

      {zoomedImage && <div className="fixed inset-0 bg-stone-950/95 z-[110] flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomedImage(null)}><img src={zoomedImage} className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in zoom-in-95" alt="Zoomed product" /></div>}
      
      {/* LABEL PRINT CONTAINER (PORTAL) */}
      {(lastAddedProduct || bulkPrintList.length > 0) && createPortal(
        <div id="label-print" className="bg-white">
          {bulkPrintList.length > 0 ? (
            bulkPrintList.map((p, idx) => (
              <div key={p.id} className={idx < bulkPrintList.length - 1 ? 'label-page-break' : ''}>
                <LabelPrint product={p} settings={settings} />
              </div>
            ))
          ) : (
            <LabelPrint product={lastAddedProduct} settings={settings} />
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default StockModule;
