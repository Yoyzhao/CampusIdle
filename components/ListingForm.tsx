import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import { Category, ItemType, Item } from '../types';

interface ListingFormProps {
  onAddItem: (item: Omit<Item, 'id' | 'createdAt' | 'likes' | 'sellerName' | 'sellerId'>) => void;
  onCancel: () => void;
  initialItem?: Item; // Optional prop for editing existing items
}

export const ListingForm: React.FC<ListingFormProps> = ({ onAddItem, onCancel, initialItem }) => {
  const [title, setTitle] = useState(initialItem?.title || '');
  const [category, setCategory] = useState<Category>(initialItem?.category || Category.OTHER);
  const [type, setType] = useState<ItemType>(initialItem?.type || ItemType.SELL);
  const [price, setPrice] = useState<number | ''>(initialItem?.type === ItemType.SELL ? initialItem.price : '');
  const [description, setDescription] = useState(initialItem?.description || '');
  const [imageUrls, setImageUrls] = useState<string[]>(initialItem?.imageUrls || []);
  const [isDragging, setIsDragging] = useState(false);

  // Reset form when initialItem changes
  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title);
      setCategory(initialItem.category);
      setType(initialItem.type);
      setPrice(initialItem.type === ItemType.SELL ? initialItem.price : '');
      setDescription(initialItem.description);
      setImageUrls(initialItem.imageUrls);
    }
  }, [initialItem]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImageUrls: string[] = [...imageUrls];
    
    // Process up to 3 files
    for (let i = 0; i < files.length && newImageUrls.length < 3; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64Image = event.target.result as string;
          setImageUrls(prev => [...prev, base64Image]);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files) return;

    const newImageUrls: string[] = [...imageUrls];
    
    // Process up to 3 files
    for (let i = 0; i < files.length && newImageUrls.length < 3; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64Image = event.target.result as string;
          setImageUrls(prev => [...prev, base64Image]);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    // If no images uploaded, use a default image
    const finalImageUrls = imageUrls.length > 0 ? imageUrls : ['https://picsum.photos/seed/default/400/300'];

    onAddItem({
      title,
      category,
      type,
      price: type === ItemType.SELL ? Number(price) : 0,
      description,
      imageUrls: finalImageUrls
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-brand-100 overflow-hidden">
      <div className="bg-brand-50 p-6 border-b border-brand-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Upload className="w-6 h-6 mr-2 text-brand-600" />
          {initialItem ? '编辑闲置' : '发布闲置'}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {initialItem ? '修改你的闲置物品信息' : '让你的闲置物品找到新主人'}
        </p>
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-400 outline-none resize-none"
            placeholder="描述物品的新旧程度、入手渠道等..."
            required
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">物品图片 (最多3张)</label>
          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${isDragging ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label 
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <Upload className="w-10 h-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">点击上传或拖拽图片到此处</p>
              <p className="text-xs text-gray-400">支持 JPG、PNG 格式，最多3张</p>
            </label>
          </div>

          {/* Image Previews */}
          {imageUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={url} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
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
            {initialItem ? '确认修改' : '确认发布'}
          </button>
        </div>
      </form>
    </div>
  );
};