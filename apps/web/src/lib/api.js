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

export async function createGig(formData) {
    const csrfToken = await getCsrfToken();
    const response = await fetch("/api/gigs", {
        method: "POST",
        credentials: "include",
        headers: {
            Accept: "application/json",
            "X-CSRF-TOKEN": csrfToken,
        },
        body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
        throw new Error("Sesi login kamu sudah berakhir atau tidak terbaca. Silakan login kembali, lalu kirim ulang Gig.");
    }
    if (response.status === 419) {
        throw new Error("Sesi formulir sudah berubah. Silakan coba kirim ulang Gig.");
    }
    if (!response.ok) {
        throw new Error(data.message || "Gagal membuat Gig.");
    }
    return data;
}
