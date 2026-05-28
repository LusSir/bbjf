# 商品表填写说明

这个表用于批量维护小程序商品。后续导入脚本会读取 `data/products.csv`，生成小程序使用的 `miniprogram/data/products.js`。

## 字段

- `id`: 商品唯一编号，只用英文、数字、短横线，例如 `cotton-set-001`。
- `categoryId`: 分类编号，可填 `sets`、`quilts`、`pillows`、`blankets`、`mats`、`wedding`、`specials`。
- `name`: 商品名称。
- `priceText`: 页面显示价格，例如 `¥199 起`、`到店咨询价`。
- `image`: 商品图片文件名，图片放到 `miniprogram/assets/products/`。
- `tags`: 标签，多个用 `|` 分隔，例如 `热卖|纯棉`。
- `highlights`: 产品卖点，多个用 `|` 分隔。
- `specs`: 规格信息，多个用 `|` 分隔。
- `description`: 商品说明。
- `isFeatured`: 是否首页推荐，填 `true` 或 `false`。
- `isSpecial`: 是否特价商品，填 `true` 或 `false`。
- `isNew`: 是否新品，填 `true` 或 `false`。
- `sort`: 排序数字，越小越靠前。
- `status`: 商品状态，正常显示填 `active`，暂不上架填 `draft`。

## 图片

图片统一放到：

```text
miniprogram/assets/products/
```

表格里只填文件名，例如：

```text
cotton-set-001.jpg
```
