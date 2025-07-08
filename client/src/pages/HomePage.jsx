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

        const playerData = JSON.parse(localStorage.getItem("playerInfoSolo")) || {
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

        const playerData = JSON.parse(localStorage.getItem("playerInfoSolo")) || {
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

            <div className="sticky top-0 left-0 w-auto h-auto flex justify-center z-5 py-4 sm:py-6 md:py-8 px-4 sm:px-6">
                <div className="bg-black/40 flex flex-col gap-3 sm:gap-4 md:gap-5 items-center py-6 sm:py-8 md:py-10 text-white my-4 sm:my-6 md:my-10 w-full max-w-sm sm:max-w-md md:w-[30rem] h-auto rounded">
                    <div className='flex justify-center mb-6 sm:mb-8 md:mb-10 group cursor-pointer' onClick={() => navigate('/')}>
                        <Sketchaa />
                        <Logo />
                    </div>
                    <div className='flex flex-col gap-4 sm:gap-5 md:gap-6 items-center w-full px-4'>
                        <input
                            type="text"
                            placeholder="Enter Your Name"
                            className='bg-gray-700 w-full max-w-xs sm:max-w-sm md:w-70 px-2 sm:px-3 rounded py-1 sm:py-2 focus:outline-none text-sm sm:text-base'
                            onChange={(e) => { setName(e.target.value) }}
                            value={name}
                        />
                        <button className='opacity-80 mb-3 sm:mb-4 md:mb-5 text-xs sm:text-sm md:text-base' disabled>CHOOSE YOUR PLAYER ➡️</button>
                    </div>
                    <div className='flex justify-center gap-3 sm:gap-4 md:gap-5 items-center'>
                        <button onClick={handlePrev} className='hover:cursor-pointer text-lg sm:text-xl md:text-2xl'>◀</button>
                        <img
                            src={characterData[characterIndex]}
                            alt="Character"
                            className='aspect-square rounded-full object-cover border-2 border-white w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 hover:cursor-pointer'
                        />
                        <button onClick={handleNext} className='hover:cursor-pointer text-lg sm:text-xl md:text-2xl'>▶</button>
                    </div>
                    <div className='flex flex-col w-full mt-6 sm:mt-8 md:mt-10 items-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-2'>
                        <button
                            className='w-full sm:w-[85%] md:w-[80%] bg-[linear-gradient(to_right,_#ff512f,_#dd2476)] rounded-full py-2 sm:py-3 md:py-2 transition duration-300 hover:scale-[1.05] cursor-pointer text-sm sm:text-base'
                            onClick={handlePlayClick}
                        >
                            Play
                        </button>
                        <button
                            className='w-full sm:w-[85%] md:w-[80%] bg-[linear-gradient(to_right,_#36D1DC,_#5B86E5)] py-2 sm:py-3 md:py-2 rounded-full transition duration-300 hover:scale-[1.05] cursor-pointer text-sm sm:text-base'
                            onClick={handleRoomClick}
                        >
                            Room
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-center items-center w-full min-h-[100vh] z-10 relative px-2 sm:px-4 md:px-6 text-white">
                <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-5xl h-auto bg-gradient-to-br to-[#0f0f33]/90 via-[#1a1a3f]/90 from-black/90 justify-center items-center rounded-xl shadow-lg py-6 sm:py-8 md:py-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 w-full px-4 sm:px-6 md:px-8">
                        <div className="bg-gray-700/80 rounded-lg p-4 sm:p-5 md:p-6 flex flex-col items-start shadow">
                            <h2 className="text-lg sm:text-xl md:text-xl font-semibold mb-2 sm:mb-3 text-primary">About</h2>
                            <p className="text-xs sm:text-sm md:text-sm leading-relaxed">
                                Sketchaa is a fast-paced multiplayer drawing game where players draw a random word and then rate each other's artwork anonymously. After voting, scores are revealed and the leaderboard ranks the players. The winner is chosen entirely by fair player votes!
                            </p>
                        </div>

                        <div className="bg-gray-700/80 rounded-lg p-4 sm:p-5 md:p-6 flex flex-col items-start shadow">
                            <h2 className="text-lg sm:text-xl md:text-xl font-semibold mb-2 sm:mb-3 text-primary">News</h2>
                            <ul className="list-disc ml-4 sm:ml-5 text-xs sm:text-sm md:text-sm space-y-1 sm:space-y-2">
                                <li>New drawing tools added</li>
                                <li>Better color selection options</li>
                                <li>Enhanced user interface</li>
                            </ul>
                        </div>

                        <div className="bg-gray-700/80 rounded-lg p-4 sm:p-5 md:p-6 flex flex-col items-start shadow sm:col-span-2 md:col-span-1">
                            <h2 className="text-lg sm:text-xl md:text-xl font-semibold mb-2 sm:mb-3 text-primary">How to Play!</h2>
                            <img src={aboutImg} alt="How to Play" className="w-full rounded mb-2 sm:mb-3 object-cover" />
                            <p className="text-xs sm:text-sm md:text-sm">
                                Get the word &rarr; Start drawing &rarr; Compete with friends!
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 mt-4 sm:mt-6 md:mt-8 px-4">
                        <button className="text-white px-3 sm:px-4 py-2 rounded hover:bg-gray-700 hover:cursor-pointer transition text-xs sm:text-sm md:text-base">Contact</button>
                        <button className="text-white px-3 sm:px-4 py-2 rounded hover:bg-gray-700 cursor-pointer transition text-xs sm:text-sm md:text-base">Terms and Service</button>
                        <button className="text-white px-3 sm:px-4 py-2 rounded hover:bg-gray-700 cursor-pointer transition text-xs sm:text-sm md:text-base">Privacy</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HomePage;