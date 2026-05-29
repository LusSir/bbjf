# Project Context

## 项目概览

- 项目名称：贝贝家纺微信小程序。
- 项目目标：实体店成品家纺产品展示、门店联系、管理员手动维护商品。
- 主要技术栈：微信小程序原生页面、微信云开发、Node.js 云函数。
- 运行入口：微信开发者工具打开项目根目录。
- 测试入口：`node scripts/test-*.js` 与相关 `node --check`。

## 关键路径

- 源码：`miniprogram/`、`cloudfunctions/`。
- 测试：`scripts/`。
- 配置：`project.config.json`。
- 文档：`docs/`、`agent_memory/`。

## 本地约定

- 代码风格：遵循仓库现有风格。
- 命令约定：优先使用仓库已有 scripts / Makefile / task runner。
- 验证约定：改动后运行与范围匹配的最小必要验证。

## 已确认事实

- 商品管理页支持商品多图，`form.images` 保存花色图列表，`form.image` 保存主图。
- 当前商品图片上传使用 `wx.cloud.uploadFile`。

## 当前假设

- 第一版以手动录入商品为主，不继续做 Excel 批量导入。

## 注意事项

- 不硬编码密钥。
- 不提交 `.env`。
- 不在日志中泄露敏感信息。
- 修改公共 API / 数据结构 / 数据库 schema / 删除文件前先确认。
