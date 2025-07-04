import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PencilIcon, LucideEraser, Trash, SwitchCameraIcon } from 'lucide-react';
import Background from '../components/Background';
import Sketchaa from '../components/Sketchaa';
import Logo from '../components/Logo';
import DrawingCanvas from '../components/DrawingCanvas';
import { drawingwords } from '../assets/assets';

const PracticePage = () => {
    const navigate = useNavigate();

    const [brushSize, setBrushSize] = useState(5);
    const [brushColor, setBrushColor] = useState('#000000');
    const [isErasing, setIsErasing] = useState(false);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(800);
    const [containerHeight, setContainerHeight] = useState(600);

    const [wordToDraw, setWordToDraw] = useState("");

    const chooseWord = () => {
        const word = JSON.parse(localStorage.getItem("practice-word"));
        setWordToDraw(word);
        return word;
    }

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
                setContainerHeight(containerRef.current.offsetHeight);
            }
        };
        chooseWord();
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const handleClearCanvas = () => {
        if (canvasRef.current) {
            canvasRef.current.clearCanvas();
        }
    };
    const changeWord = () => {
        const randomIndex = Math.floor(Math.random() * drawingwords.length);
        const word = drawingwords[randomIndex];
        localStorage.setItem("practice-word", JSON.stringify(word));
        setWordToDraw(word);
    }

    return (
        <div className="min-h-screen bg-gray-900 relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 ">
                <Background />
            </div>

            {/* Header */}
            <div className="bg-black/60 backdrop-blur-sm p-4 flex items-center justify-between z-20">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
                    <Sketchaa />
                    <Logo />
                </div>
                <div className="text-white font-bold text-lg">
                    Practice Drawing
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
                {/* Left Panel - Drawing Tools */}
                <div className="w-full md:w-80 bg-black/40 backdrop-blur-sm p-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className='flex gap-2'>
                            <span className='text-white font-bold mb-3'><span>Draw : {wordToDraw}</span></span>

                        </div>
                        <button className='bg-green-600 items-center hover:bg-green-700 rounded-2xl p-1 flex h-10 px-4 gap-2 mb-2 cursor-pointer  transition-colors'
                            onClick={changeWord}>
                            <SwitchCameraIcon color='white' />
                            <span className='text-white'>Change Word</span>
                        </button>

                        <h3 className="text-white font-bold mb-4">Drawing Tools:</h3>

                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setIsErasing(false)}
                                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${!isErasing ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
                                    } text-white`}
                            >
                                <PencilIcon size={16} />
                                Draw
                            </button>
                            <button
                                onClick={() => setIsErasing(true)}
                                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${isErasing ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
                                    } text-white`}
                            >
                                <LucideEraser size={16} />
                                Erase
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="text-white text-sm mb-2 block">Brush Size: {brushSize}px</label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="text-white text-sm mb-2 block">Color:</label>
                            <input
                                type="color"
                                value={brushColor}
                                onChange={(e) => setBrushColor(e.target.value)}
                                className="w-full h-10 rounded-lg"
                            />
                        </div>

                        <button
                            onClick={handleClearCanvas}
                            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <Trash size={16} />
                            Clear Canvas
                        </button>
                    </div>
                    <button className='bg-amber-300 hover:bg-amber-400 text-amber-900 font-semibold rounded-lg flex items-center justify-center cursor-pointer py-2'>Submit</button>
                </div>

                {/* Center - Drawing Canvas */}
                <div className="flex-1 p-4 flex justify-center items-center">
                    <div
                        ref={containerRef}
                        className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden flex justify-center items-center"
                    >
                        <DrawingCanvas
                            ref={canvasRef}
                            width={containerWidth}
                            height={containerHeight}
                            brushSize={brushSize}
                            brushColor={brushColor}
                            isErasing={isErasing}
                            disabled={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PracticePage;
