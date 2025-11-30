
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ItemCard } from './components/ItemCard';
import { ListingForm } from './components/ListingForm';
import { MarketStats } from './components/MarketStats';
import { AuthModal } from './components/AuthModal';
import { Item, Category, ItemType, CartItem, User, ItemStatus, Transaction, TransactionStatus } from './types';
import { Trash2, Loader2, Database, Edit2, CheckCircle2, XCircle, Copy, CheckCircle, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { authService } from './services/authService';
import { api } from './services/api';

export default function App() {
  const [view, setView] = useState<'market' | 'sell' | 'cart' | 'profile'>('market');
  const [items, setItems] = useState<Item[]>([]);
  const [sellerItems, setSellerItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<Category | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSellerItemsLoading, setIsSellerItemsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Transaction State
  const [sellerTransactions, setSellerTransactions] = useState<Transaction[]>([]);
  const [buyerTransactions, setBuyerTransactions] = useState<Transaction[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
  const [copiedTransactionId, setCopiedTransactionId] = useState<string | null>(null);
  const [sellerTransactionsExpanded, setSellerTransactionsExpanded] = useState(false);
  const [buyerTransactionsExpanded, setBuyerTransactionsExpanded] = useState(false);

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

  // Ensure user has purchaseHistory array and fetch transactions when user changes
  useEffect(() => {
    if (currentUser) {
      // Ensure purchaseHistory is an array
      if (!currentUser.purchaseHistory) {
        const updatedUser = {
          ...currentUser,
          purchaseHistory: []
        };
        setCurrentUser(updatedUser);
        authService.updateUser(updatedUser);
      }
      
      // Fetch transactions when user changes
      fetchSellerTransactions();
      fetchBuyerTransactions();
    }
  }, [currentUser]);

  // Update cart items when original items change
  useEffect(() => {
    if (!currentUser) return;
    
    // Ensure cart and purchaseHistory are arrays
    const safeUser = {
      ...currentUser,
      cart: currentUser.cart || [],
      purchaseHistory: currentUser.purchaseHistory || []
    };
    
    // Update cart items with latest status from original items
    const updatedCart = safeUser.cart.map(cartItem => {
      const originalItem = items.find(item => item.id === cartItem.id);
      if (originalItem) {
        // Only update the status and other fields that might change
        return {
          ...cartItem,
          status: originalItem.status,
          title: originalItem.title,
          description: originalItem.description,
          price: originalItem.price,
          type: originalItem.type,
          category: originalItem.category,
          imageUrls: originalItem.imageUrls,
          sellerName: originalItem.sellerName,
          likes: originalItem.likes
        };
      }
      return cartItem;
    });
    
    // Only update if there are changes
    const hasChanges = JSON.stringify(updatedCart) !== JSON.stringify(safeUser.cart);
    if (hasChanges) {
      const updatedUser = {
        ...safeUser,
        cart: updatedCart
      };
      setCurrentUser(updatedUser);
      // Update user in database
      authService.updateUser(updatedUser);
    }
  }, [items, currentUser]);

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

  const handleLogin = async (username: string, password: string) => {
    try {
      const user = await authService.login(username, password);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRegister = async (username: string, password: string) => {
    try {
      const user = await authService.register(username, password);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setView('market');
  };

  const handleViewChange = (newView: 'market' | 'sell' | 'cart' | 'profile') => {
    if (newView === 'sell' || newView === 'cart' || newView === 'profile') {
      requireAuth(async () => {
        setView(newView);
        if (newView === 'profile') {
          // Show loading states
          setIsLoading(true);
          setIsSellerItemsLoading(true);
          setIsTransactionsLoading(true);
          
          try {
            // Fetch all items first to ensure we have them for transaction details
            const allItems = await api.getItems();
            setItems(allItems);
            
            // Then fetch seller-specific data
            await fetchSellerItems();
            await fetchSellerTransactions();
            await fetchBuyerTransactions();
            
            console.log('Profile data refreshed successfully:', {
              items: allItems.length,
              sellerItems: sellerItems.length,
              sellerTransactions: sellerTransactions.length,
              buyerTransactions: buyerTransactions.length
            });
          } catch (error) {
            console.error('Failed to refresh profile data:', error);
          } finally {
            // Hide loading states
            setIsLoading(false);
            setIsSellerItemsLoading(false);
            setIsTransactionsLoading(false);
          }
        }
      });
    } else {
      setView(newView);
    }
  };

  // Fetch seller's items
  const fetchSellerItems = async () => {
    if (!currentUser) return;
    
    setIsSellerItemsLoading(true);
    try {
      const items = await api.getItemsBySeller(currentUser.id);
      setSellerItems(items);
    } catch (error) {
      console.error('Failed to fetch seller items:', error);
      alert('获取发布物品失败');
    } finally {
      setIsSellerItemsLoading(false);
    }
  };

  // Fetch seller transactions (requests from buyers)
  const fetchSellerTransactions = async () => {
    if (!currentUser) return;
    
    setIsTransactionsLoading(true);
    try {
      const transactions = await api.getSellerTransactions(currentUser.id);
      console.log('Fetched seller transactions:', transactions);
      setSellerTransactions(transactions);
    } catch (error) {
      console.error('Failed to fetch seller transactions:', error);
      alert('获取交易请求失败');
    } finally {
      setIsTransactionsLoading(false);
    }
  };

  // Fetch buyer transactions (history)
  const fetchBuyerTransactions = async () => {
    if (!currentUser) return;
    
    setIsTransactionsLoading(true);
    try {
      const transactions = await api.getBuyerTransactions(currentUser.id);
      console.log('Fetched buyer transactions:', transactions);
      setBuyerTransactions(transactions);
    } catch (error) {
      console.error('Failed to fetch buyer transactions:', error);
      alert('获取交易历史失败');
    } finally {
      setIsTransactionsLoading(false);
    }
  };

  // Update item status
  const updateItemStatus = async (itemId: string, newStatus: ItemStatus) => {
    try {
      await api.updateItemStatus(itemId, newStatus);
      // Update local state
      setItems(prevItems => prevItems.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      ));
      setSellerItems(prevItems => prevItems.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      ));
    } catch (error) {
      console.error('Failed to update item status:', error);
      alert('更新物品状态失败');
    }
  };

  // Delete item (soft delete by updating status to DELETED)
  const deleteItem = async (itemId: string) => {
    if (!window.confirm('确定要删除这个物品吗？')) return;
    
    try {
      await api.updateItemStatus(itemId, ItemStatus.DELETED);
      // Update local state
      setItems(prevItems => prevItems.map(item => 
        item.id === itemId ? { ...item, status: ItemStatus.DELETED } : item
      ));
      setSellerItems(prevItems => prevItems.filter(item => item.id !== itemId));
      alert('物品已删除');
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('删除物品失败');
    }
  };

  // Handle item edit
  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setView('sell');
  };

  // Handle update item
  const handleUpdateItem = async (updatedItem: Item) => {
    try {
      await api.updateItem(updatedItem);
      // Update local state
      setItems(prevItems => prevItems.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ));
      setSellerItems(prevItems => prevItems.filter(item => item.id !== updatedItem.id));
      setEditingItem(null);
      setView('profile');
      fetchSellerItems(); // Refresh seller items
      alert('物品已更新');
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('更新物品失败');
    }
  };

  const addToCart = (item: Item) => {
    requireAuth(async () => {
      if (!currentUser) return;

      if (item.status === ItemStatus.SOLD) {
        alert('该物品已售出，无法添加到购物车');
        return;
      }

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

  // Confirm transaction request (seller action)
  const confirmTransaction = async (transactionId: string) => {
    try {
      const updatedTransaction = await api.confirmTransaction(transactionId);
      // Update local state
      setSellerTransactions(prev => prev.map(t => 
        t.id === transactionId ? updatedTransaction : t
      ));
      setBuyerTransactions(prev => prev.map(t => 
        t.id === transactionId ? updatedTransaction : t
      ));
      alert('交易已确认，交易码已生成！');
    } catch (error) {
      console.error('Failed to confirm transaction:', error);
      alert('确认交易失败');
    }
  };

  // Cancel transaction request (seller action)
  const cancelTransaction = async (transactionId: string) => {
    try {
      await api.cancelTransaction(transactionId);
      // Update local state
      setSellerTransactions(prev => prev.filter(t => t.id !== transactionId));
      setBuyerTransactions(prev => prev.map(t => 
        t.id === transactionId ? { ...t, status: TransactionStatus.CANCELLED } : t
      ));
      alert('交易已取消');
    } catch (error) {
      console.error('Failed to cancel transaction:', error);
      alert('取消交易失败');
    }
  };

  // Delete transaction record
  const deleteTransaction = async (transactionId: string) => {
    if (window.confirm('确定要删除这条交易记录吗？此操作不可恢复。')) {
      // Show loading state
      setIsTransactionsLoading(true);
      try {
        // Call API to mark as deleted for current user
        await api.deleteTransaction(transactionId, currentUser?.id);
        
        // Update local state to reflect deletion
        setSellerTransactions(prev => prev.filter(t => t.id !== transactionId));
        setBuyerTransactions(prev => prev.filter(t => t.id !== transactionId));
        
        // Show success message
        alert('交易记录已成功删除！');
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        alert('删除交易记录失败，请稍后重试。');
        
        // Force re-fetch transactions from server to ensure local state is correct
        if (currentUser) {
          fetchSellerTransactions();
          fetchBuyerTransactions();
        }
      } finally {
        // Hide loading state
        setIsTransactionsLoading(false);
      }
    }
  };

  // Complete transaction (buyer confirms receipt)
  const completeTransaction = async (transactionId: string) => {
    try {
      const updatedTransaction = await api.completeTransaction(transactionId);
      // Update local state
      setBuyerTransactions(prev => prev.map(t => 
        t.id === transactionId ? updatedTransaction : t
      ));
      setSellerTransactions(prev => prev.map(t => 
        t.id === transactionId ? updatedTransaction : t
      ));
      // Update item status to SOLD
      const transaction = [...sellerTransactions, ...buyerTransactions].find(t => t.id === transactionId);
      if (transaction) {
        await updateItemStatus(transaction.itemId, ItemStatus.SOLD);
        
        // Add item to buyer's purchase history if current user is the buyer
        if (currentUser && transaction.buyerId === currentUser.id) {
          const relatedItem = items.find(item => item.id === transaction.itemId);
          if (relatedItem) {
            const updatedUser = {
              ...currentUser,
              purchaseHistory: [...(currentUser.purchaseHistory || []), {
                ...relatedItem,
                cartId: Math.random().toString()
              }]
            };
            
            await authService.updateUser(updatedUser);
            setCurrentUser(updatedUser);
          }
        }
      }
      alert('交易已完成，感谢您的使用！');
    } catch (error) {
      console.error('Failed to complete transaction:', error);
      alert('完成交易失败');
    }
  };

  // Copy transaction code to clipboard
  const copyTransactionCode = (code: string, transactionId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTransactionId(transactionId);
    setTimeout(() => setCopiedTransactionId(null), 2000);
  };

  const handleAddItem = async (newItemData: Omit<Item, 'id' | 'createdAt' | 'likes' | 'sellerName' | 'sellerId'>) => {
    if (!currentUser) return;

    if (editingItem) {
      // Update existing item - preserve original createdAt, likes, sellerId, and sellerName
      const updatedItem: Item = {
        ...editingItem,
        ...newItemData
      };
      await handleUpdateItem(updatedItem);
    } else {
      // Add new item
      const newItem: Item = {
        ...newItemData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: Date.now(),
        likes: 0,
        sellerId: currentUser.id,
        sellerName: currentUser.username,
        status: ItemStatus.ACTIVE // Default status is 在售
      };
      await api.addItem(newItem);
      await refreshItems();
      setView('market');
    }
  };

  // Filter Logic
  const filteredItems = (filter === 'ALL' ? items : items.filter(i => i.category === filter))
    .filter(item => item.status === ItemStatus.ACTIVE || item.status === ItemStatus.SOLD) // Show active and sold items in market view, hide deleted and offline items
    .filter(item => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.sellerName.toLowerCase().includes(term)
      );
    });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-brand-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">正在连接服务器...</p>
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
              <div className="mb-4 md:mb-0 w-full md:w-auto">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  好物集市 <span className="text-brand-500 ml-2">Marketplace</span>
                </h1>
                <p className="text-gray-500 text-sm flex items-center mt-1">
              <Database className="w-3 h-3 mr-1 text-green-500" />
              服务器连接正常 
              {currentUser ? ` • Hi, ${currentUser.username}` : ''}
            </p>
              </div>
              
              {/* Search Bar */}
              <div className="w-full md:w-auto mb-4 md:mb-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜索物品、描述或卖家..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64 lg:w-80 px-4 py-2 pl-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
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
          <ListingForm 
            onAddItem={handleAddItem} 
            onCancel={() => {
              setEditingItem(null);
              setView('market');
            }} 
            initialItem={editingItem} 
          />
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
                      <img src={item.imageUrls[0] || ''} alt={item.title} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                      <div className="ml-6 flex-1">
                        <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                           <span className="text-brand-600 font-bold">¥{item.price}</span>
                           <div className="flex space-x-2">
                             <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">卖家: {item.sellerName}</span>
                             <span className={`
                               text-xs font-bold px-2 py-1 rounded-full shadow-sm
                               ${item.status === '在售' ? 'bg-green-100 text-green-600' : 
                                 item.status === '已售出' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                             `}>
                               {item.status}
                             </span>
                           </div>
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
                <div className="p-6 bg-brand-50 border-t border-brand-100">
                  <div className="flex flex-col">
                    {/* Check if all items are in ACTIVE status */}
                    {currentUser.cart.some(item => item.status !== ItemStatus.ACTIVE) && (
                      <div className="text-sm text-yellow-600 mb-2">
                        购物车中包含不可交易的物品
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="text-gray-600">
                        总计: <span className="text-2xl font-bold text-brand-600">¥{currentUser.cart.reduce((sum, item) => sum + item.price, 0)}</span>
                      </div>
                      <button 
                        onClick={async () => {
                            if (!currentUser) return;
                            
                            // Validate all items are in ACTIVE status
                            const inactiveItems = currentUser.cart.filter(item => item.status !== ItemStatus.ACTIVE);
                            if (inactiveItems.length > 0) {
                              alert('购物车中包含不可交易的物品，请先移除它们');
                              return;
                            }
                            
                            try {
                              // Create transaction requests for each item in cart
                              for (const item of currentUser.cart) {
                                await api.createTransaction({
                                  itemId: item.id,
                                  sellerId: item.sellerId,
                                  buyerId: currentUser.id,
                                  buyerName: currentUser.username
                                });
                              }
                              
                              // Clear cart after creating transactions
                              const updatedUser = {
                                ...currentUser,
                                cart: []
                              };
                              
                              await authService.updateUser(updatedUser);
                              setCurrentUser(updatedUser);
                              
                              // Refresh seller transactions for all users
                              fetchSellerTransactions();
                              fetchBuyerTransactions();
                              
                              alert('交易请求已发送！卖家将收到您的交易请求。');
                            } catch (error) {
                              console.error('Failed to create transactions:', error);
                              alert('创建交易请求失败，请稍后重试。');
                            }
                        }}
                        className={`px-8 py-3 rounded-xl font-bold shadow-lg transform transition hover:-translate-y-0.5 ${currentUser.cart.some(item => item.status !== ItemStatus.ACTIVE) ? 
                          'bg-gray-400 text-white cursor-not-allowed hover:bg-gray-400 hover:translate-y-0' : 
                          'bg-gray-900 text-white hover:bg-gray-800'}`}
                        disabled={currentUser.cart.some(item => item.status !== ItemStatus.ACTIVE)}
                      >
                        请求交易
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && currentUser && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-brand-400 w-2 h-8 rounded mr-3"></span>
              个人中心
            </h2>

            <div className="bg-white rounded-xl shadow-sm border border-brand-50 p-6 mb-8">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-600">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{currentUser.username}</h3>
                  <p className="text-gray-500">ID: {currentUser.id}</p>
                </div>
              </div>
            </div>

            {/* Favorites Section */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-50 p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-red-200 w-2 h-6 rounded mr-3"></span>
                我的收藏 ({currentUser.likes.length})
              </h3>

              {currentUser.likes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">您还没有收藏任何物品</p>
                  <button 
                    onClick={() => setView('market')}
                    className="px-6 py-2 bg-brand-500 text-white rounded-full font-bold hover:bg-brand-600 transition-colors"
                  >
                    去逛逛
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.filter(item => currentUser.likes.includes(item.id)).map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      {/* Item Image */}
                      <div className="relative h-48 bg-gray-100">
                        {item.imageUrls.length > 0 ? (
                          <img 
                            src={item.imageUrls[0]} 
                            alt={item.title} 
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            无图片
                          </div>
                        )}
                        {/* Status Badge */}
                        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold ${item.status === ItemStatus.ACTIVE ? 'bg-green-100 text-green-800' : 
                          item.status === ItemStatus.SOLD ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {item.status}
                        </div>
                      </div>
                        
                      {/* Item Info */}
                      <div className="p-4">
                        <h4 className="font-bold text-gray-800 mb-1 line-clamp-1">{item.title}</h4>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</p>
                        <p className="text-lg font-bold text-brand-600 mb-3">¥{item.price}</p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            卖家: {item.sellerName}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => addToCart(item)}
                              className="p-2 text-brand-500 hover:bg-brand-50 rounded-full transition-colors"
                              title="加入购物车"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => toggleLike(item)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              title="取消收藏"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-brand-50 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-brand-200 w-2 h-6 rounded mr-3"></span>
                我的发布 ({sellerItems.length})
              </h3>

              {isSellerItemsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
              ) : sellerItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">您还没有发布任何物品</p>
                  <button 
                    onClick={() => setView('sell')}
                    className="px-6 py-2 bg-brand-500 text-white rounded-full font-bold hover:bg-brand-600 transition-colors"
                  >
                    发布物品
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sellerItems.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      {/* Item Image */}
                      <div className="relative h-48 bg-gray-100">
                        {item.imageUrls.length > 0 ? (
                          <img 
                            src={item.imageUrls[0]} 
                            alt={item.title} 
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            无图片
                          </div>
                        )}
                        {/* Status Badge */}
                        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold ${item.status === ItemStatus.ACTIVE ? 'bg-green-100 text-green-800' : item.status === ItemStatus.SOLD ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {item.status}
                        </div>
                      </div>
                      
                      {/* Item Info */}
                      <div className="p-4">
                        <h4 className="font-bold text-gray-800 mb-1 line-clamp-1">{item.title}</h4>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</p>
                        <p className="text-lg font-bold text-brand-600 mb-3">¥{item.price}</p>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          {/* Only show edit button if item is not sold */}
                          {item.status !== ItemStatus.SOLD && (
                            <button
                              onClick={() => handleEditItem(item)}
                              className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              编辑
                            </button>
                          )}
                          {/* Always show delete button */}
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            删除
                          </button>
                          {/* Only show status change buttons if item is not sold */}
                          {item.status !== ItemStatus.SOLD && (
                            <>
                              {item.status !== ItemStatus.ACTIVE && (
                                <button
                                  onClick={() => updateItemStatus(item.id, ItemStatus.ACTIVE)}
                                  className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  上架
                                </button>
                              )}
                              {item.status !== ItemStatus.OFFLINE && (
                                <button
                                  onClick={() => updateItemStatus(item.id, ItemStatus.OFFLINE)}
                                  className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  下架
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transaction Requests Section (Seller View) */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-50 p-6 mt-8">
              <div 
                className="flex items-center justify-between cursor-pointer" 
                onClick={() => setSellerTransactionsExpanded(!sellerTransactionsExpanded)}
              >
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <span className="bg-purple-200 w-2 h-6 rounded mr-3"></span>
                  交易请求 ({sellerTransactions.length})
                </h3>
                <button className="text-gray-500 hover:text-gray-700 transition-colors">
                  {sellerTransactionsExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {sellerTransactionsExpanded && (
                <div className="mt-4">
                  {isTransactionsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                    </div>
                  ) : sellerTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-4">暂无交易请求</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sellerTransactions.map((transaction, index) => {
                        // Check if transaction is valid
                        if (!transaction) return null;
                        
                        const relatedItem = items.find(item => item.id === transaction.itemId);
                        
                        return (
                          <div key={transaction.id || `seller-${index}-${Math.random().toString(36).substr(2, 9)}`} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                            <div className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-800 text-sm mb-1 truncate">{relatedItem ? relatedItem.title : '物品已删除'}</h4>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <span className="mr-3">买家: {transaction.buyerName || '未知买家'}</span>
                                    <span className="font-bold text-brand-600">¥{relatedItem ? relatedItem.price : '0'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <div className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${transaction.status === TransactionStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : 
                                    transaction.status === TransactionStatus.CONFIRMED ? 'bg-blue-100 text-blue-800' : 
                                    transaction.status === TransactionStatus.COMPLETED ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {transaction.status === TransactionStatus.PENDING ? '待确认' : 
                                      transaction.status === TransactionStatus.CONFIRMED ? '已确认' : 
                                      transaction.status === TransactionStatus.COMPLETED ? '已完成' : '已取消'}
                                  </div>
                                  {(transaction.status === TransactionStatus.COMPLETED || transaction.status === TransactionStatus.CANCELLED) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTransaction(transaction.id);
                                      }}
                                      className="ml-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      删除
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Transaction Code Display */}
                              {transaction.status === TransactionStatus.CONFIRMED && transaction.transactionCode && (
                                <div className="bg-gray-50 p-2 rounded-md mt-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <span className="text-xs text-gray-500 mr-2">交易码:</span>
                                      <span className="font-mono text-sm font-bold text-purple-600">{transaction.transactionCode}</span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyTransactionCode(transaction.transactionCode, transaction.id);
                                      }}
                                      className="p-1 text-gray-500 hover:text-purple-600 transition-colors rounded-full hover:bg-gray-100"
                                      title="复制交易码"
                                    >
                                      {copiedTransactionId === transaction.id ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">请将此交易码提供给买家，用于线下确认</p>
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="flex space-x-2 mt-2">
                                {transaction.status === TransactionStatus.PENDING && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        confirmTransaction(transaction.id);
                                      }}
                                      className="flex-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs font-medium hover:bg-green-100 transition-colors flex items-center justify-center"
                                    >
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      确认
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelTransaction(transaction.id);
                                      }}
                                      className="flex-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center"
                                    >
                                      <XCircle className="w-3 h-3 mr-1" />
                                      取消
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transaction History Section (Buyer View) */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-50 p-6 mt-8">
              <div 
                className="flex items-center justify-between cursor-pointer" 
                onClick={() => setBuyerTransactionsExpanded(!buyerTransactionsExpanded)}
              >
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <span className="bg-blue-200 w-2 h-6 rounded mr-3"></span>
                  交易历史 ({buyerTransactions.length})
                </h3>
                <button className="text-gray-500 hover:text-gray-700 transition-colors">
                  {buyerTransactionsExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {buyerTransactionsExpanded && (
                <div className="mt-4">
                  {isTransactionsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                    </div>
                  ) : buyerTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-4">暂无交易记录</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {buyerTransactions.map((transaction, index) => {
                        // Check if transaction is valid
                        if (!transaction) return null;
                        
                        const relatedItem = items.find(item => item.id === transaction.itemId);
                        
                        return (
                          <div key={transaction.id || `buyer-${index}-${Math.random().toString(36).substr(2, 9)}`} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                            <div className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-800 text-sm mb-1 truncate">{relatedItem ? relatedItem.title : '物品已删除'}</h4>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <span className="mr-3">卖家: {relatedItem ? relatedItem.sellerName : '未知卖家'}</span>
                                    <span className="font-bold text-brand-600">¥{relatedItem ? relatedItem.price : '0'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <div className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${transaction.status === TransactionStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : 
                                    transaction.status === TransactionStatus.CONFIRMED ? 'bg-blue-100 text-blue-800' : 
                                    transaction.status === TransactionStatus.COMPLETED ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {transaction.status === TransactionStatus.PENDING ? '待卖家确认' : 
                                      transaction.status === TransactionStatus.CONFIRMED ? '卖家已确认' : 
                                      transaction.status === TransactionStatus.COMPLETED ? '已完成' : '已取消'}
                                  </div>
                                  {(transaction.status === TransactionStatus.COMPLETED || transaction.status === TransactionStatus.CANCELLED) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTransaction(transaction.id);
                                      }}
                                      className="ml-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      删除
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Transaction Code Display */}
                              {transaction.status === TransactionStatus.CONFIRMED && transaction.transactionCode && (
                                <div className="bg-gray-50 p-2 rounded-md mt-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <span className="text-xs text-gray-500 mr-2">交易码:</span>
                                      <span className="font-mono text-sm font-bold text-purple-600">{transaction.transactionCode}</span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyTransactionCode(transaction.transactionCode, transaction.id);
                                      }}
                                      className="p-1 text-gray-500 hover:text-purple-600 transition-colors rounded-full hover:bg-gray-100"
                                      title="复制交易码"
                                    >
                                      {copiedTransactionId === transaction.id ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">请使用此交易码进行线下确认</p>
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="mt-2">
                                {transaction.status === TransactionStatus.CONFIRMED && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      completeTransaction(transaction.id);
                                    }}
                                    className="w-full px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs font-medium hover:bg-green-100 transition-colors flex items-center justify-center"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    确认收货
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Purchase History Section */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-50 p-6 mt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-blue-200 w-2 h-6 rounded mr-3"></span>
                已购历史 ({currentUser.purchaseHistory.length})
              </h3>

              {currentUser.purchaseHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">您还没有购买任何物品</p>
                  <button 
                    onClick={() => setView('market')}
                    className="px-6 py-2 bg-brand-500 text-white rounded-full font-bold hover:bg-brand-600 transition-colors"
                  >
                    去逛逛
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentUser.purchaseHistory.map(item => (
                    <div key={item.cartId} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      {/* Item Image */}
                      <div className="relative h-48 bg-gray-100">
                        {item.imageUrls.length > 0 ? (
                          <img 
                            src={item.imageUrls[0]} 
                            alt={item.title} 
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            无图片
                          </div>
                        )}
                        {/* Status Badge */}
                        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold ${item.status === ItemStatus.ACTIVE ? 'bg-green-100 text-green-800' : 
                          item.status === ItemStatus.SOLD ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {item.status}
                        </div>
                      </div>
                       
                      {/* Item Info */}
                      <div className="p-4">
                        <h4 className="font-bold text-gray-800 mb-1 line-clamp-1">{item.title}</h4>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</p>
                        <p className="text-lg font-bold text-brand-600 mb-3">¥{item.price}</p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            卖家: {item.sellerName}
                          </span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
