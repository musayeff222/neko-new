
import React from 'react';
import { Product, AppSettings } from '@/types';

interface LabelPrintProps {
  product: Product;
  settings: AppSettings;
}

export const LabelPrint: React.FC<LabelPrintProps> = ({ product, settings }) => {
  const { labelConfig } = settings;

  return (
    <div id="label-print" className="label-print-container" style={{
      width: `${labelConfig.width}mm`,
      height: `${labelConfig.height}mm`,
      position: 'relative',
      backgroundColor: 'white',
      color: 'black',
      overflow: 'hidden',
      pageBreakAfter: 'always',
      fontWeight: settings.labelFontWeight || '600'
    }}>
      {labelConfig.elements.map(el => (
        el.visible && (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: `${el.x}%`,
              top: `${el.y}%`,
              fontSize: `${el.fontSize}px`,
              fontWeight: el.bold ? 'bold' : 'normal',
              whiteSpace: 'nowrap',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {el.field === 'shopName' ? settings.shopName : 
             el.field === 'code' ? product.code : 
             el.field === 'weight' ? `${product.weight} gr` : 
             el.field === 'price' ? `${(Number(product.price) || 0).toLocaleString()}` : 
             el.field === 'carat' ? `${product.carat}K` : 
             el.field === 'supplier' ? product.supplier : 
             el.field === 'brilliant' ? (product.brilliant || '') : 
             el.field === 'currency' ? 'AZN' : ''}
          </div>
        )
      ))}
    </div>
  );
};
