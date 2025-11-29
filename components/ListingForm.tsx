import React, { useState } from 'react';
import { Sparkles, Upload, Loader2, CheckCircle } from 'lucide-react';
import { Category, ItemType, Item } from '../types';
import { generateItemDescription } from '../services/geminiService';

interface ListingFormProps {
  onAddItem: (item: Omit<Item, 'id' | 'createdAt' | 'likes' | 'sellerName' | 'sellerId'>) => void;
  onCancel: () => void;
}

export const ListingForm: React.FC<ListingFormProps> = ({ onAddItem, onCancel }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(Category.OTHER);
  const [type, setType] = useState<ItemType>(ItemType.SELL);
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIGenerate = async () => {
    if (!title) {
      alert("请先输入物品名称");
      return;
    }
    
    setIsGenerating(true);
    const result = await generateItemDescription(title, category, type);
    setDescription(result.description);
    if (result.suggestedPrice > 0 && type === ItemType.SELL) {
      setPrice(result.suggestedPrice);
    }
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    // Generate a pseudo-random image based on category for demo
    const width = 400;
    const height = 300;
    const seed = Math.floor(Math.random() * 1000);
    const imageUrl = `https://picsum.photos/seed/${seed}/${width}/${height}`;

    onAddItem({
      title,
      category,
      type,
      price: type === ItemType.SELL ? Number(price) : 0,
      description,
      imageUrl
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-brand-100 overflow-hidden">
      <div className="bg-brand-50 p-6 border-b border-brand-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Upload className="w-6 h-6 mr-2 text-brand-600" />
          发布闲置
        </h2>
        <p className="text-gray-500 text-sm mt-1">让你的闲置物品找到新主人</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">物品名称</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none transition-all"
            placeholder="例如：罗技无线鼠标"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-400 outline-none"
            >
              {Object.values(Category).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">交易方式</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-400 outline-none"
            >
              {Object.values(ItemType).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price - Only show if selling */}
        {type === ItemType.SELL && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">价格 (元)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-400 outline-none"
              placeholder="0.00"
              min="0"
              required
            />
          </div>
        )}

        {/* Description & AI Button */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">描述</label>
            <button
              type="button"
              onClick={handleAIGenerate}
              disabled={isGenerating || !title}
              className={`
                flex items-center text-xs px-3 py-1 rounded-full transition-all
                ${isGenerating 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}
              `}
            >
              {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
              {isGenerating ? 'AI思考中...' : 'AI 帮我写'}
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-400 outline-none resize-none"
            placeholder="描述物品的新旧程度、入手渠道等..."
            required
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            确认发布
          </button>
        </div>
      </form>
    </div>
  );
};