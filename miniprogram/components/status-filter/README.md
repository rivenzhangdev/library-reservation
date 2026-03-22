# StatusFilter 状态筛选组件

通用的横向滚动状态选择器组件，适用于活动列表、预约记录、搜索结果等需要状态筛选的场景。

## 特性

- ✅ 支持横向滚动和静态布局两种模式
- ✅ 支持显示数量徽章
- ✅ 完整的 TypeScript 类型支持
- ✅ 支持多语言切换
- ✅ 符合微信小程序 UI 规范

## 使用示例

### 1. 在页面 JSON 中注册组件

```json
{
  "usingComponents": {
    "status-filter": "/components/status-filter/status-filter"
  }
}
```

### 2. 在 WXML 中使用

```xml
<!-- 基础用法 -->
<status-filter
  status-list="{{statusList}}"
  current-status="{{currentStatus}}"
  bind:status-change="onStatusChange"
/>

<!-- 显示数量徽章 -->
<status-filter
  status-list="{{statusList}}"
  current-status="{{currentStatus}}"
  show-count="{{true}}"
  bind:status-change="onStatusChange"
/>

<!-- 静态布局 (不可滚动) -->
<status-filter
  status-list="{{statusList}}"
  current-status="{{currentStatus}}"
  scrollable="{{false}}"
  bind:status-change="onStatusChange"
/>
```

### 3. 在 TypeScript 中定义数据

```typescript
data: {
  statusList: [
    { id: 'all', name: '全部', count: 10 },
    { id: 'ongoing', name: '进行中', count: 5 },
    { id: 'upcoming', name: '即将开始', count: 3 },
    { id: 'ended', name: '已结束', count: 2 },
  ],
  currentStatus: 'all',
}

// 处理状态变化
onStatusChange(e: any) {
  const statusId = e.detail.id;
  this.setData({
    currentStatus: statusId,
  });
  // 执行筛选逻辑
  this.filterData();
}
```

## API

### Properties

| 参数           | 类型           | 默认值  | 必填 | 说明              |
| -------------- | -------------- | ------- | ---- | ----------------- |
| status-list    | `StatusItem[]` | `[]`    | 是   | 状态列表          |
| current-status | `string`       | `''`    | 是   | 当前选中的状态 ID |
| scrollable     | `boolean`      | `true`  | 否   | 是否可滚动        |
| show-count     | `boolean`      | `false` | 否   | 是否显示数量徽章  |

### StatusItem 数据结构

| 字段  | 类型     | 说明           |
| ----- | -------- | -------------- |
| id    | `string` | 状态唯一标识   |
| name  | `string` | 状态显示文本   |
| count | `number` | 可选，数量徽章 |

### Events

| 事件名        | 参数                  | 说明           |
| ------------- | --------------------- | -------------- |
| status-change | `e.detail.id: string` | 状态变化时触发 |

## 样式定制

组件支持通过外部样式类进行定制:

```scss
// 在页面的 scss 文件中
.status-filter {
  .status-item {
    &.active {
      background-color: #your-color;
    }
  }
}
```

## 注意事项

1. **事件命名**: 组件事件使用短横线命名 (`status-change`),绑定事件时需保持一致
2. **数据更新**: 状态列表变化时，组件会自动更新
3. **性能优化**: 滚动模式下建议使用 `catch:tap` 阻止事件冒泡
4. **多语言**: 组件支持多语言，只需在父组件中切换 `statusList` 即可

## 迁移指南

### 从旧版迁移

如果您之前使用的是内联的状态筛选代码，迁移步骤如下:

1. 在页面 JSON 中注册组件
2. 替换 WXML 中的 `scroll-view` 为 `<status-filter>`
3. 将事件处理方法从 `onStatusTap` 改为 `onStatusChange`
4. 确保 `statusList` 数据结构符合 `StatusItem[]` 类型

## 示例代码

完整示例请参考:

- `pages/my-activity/my-activity.wxml`
- `pages/my-activity/my-activity.ts`
