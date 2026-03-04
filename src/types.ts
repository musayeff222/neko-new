
export type ProductType = string;

export interface ProductLog {
  date: string;
  action: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  carat: number; // Əyar
  type: ProductType;
  supplier: string; // Tədərükçü
  brilliant?: string; // Brilliant məlumatı
  weight: number | ''; // Çəki
  supplierPrice: number;
  price: number | '';
  stockCount: number;
  imageUrl?: string;
  purchaseDate: string; // Alış tarixi
  logs: ProductLog[]; // Dəyişiklik tarixçəsi
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  title?: string; // Vəzifə və ya Status
  address?: string; // Ünvan
  cashDebt: number;
  goldDebt: number; // qram ilə
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  type: ProductType;
  customerName: string;
  price: number;
  discount: number;
  total: number;
  date: string;
  status: 'completed' | 'returned' | 'exchanged';
  returnNote?: string; // Geri qaytarılma və ya dəyişdirilmə detalları
  // Snapshot fields for history
  weight?: number;
  carat?: number;
  supplier?: string;
  brilliant?: string; // Brilliant məlumatı (tarixçə üçün)
  imageUrl?: string;
}

export interface ScrapItem {
  name: string;
  weight: number;
  carat: number;
  image: string;
}

export interface ScrapPhone {
  number: string;
  owner: string;
}

export interface ScrapGold {
  id: string;
  customerName: string;
  idCardFin: string;
  phones: ScrapPhone[];
  items: ScrapItem[];
  pricePerGram: number;
  totalPrice: number;
  personImage?: string;
  idCardImage?: string;
  isMelted: boolean;
  date: string;
}

export interface LabelElement {
  id: string;
  field: 'shopName' | 'code' | 'weight' | 'price' | 'carat' | 'supplier' | 'brilliant' | 'currency';
  x: number; // percentage
  y: number; // percentage
  fontSize: number; // px
  visible: boolean;
  bold: boolean;
}

export interface LabelConfig {
  width: number; // mm
  height: number; // mm
  elements: LabelElement[];
}

export interface AppSettings {
  deleteCode: string;
  adminPassword: string;
  printerName: string;
  shopName: string;
  productTypes: string[];
  suppliers: string[];
  carats: number[];
  pricePerGram: number; // 1 Qramın qiyməti
  labelConfig: LabelConfig;
  silentPrinting: boolean;
  receiptPrinterPath: string;
  labelPrinterPath: string;
  receiptFontWeight: string;
  labelFontWeight: string;
}

export enum Page {
  Sales = 'SALES',
  Stock = 'STOCK',
  Customers = 'CUSTOMERS',
  SoldProducts = 'SOLD_PRODUCTS',
  Return = 'RETURN',
  Scrap = 'SCRAP',
  Settings = 'SETTINGS',
  Reports = 'REPORTS',
  Chat = 'CHAT'
}
