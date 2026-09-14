export async function getCsrfToken(){
    const response = await fetch("/api/auth/csrf-token", {
        credentials: "include",
        headers: { Accept: "application/json"},
    });

    if(!response.ok){
        throw new Error("Gagal mengambil token CSRF.");
    }

    const { csrf_token } = await response.json();
    return csrf_token;
}