import React from 'react';
import { ShoppingCart, Repeat, MessageCircle, Heart } from 'lucide-react';
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

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img 
          src={item.imageUrl} 
          alt={item.title} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2">
          <span className={`
            px-2 py-1 text-xs font-bold rounded-full shadow-sm
            ${isTrade ? 'bg-purple-100 text-purple-600' : 
              isFree ? 'bg-green-100 text-green-600' : 'bg-brand-100 text-brand-700'}
          `}>
            {item.type}
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
              onClick={() => onAddToCart(item)}
              className="p-2 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-500 hover:text-white transition-all shadow-sm"
              title={isTrade ? "发起交换" : "加入购物车"}
            >
              {isTrade ? <MessageCircle className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
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