import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

export default function ProtedtedRoute({ guestOnly = false }){
    const [status, setStatus] = useState("checking");
    const [errorCode, setErrorCode] = useState(null)
    const [user, setUser] = useState(null);

    useEffect(() => {
        let controller;

        async function checkLogin() {
            controller?.abort();
            const requestController = new AbortController();
            controller = requestController;
            setStatus("checking");
            setErrorCode(null);

            try {
                const response = await fetch("/api/auth/me", {
                    credentials: "include",
                    cache: "no-store",
                    headers: {Accept: "application/json"},
                    signal: requestController.signal,
                });

                if(requestController.signal.aborted) return;
                
                if(response.status === 401) return setStatus("guest");

                if(!response.ok) {
                    setErrorCode(response.status);
                    throw new Error("Gagal memeriksa login.");
                }

                const data = await response.json();

                if(!data.user) throw new Error("Respon pengguna tidak valid");

                if(!requestController.signal.aborted) {
                    setUser(data.user);
                    setStatus("authenticated");
                }
            } catch {
                if(!requestController.signal.aborted) setStatus("error");
            }
        }

        function handlePageShow(event) {
            // Back/Forward can restore a document without remounting React.
            if (event.persisted) checkLogin();
        }
        
        checkLogin();
        window.addEventListener("pageshow", handlePageShow);

        return () => {
            controller?.abort();
            window.removeEventListener("pageshow", handlePageShow);
        };
    }, []);

    if(status === "checking") return null;

    if(status === "error"){
        return (
            <div className="mobile-container min-h-dvh flex items-center justify-center text-white">
                <p>{errorCode ?? "Koneksi gagal"} | Error</p>
            </div>
        )
    }

    if (guestOnly && status === "authenticated") {
        return <Navigate to="/dashboard" replace />;
    }

    if (!guestOnly && status === "guest") {
        return <Navigate to="/login" replace />;
    }

    return <Outlet context={user} />
}
