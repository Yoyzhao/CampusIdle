import React, { useState } from 'react';
import { ShoppingCart, Repeat, Heart } from 'lucide-react';
import { Item, ItemType } from '../types';

interface ItemCardProps {
  item: Item;
  isLiked: boolean;
  onAddToCart: (item: Item) => void;
  onToggleLike: (item: Item) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isLiked, onAddToCart, onToggleLike }) => {
  const isTrade = item.type === ItemType.TRADE;
  const isFree = item.type === ItemType.FREE;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Use imageUrls array, default to empty array if not exists
  const images = item.imageUrls || [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentImageIndex]} 
              alt={item.title} 
              loading="lazy" 
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
            />
            
            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Image Indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-white w-6' : 'bg-white/60'}`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`
            px-2 py-1 text-xs font-bold rounded-full shadow-sm
            ${isTrade ? 'bg-purple-100 text-purple-600' : 
              isFree ? 'bg-green-100 text-green-600' : 'bg-brand-100 text-brand-700'}
          `}>
            {item.type}
          </span>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={`
            px-2 py-1 text-xs font-bold rounded-full shadow-sm
            ${item.status === '在售' ? 'bg-green-100 text-green-600' : 
              item.status === '已售出' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
          `}>
            {item.status}
          </span>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-800 line-clamp-1 text-lg">{item.title}</h3>
        </div>
        
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">
          {item.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div>
            {isTrade ? (
              <span className="text-purple-600 font-bold text-sm flex items-center">
                <Repeat className="w-3 h-3 mr-1" />
                以物易物
              </span>
            ) : isFree ? (
              <span className="text-green-600 font-bold text-lg">
                免费
              </span>
            ) : (
              <span className="text-brand-600 font-bold text-xl">
                ¥{item.price}
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => onToggleLike(item)}
              className={`p-2 rounded-full transition-colors ${
                isLiked 
                  ? 'bg-red-50 text-red-500' 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'
              }`}
              title="收藏"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={() => {
                if (item.status === '已售出') {
                  alert('该物品已售出，无法添加到购物车');
                  return;
                }
                onAddToCart(item);
              }}
              className={`p-2 rounded-full transition-all shadow-sm ${item.status === '已售出' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-brand-50 text-brand-600 hover:bg-brand-500 hover:text-white'}`}
              title={item.status === '已售出' ? "该物品已售出" : (isTrade ? "发起交换" : "加入购物车")}
              disabled={item.status === '已售出'}
            >
              {isTrade ? <Repeat className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <div className="mt-2 flex items-center text-xs text-gray-400">
           <div className="w-5 h-5 rounded-full bg-gray-200 mr-2 overflow-hidden border border-gray-200">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.sellerName}`} alt="avatar" />
           </div>
           <span className="truncate max-w-[100px]">{item.sellerName}</span>
           <span className="mx-2">•</span>
           <span>{item.category}</span>
           {item.likes > 0 && (
             <>
                <span className="mx-2">•</span>
                <span className="text-red-400 flex items-center">
                  <Heart className="w-3 h-3 mr-0.5 fill-current" /> {item.likes}
                </span>
             </>
           )}
        </div>
      </div>
    </div>
  );
};