/**
 * Ingredients Input Component
 * Dynamic list input for managing product ingredients
 */

import { useState, KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';

interface IngredientsInputProps {
  value: string[];
  onChange: (ingredients: string[]) => void;
}

export function IngredientsInput({ value, onChange }: IngredientsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddIngredient = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-body-sm font-medium text-gray-700 dark:text-gray-300">
        Ingredients (Optional)
      </label>

      {/* Ingredients List */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((ingredient, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-burmese-ruby/10 dark:bg-burmese-ruby/20 text-burmese-ruby rounded-md group"
            >
              <span className="text-body-sm">{ingredient}</span>
              <button
                type="button"
                onClick={() => handleRemoveIngredient(index)}
                className="opacity-70 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${ingredient}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Ingredient Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add an ingredient (e.g., Rice noodles)"
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 placeholder-gray-400 text-body-sm focus:outline-none focus:ring-2 focus:ring-burmese-ruby"
        />
        <button
          type="button"
          onClick={handleAddIngredient}
          disabled={!inputValue.trim()}
          className="flex items-center gap-2 px-4 py-2 text-body-sm font-medium text-white bg-burmese-ruby rounded-md hover:bg-burmese-ruby/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Ingredient
        </button>
      </div>

      {value.length === 0 && (
        <p className="text-caption text-gray-500 dark:text-gray-400">
          No ingredients added yet. Add ingredients to help customers know what's in your product.
        </p>
      )}
    </div>
  );
}
