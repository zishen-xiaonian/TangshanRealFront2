# 后端获取 amap-token 说明

## 1. 背景

前端页面中，一张图地图 SDK 在执行设备飞跃时，会调用如下内网接口：

```http
http://25.42.182.119/amap-gateway-service/amap-sdk-service/query/disSearch/queryDeviceById
```

该请求的请求头中会携带：

```http
amap-token: <一张图SDK生成或维护的token>
```

前端已在地图 iframe 中捕获这个 `amap-token`，并在调用后端接口时，将该值原样放入请求头传给后端。

## 2. 前端传给后端的方式

前端调用后端接口：

```http
POST /api/v1/one-map/meter-box-id
Content-Type: application/json
amap-token: <从一张图 queryDeviceById 请求头中捕获到的值>
```

请求体：

```json
{
  "consNo": "1601173658324"
}
```

也就是说，后端不需要从请求体里取 `amap-token`，而是从 HTTP 请求头中读取。

## 3. 后端如何获取 amap-token

### Spring Boot 示例

```java
@PostMapping("/api/v1/one-map/meter-box-id")
public MeterBoxIdResponse getMeterBoxId(
        @RequestHeader("amap-token") String amapToken,
        @RequestBody MeterBoxIdRequest request
) {
    String consNo = request.getConsNo();

    // 使用 amapToken 调用一张图上游接口
    return oneMapService.queryMeterBoxId(consNo, amapToken);
}
```

如果希望兼容 header 缺失时的错误提示：

```java
@PostMapping("/api/v1/one-map/meter-box-id")
public MeterBoxIdResponse getMeterBoxId(
        @RequestHeader(value = "amap-token", required = false) String amapToken,
        @RequestBody MeterBoxIdRequest request
) {
    if (amapToken == null || amapToken.trim().isEmpty()) {
        throw new IllegalArgumentException("缺少请求头 amap-token");
    }

    if (request.getConsNo() == null || request.getConsNo().trim().isEmpty()) {
        throw new IllegalArgumentException("缺少 consNo");
    }

    return oneMapService.queryMeterBoxId(request.getConsNo(), amapToken);
}
```

### Node / Express 示例

```js
app.post('/api/v1/one-map/meter-box-id', express.json(), async (req, res) => {
  const amapToken = req.get('amap-token')
  const { consNo } = req.body || {}

  if (!amapToken) {
    return res.status(400).json({ message: '缺少请求头 amap-token' })
  }

  if (!consNo) {
    return res.status(400).json({ message: '缺少 consNo' })
  }

  const result = await queryMeterBoxIdFromOneMap(consNo, amapToken)
  res.json(result)
})
```

## 4. 后端调用一张图接口时如何使用

后端拿到前端传来的 `amap-token` 后，调用一张图上游接口时，需要继续把它放到请求头中。

示例：

```http
POST http://25.42.182.119/amap-gateway-service/amap-sdk-service/query/disSearch/queryDeviceById
Content-Type: application/json
amap-token: <前端传来的amap-token>
```

后端转发逻辑示意：

```java
HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType.APPLICATION_JSON);
headers.set("amap-token", amapToken);

HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

ResponseEntity<String> response = restTemplate.postForEntity(
    oneMapUrl,
    entity,
    String.class
);
```

## 5. 注意事项

1. HTTP header 名大小写不敏感，但建议统一使用 `amap-token`。
2. `amap-token` 不要放到请求体里，后端从请求头读取即可。
3. 后端日志中不要完整打印 `amap-token`，如需排查，只打印前后几位。
4. 如果后端接口返回 `400`，优先检查前端请求头中是否实际带上了 `amap-token`。
5. 如果后端要跨域部署，需要允许前端发送自定义请求头 `amap-token`。

## 6. 完整链路

```text
一张图SDK调用 queryDeviceById
        ↓
请求头中带 amap-token
        ↓
前端捕获 amap-token
        ↓
前端调用 /api/v1/one-map/meter-box-id
        ↓
请求头中携带 amap-token
        ↓
后端通过 Request Header 读取 amap-token
        ↓
后端调用一张图上游接口时继续放入请求头
```

