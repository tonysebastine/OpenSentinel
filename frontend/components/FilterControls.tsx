
import React from 'react';
import { ScanRating } from '../types';
import { FilterIcon, SearchIcon } from './icons';

interface FilterControlsProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedRating: ScanRating | 'all';
  onRatingChange: (rating: ScanRating | 'all') => void;
  targetUrlFilter: string;
  onTargetUrlFilterChange: (url: string) => void;
  dateRange: { startDate: string | null, endDate: string | null };
  onDateRangeChange: (range: { startDate: string | null, endDate: string | null }) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  searchTerm,
  onSearchTermChange,
  selectedRating,
  onRatingChange,
  targetUrlFilter,
  onTargetUrlFilterChange,
  dateRange,
  onDateRangeChange
}) => {
  return (
    <div className="p-4 bg-slate-200 dark:bg-slate-800 rounded-lg shadow-md mb-6 transition-colors duration-300 border border-slate-300 dark:border-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-1 lg:col-span-2">
          <label htmlFor="searchTerm" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Search Scans (ID or Target)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              type="text"
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder="e.g., scan-001 or example.com"
              className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 rounded-md shadow-sm pl-10 pr-4 py-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-300"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="targetUrlFilter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Filter by Target URL
          </label>
          <input
            type="text"
            id="targetUrlFilter"
            value={targetUrlFilter}
            onChange={(e) => onTargetUrlFilterChange(e.target.value)}
            placeholder="e.g., specific-target.com"
            className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 rounded-md shadow-sm px-4 py-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-300"
          />
        </div>

        <div>
          <label htmlFor="ratingFilter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Overall Rating
          </label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FilterIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
            <select
              id="ratingFilter"
              value={selectedRating}
              onChange={(e) => onRatingChange(e.target.value as ScanRating | 'all')}
              className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 rounded-md shadow-sm pl-10 pr-4 py-2 focus:ring-teal-500 focus:border-teal-500 appearance-none transition-colors duration-300"
            >
              <option value="all">All Ratings</option>
              {Object.values(ScanRating).map(rating => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 lg:col-span-1">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={dateRange.startDate || ''}
                onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value || null })}
                className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 rounded-md shadow-sm px-3 py-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-300"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={dateRange.endDate || ''}
                onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value || null })}
                min={dateRange.startDate || undefined}
                className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 rounded-md shadow-sm px-3 py-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-300"
              />
            </div>
        </div>

      </div>
    </div>
  );
};

export default FilterControls;