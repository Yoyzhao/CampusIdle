import React from 'react';
import { ShoppingBag, PlusCircle, Store, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  view: 'market' | 'sell' | 'cart';
  setView: (view: 'market' | 'sell' | 'cart') => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  view, 
  setView, 
  currentUser, 
  onLoginClick, 
  onLogoutClick 
}) => {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-brand-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => setView('market')}
          >
            <div className="bg-brand-400 p-2 rounded-lg mr-2 transform -rotate-6">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-wide">
              校园<span className="text-brand-500">闲置社</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="flex items-center space-x-2 sm:space-x-8">
            <button 
              onClick={() => setView('market')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'market' ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:text-brand-500'
              }`}
            >
              <Store className="h-4 w-4 mr-1.5" />
              逛集市
            </button>
            
            <button 
              onClick={() => setView('sell')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'sell' ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:text-brand-500'
              }`}
            >
              <PlusCircle className="h-4 w-4 mr-1.5" />
              卖闲置
            </button>

            <button 
              onClick={() => setView('cart')}
              className="relative p-2 text-gray-600 hover:text-brand-600 transition-colors mr-2"
            >
              <ShoppingBag className="h-6 w-6" />
              {currentUser && currentUser.cart.length > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                  {currentUser.cart.length}
                </span>
              )}
            </button>

            <div className="pl-4 border-l border-gray-200">
              {currentUser ? (
                <div className="flex items-center group relative">
                  <div className="flex items-center cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-brand-100 overflow-hidden border border-brand-200">
                      <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full object-cover" />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {currentUser.username}
                    </span>
                  </div>
                  
                  {/* Dropdown (Simple implementation) */}
                  <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden group-hover:block">
                    <button 
                      onClick={onLogoutClick}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      退出登录
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onLoginClick}
                  className="flex items-center px-4 py-2 bg-brand-500 text-white text-sm font-bold rounded-full hover:bg-brand-600 transition-colors shadow-sm"
                >
                  <LogIn className="w-4 h-4 mr-1.5" />
                  登录
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};