import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

const DrawingCanvas = forwardRef(({ width, height, brushSize = 5, brushColor = '#000000', isErasing, disabled = false }, ref) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastXRef = useRef(0);
    const lastYRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = width;
            canvas.height = height;

            // Set white background
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
        }
    }, [width, height]);

    useImperativeHandle(ref, () => ({
        clearCanvas: () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        },
        getCanvasDataUrl: () => {
            if (canvasRef.current) {
                return canvasRef.current.toDataURL('image/png');
            }
            return null;
        }
    }));


    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e) => {
        if (disabled) return;

        const pos = getMousePos(e);
        setIsDrawing(true);
        lastXRef.current = pos.x;
        lastYRef.current = pos.y;
    };

    const draw = (e) => {
        if (!isDrawing || disabled) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getMousePos(e);

        ctx.strokeStyle = isErasing ? "white" : brushColor;
        ctx.lineWidth = isErasing ? 20 : brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(lastXRef.current, lastYRef.current);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        lastXRef.current = pos.x;
        lastYRef.current = pos.y;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleTouchStart = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        startDrawing(mouseEvent);
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        const touch = e.touches[0];

        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        draw(mouseEvent);
    };

    const handleTouchEnd = (e) => {
        e.preventDefault();
        stopDrawing();
    };



    return (
        <div className="relative w-full h-full">
            <canvas
                ref={canvasRef}
                className={`w-full h-full border-2 border-gray-300 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'}`}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    backgroundColor: 'white',
                    display: 'block',
                    touchAction: 'none'
                }}
            />
            {disabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white font-bold">
                    Game has not started yet...
                </div>
            )}
        </div>
    );
});

export default DrawingCanvas;