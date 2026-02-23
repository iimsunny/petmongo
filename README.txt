Pétmongo 本地启动说明

一、后端启动
1) 进入后端目录
   cd apps\backend
2) 启动后端（开发模式）
   npm run start:dev
3) 访问接口（示例）
   http://localhost:3000/api/resources
4) 确认后端已启动（看到 "🚀 Backend server is running on http://localhost:3000"）

二、Web 端 App 启动
1) 进入移动端目录
   cd apps\mobile
2) 启动 Web 预览
   $env:EXPO_NO_DOCTOR="1"
   $env:EXPO_OFFLINE="1"
   npm run web
   或者直接：
   npm run start
   然后在 Expo 界面按 'w' 键打开 Web 版本
3) 打开浏览器
   http://localhost:8081
4) Web 端会自动使用 http://localhost:3000 连接后端（无需配置）

三、手机端 App 启动（Expo Go）
1) 进入移动端目录
   cd apps\mobile
2) 启动 Expo 开发服务器
   npm run start
3) 用手机 Expo Go 扫码打开
4) 手机端会自动使用 http://192.168.1.9:3000 连接后端
   如果 IP 地址不同，需要修改 apps\mobile\src\api\client.js 中的 IP 地址
   或者设置环境变量：
   $env:EXPO_PUBLIC_API_BASE_URL="http://你的IP:3000"
   npm run start

注意事项：
- 确保手机和电脑在同一 Wi-Fi 网络
- 确保后端服务正在运行（端口 3000）
- 如果连接失败，检查防火墙是否允许端口 3000 和 8081
- 可以通过运行 ipconfig 查看你的局域网 IP 地址
