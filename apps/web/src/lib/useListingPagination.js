import { useEffect, useRef, useState, useCallback } from "react";

export default function useListingPagination({ endpoint, dataKey, queryString,}) {
    const requestRef = useRef(null);

    // Identitas data mencakup endpoint agar gig dan jasa tidak tercampur.
    const requestKey = JSON.stringify([endpoint, dataKey, queryString]);
    
    const [result, setResult] = useState({
        key: null,
        items: [],
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
                key: requestKey,
                items: requestedPage === 1 ? [] : previous.items,
                loading: true,
                error: "",
                hasMore: true,
            }));

            try{
                const params = new URLSearchParams(queryString);
                params.set("page", String(requestedPage));

                const response = await fetch(`${endpoint}?${params}`, {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                    signal: controller.signal,
                });

                const data = await response.json().catch(() => null);

                if(!response.ok){
                    throw new Error(
                        response.status === 401
                            ? "Silahkan login terlebih dahulu."
                            : data?.message || "Gagal mengambil data."
                    );
                }

                const incoming = data?.[dataKey];
                const pagination = data?.pagination;

                if (
                    !Array.isArray(incoming) ||
                    typeof pagination?.has_more !== "boolean" ||
                    (
                        pagination.has_more &&
                        (
                            !Number.isInteger(pagination.next_page) ||
                            pagination.next_page <= requestedPage
                        )
                )
                ) {
                    throw new Error("Format respons pagination tidak valid.");
                }

                if(cancelled) return;

                nextPage = pagination.has_more
                    ? pagination.next_page
                    : null;

                setResult((previous) => {
                    const existing = requestedPage === 1 
                        ? []
                        : previous.items; 

                    const byId = new Map(
                        existing.map((item) => [item.id, item])
                    );

                    incoming.forEach((item) => {
                        byId.set(item.id, item);
                    });

                    return {
                            key: requestKey,
                            items: [...byId.values()],
                            loading: false,
                            error: "",
                            hasMore: nextPage !== null,
                        };
                    });
            } catch(err) {
                if(cancelled) return;
                
                setResult((previous) => ({
                    key: requestKey,
                    items: requestedPage === 1 ? [] : previous.items,
                    loading: false,
                    error: err.message || "Terjadi kesalahan.",
                    hasMore: true,
                }));

            } finally {
                busy = false;
            }
        }

        requestRef.current = {
                    key: requestKey,
                    load: loadNextPage,
                };

                // Debounce saat pencarian/filter berubah.
                const timeout = setTimeout(loadNextPage, 300);

                return () => {
                    cancelled = true;
                    clearTimeout(timeout);
                    controller.abort();
                    requestRef.current = null;
                };
            }, [endpoint, dataKey, queryString, requestKey]);

            const loadMore = useCallback(() => {
                const request = requestRef.current;

                if (request?.key === requestKey) {
                    request.load();
                }
            }, [requestKey]);

            // Sembunyikan hasil query/tab sebelumnya saat menunggu request baru.
            const current = result.key === requestKey
                ? result
                : {
                    items: [],
                    loading: true,
                    error: "",
                    hasMore: true,
                };

            return {
                items: current.items,
                loading: current.loading,
                error: current.error,
                hasMore: current.hasMore,
                loadMore,
            };
        }

