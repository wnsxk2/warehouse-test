다음은 Toss 웹 디자인 시스템(Tossface 및 Toss Developers 기준)을 분석하여 '창고 ERP 시스템'에 복제 적용하기 위한 상세 기술 문서입니다. 이 문서는 LLM이 디자인 토큰과 규칙을 학습하여 일관된 스타일의 컴포넌트를 생성할 수 있도록 구조화되었습니다.

---

# Toss 디자인 시스템 분석 및 복제 가이드 (For ERP)

본 문서는 Toss의 웹 디자인 시스템을 분석하고, 이를 '창고 ERP 시스템'에 적용하기 위한 핵심 규칙(Rules)과 토큰(Tokens)을 정의합니다.

## 1. 핵심 디자인 원칙 (Core Principles)

Toss 디자인 시스템은 금융 서비스의 복잡성을 해결하기 위해 다음 세 가지 핵심 원칙을 기반으로 합니다. 이는 데이터 집약적인 ERP 시스템에도 동일하게 중요합니다.

- **간결함 (Simplicity):** 사용자가 목표를 달성하는 데 방해가 되는 모든 시각적, 기능적 요소를 제거합니다. ERP에서는 불필요한 클릭과 시각적 노이즈를 최소화하는 것을 의미합니다.
- **명확성 (Clarity):** 모든 정보와 인터랙션은 명확하고 직관적으로 이해되어야 합니다. 재고 수량, 주문 상태, 오류 메시지 등이 명확하게 전달되어야 합니다.
- **유용성 (Usefulness):** 디자인은 사용자의 실제 문제를 해결하고 작업을 더 효율적으로 만드는 데 기여해야 합니다. 모든 기능은 명확한 목적을 가집니다.

---

## 2. 색상 (Colors)

색상 토큰은 시스템 전체의 일관성을 유지하고 사용자에게 명확한 시각적 피드백을 제공합니다. (참조: Toss Developers의 색상 체계를 기반으로 ERP에 맞게 재구성)

### Primary (주요 색상)

브랜드 정체성 및 핵심 액션(예: 생성, 저장, 실행)에 사용됩니다.

| 이름 (Token)      | 16진수 코드 (Hex) | 주요 용도 (Use Case)                        |
| :---------------- | :---------------- | :------------------------------------------ |
| `primary-default` | `#3182F6`         | 기본 버튼 배경, 활성화된 탭, 주요 아이콘    |
| `primary-hover`   | `#1B64DA`         | Primary 버튼 Hover 상태                     |
| `primary-active`  | `#104AB6`         | Primary 버튼 Active (클릭) 상태             |
| `primary-light`   | `#E8F3FF`         | Primary 색상의 연한 배경 (예: 선택된 표 행) |

### Grayscale (회색조)

텍스트, 배경, UI 요소의 테두리 등 인터페이스의 기본 골격을 구성합니다.

| 이름 (Token) | 16진수 코드 (Hex) | 주요 용도 (Use Case)                     |
| :----------- | :---------------- | :--------------------------------------- |
| `gray-900`   | `#191F28`         | 가장 어두운 텍스트 (주요 제목)           |
| `gray-800`   | `#333D4B`         | 본문 텍스트 (기본)                       |
| `gray-700`   | `#4E5968`         | 보조 텍스트, 설명                        |
| `gray-600`   | `#6B7684`         | 비활성 텍스트, 아이콘                    |
| `gray-500`   | `#B0B8C1`         | Placeholder 텍스트                       |
| `gray-400`   | `#E5E8EB`         | 비활성 요소 테두리, 구분선 (Line)        |
| `gray-300`   | `#F2F4F6`         | 비활성 요소 배경 (Disabled Input/Button) |
| `gray-200`   | `#F7F9FA`         | 은은한 배경 (예: 카드 배경)              |
| `gray-100`   | `#FFFFFF`         | 기본 페이지/컴포넌트 배경                |

### Semantic (의미별 색상)

시스템의 상태(성공, 오류, 경고)를 명확하게 전달합니다. ERP에서 작업 결과 피드백에 필수적입니다.

