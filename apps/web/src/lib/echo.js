import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getCsrfToken } from "./api";

export function createEcho(){
    return new Echo ({
        broadcaster: 'reverb',
        Pusher,
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT),
        forceTLS: import.meta.env.VITE_REVERB_SCHEME === "https",
        enabledTransports: ["ws", "wss"],

        channelAuthorization: {
            customHandler: async (
                {socketId, channelName },
                callback,
            ) => {
                try {
                    const csrfToken = await getCsrfToken();

                    const response = await fetch("/api/broadcasting/auth", {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": csrfToken,
                        },
                        body: JSON.stringify({
                            socket_id: socketId,
                            channel_name: channelName,
                        }),
                    },
                );

                if(!response.ok){
                    throw new Error(`Otorisasi channel gagal: ${response.status}`);
                }

                callback(null, await response.json());
                } catch (error) {
                    callback(error,null);
                }
            }
        },
    });
}
