import { useEffect, useRef, useState, useCallback } from "react";

export default function useGigPagination(queryString){
    const requestRef = useRef(null);

    const [result , setResult] = useState({
        query: null,
        gigs: [],
        loading: true,
        error: "",
        hasMore: true,
    });

    useEffect(() => {
        const controller = new AbortController();
        
        let cancelled = false;
        let busy = false;
        let nextPage = 1;

        async function loadNextPage(){
            if (cancelled || busy || nextPage === null) return;

            busy = true;
            const requestedPage = nextPage;

            setResult((previous) => ({
                query: queryString,
                gigs: requestedPage === 1 ? [] : previous.gigs,
                loading: true,
                error: "",
                hasMore: true,
            }));

            try{
                const params = new URLSearchParams(queryString);
                params.set("page", String(requestedPage));

                const response = await fetch(`/api/gigs?${params}`, {
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                    signal: controller.signal,
                });

                if(!response.ok){
                    throw new Error(
                        response.status === 401
                            ? "Silahkan login terlebih dahulu."
                            : "Gagal mengambil data gig."
                    );
                }

            const data = await response.json();

            if(cancelled) return;

            nextPage = data.pagination.has_more
                ? data.pagination.next_page
                : null;

            setResult((previous) => {
                const existing = requestedPage === 1 ? [] : previous.gigs;

                const ids = new Set(
                    existing.map((gig) => gig.id)
                );

                return {
                    query: queryString,
                    gigs: [
                        ...existing,
                        ...data.gigs.filter(
                            (gig) => !ids.has(gig.id)
                        ),
                    ],
                    loading: false,
                    error: "",
                    hasMore: nextPage !== null,
                };
            });
            } catch(err) {
                if(cancelled) return;

                setResult((previous) => ({
                    ...previous,
                    loading: false,
                    error: err.message || "Terjadi kesalahan.",
                }));
            } finally {
                busy = false;
            }
            }
                requestRef.current = loadNextPage;

                const timeout = setTimeout(loadNextPage, 300);

                return () => {
                    cancelled = true;
                    clearTimeout(timeout);
                    controller.abort();
                    requestRef.current = null;
                };
            }, [queryString]);

        const loadMore = useCallback(() => {
            requestRef.current?.();
        }, []);

        const current =
            result.query === queryString
                ? result
                : {
                    gigs: [],
                    loading: true,
                    error: "",
                    hasMore: true,
                };

        return { ...current, loadMore };
    }


