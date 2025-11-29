import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import * as d3 from 'd3';
import { Item, Category } from '../types';

interface MarketStatsProps {
  items: Item[];
}

export const MarketStats: React.FC<MarketStatsProps> = ({ items }) => {
  const stats = useMemo(() => {
    const categoryMap = new Map<Category, { count: number; total: number }>();
    
    // Initialize
    Object.values(Category).forEach(cat => {
      categoryMap.set(cat, { count: 0, total: 0 });
    });

    // Aggregate
    items.forEach(item => {
      const current = categoryMap.get(item.category) || { count: 0, total: 0 };
      categoryMap.set(item.category, {
        count: current.count + 1,
        total: current.total + item.price
      });
    });

    // Format for Recharts
    const data = Array.from(categoryMap.entries()).map(([name, val]) => ({
      name,
      count: val.count,
      avgPrice: val.count > 0 ? Math.round(val.total / val.count) : 0
    }));

    return data;
  }, [items]);

  // Use D3 for color scale
  const colorScale = d3.scaleOrdinal<string>()
    .domain(Object.values(Category))
    .range(['#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#93c5fd']);

  if (items.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100 mb-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <span className="w-2 h-6 bg-brand-500 rounded-full mr-2"></span>
        市场行情看板
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="元" />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Bar dataKey="avgPrice" radius={[4, 4, 0, 0]} name="平均价格">
              {stats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorScale(entry.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-center text-gray-400 mt-2">基于当前上架物品的平均价格统计</p>
    </div>
  );
};