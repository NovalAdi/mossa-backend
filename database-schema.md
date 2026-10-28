# Database Schema — Manajemen & Katalog Bengkel

Skema relasional untuk backend Manajemen & Katalog Bengkel (car workshop).

## Cara baca diagram ini

- **`PK`** = Primary Key (kolom yang jadi ID utama, unik).
- **`FK`** = Foreign Key (kolom yang "menunjuk ke" tabel lain).
- Garis `||--o{` artinya **1 → banyak** (misal `BENGKEL ||--o{ CUSTOMER` = 1 bengkel punya banyak customer).
- `SETTINGS` **tidak punya FK** karena tabel konfigurasi key-value, sengaja tidak terikat ke tabel lain. Sisanya yang tadi ditanya (`USERS`, `TRANSACTION`, `EXPENSE`, `REMINDER_LOG`) sudah ikut digambar hubungannya sekarang.

Gambar ER dibawah ini dibuat dengan **Mermaid** (`erDiagram`), siap dibuka di VS Code (ekstensi Mermaid Utils / Markdown Preview Mermaid Support).

> Catatan: tipe field (`uuid`, `decimal`, `jsonb`, `timestamp`) adalah panduan, belum jadi file migration SQL.

## Diagram ER

```mermaid
erDiagram
    BENGKEL {
        uuid id PK
        string name
        text description
        text address
        decimal latitude
        decimal longitude
        string phone
        string email
        string logo_url
        jsonb opening_hours
        string photo_url
        timestamp created_at
        timestamp updated_at
    }
    USERS {
        uuid id PK
        uuid bengkel_id FK
        string name
        string email
        string password_hash
        string role
        string phone
        string avatar_url
        timestamp created_at
        timestamp updated_at
    }
    CUSTOMER {
        uuid id PK
        uuid bengkel_id FK
        string name
        string email
        string phone
        text address
        text note
        timestamp created_at
        timestamp updated_at
    }
    VEHICLE {
        uuid id PK
        uuid bengkel_id FK
        uuid customer_id FK
        string plate
        string brand
        string model
        int year
        string color
        string engine_type
        string vin
        timestamp created_at
        timestamp updated_at
    }
    SERVICE_TYPE {
        uuid id PK
        uuid bengkel_id FK
        string name
        string category
        text description
        int estimated_minutes
        decimal price
        string icon
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    PRODUCT {
        uuid id PK
        uuid bengkel_id FK
        string name
        string category
        string sku
        string barcode
        decimal unit_price
        int stock
        int min_stock
        string photo_url
        timestamp created_at
        timestamp updated_at
    }
    QUEUE_ENTRY {
        uuid id PK
        uuid bengkel_id FK
        uuid vehicle_id FK
        uuid customer_id FK
        uuid service_type_id FK
        uuid staff_id FK
        string status
        int queue_position
        int estimated_wait_minutes
        timestamp created_at
        timestamp started_at
        timestamp completed_at
        text note
    }
    BOOKING {
        uuid id PK
        uuid bengkel_id FK
        uuid customer_id FK
        uuid vehicle_id FK
        uuid service_type_id FK
        uuid staff_id FK
        date slot_date
        string slot_time
        string status
        timestamp created_at
        timestamp confirmed_at
        timestamp completed_at
    }
    REMINDER {
        uuid id PK
        uuid bengkel_id FK
        uuid vehicle_id FK
        uuid service_type_id FK
        int interval_days
        timestamp next_reminder_at
        timestamp last_reminded_at
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    REMINDER_LOG {
        uuid id PK
        uuid maintenance_reminder_id FK
        string channel
        text message
        string status
        timestamp sent_at
        timestamp created_at
    }
    SERVICE_HISTORY {
        uuid id PK
        uuid bengkel_id FK
        uuid vehicle_id FK
        uuid customer_id FK
        uuid service_type_id FK
        uuid queue_entry_id FK
        uuid booking_id FK
        uuid staff_id FK
        string status
        decimal total_price
        jsonb sub_items
        text note
        timestamp completed_at
    }
    TRANSACTION {
        uuid id PK
        uuid bengkel_id FK
        uuid customer_id FK
        uuid vehicle_id FK
        string service_key
        decimal amount
        string payment_method
        string reference_no
        timestamp created_at
    }
    EXPENSE {
        uuid id PK
        uuid bengkel_id FK
        string name
        string category
        decimal amount
        string payment_method
        date date
        text note
        timestamp created_at
        timestamp updated_at
    }
    INVENTORY_LOG {
        uuid id PK
        uuid product_id FK
        string type
        int quantity
        text reason
        string reference_id
        timestamp created_at
    }
    SETTINGS {
        uuid id PK
        string key
        text value
        timestamp created_at
        timestamp updated_at
    }

    BENGKEL ||--o{ CUSTOMER : "has"
    BENGKEL ||--o{ VEHICLE : "has"
    BENGKEL ||--o{ SERVICE_TYPE : "defines"
    BENGKEL ||--o{ PRODUCT : "defines"
    BENGKEL ||--o{ QUEUE_ENTRY : "manages"
    BENGKEL ||--o{ BOOKING : "manages"
    BENGKEL ||--o{ SERVICE_HISTORY : "records"
    BENGKEL ||--o{ REMINDER : "manages"
    BENGKEL ||--o{ USERS : "has"
    BENGKEL ||--o{ TRANSACTION : "records"
    BENGKEL ||--o{ EXPENSE : "records"
    USERS ||--o{ QUEUE_ENTRY : "assigns"
    USERS ||--o{ BOOKING : "assigns"
    USERS ||--o{ SERVICE_HISTORY : "performs"
    CUSTOMER ||--o{ VEHICLE : "owns"
    CUSTOMER ||--o{ BOOKING : "makes"
    CUSTOMER ||--o{ SERVICE_HISTORY : "has"
    CUSTOMER ||--o{ QUEUE_ENTRY : "queued"
    CUSTOMER ||--o{ TRANSACTION : "has"
    SERVICE_TYPE ||--o{ QUEUE_ENTRY : "queued"
    SERVICE_TYPE ||--o{ BOOKING : "booked"
    SERVICE_TYPE ||--o{ SERVICE_HISTORY : "completed"
    SERVICE_TYPE ||--o{ REMINDER : "triggers"
    PRODUCT ||--o{ INVENTORY_LOG : "tracked"
    VEHICLE ||--o{ SERVICE_HISTORY : "serviced"
    VEHICLE ||--o{ TRANSACTION : "has"
    QUEUE_ENTRY ||--o{ SERVICE_HISTORY : "follows"
    BOOKING ||--o{ SERVICE_HISTORY : "becomes"
    REMINDER ||--o{ REMINDER_LOG : "logs"
```

