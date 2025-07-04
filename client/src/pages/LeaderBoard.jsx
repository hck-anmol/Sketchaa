import React from 'react';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {

  const navigate = useNavigate();
  const leaderboardData = JSON.parse(sessionStorage.getItem('leaderboardData')) || [];
  console.log('Leaderboard data:', leaderboardData);
  
  const getCharacterImage = (character) => {
    // Handle both direct image paths and character keys
    if (character && character.includes('.png')) {
      return character; // Already an image path
    }

    const characterImages = {
      'char1': 'character3.png',
      'char2': 'character5.png',
      'char3': 'character6.png',
      'char4': 'character7.png',
      'char5': 'character8.png',
      'char6': 'character9.png',
      'char7': 'character10.png',
    };
    return characterImages[character] || 'character3.png';
  };

  return (
    <div className="leaderboard-container">
      <h1>🏆 Final Results 🏆</h1>

      <div className="players-list">
        {leaderboardData.length > 0 ? (
          leaderboardData.map((player, index) => (
            <div key={index} className="player-card">
              <img
                src={getCharacterImage(player.character)}
                alt="Player"
                className="avatar"
              />
              <span>{index + 1}. {player.playerName} — <b>Score: {player.score}</b></span>
            </div>
          ))
        ) : (
          <p>No game results found</p>
        )}
      </div>

      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
};

export default Leaderboard;