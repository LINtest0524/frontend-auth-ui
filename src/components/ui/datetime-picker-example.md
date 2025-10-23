# DateTimePicker 組件使用說明

## 概述
這是一個統一的24小時制日期時間選擇器組件，解決了原生 `datetime-local` 輸入框在不同系統設定下顯示格式不一致的問題。

## 功能特色
- ✅ **強制24小時制顯示**：無論系統設定如何，都顯示24小時制
- ✅ **分離式設計**：日期和時間分開選擇，更直觀
- ✅ **統一的時間處理**：配合 `timeUtils.ts` 工具模組使用
- ✅ **響應式設計**：在手機上會垂直排列
- ✅ **完整的表單支援**：支援 required、disabled、error 狀態

## 基本使用

```tsx
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { toTaiwanDatetimeString, fromDatetimeLocalToUTC } from "@/lib/timeUtils";

function MyForm() {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: ''
  });

  // 從後端載入資料時的轉換
  useEffect(() => {
    if (apiData) {
      setFormData({
        startDate: toTaiwanDatetimeString(apiData.startDate),
        endDate: toTaiwanDatetimeString(apiData.endDate)
      });
    }
  }, [apiData]);

  // 提交時轉換為 UTC 格式
  const handleSubmit = async () => {
    const payload = {
      startDate: fromDatetimeLocalToUTC(formData.startDate),
      endDate: fromDatetimeLocalToUTC(formData.endDate)
    };
    // 提交到後端...
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="startDate" className="form-label required">
          開始時間
        </label>
        <DateTimePicker
          id="startDate"
          value={formData.startDate}
          onChange={(value) => setFormData(prev => ({ ...prev, startDate: value }))}
          className="form-input"
          required
        />
      </div>
    </form>
  );
}
```

## 屬性 (Props)

| 屬性 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `value` | `string` | `''` | datetime-local 格式的值 (YYYY-MM-DDTHH:mm) |
| `onChange` | `(value: string) => void` | - | 值改變時的回調函數 |
| `placeholder` | `string` | `'請選擇日期時間'` | 佔位符文字 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `required` | `boolean` | `false` | 是否必填 |
| `className` | `string` | `''` | 額外的 CSS 類別 |
| `id` | `string` | - | 元素 ID |

## 樣式整合

組件內建了樣式，但你也可以通過 CSS 客製化：

```css
/* 在你的 global.css 或組件 CSS 中 */
.form-input.datetime-picker {
  padding: 0;
  border: none;
}

.form-input.datetime-picker .datetime-picker-input {
  border-color: inherit;
}

.form-input.datetime-picker.error .datetime-picker-input {
  border-color: #ef4444;
}
```

## 配合時間工具模組使用

```tsx
import { 
  toTaiwanDatetimeString,    // 後端資料 → 表單顯示
  fromDatetimeLocalToUTC,    // 表單提交 → 後端
  toTaiwanDisplayTime        // 列表頁顯示
} from "@/lib/timeUtils";

// 完整的時間處理流程：
// 1. 後端 ISO 字串 → 表單輸入框
const formValue = toTaiwanDatetimeString(apiData.startDate);

// 2. 表單輸入框 → 後端提交
const apiPayload = fromDatetimeLocalToUTC(formData.startDate);

// 3. 列表頁顯示
const displayText = toTaiwanDisplayTime(apiData.startDate);
```

## 使用場景

### ✅ 適合使用的情況
- 需要精確到分鐘的日期時間選擇
- 希望統一24小時制顯示
- 表單中的日期時間輸入
- 活動、預約時間設定

### ❌ 不適合的情況
- 只需要選擇日期（建議使用 `<input type="date">`）
- 需要秒級精確度
- 需要時區選擇功能

## 響應式行為
- **桌面版**：日期和時間並排顯示
- **手機版**：日期和時間垂直排列

## 無障礙支援
- 支援鍵盤操作
- 正確的 label 關聯
- 支援螢幕閱讀器