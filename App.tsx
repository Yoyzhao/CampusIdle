
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ItemCard } from './components/ItemCard';
import { ListingForm } from './components/ListingForm';
import { MarketStats } from './components/MarketStats';
import { AuthModal } from './components/AuthModal';
import { Item, Category, ItemType, CartItem, User } from './types';
import { Trash2, Loader2, Database } from 'lucide-react';
import { authService } from './services/authService';
import { api } from './services/api';

export default function App() {
  const [view, setView] = useState<'market' | 'sell' | 'cart'>('market');
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<Category | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize Data and Auth
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        // 1. 加载商品列表 (from Local DB)
        const allItems = await api.getItems();
        setItems(allItems);

        // 2. 恢复用户会话
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Initialization critical failure:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // 刷新商品列表辅助函数
  const refreshItems = async () => {
    try {
      const allItems = await api.getItems();
      setItems(allItems);
    } catch (e) {
      console.error("Failed to refresh items", e);
    }
  };

  // Protected Action Handler
  const requireAuth = (action: () => void) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    action();
  };

  const handleLogin = async (username: string) => {
    try {
      const user = await authService.login(username);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRegister = async (username: string) => {
    try {
      const user = await authService.register(username);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setView('market');
  };

  const handleViewChange = (newView: 'market' | 'sell' | 'cart') => {
    if (newView === 'sell' || newView === 'cart') {
      requireAuth(() => setView(newView));
    } else {
      setView(newView);
    }
  };

  const addToCart = (item: Item) => {
    requireAuth(async () => {
      if (!currentUser) return;

      if (currentUser.id === item.sellerId) {
        alert('不能添加自己的物品哦');
        return;
      }

      // Check duplications locally
      if (currentUser.cart.some(c => c.id === item.id)) {
        alert('该物品已经在购物车里了');
        return;
      }

      const newItem: CartItem = { ...item, cartId: Math.random().toString() };
      const updatedUser = {
        ...currentUser,
        cart: [...currentUser.cart, newItem]
      };
      
      await authService.updateUser(updatedUser);
      setCurrentUser(updatedUser);
      
      if (item.type === ItemType.SELL) {
        alert('已加入购物车！');
      } else {
        alert('这是一个交换/赠送物品，已添加到您的清单方便联络！');
      }
    });
  };

  const toggleLike = (item: Item) => {
    requireAuth(async () => {
      if (!currentUser) return;
      
      const isLiked = currentUser.likes.includes(item.id);
      let newLikesList;
      let newItemLikesCount = item.likes;

      if (isLiked) {
        newLikesList = currentUser.likes.filter(id => id !== item.id);
        newItemLikesCount = Math.max(0, item.likes - 1);
      } else {
        newLikesList = [...currentUser.likes, item.id];
        newItemLikesCount = item.likes + 1;
      }

      // 1. Update User (API)
      const updatedUser = { ...currentUser, likes: newLikesList };
      setCurrentUser(updatedUser);
      // Non-blocking update
      authService.updateUser(updatedUser);

      // 2. Update Item (API)
      const updatedItem = { ...item, likes: newItemLikesCount };
      await api.updateItemLikes(item.id, newItemLikesCount);
      
      // Optimistic update for UI
      setItems(prevItems => prevItems.map(i => i.id === item.id ? updatedItem : i));
    });
  };

  const removeFromCart = async (cartId: string) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      cart: currentUser.cart.filter(i => i.cartId !== cartId)
    };
    setCurrentUser(updatedUser);
    await authService.updateUser(updatedUser);
  };

  const handleAddItem = async (newItemData: Omit<Item, 'id' | 'createdAt' | 'likes' | 'sellerName' | 'sellerId'>) => {
    if (!currentUser) return;

    const item: Item = {
      ...newItemData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      likes: 0,
      sellerId: currentUser.id,
      sellerName: currentUser.username
    };

    await api.addItem(item);
    await refreshItems();
    setView('market');
  };

  // Filter Logic
  const filteredItems = filter === 'ALL' ? items : items.filter(i => i.category === filter);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-brand-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">正在启动本地数据库...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12">
      <Navbar 
        view={view} 
        setView={handleViewChange} 
        currentUser={currentUser}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* MARKET VIEW */}
        {view === 'market' && (
          <div className="space-y-8">
            {/* Header / Filter */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-brand-50">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  好物集市 <span className="text-brand-500 ml-2">Marketplace</span>
                </h1>
                <p className="text-gray-500 text-sm flex items-center mt-1">
                  <Database className="w-3 h-3 mr-1 text-green-500" />
                  本地数据库运行中 
                  {currentUser ? ` • Hi, ${currentUser.username}` : ''}
                </p>
              </div>
              
              <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                {Object.values(Category).map(c => (
                  <button
                    key={c}
                    onClick={() => setFilter(c)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      filter === c ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <MarketStats items={items} />

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(item => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  isLiked={currentUser?.likes.includes(item.id) || false}
                  onAddToCart={addToCart} 
                  onToggleLike={toggleLike}
                />
              ))}
            </div>
            
            {filteredItems.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <p>该分类下暂时没有物品哦~</p>
              </div>
            )}
          </div>
        )}

        {/* SELL VIEW */}
        {view === 'sell' && currentUser && (
          <ListingForm onAddItem={handleAddItem} onCancel={() => setView('market')} />
        )}

        {/* CART VIEW */}
        {view === 'cart' && currentUser && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-brand-400 w-2 h-8 rounded mr-3"></span>
              我的购物车 ({currentUser.cart.length})
            </h2>
            
            {currentUser.cart.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center text-gray-500 border border-dashed border-gray-300">
                <p className="mb-4">购物车空空如也</p>
                <button 
                  onClick={() => setView('market')}
                  className="px-6 py-2 bg-brand-500 text-white rounded-full font-bold hover:bg-brand-600 transition-colors"
                >
                  去逛逛
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  {currentUser.cart.map((item) => (
                    <li key={item.cartId} className="p-6 flex items-center hover:bg-gray-50 transition-colors">
                      <img src={item.imageUrl} alt={item.title} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                      <div className="ml-6 flex-1">
                        <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                           <span className="text-brand-600 font-bold">¥{item.price}</span>
                           <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">卖家: {item.sellerName}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.cartId)}
                        className="p-3 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="p-6 bg-brand-50 border-t border-brand-100 flex justify-between items-center">
                  <div className="text-gray-600">
                    总计: <span className="text-2xl font-bold text-brand-600">¥{currentUser.cart.reduce((sum, item) => sum + item.price, 0)}</span>
                  </div>
                  <button 
                    onClick={async () => {
                        if (!currentUser) return;
                        const emptyCartUser = { ...currentUser, cart: [] };
                        await authService.updateUser(emptyCartUser);
                        setCurrentUser(emptyCartUser);
                        alert('结算成功！已通知卖家发货。');
                    }}
                    className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 shadow-lg transform transition hover:-translate-y-0.5"
                  >
                    立即结算
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