## Foreign Key Mapping (relasi eksplisit)

| Tabel | Kolom `(FK)` | Menunjuk ke |
|---|---|---|
| `USERS` | `bengkel_id` | `BENGKEL.id` |
| `CUSTOMER` | `bengkel_id` | `BENGKEL.id` |
| `VEHICLE` | `bengkel_id` | `BENGKEL.id` |
| `VEHICLE` | `customer_id` | `CUSTOMER.id` |
| `SERVICE_TYPE` | `bengkel_id` | `BENGKEL.id` |
| `PRODUCT` | `bengkel_id` | `BENGKEL.id` |
| `QUEUE_ENTRY` | `bengkel_id` | `BENGKEL.id` |
| `QUEUE_ENTRY` | `vehicle_id` | `VEHICLE.id` |
| `QUEUE_ENTRY` | `customer_id` | `CUSTOMER.id` |
| `QUEUE_ENTRY` | `service_type_id` | `SERVICE_TYPE.id` |
| `QUEUE_ENTRY` | `staff_id` | `USERS.id` |
| `BOOKING` | `bengkel_id` | `BENGKEL.id` |
| `BOOKING` | `customer_id` | `CUSTOMER.id` |
| `BOOKING` | `vehicle_id` | `VEHICLE.id` |
| `BOOKING` | `service_type_id` | `SERVICE_TYPE.id` |
| `BOOKING` | `staff_id` | `USERS.id` |
| `REMINDER` | `bengkel_id` | `BENGKEL.id` |
| `REMINDER` | `vehicle_id` | `VEHICLE.id` |
| `REMINDER` | `service_type_id` | `SERVICE_TYPE.id` |
| `REMINDER_LOG` | `maintenance_reminder_id` | `REMINDER.id` |
| `SERVICE_HISTORY` | `bengkel_id` | `BENGKEL.id` |
| `SERVICE_HISTORY` | `vehicle_id` | `VEHICLE.id` |
| `SERVICE_HISTORY` | `customer_id` | `CUSTOMER.id` |
| `SERVICE_HISTORY` | `service_type_id` | `SERVICE_TYPE.id` |
| `SERVICE_HISTORY` | `queue_entry_id` | `QUEUE_ENTRY.id` |
| `SERVICE_HISTORY` | `booking_id` | `BOOKING.id` |
| `SERVICE_HISTORY` | `staff_id` | `USERS.id` |
| `TRANSACTION` | `bengkel_id` | `BENGKEL.id` |
| `TRANSACTION` | `customer_id` | `CUSTOMER.id` |
| `TRANSACTION` | `vehicle_id` | `VEHICLE.id` |
| `EXPENSE` | `bengkel_id` | `BENGKEL.id` |
| `INVENTORY_LOG` | `product_id` | `PRODUCT.id` |

