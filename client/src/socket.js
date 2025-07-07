
import io from 'socket.io-client';

const socket = io(`${import.meta.env.VITE_PUBLIC_API_URI}`, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

export default socket;