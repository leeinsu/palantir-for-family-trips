# 여행 도메인 상세설계서

## 1. 목적

`여행(Trip)`을 최상위 aggregate로 정의하고, 방문 장소, 식사, 쇼핑리스트, 사진, 이동로그 등 모든 여행 데이터를 여행 하위에 저장한다.

## 2. 핵심 규칙

- 모든 여행 데이터는 `trip_id`를 가진다.
- 여행 소유자 또는 멤버만 여행 데이터를 읽고 쓸 수 있다.
- 삭제는 우선 soft delete를 기본으로 한다.
- 현행 `tripModel.js`의 local document는 서버 Trip DTO로 단계적으로 치환한다.

## 3. 도메인 관계

```mermaid
erDiagram
  USERS ||--o{ TRIP_MEMBERS : joins
  TRIPS ||--o{ TRIP_MEMBERS : has
  TRIPS ||--o{ VISITED_PLACES : contains
  TRIPS ||--o{ MEALS : contains
  TRIPS ||--o{ SHOPPING_LISTS : contains
  SHOPPING_LISTS ||--o{ SHOPPING_ITEMS : has
  TRIPS ||--o{ PHOTOS : contains
  TRIPS ||--o{ MOVEMENT_LOGS : contains
  VISITED_PLACES ||--o{ PHOTOS : tagged_at
  VISITED_PLACES ||--o{ MEALS : located_at

  USERS {
    bigint id PK
    varchar email UK
    varchar display_name
  }
  TRIPS {
    bigint id PK
    bigint owner_user_id FK
    varchar title
    date start_date
    date end_date
    varchar timezone
    text description
  }
  TRIP_MEMBERS {
    bigint trip_id FK
    bigint user_id FK
    varchar role
  }
  VISITED_PLACES {
    bigint id PK
    bigint trip_id FK
    varchar place_type
    varchar name
    decimal latitude
    decimal longitude
  }
  MEALS {
    bigint id PK
    bigint trip_id FK
    bigint place_id FK
    varchar meal_type
    datetime scheduled_at
  }
  SHOPPING_LISTS {
    bigint id PK
    bigint trip_id FK
    varchar title
  }
  SHOPPING_ITEMS {
    bigint id PK
    bigint shopping_list_id FK
    varchar name
    bool purchased
  }
  PHOTOS {
    bigint id PK
    bigint trip_id FK
    bigint place_id FK
    varchar object_key
  }
  MOVEMENT_LOGS {
    bigint id PK
    bigint trip_id FK
    bigint from_place_id FK
    bigint to_place_id FK
    datetime started_at
    datetime ended_at
  }
```

## 4. Trip API

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/trips` | 내 여행 목록 |
| POST | `/api/trips` | 여행 생성 |
| GET | `/api/trips/{tripId}` | 여행 상세 aggregate 조회 |
| PATCH | `/api/trips/{tripId}` | 여행 기본정보 수정 |
| DELETE | `/api/trips/{tripId}` | 여행 soft delete |
| GET | `/api/trips/{tripId}/summary` | 대시보드 요약 |

## 5. 상세 조회 DTO 구조

```json
{
  "trip": {},
  "members": [],
  "places": [],
  "meals": [],
  "shoppingLists": [],
  "photos": [],
  "movementLogs": []
}
```

## 6. 여행 생성 흐름

```mermaid
sequenceDiagram
  actor U as User
  participant FE as React App
  participant API as Trip API
  participant DB as MariaDB
  U->>FE: 여행 생성 폼 제출
  FE->>API: POST /api/trips
  API->>DB: trips insert
  API->>DB: trip_members owner insert
  API-->>FE: created trip
  FE-->>U: /trips/{tripId} 이동
```

## 7. 검증 기준

- 여행 상세 응답에 요구 데이터가 같은 `trip_id` 기준으로 포함된다.
- 다른 여행의 장소/사진/이동로그가 섞이지 않는다.
- 멤버가 아닌 사용자는 403을 받는다.
