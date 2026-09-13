# AI 接口文档（前端版）

本文档面向前端调用方。前端只需要调用本系统 `/api/v1` 下的 AI 代理接口，不需要直接调用智能体原始接口，也不需要传 `agentCode`、`agentVersion`、`Authorization`、`appcode` 等后端配置。

## 1. 调用说明

- 请求协议：HTTP
- 请求方法：`POST`
- 请求体格式：`application/json`
- 日期格式：`YYYYMMDD`，例如 `20260701`
- 返回格式：JSON
- 接口统一前缀：`/api/v1`

后端处理流程：

1. 前端传入客户编号 `cust_no` 和查询截止日期 `endTime`。
2. 后端固定使用 `beginTime = 20260101` 查询该客户的诉求记录。
3. 后端把诉求记录中的客户姓名、受理时间、受理内容拼成智能体输入文本。
4. 后端创建智能体会话并调用智能体。
5. 后端只把智能体输出内容返回给前端。

## 2. 接口清单

三个接口的请求参数和响应结构一致，区别是后端使用的智能体能力不同。

| 功能 | 请求地址 | 说明 |
| --- | --- | --- |
| 情绪演变分析 | `POST /api/v1/sensitive-appeals/ai/emotion-evolution` | 分析客户历史诉求中的情绪变化 |
| 智能预警 | `POST /api/v1/sensitive-appeals/ai/intelligent-warning` | 根据客户诉求记录生成风险预警内容 |
| 智能回单 | `POST /api/v1/sensitive-appeals/ai/intelligent-receipt` | 根据客户诉求记录生成回单话术 |

## 3. 请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cust_no` | string | 是 | 客户编号 |
| `endTime` | string | 是 | 查询截止日期，格式为 `YYYYMMDD` |
| `beginTime` | string | 否 | 前端一般不要传；如果传，必须为 `20260101` |

注意：

- `cust_no` 不能为空字符串。
- `endTime` 必须是 8 位日期字符串，例如 `20260701`。
- 后端会固定用 `20260101` 作为查询开始日期。前端传其他 `beginTime` 会返回 `400`。

## 4. 请求示例

### 情绪演变分析

```http
POST /api/v1/sensitive-appeals/ai/emotion-evolution
Content-Type: application/json

{
  "cust_no": "1600000001",
  "endTime": "20260701"
}
```

### 智能预警

```http
POST /api/v1/sensitive-appeals/ai/intelligent-warning
Content-Type: application/json

{
  "cust_no": "1600000001",
  "endTime": "20260701"
}
```

### 智能回单

```http
POST /api/v1/sensitive-appeals/ai/intelligent-receipt
Content-Type: application/json

{
  "cust_no": "1600000001",
  "endTime": "20260701"
}
```

## 5. 成功响应

HTTP 状态码：`200`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `value` | string | 智能体返回的文本内容 |

响应示例：

```json
{
  "value": "智能体返回的分析、预警或回单内容"
}
```

前端展示建议：

- 直接展示 `value` 字段即可。
- `value` 可能包含换行符，展示时建议保留换行格式。
- 如果请求耗时较长，建议前端加 loading 状态。

## 6. 错误响应

后端错误统一返回 JSON。

### 参数错误

HTTP 状态码：`400`

```json
{
  "code": 400,
  "message": "invalid request payload",
  "errors": [
    "endTime must be formatted as YYYYMMDD"
  ]
}
```

常见参数错误：

| 场景 | 错误信息 |
| --- | --- |
| 未传客户编号 | `cust_no is required` |
| 未传截止日期 | `endTime is required` |
| 日期格式错误 | `endTime must be formatted as YYYYMMDD` |
| `beginTime` 不是固定值 | `beginTime must be 20260101` |

### 没有可分析的诉求数据

HTTP 状态码：`404`

```json
{
  "code": 404,
  "message": "no user appeal data found"
}
```

前端可提示：`暂无可分析的客户诉求数据`。

### 上游或智能体异常

HTTP 状态码：`500`、`502` 或 `504`

```json
{
  "code": 502,
  "message": "ai agent request failed",
  "detail": "..."
}
```

前端可统一提示：`智能分析服务暂不可用，请稍后重试`。

## 7. Axios 示例

```ts
import axios from "axios";

type AiApiPath =
  | "/api/v1/sensitive-appeals/ai/emotion-evolution"
  | "/api/v1/sensitive-appeals/ai/intelligent-warning"
  | "/api/v1/sensitive-appeals/ai/intelligent-receipt";

interface AiRequest {
  cust_no: string;
  endTime: string;
}

interface AiResponse {
  value: string;
}

export async function runAiAnalysis(path: AiApiPath, payload: AiRequest) {
  const { data } = await axios.post<AiResponse>(path, payload);
  return data.value;
}

// 使用示例
const value = await runAiAnalysis(
  "/api/v1/sensitive-appeals/ai/intelligent-receipt",
  {
    cust_no: "1600000001",
    endTime: "20260701",
  }
);
```

## 8. 和原始 AI 文档的对应关系

原始 AI 文档中有两个后端内部接口：

| 原始步骤 | 前端是否需要调用 | 说明 |
| --- | --- | --- |
| 创建会话 `createSession` | 否 | 后端根据接口类型自动选择智能体版本并创建会话 |
| 与智能体对话 `run` | 否 | 后端自动把客户诉求记录拼成 `message.text` 并调用智能体 |

前端只需要调用本文档第 2 节中的三个业务接口。
