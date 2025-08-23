'use client';

import React from 'react';

interface ChartProps {
  data: Record<string, number>;
  title: string;
  type: 'bar' | 'pie' | 'line';
  height?: number;
  className?: string;
}

export function Chart({ data, title, type, height = 200, className = '' }: ChartProps) {
  const entries = Object.entries(data).filter(([_, value]) => value > 0);
  
  if (entries.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  if (type === 'bar') {
    return <BarChart data={entries} title={title} height={height} className={className} />;
  } else if (type === 'pie') {
    return <PieChart data={entries} title={title} height={height} className={className} />;
  } else {
    return <LineChart data={entries} title={title} height={height} className={className} />;
  }
}

function BarChart({ data, title, height, className }: { data: [string, number][], title: string, height: number, className: string }) {
  const maxValue = Math.max(...data.map(([_, value]) => value));
  
  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-3" style={{ height }}>
        {data.map(([label, value]) => (
          <div key={label} className="flex items-center space-x-3">
            <div className="w-24 text-sm text-gray-600 dark:text-gray-400 truncate">
              {label}
            </div>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
              <div
                className="bg-blue-600 h-6 rounded-full transition-all duration-300"
                style={{ width: `${(value / maxValue) * 100}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieChart({ data, title, height, className }: { data: [string, number][], title: string, height: number, className: string }) {
  const total = data.reduce((sum, [_, value]) => sum + value, 0);
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  
  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="flex items-center space-x-6">
        <div className="relative" style={{ width: height, height }}>
          <svg width={height} height={height} viewBox="0 0 100 100">
            {data.map(([label, value], index) => {
              const percentage = (value / total) * 100;
              const startAngle = (data.slice(0, index).reduce((sum, [_, val]) => sum + val, 0) / total) * 360;
              const endAngle = startAngle + (value / total) * 360;
              
              const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
              const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
              
              const largeArcFlag = percentage > 50 ? 1 : 0;
              
              return (
                <path
                  key={label}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={colors[index % colors.length]}
                />
              );
            })}
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          {data.map(([label, value], index) => (
            <div key={label} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {label}: {value} ({((value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LineChart({ data, title, height, className }: { data: [string, number][], title: string, height: number, className: string }) {
  const maxValue = Math.max(...data.map(([_, value]) => value));
  const minValue = Math.min(...data.map(([_, value]) => value));
  const range = maxValue - minValue;
  
  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="relative" style={{ height }}>
        <svg width="100%" height={height} className="overflow-visible">
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            points={data.map(([label, value], index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = height - ((value - minValue) / range) * height;
              return `${x},${y}`;
            }).join(' ')}
          />
          {data.map(([label, value], index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = height - ((value - minValue) / range) * height;
            return (
              <circle
                key={label}
                cx={`${x}%`}
                cy={y}
                r="4"
                fill="#3B82F6"
              />
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          {data.map(([label]) => (
            <span key={label} className="truncate">
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon, trend, className = '' }: MetricCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span className="ml-1">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  className?: string;
}

export function ProgressBar({ label, value, max, className = '' }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-gray-900 dark:text-white font-medium">
          {value} / {max}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
