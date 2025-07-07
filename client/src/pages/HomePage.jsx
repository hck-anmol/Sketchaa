import React, { useState } from 'react';
import Sketchaa from '../components/Sketchaa';
import Logo from '../components/Logo';
import Background from '../components/Background';
import { characterData, aboutImg } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { drawingwords } from '../assets/assets';

const HomePage = () => {
    const [name, setName] = useState("");
    const [characterIndex, setCharacterIndex] = useState(0);
    const navigate = useNavigate();
    const [playerId, setplayerId] = useState("");
    const [practiceWord, setpracticeWord] = useState("");

    const handlePrev = () => {
        setCharacterIndex((prev) => (prev === 0 ? characterData.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCharacterIndex((prev) => (prev === characterData.length - 1 ? 0 : prev + 1));
    };

    const handlePlayClick = async () => {
        if (!name.trim()) {
            toast.error('Please enter your name!');
            return;
        }

        const generatedId = generatePlayerId();

        const playerData = {
            id: generatedId,
            name,
            character: characterData[characterIndex],
        };

        const randomIndex = Math.floor(Math.random() * drawingwords.length);
        const word = drawingwords[randomIndex];
        setpracticeWord(word);
        localStorage.setItem("practice-word", JSON.stringify(word));

        localStorage.setItem("playerInfoSolo", JSON.stringify(playerData));
        navigate(`/game/${generatedId}`);
    };

    const handleRoomClick = () => {
        if (!name.trim()) {
            toast.error('Please enter your name!');
            return;
        }

        const generatedId = generatePlayerId();

        const playerData = {
            id: generatedId,
            name,
            character: characterData[characterIndex],
        };


        localStorage.setItem("playerInfoMulti", JSON.stringify(playerData));
        localStorage.setItem("playerInfoSolo", JSON.stringify(playerData));
        navigate('/room');
    };


    const generatePlayerId = () => {
        const newId = ((Math.floor(100000000 + Math.random() * 900000000)).toString());
        setplayerId(newId);
        return newId;
    };

    return (
        <>
            <div className="fixed inset-0 -z-10">
                <Background />
            </div>

            <div className="sticky top-0 left-0 w-auto h-auto flex justify-center z-5 py-8">
                <div className="bg-black/40 flex flex-col gap-5 items-center py-10 text-white my-10 w-[30rem] h-auto rounded">
                    <div className='flex justify-center mb-10 group cursor-pointer' onClick={() => navigate('/')}>
                        <Sketchaa />
                        <Logo />
                    </div>
                    <div className='flex flex-col gap-6 items-center'>
                        <input
                            type="text"
                            placeholder="Enter Your Name"
                            className='bg-gray-700 w-70 px-2 rounded py-1 focus:outline-none'
                            onChange={(e) => { setName(e.target.value) }}
                            value={name}
                        />
                        <button className='opacity-80 mb-5' disabled>CHOOSE YOUR PLAYER ➡️</button>
                    </div>
                    <div className='flex justify-center gap-5 items-center'>
                        <button onClick={handlePrev} className='hover:cursor-pointer'>◀</button>
                        <img
                            src={characterData[characterIndex]}
                            alt="Character"
                            className='aspect-square rounded-full object-cover border-2 border-white w-24 h-24 hover:cursor-pointer'
                        />
                        <button onClick={handleNext} className='hover:cursor-pointer'>▶</button>
                    </div>
                    <div className='flex flex-col w-full mt-10 items-center gap-2 px-2'>
                        <button
                            className='w-[80%] bg-[linear-gradient(to_right,_#ff512f,_#dd2476)] rounded-full py-2 transition duration-300 hover:scale-[1.05] cursor-pointer'
                            onClick={handlePlayClick}
                        >
                            Play
                        </button>
                        <button
                            className='w-[80%] bg-[linear-gradient(to_right,_#36D1DC,_#5B86E5)] py-2 rounded-full transition duration-300 hover:scale-[1.05] cursor-pointer'
                            onClick={handleRoomClick}
                        >
                            Room
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-center items-center w-full min-h-[100vh] z-10 relative px-2 text-white">
                <div className="flex flex-col gap-10 w-full max-w-5xl h-auto bg-gradient-to-br to-[#0f0f33]/90 via-[#1a1a3f]/90 from-black/90 justify-center items-center rounded-xl shadow-lg py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full px-4">
                        <div className="bg-gray-700/80 rounded-lg p-6 flex flex-col items-start shadow">
                            <h2 className="text-xl font-semibold mb-3 text-primary">About</h2>
                            <p className="text-sm leading-relaxed">
                                Sketchaa is a fast-paced multiplayer drawing game where players draw a random word and then rate each other's artwork anonymously. After voting, scores are revealed and the leaderboard ranks the players. The winner is chosen entirely by fair player votes!
                            </p>
                        </div>

                        <div className="bg-gray-700/80 rounded-lg p-6 flex flex-col items-start shadow">
                            <h2 className="text-xl font-semibold mb-3 text-primary">News</h2>
                            <ul className="list-disc ml-5 text-sm space-y-2">
                                <li>New drawing tools added</li>
                                <li>Better color selection options</li>
                                <li>Enhanced user interface</li>
                            </ul>
                        </div>

                        <div className="bg-gray-700/80 rounded-lg p-6 flex flex-col items-start shadow">
                            <h2 className="text-xl font-semibold mb-3 text-primary">How to Play!</h2>
                            <img src={aboutImg} alt="How to Play" className="w-full rounded mb-3 object-cover" />
                            <p className="text-sm">
                                Get the word &rarr; Start drawing &rarr; Compete with friends!
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-5 mt-8">
                        <button className="text-white px-4 py-2 rounded hover:bg-gray-700 hover:cursor-pointer transition">Contact</button>
                        <button className="text-white px-4 py-2 rounded hover:bg-gray-700 cursor-pointer transition">Terms and Service</button>
                        <button className="text-white px-4 py-2 rounded hover:bg-gray-700 cursor-pointer transition">Privacy</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HomePage;