| 이름 (Token)             | 16진수 코드 (Hex) | 주요 용도 (Use Case)                            |
| :----------------------- | :---------------- | :---------------------------------------------- |
| `semantic-error`         | `#F04452`         | 오류 메시지, 실패 상태, 유효성 검사 실패 테두리 |
| `semantic-success`       | `#22C58B`         | 성공 메시지, 완료 상태 (예: '저장 완료')        |
| `semantic-warning`       | `#FFB13D`         | 경고 메시지 (예: '재고 부족')                   |
| `semantic-info`          | `#5094FA`         | 정보성 알림, 도움말                             |
| `semantic-error-light`   | `#FEEFEE`         | 오류 상태의 연한 배경                           |
| `semantic-success-light` | `#E9FAF3`         | 성공 상태의 연한 배경                           |

---

## 3. 타이포그래피 (Typography)

Toss는 가독성이 뛰어난 'Toss Product Sans' 폰트를 사용합니다. 이는 ERP의 데이터 가독성을 높이는 데 매우 효과적입니다.

- **기본 글꼴 (Font Family):** `'Toss Product Sans', 'Helvetica Neue', 'Arial', sans-serif`

### 스케일 및 계층

의미론적 계층에 따라 타이포그래피 스타일을 정의합니다.

| 이름 (Token) | CSS 속성                                                | 사용 예시 (Use Case)                           |
| :----------- | :------------------------------------------------------ | :--------------------------------------------- |
| `title-xl`   | `font-size: 32px; font-weight: 700; line-height: 44px;` | 대시보드 타이틀 (숫자 강조)                    |
| `title-l`    | `font-size: 24px; font-weight: 700; line-height: 34px;` | 모듈(페이지) 제목 (예: '재고 관리')            |
| `title-m`    | `font-size: 20px; font-weight: 700; line-height: 28px;` | 섹션 제목, 모달(Modal) 제목                    |
| `title-s`    | `font-size: 16px; font-weight: 700; line-height: 24px;` | 카드(Card) 제목, 데이터 테이블 헤더(THead)     |
| `body-l`     | `font-size: 16px; font-weight: 500; line-height: 24px;` | 기본 본문, 버튼 텍스트                         |
| `body-m`     | `font-size: 14px; font-weight: 500; line-height: 22px;` | ERP의 주 사용 텍스트 (입력 필드, 표 내용)      |
| `body-s`     | `font-size: 13px; font-weight: 500; line-height: 20px;` | 보조 설명, 캡션                                |
| `caption`    | `font-size: 12px; font-weight: 500; line-height: 18px;` | 가장 작은 텍스트 (예: 유효성 검사 오류 메시지) |

---

## 4. 간격 및 레이아웃 (Spacing & Layout)

### Spacing Unit (간격 단위)

일관된 간격 유지를 위해 **4px 기반 스케일**을 사용합니다. (Toss는 8px을 기본으로 하나, 4px 단위를 혼용하여 세밀한 조정)

| 토큰 (Token) | 값 (Value) | 주요 용도 (Use Case)                  |
| :----------- | :--------- | :------------------------------------ |
| `space-0`    | `0px`      | 간격 없음                             |
| `space-1`    | `4px`      | 아이콘과 텍스트 사이                  |
| `space-2`    | `8px`      | 가장 작은 컴포넌트 간 여백            |
| `space-3`    | `12px`     | 입력 필드 내부 패딩 (좌우)            |
| `space-4`    | `16px`     | 컴포넌트 간 기본 여백, 카드 내부 패딩 |
| `space-5`    | `20px`     | 섹션과 섹션 사이 (좁게)               |
| `space-6`    | `24px`     | 섹션과 섹션 사이 (기본)               |
| `space-7`    | `32px`     | 페이지 제목과 콘텐츠 사이             |
| `space-8`    | `48px`     | 큰 영역 구분                          |

### Layout (레이아웃)

- **Grid System:** 12-Column Grid를 기본으로 합니다.
- **Max-width:** ERP의 데이터 가독성을 위해 메인 콘텐츠 영역의 최대 너비를 `1280px`로 설정하고 중앙 정렬합니다. (측면 GNB 메뉴를 제외한 콘텐츠 영역)
- **Gutter:** 컬럼 간 간격(Gutter)은 `24px`를 사용합니다.

---

## 5. 핵심 컴포넌트 (Core Components)

ERP 시스템 구축에 필수적인 5가지 핵심 컴포넌트의 사양 및 상태별 스타일입니다.

