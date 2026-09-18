import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

export default function ProtedtedRoute(){
    const [status, setStatus] = useState("checking");
    const [errorCode, setErrorCode] = useState(null)

    useEffect(() => {
        const controller = new AbortController();

        async function checkLogin() {
            try {
                const response = await fetch("/api/auth/me", {
                    credentials: "include",
                    headers: {Accept: "application/json"},
                    signal: controller.signal,
                });

                if(controller.signal.aborted) return;
                
                if(response.status === 401) return setStatus("guest");

                if(!response.ok) {
                    setErrorCode(response.status);
                    throw new Error("Gagal memeriksa login.");
                }

                const data = await response.json();

                if(!data.user) throw new Error("Respon pengguna tidak valid");

                if(!controller.signal.aborted) setStatus("authenticated");
            } catch {
                if(!controller.signal.aborted) setStatus("error");
            }
        }
        
        checkLogin();

        return () => controller.abort();
    }, []);

    if(status === "checking") return null;

    if(status === "error"){
        return (
            <div className="mobile-container min-h-dvh flex items-center justify-center text-white">
                <p>{errorCode ?? "Koneksi gagal"} | Error</p>
            </div>
        )
    }

    if (status === "guest") {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />
}