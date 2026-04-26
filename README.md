# 微信小程序说明

本项目是图书馆预约系统用户端小程序，提供登录、预约、续约、通知、活动、个人中心、信用记录等功能。

## 1. 项目结构

- miniprogram：小程序业务代码
- miniprogram/pages：页面
- miniprogram/components：通用组件
- miniprogram/apis：接口请求封装
- miniprogram/config：运行配置与环境地址
- miniprogram/data/langs：多语言文案

## 2. 环境配置

小程序后端环境配置在项目内维护：

- [miniprogram/config/backendEnvs.ts](miniprogram/config/backendEnvs.ts)
- [miniprogram/config/index.ts](miniprogram/config/index.ts)

说明：

- 生产构建默认隐藏环境切换入口
- 非生产构建可在登录页进入环境切换页面
- 环境切换会更新本地保存的后端 baseUrl

## 3. 本地运行

1. 安装依赖：pnpm install
2. 用微信开发者工具打开 [library-reservation](.)
3. 选择小程序项目根目录并编译
4. 确认后端服务已启动并可访问

## 4. 关键页面

- 首页：[miniprogram/pages/index/index](miniprogram/pages/index/index.ts)
- 登录页：[miniprogram/pages/login/login.ts](miniprogram/pages/login/login.ts)
- 我的预约：[miniprogram/pages/my-reservation/my-reservation.ts](miniprogram/pages/my-reservation/my-reservation.ts)
- 预约页：[miniprogram/pages/reservation/reservation.ts](miniprogram/pages/reservation/reservation.ts)

## 5. 续约体验与规则

小程序已与后端规则联动：

- 按后端返回的续约窗口和时段判断是否显示续约按钮
- 不可续约时展示对应原因提示
- 续约文案支持按配置天数动态显示

## 6. 代码质量

- pnpm lint
- pnpm lint:fix
- pnpm lint:style
- pnpm format

## 7. 调试建议

1. 若真机访问失败，优先检查局域网地址配置
2. 若登录后接口全部 401，先清本地存储后重试
3. 若时段名称显示异常，检查 time-slot helper 与后端时段配置
