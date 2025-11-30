import React, { useState } from 'react';
import { ShoppingBag, PlusCircle, Store, LogIn, LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  view: 'market' | 'sell' | 'cart' | 'profile';
  setView: (view: 'market' | 'sell' | 'cart' | 'profile') => void;
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-brand-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => {
              setView('market');
              closeMobileMenu();
            }}
          >
            <div className="bg-brand-400 p-2 rounded-lg mr-2 transform -rotate-6">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-wide">
              校园<span className="text-brand-500">闲置社</span>
            </span>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-brand-500 hover:bg-brand-50 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-8">
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
                <div className="flex items-center relative">
                  <div 
                    className="flex items-center cursor-pointer"
                    onMouseEnter={() => setIsDropdownOpen(true)}
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 overflow-hidden border border-brand-200">
                      <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full object-cover" />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {currentUser.username}
                    </span>
                  </div>
                  
                  {/* Dropdown */}
                  <div 
                    className={`absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 transition-opacity duration-200 ${isDropdownOpen ? 'opacity-100 block' : 'opacity-0 hidden'}
                    `}
                    onMouseEnter={() => setIsDropdownOpen(true)}
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    <button 
                      onClick={() => {
                        setView('profile');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <UserIcon className="w-4 h-4 mr-2" />
                      个人中心
                    </button>
                    <button 
                      onClick={() => {
                        onLogoutClick();
                        setIsDropdownOpen(false);
                      }}
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

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button 
              onClick={() => {
                setView('market');
                closeMobileMenu();
              }}
              className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium transition-colors ${
                view === 'market' ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:text-brand-500 hover:bg-brand-50'
              }`}
            >
              <Store className="h-5 w-5 mr-3" />
              逛集市
            </button>
            
            <button 
              onClick={() => {
                setView('sell');
                closeMobileMenu();
              }}
              className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium transition-colors ${
                view === 'sell' ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:text-brand-500 hover:bg-brand-50'
              }`}
            >
              <PlusCircle className="h-5 w-5 mr-3" />
              卖闲置
            </button>

            <button 
              onClick={() => {
                setView('cart');
                closeMobileMenu();
              }}
              className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-brand-500 hover:bg-brand-50"
            >
              <ShoppingBag className="h-5 w-5 mr-3" />
              购物车
              {currentUser && currentUser.cart.length > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white rounded-full bg-red-500">
                  {currentUser.cart.length}
                </span>
              )}
            </button>

            {currentUser && (
              <button 
                onClick={() => {
                  setView('profile');
                  closeMobileMenu();
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-brand-500 hover:bg-brand-50"
              >
                <UserIcon className="h-5 w-5 mr-3" />
                个人中心
              </button>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 px-4">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-brand-100 overflow-hidden border border-brand-200">
                    <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full object-cover" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{currentUser.username}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      onLogoutClick();
                      closeMobileMenu();
                    }}
                    className="flex items-center w-full px-4 py-2 border border-transparent text-base font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    退出登录
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  onLoginClick();
                  closeMobileMenu();
                }}
                className="flex items-center w-full justify-center px-4 py-3 border border-transparent text-base font-bold rounded-md text-white bg-brand-500 hover:bg-brand-600"
              >
                <LogIn className="h-5 w-5 mr-2" />
                登录
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};