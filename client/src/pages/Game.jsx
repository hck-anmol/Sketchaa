import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Eraser, Trash, RotateCcw } from 'lucide-react';
import Sketchaa from '../components/Sketchaa';
import Logo from '../components/Logo';
import DrawingCanvas from '../components/DrawingCanvas';
import { drawingwords } from '../assets/assets';

const COLORS = ['#1c1917','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#ffffff'];

const PracticePage = () => {
    const navigate = useNavigate();
    const [brushSize, setBrushSize] = useState(5);
    const [brushColor, setBrushColor] = useState('#1c1917');
    const [isErasing, setIsErasing] = useState(false);
    const [wordToDraw, setWordToDraw] = useState('');

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(800);
    const [containerHeight, setContainerHeight] = useState(600);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
                setContainerHeight(containerRef.current.offsetHeight);
            }
        };
        const word = JSON.parse(localStorage.getItem('practice-word'));
        if (word) setWordToDraw(word);
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const handleClearCanvas = () => { if (canvasRef.current) canvasRef.current.clearCanvas(); };

    const changeWord = () => {
        const word = drawingwords[Math.floor(Math.random() * drawingwords.length)];
        localStorage.setItem('practice-word', JSON.stringify(word));
        setWordToDraw(word);
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#f5f0e8' }}>

            {/* Top bar */}
            <div className="bg-white border-b border-stone-200 px-5 py-2.5 flex items-center justify-between flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <Sketchaa />
                    <Logo />
                </div>
                <div className="flex items-center gap-2 bg-stone-100 border border-stone-200 rounded-full px-4 py-1.5">
                    <span className="text-xs text-stone-500 font-medium">Practice Mode</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">

                {/* Sidebar */}
                <div className="w-64 bg-white border-r border-stone-200 flex flex-col gap-4 p-4 overflow-y-auto no-scrollbar flex-shrink-0">

                    {/* Word */}
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
                        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Draw This</p>
                        <p className="text-2xl font-black text-stone-800 mb-3">{wordToDraw || '—'}</p>
                        <button
                            onClick={changeWord}
                            className="btn btn-outline w-full rounded-xl py-2 text-xs gap-1.5"
                        >
                            <RotateCcw size={12} /> New Word
                        </button>
                    </div>

                    {/* Tools */}
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex-1">
                        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Tools</p>

                        {/* Pen / Eraser */}
                        <div className="flex gap-1.5 mb-4 p-1 bg-stone-100 rounded-xl">
                            <button
                                onClick={() => setIsErasing(false)}
                                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${!isErasing ? 'bg-white text-stone-800 shadow-sm border border-stone-200' : 'text-stone-500'}`}
                            >
                                <Pencil size={12} /> Draw
                            </button>
                            <button
                                onClick={() => setIsErasing(true)}
                                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${isErasing ? 'bg-white text-stone-800 shadow-sm border border-stone-200' : 'text-stone-500'}`}
                            >
                                <Eraser size={12} /> Erase
                            </button>
                        </div>

                        {/* Color swatches */}
                        <div className="mb-4">
                            <p className="text-xs text-stone-400 mb-2">Color</p>
                            <div className="flex flex-wrap gap-1.5">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { setBrushColor(c); setIsErasing(false); }}
                                        className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                                        style={{
                                            background: c,
                                            borderColor: brushColor === c && !isErasing ? '#1c1917' : c === '#ffffff' ? '#d6d3d1' : c,
                                            boxShadow: brushColor === c && !isErasing ? '0 0 0 2px #f5f0e8, 0 0 0 4px #1c1917' : 'none'
                                        }}
                                    />
                                ))}
                                <div className="relative w-7 h-7">
                                    <input
                                        type="color"
                                        value={brushColor}
                                        onChange={e => { setBrushColor(e.target.value); setIsErasing(false); }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="w-7 h-7 rounded-lg border-2 border-stone-300 border-dashed flex items-center justify-center text-stone-400 text-xs pointer-events-none">+</div>
                                </div>
                            </div>
                        </div>

                        {/* Brush size */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs text-stone-400">Brush Size</p>
                                <span className="text-xs font-bold text-stone-600">{brushSize}px</span>
                            </div>
                            <input type="range" min="1" max="30" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full slider" />
                        </div>

                        {/* Clear */}
                        <button
                            onClick={handleClearCanvas}
                            className="btn btn-outline w-full rounded-xl py-2 text-xs text-red-500 border-red-200 hover:bg-red-50 gap-1.5"
                        >
                            <Trash size={12} /> Clear Canvas
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 p-4 flex items-center justify-center bg-stone-50/60">
                    <div
                        ref={containerRef}
                        className="w-full h-full bg-white rounded-2xl shadow-md overflow-hidden border border-stone-200"
                        style={{ maxHeight: 'calc(100vh - 120px)' }}
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