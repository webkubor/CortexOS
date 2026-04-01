# PK Ecommerce Init Skill (巴基斯坦合规建站工厂 V4)

> 目标：自动化生产符合巴基斯坦支付公司 KYC 审核标准的高级电商站点。
> 核心原则：全链路闭环、全英文无中文、拒绝假成功、订单处理态真实化。

## 1. 语言与编码规范 (Strict Language Policy)
- **Zero Chinese Tolerance**: 严禁在代码、注释、UI 中出现任何中文字符。
- **Language**: 全站使用 **Professional English (International Standard)**。
- **Tone**: Professional, Reliable, Operational.

## 2. 核心交互流程 (Real-World Interaction Flow)
生成的站点必须具备完整的“业务路径”，且终点状态必须真实：
`Home -> Shop -> Product Detail -> Add to Cart -> Cart -> Checkout -> Order Processing (Pending Review)`.

## 3. 页面清单 (Total 10 Pages)
必须包含以下 10 个独立路由页面，确保交互无断层：
1.  **Home (`/`)**: 品牌 Hero 区域、特色类目、热销产品展示。
2.  **Shop (`/shop`)**: 全量产品网格，支持分类过滤。
3.  **Product Detail (`/product/:id`)**: 多图展示、Rs. 计价、规格选择、Add to Cart 交互。
4.  **Cart (`/cart`)**: 购物车清单、数量增减、实时总价计算（含运费逻辑）。
5.  **Checkout (`/checkout`)**: 核心合规页。含：Shipping Address、Payment Selection (JazzCash, Easypaisa, COD)。
6.  **Order Processing (`/order-status`)**: **拒绝假成功！** 显示 "Order Processing"，告知用户 "Our team is verifying your payment. You will receive a confirmation call shortly."
7.  **Contact Us (`/contact`)**: 包含真实巴基斯坦地址占位、Google Maps 占位图、联系表单。
8.  **Privacy Policy (`/privacy-policy`)**: 提及 `COGNISYNC SOLUTIONS (SMC-PRIVATE) LIMITED` 的合规文书。
9.  **Refund Policy (`/refund-policy`)**: 描述 7 天退换货流程及退款路径。
10. **Terms of Service (`/terms`)**: 网站使用协议。

## 4. 商业 SSOT 数据规范 (Finance SSOT)
- **Currency**: `PKR`
- **Prefix**: `Rs. ` (Space after dot)
- **Format**: `Rs. 5,499` (Comma for thousands, 0 decimals).
- **Consumption Level**: 单价 `Rs. 2,999` - `Rs. 12,999` (中产偏高档次)。
- **Shipping**: `200 PKR` fixed fee; Free shipping over `5,000 PKR`.

## 5. 支付资产锁定 (Compliance Assets)
- **JazzCash Logo**: `https://cdn.jsdelivr.net/gh/webkubor/picx-images-hosting@main/pk-methods/jazzCash.png`
- **Easypaisa Logo**: `https://cdn.jsdelivr.net/gh/webkubor/picx-images-hosting@main/pk-methods/easypaisa.png`
- **Payment Interaction**: 点击 JazzCash/Easypaisa 必须展开 `Account Number` 和 `CNIC` 输入框（KYC 审核要点）。

## 6. 初始化脚本规范 (Execution Blueprint)
1.  **基座扫描**: 检查 `SMC-PRIVATE/xianbei.shop` 是否存在中文字符或死链接。
2.  **全量拷贝**: `cp -r` 架构并初始化 git。
3.  **SSOT 注入**: 更新 `brandConfig` 和 `ecoConfig`。
4.  **中文化清理**: 自动扫描并移除所有 `.vue` 和 `.js` 文件中的中文注释。
5.  **状态重写**: 强制将所有 "Order Success" 逻辑修改为 "Order Processing" 待审核逻辑。