### 1. 버튼 (Button)

- **시각적 사양 (Variants):**
  - **Primary (주요):** 파란색 배경 (`primary-default`), 흰색 텍스트 (`gray-100`).
  - **Secondary (보조):** 회색 테두리 (`gray-400`), 검은색 텍스트 (`gray-800`).
  - **Ghost (고스트):** 테두리 없음, 파란색 텍스트 (`primary-default`).
- **공통 사양:**
  - `border-radius: 8px`
  - `padding: 10px 16px` (Medium Size 기준, `body-l` 타이포그래피 사용)
  - `font-weight: 700`
- **상태별 스타일 (Primary 버튼 기준):**
  - **`default`:** `background: #3182F6;` `color: #FFFFFF;`
  - **`:hover`:** `background: #1B64DA;`
  - **`:active`:** `background: #104AB6;`
  - **`:disabled`:** `background: #F2F4F6;` `color: #B0B8C1;` `cursor: not-allowed;`

### 2. 입력 필드 (Input Field)

- **시각적 사양:**
  - `border: 1px solid #E5E8EB;` (`gray-400`)
  - `background: #FFFFFF;` (`gray-100`)
  - `border-radius: 8px;`
  - `padding: 12px 16px;` (`space-3`, `space-4` 혼용)
  - `font-size: 14px;` (`body-m`)
- **상태별 스타일:**
  - **`default`:** `border-color: #E5E8EB;`
  - **`::placeholder`:** `color: #B0B8C1;` (`gray-500`)
  - **`:focus`:** `border-color: #3182F6;` (`primary-default`) `box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.15);`
  - **`.error` (or `:invalid`):** `border-color: #F04452;` (`semantic-error`)
  - **`:disabled`:** `background: #F2F4F6;` (`gray-300`) `border-color: #F2F4F6;` `color: #B0B8C1;`

### 3. 체크박스 (Checkbox)

- **시각적 사양:**
  - **Box:** `width: 20px;` `height: 20px;` `border-radius: 4px;`
  - **Label:** `font-size: 14px;` (`body-m`) `color: #333D4B;` (`gray-800`)
- **상태별 스타일:**
  - **`default (unchecked)`:** `border: 2px solid #E5E8EB;` `background: #FFFFFF;`
  - **`default (checked)`:** `border: 2px solid #3182F6;` `background: #3182F6;` (내부 체크 아이콘 `color: #FFFFFF;`)
  - **`:hover (unchecked)`:** `border-color: #B0B8C1;`
  - **`:hover (checked)`:** `border-color: #1B64DA;` `background: #1B64DA;`
  - **`:disabled (unchecked)`:** `border-color: #F2F4F6;` `background: #F2F4F6;`
  - **`:disabled (checked)`:** `border-color: #F2F4F6;` `background: #F2F4F6;` (내부 체크 아이콘 `color: #B0B8C1;`)

### 4. 탭 (Tabs)

- **시각적 사양:**
  - 전체 컨테이너 하단에 `border-bottom: 2px solid #E5E8EB;` (`gray-400`)
  - 개별 탭은 `padding: 12px 16px;`
  - `font-size: 16px;` `font-weight: 700;` (`title-s`)
- **상태별 스타일:**
  - **`default (inactive)`:** `color: #6B7684;` (`gray-600`)
  - **`:hover (inactive)`:** `color: #333D4B;` (`gray-800`)
  - **`active`:** `color: #3182F6;` (`primary-default`) 탭 하단에 `border-bottom: 2px solid #3182F6;`
  - **`:disabled`:** `color: #B0B8C1;` (`gray-500`)

### 5. 모달 (Modal)

- **시각적 사양:**
  - **Overlay:** `background: rgba(0, 0, 0, 0.6);` (어두운 반투명 배경)
  - **Container:** `background: #FFFFFF;` `border-radius: 16px;` `padding: 24px;`
  - `box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);`
  - `width: 480px;` (기본값, 콘텐츠에 따라 조절)
- **구조:**
  - **Header:** `title-m` (`20px`, `700`) 사용, 우측 상단 닫기(X) 아이콘.
  - **Body:** `body-m` (`14px`) 사용.
  - **Footer:** 버튼(들)이 우측 정렬됨 (예: '취소', '확인'). 버튼 간 간격 `space-2` (`8px`).
