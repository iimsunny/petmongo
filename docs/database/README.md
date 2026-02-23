# MVP 数据库说明

本目录用于保存第一版数据库结构与字段定义，后续可直接映射到 API 与后台审核流。

## 表结构概览
- `cities` 城市字典
- `categories` 分类字典（住宿/草坪/餐厅/景点）
- `tags` 标签字典（安全/适配/特征）
- `resources` 资源主表
- `resource_tags` 资源与标签关联
- `submissions` 提交与审核记录

## 核心原则
- 状态字段统一使用 `pending/approved/rejected` 这样的轻量枚举
- 位置仅保留模糊提示 `location_hint`，不保存精确坐标
- 所有资源变更保留 `submissions` 作为审核链路
