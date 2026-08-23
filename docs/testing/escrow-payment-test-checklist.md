# Manual Test Checklist: Escrow & Pembayaran — SIKAGIG

> Test ini dijalankan setelah flow proposal selesai (ada escrow yang terbuat).
> Siapkan skenario: 1 gig, 1 proposal accepted, 1 escrow per metode bayar.

---

## A. Escrow — Transfer / E-Wallet

| #   | Test Case                                  | Steps                                                   | Expected                                                                       | Pass? |
| --- | ------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------ | ----- |
| 1   | Escrow terbuat saat proposal accepted      | Terima proposal dengan metode `bank_transfer`           | Record escrow ada di DB, `status = awaiting_payment`                           |       |
| 2   | Lihat detail escrow                        | Client `GET /api/escrows/{id}`                          | Data escrow tampil (amount, method, status)                                    |       |
| 3   | Client deposit                             | `POST /api/escrows/{id}/deposit` dengan data pembayaran | Escrow `status → holding`, `held_at` terisi, payment log dibuat                |       |
| 4   | Deposit dua kali                           | Coba deposit lagi ke escrow yang sudah `holding`        | Response 400 "Escrow sudah dalam status holding"                               |       |
| 5   | Freelancer tidak bisa deposit              | Freelancer `POST /api/escrows/{id}/deposit`             | Response 403 Forbidden                                                         |       |
| 6   | Escrow `awaiting_payment` — client release | Coba release sebelum deposit                            | Response 400 "Bayar dulu sebelum release"                                      |       |
| 7   | Client release setelah deposit             | Gig selesai → `POST /api/escrows/{id}/release`          | Escrow `status → released`, `released_at` terisi                               |       |
| 8   | Settlement otomatis setelah release        | Setelah release → cek wallet freelancer                 | `wallets.balance` bertambah sebesar `escrow.amount`, escrow `status → settled` |       |
| 9   | Release dua kali                           | Coba release lagi escrow yang sudah `settled`           | Response 400 "Dana sudah dirilis"                                              |       |
| 10  | Freelancer tidak bisa release              | Freelancer `POST /api/escrows/{id}/release`             | Response 403 Forbidden                                                         |       |

---

## B. Escrow — Cash / Bayar di Tempat

| #   | Test Case                         | Steps                                             | Expected                                                                          | Pass? |
| --- | --------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------- | ----- |
| 11  | Escrow cash langsung `holding`    | Terima proposal dengan metode `cash`              | Escrow `status = holding`, `held_at` terisi, **tidak ada** payment deposit record |       |
| 12  | Cash — tidak perlu deposit        | `POST /api/escrows/{id}/deposit` pada escrow cash | Response 400 "Metode cash tidak memerlukan deposit digital"                       |       |
| 13  | Client konfirmasi bayar cash      | `POST /api/escrows/{id}/confirm-cash`             | Escrow `status → released`, `released_at` terisi                                  |       |
| 14  | Cash — wallet tidak bertambah     | Setelah confirm cash → cek wallet freelancer      | Saldo wallet **tidak berubah** (bayar langsung di tempat)                         |       |
| 15  | Escrow cash tidak bisa di-deposit | Freelancer / client coba deposit ke escrow cash   | Response 400                                                                      |       |

---

## C. Refund

| #   | Test Case                         | Steps                                                              | Expected                                              | Pass? |
| --- | --------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- | ----- |
| 16  | Refund saat escrow `holding`      | Client `POST /api/escrows/{id}/refund`                             | Escrow `status → refunded`, payment log refund dibuat |       |
| 17  | Refund setelah `released`         | Coba refund escrow yang sudah released                             | Response 400 "Dana sudah dirilis ke freelancer"       |       |
| 18  | Refund setelah `settled`          | Coba refund escrow yang sudah settled                              | Response 400                                          |       |
| 19  | Refund oleh freelancer            | Freelancer `POST /api/escrows/{id}/refund`                         | Response 403 Forbidden (hanya client/admin)           |       |
| 20  | Gig dibatalkan → escrow di-refund | Client cancel gig yang sudah `in_progress` dengan escrow `holding` | Gig `cancelled`, escrow `refunded`                    |       |

---

## D. Wallet Freelancer

| #   | Test Case                          | Steps                                              | Expected                           | Pass? |
| --- | ---------------------------------- | -------------------------------------------------- | ---------------------------------- | ----- |
| 21  | Lihat saldo wallet                 | Freelancer `GET /api/wallet`                       | Saldo tampil (awal 0)              |       |
| 22  | Wallet tidak bisa diakses client   | Client `GET /api/wallet`                           | Response 403 Forbidden             |       |
| 23  | Saldo bertambah setelah settlement | Selesaikan gig → release → settlement              | `wallets.balance += escrow.amount` |       |
| 24  | Saldo tidak bertambah dari cash    | Selesaikan gig cash → confirm cash                 | `wallets.balance` tetap            |       |
| 25  | Multiple gig selesai               | 2 gig selesai berurutan untuk freelancer yang sama | Saldo akumulasi dengan benar       |       |

---

## E. Payment Log

| #   | Test Case                  | Steps                                 | Expected                                                      | Pass? |
| --- | -------------------------- | ------------------------------------- | ------------------------------------------------------------- | ----- |
| 26  | Log deposit terbuat        | Client deposit → cek tabel `payments` | Record type `deposit`, status `success`, `reference_code` ada |       |
| 27  | Log settlement terbuat     | Settlement → cek tabel `payments`     | Record type `settlement`, status `success`                    |       |
| 28  | Log refund terbuat         | Refund → cek tabel `payments`         | Record type `refund`, status `success`                        |       |
| 29  | Cash tidak ada log deposit | Escrow cash → cek tabel `payments`    | Tidak ada record type `deposit` untuk escrow ini              |       |
| 30  | Reference code unik        | Buat 2 pembayaran                     | Kedua `reference_code` berbeda                                |       |

---

## F. State Machine Integrity

| #   | Test Case                      | Steps                                         | Expected                           | Pass? |
| --- | ------------------------------ | --------------------------------------------- | ---------------------------------- | ----- |
| 31  | `awaiting_payment` → `holding` | Deposit berhasil                              | Status berubah, tidak bisa kembali |       |
| 32  | `holding` → `released`         | Release berhasil                              | Status berubah, tidak bisa kembali |       |
| 33  | `released` → `settled`         | Settlement berhasil                           | Status berubah, tidak bisa kembali |       |
| 34  | Tidak bisa skip state          | Coba langsung release dari `awaiting_payment` | Response 400                       |       |
| 35  | Escrow ganda per proposal      | Coba buat 2 escrow untuk proposal yang sama   | Error UNIQUE constraint            |       |
