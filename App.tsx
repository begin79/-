import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ImageSlot } from './components/ImageSlot';
import { CameraIcon, UploadIcon } from './components/icons';
import { editImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';

// --- TYPES ---
type UserImage = {
  base64: string;
  url: string; // for display
  mimeType: string;
};

type Scene = {
  id: string;
  name: string;
  description: string;
  promptFragment: string;
  bgColor: string;
  textColor: string;
};

// --- CONSTANTS ---
const HISTORICAL_SCENES: Scene[] = [
  { id: 'rome', name: 'Ancient Rome', description: 'The bustling Roman Forum', promptFragment: 'a scene in the Roman Forum, with classical architecture and citizens in togas', bgColor: 'bg-amber-800', textColor: 'text-amber-100' },
  { id: 'dino', name: 'Jurassic Era', description: 'Amongst the dinosaurs', promptFragment: 'a lush, prehistoric jungle teeming with dinosaurs like T-Rex and Brontosaurus', bgColor: 'bg-emerald-800', textColor: 'text-emerald-100' },
  { id: 'paris', name: '1920s Paris', description: 'The Roaring Twenties', promptFragment: 'a vibrant street scene in 1920s Paris, with flapper dresses, vintage cars, and Art Deco architecture', bgColor: 'bg-slate-700', textColor: 'text-slate-100' },
  { id: 'moon', name: 'Moon Landing', description: 'First steps on the moon', promptFragment: 'the surface of the moon during the Apollo landing, with the Earth visible in the sky and the lunar module nearby', bgColor: 'bg-indigo-900', textColor: 'text-indigo-100' },
  { id: 'viking', name: 'Viking Age', description: 'Exploring the fjords', promptFragment: 'a Viking longship sailing through a misty fjord, surrounded by dramatic cliffs and Norse warriors', bgColor: 'bg-cyan-900', textColor: 'text-cyan-100' },
  { id: 'future', name: 'Cyberpunk City', description: 'A neon-lit future', promptFragment: 'a futuristic cyberpunk city at night, filled with flying vehicles, neon signs, and towering skyscrapers', bgColor: 'bg-purple-900', textColor: 'text-purple-100' },
];

const App: React.FC = () => {
  const [userImage, setUserImage] = useState<UserImage | null>(null);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [generatedImage, setGeneratedImage] = useState<UserImage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CAMERA LOGIC ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isCameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(mediaStream => {
          stream = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing camera:", err);
          setError("Could not access the camera. Please check permissions.");
          setIsCameraOn(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOn]);

  // --- HANDLERS ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setUserImage({
          base64,
          url: URL.createObjectURL(file),
          mimeType: file.type,
        });
        setError(null);
      } catch (err) {
        setError("Could not read the selected file.");
      }
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64 = dataUrl.split(',')[1];
        setUserImage({
          base64,
          url: dataUrl,
          mimeType: 'image/jpeg',
        });
        setIsCameraOn(false);
        setError(null);
      }
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!userImage || !selectedScene) {
      setError('Please provide a photo and select a scene.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    const prompt = `Take the person in the provided photo and seamlessly place them into a new scene. The scene should be: ${selectedScene.promptFragment}. The final image should look like a vintage photograph, matching the historical era in style, lighting, and color tone.`;

    try {
      const editedImageBase64 = await editImage(
        userImage.base64,
        userImage.mimeType,
        prompt
      );
      setGeneratedImage({
        base64: editedImageBase64,
        mimeType: userImage.mimeType,
        url: `data:${userImage.mimeType};base64,${editedImageBase64}`
      });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? `An error occurred: ${err.message}`
          : 'An unknown error occurred.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [userImage, selectedScene]);

  const reset = () => {
    setUserImage(null);
    setSelectedScene(null);
    setGeneratedImage(null);
    setError(null);
    setIsLoading(false);
    setIsCameraOn(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- RENDER LOGIC ---
  const renderLeftPanel = () => {
    if (isCameraOn) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black rounded-xl p-4">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain rounded-md"></video>
          <canvas ref={canvasRef} className="hidden"></canvas>
          <div className="flex space-x-4 mt-4">
            <button onClick={handleCapture} className="flex-1 text-lg font-semibold bg-green-600 hover:bg-green-700 rounded-lg px-4 py-3 transition-colors">Capture Photo</button>
            <button onClick={() => setIsCameraOn(false)} className="flex-1 text-lg bg-gray-600 hover:bg-gray-700 rounded-lg px-4 py-3 transition-colors">Cancel</button>
          </div>
        </div>
      );
    }

    if (userImage) {
      return <ImageSlot title="Your Photo" imageUrl={userImage.url} onClear={reset} />;
    }

    return (
      <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-200 mb-4">Step 1: Your Photo</h2>
        <p className="text-gray-400 mb-6">Use your camera or upload a clear photo of your face.</p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
          <button onClick={() => setIsCameraOn(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-lg font-semibold rounded-md bg-purple-600 hover:bg-purple-700 transition-colors">
            <CameraIcon className="w-6 h-6" /> Use Camera
          </button>
          <label htmlFor="file-upload" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-lg font-semibold rounded-md bg-pink-600 hover:bg-pink-700 transition-colors cursor-pointer">
            <UploadIcon className="w-6 h-6" /> Upload
          </label>
          <input id="file-upload" ref={fileInputRef} type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
        </div>
      </div>
    );
  };
  
  const renderRightPanel = () => {
    if (!userImage) {
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold text-gray-200 mb-2">Step 2: Choose Your Destination</h2>
          <p className="text-gray-400">After providing your photo, you'll select a historical scene here.</p>
        </div>
      );
    }
    
    return (
      <div className="w-full h-full flex flex-col">
        {generatedImage || isLoading || error ? (
           <ImageSlot
            title="Time-Travel Result"
            imageUrl={generatedImage?.url || null}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center mb-4">Step 2: Choose Your Scene</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-grow">
              {HISTORICAL_SCENES.map(scene => (
                <button
                  key={scene.id}
                  onClick={() => setSelectedScene(scene)}
                  className={`p-4 rounded-lg text-left flex flex-col justify-end transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 ${selectedScene?.id === scene.id ? 'ring-4 ring-pink-500 scale-105' : `ring-2 ring-transparent ${scene.textColor} ${scene.bgColor}`}`}
                >
                  <h3 className="font-bold text-lg">{scene.name}</h3>
                  <p className="text-sm opacity-90">{scene.description}</p>
                </button>
              ))}
            </div>
             <button
                onClick={handleGenerate}
                disabled={isLoading || !selectedScene}
                className="w-full mt-6 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? 'Generating...' : 'Start Time-Travel!'}
              </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Time-Travel Photo Booth
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Place yourself in any era with Gemini.
          </p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center min-h-[400px] md:min-h-0 aspect-square">
            {renderLeftPanel()}
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center min-h-[400px] md:min-h-0 aspect-square">
            {renderRightPanel()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
