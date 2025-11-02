import React from 'react';
import { Spinner } from './Spinner';
import { ErrorIcon, PhotoIcon, XCircleIcon } from './icons';

interface ImageSlotProps {
  title: string;
  imageUrl: string | null;
  isLoading?: boolean;
  error?: string | null;
  onClear?: () => void;
}

export const ImageSlot: React.FC<ImageSlotProps> = ({
  title,
  imageUrl,
  isLoading = false,
  error = null,
  onClear,
}) => {
  const hasContent = imageUrl || isLoading || error;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      <div className="w-full h-full aspect-square rounded-xl bg-gray-700/50 flex items-center justify-center relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
            <Spinner />
            <p className="mt-4 text-lg text-gray-300">Traveling through time...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="absolute inset-0 bg-red-900/20 flex flex-col items-center justify-center text-center p-4">
            <ErrorIcon className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-red-300">Something went wrong!</h3>
            <p className="text-red-400 mt-1 text-sm">{error}</p>
          </div>
        )}
        {imageUrl && !error && (
          <img
            src={imageUrl}
            alt={title}
            className="object-contain w-full h-full"
          />
        )}
        {!hasContent && (
           <div className="flex flex-col items-center text-gray-500">
            <PhotoIcon className="w-16 h-16" />
            <p className="mt-2 font-semibold">{title}</p>
            <p className="text-sm">Your result will appear here</p>
          </div>
        )}
         {onClear && imageUrl && (
          <button
            onClick={onClear}
            className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 transition-opacity"
            aria-label="Clear image"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        )}
      </div>
       <h2 className="text-lg font-semibold text-gray-300 mt-4 absolute -top-4 bg-gray-800 px-2 rounded-md">
        {title}
      </h2>
    </div>
  );
};
