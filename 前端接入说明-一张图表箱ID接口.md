# 前端接入说明：通过用户编号获取表箱 ID

## 本次后端新增内容

后端新增接口：

```http
POST /api/v1/one-map/meter-box-id
```

用途：前端传入用户编号 `consNo`，后端调用一张图内网接口“通过用户ID获取表箱ID”，从上游返回中提取 `meterMapList[0].measPsrId`，再返回给前端。

前端不需要直接访问内网的一张图“通过用户ID获取表箱ID”接口。

## 前端需要修改什么

前端调用新后端接口时，需要传两部分内容：

1. 请求头：`amap-token`
2. 请求体：`consNo`

其中 `amap-token` 的值，就是一张图飞跃接口 Headers 里的 `amap-token` 值。前端拿到该 token 后，原样放到本系统后端接口请求头里。

## 请求格式

```http
POST /api/v1/one-map/meter-box-id
Content-Type: application/json
amap-token: <一张图飞跃接口 Headers 里的 amap-token>
```

```json
{
  "consNo": "1601173658324"
}
```

## 响应格式

成功响应：

```json
{
  "measPsrId": "1630005110360000037677"
}
```

如果后续还要调用一张图飞跃接口，则把这里返回的 `measPsrId` 作为飞跃接口的 `psrId` 使用。

## axios 示例

```javascript
const response = await axios.post(
  "/api/v1/one-map/meter-box-id",
  {
    consNo: userConsNo,
  },
  {
    headers: {
      "amap-token": amapToken,
    },
  }
);

const measPsrId = response.data.measPsrId;
```

## fetch 示例

```javascript
const response = await fetch("/api/v1/one-map/meter-box-id", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "amap-token": amapToken,
  },
  body: JSON.stringify({
    consNo: userConsNo,
  }),
});

const data = await response.json();
const measPsrId = data.measPsrId;
```

## 错误处理建议

前端至少处理以下情况：

| HTTP 状态码 | 含义 | 建议提示 |
| --- | --- | --- |
| `400` | 缺少 `consNo` 或 `amap-token` | 请检查用户编号或一张图 token |
| `404` | 一张图返回成功，但没有找到 `measPsrId` | 未查询到该用户对应表箱 |
| `502` | 一张图上游接口异常或返回失败 | 一张图服务暂不可用，请稍后重试 |
| `504` | 一张图上游接口超时 | 请求超时，请稍后重试 |

## 前端改造流程建议

1. 在已有用户编号 `consNo` 的位置，新增一次后端接口调用。
2. 从一张图飞跃接口相关逻辑中取得 `amap-token`。
3. 调用 `/api/v1/one-map/meter-box-id`，请求头带上 `amap-token`，请求体传 `consNo`。
4. 从响应中读取 `measPsrId`。
5. 如果需要继续飞跃定位，把 `measPsrId` 作为一张图飞跃接口的 `psrId`。

