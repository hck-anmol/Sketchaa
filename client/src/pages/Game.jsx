import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Eraser, Trash, RotateCcw } from 'lucide-react';
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
            
            <div className="fixed inset-0 ">
                <Background />
            </div>

            <div className="bg-black/60 backdrop-blur-sm p-4 sm:p-3 md:p-4 flex items-center justify-between z-20">
                <div className="flex items-center gap-2 sm:gap-4 cursor-pointer" onClick={() => navigate('/')}>
                    <Sketchaa />
                    <Logo />
                </div>
                <div className="text-white font-bold text-base sm:text-lg">
                    Practice Drawing
                </div>
            </div>

            <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] sm:h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]">
                <div className="w-full lg:w-80 bg-black/40 backdrop-blur-sm p-2 sm:p-4 flex flex-col gap-2 sm:gap-4 order-2 lg:order-1">
                    <div className="flex flex-col gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                        <div className='flex flex-col sm:flex-row gap-2 text-center sm:text-left'>
                            <span className='text-white font-bold mb-2 sm:mb-3 text-sm sm:text-base'>
                                <span>Draw : {wordToDraw}</span>
                            </span>
                        </div>
                        
                        <button className='bg-green-600 items-center hover:bg-green-700 rounded-2xl p-1 flex h-10 px-4 gap-2 mb-2 cursor-pointer transition-colors w-full sm:w-auto justify-center'
                            onClick={changeWord}>
                            <RotateCcw color='white' />
                            <span className='text-white'>Change Word</span>
                        </button>

                        <h3 className="text-white font-bold mb-2 sm:mb-4 text-sm sm:text-base">Drawing Tools:</h3>

                        <div className="flex flex-col sm:flex-row gap-2 mb-2 sm:mb-4">
                            <button
                                onClick={() => setIsErasing(false)}
                                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors text-sm sm:text-base ${!isErasing ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
                                    } text-white`}
                            >
                                <Pencil size={16} />
                                Draw
                            </button>
                            <button
                                onClick={() => setIsErasing(true)}
                                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors text-sm sm:text-base ${isErasing ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
                                    } text-white`}
                            >
                                <Eraser size={16} />
                                Erase
                            </button>
                        </div>

                        <div className="mb-2 sm:mb-4 flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 min-w-0">
                                <label className="text-white text-xs sm:text-sm mb-2 block">Brush Size: {brushSize}px</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <label className="text-white text-xs sm:text-sm mb-2 block">Color:</label>
                                <input
                                    type="color"
                                    value={brushColor}
                                    onChange={(e) => setBrushColor(e.target.value)}
                                    className="w-full h-8 sm:h-10 rounded-lg"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleClearCanvas}
                            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                        >
                            <Trash size={16} />
                            Clear Canvas
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-2 sm:p-4 flex justify-center items-center order-1 lg:order-2 h-[50vh] sm:h-[60vh] lg:h-auto min-h-[300px] sm:min-h-[400px]">
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