## Ringkasan field penting

| Tabel | Field penting | Keterangan |
|---|---|---|
| `BENGKEL` | `address`, `latitude`, `longitude`, `opening_hours` | Profil, lokasi, jam buka (jsonb) |
| `USERS` | `email`, `password_hash`, `role` | Login staff/admin — `role` = `admin` \| `staff` |
| `CUSTOMER` | `phone`, `email` | Pemesan/pengunjung |
| `VEHICLE` | `plate`, `brand`, `model`, `vin` | Kendaraan — bisa banyak per customer |
| `SERVICE_TYPE` | `category`, `estimated_minutes`, `price` | Jenis servis & harga |
| `PRODUCT` | `stock`, `min_stock`, `unit_price` | Sparepart |
| `QUEUE_ENTRY` | `status`, `queue_position`, `estimated_wait_minutes` | Antrean real-time |
| `BOOKING` | `slot_date`, `slot_time`, `status` | Slot antrean terjadwal |
| `REMINDER` | `interval_days`, `next_reminder_at` | Jadwal pengingat per `service_type` |
| `REMINDER_LOG` | `channel`, `status` | Log notifikasi (`sms/push/email`) |
| `SERVICE_HISTORY` | `status`, `total_price`, `sub_items` | Riwayat servis + produk yang dipakai |
| `TRANSACTION` | `amount`, `payment_method` | Pemasukan (income) |
| `EXPENSE` | `amount`, `category`, `date` | Pengeluaran RAB |
| `INVENTORY_LOG` | `type`, `quantity` | Stok sparepart in/out |
| `SETTINGS` | `key`, `value` | Konfigurasi (reminder interval, currency, dll) |

## Hal yang perlu diputuskan nanti

- **Tipe uang**: `decimal(12,2)` + format IDR. (NB: JSON/DB `float` tidak dipakai untuk uang.)
- **Waktu**: `timestamp with time zone` (UTC) untuk `created_at`/`updated_at`.
- **Multi-bengkel**: `bengkel_id` di tiap tabel sebagai tenant key — siap 1 bengkel saja maupun banyak.
- **Real-time queue**: pola polling / WebSocket dari `QUEUE_ENTRY.status` dan `queue_position`.
