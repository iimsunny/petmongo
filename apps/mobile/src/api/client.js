// API基础URL配置
// Web环境：使用localhost（因为web和backend在同一台机器）
// 手机环境：使用开发机器的局域网IP
const getDefaultBaseUrl = () => {
  // 如果设置了环境变量，优先使用
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  
  // 在Web环境下（浏览器），总是使用localhost
  if (typeof window !== 'undefined') {
    return 'http://localhost:3000';
  }
  
  // 在手机/模拟器上使用局域网IP
  // 请根据你的实际网络环境修改这个IP地址
  // 常见值：192.168.1.x, 192.168.0.x, 10.0.2.2 (Android模拟器)
  return 'http://192.168.1.9:3000';
};

export const API_BASE_URL = getDefaultBaseUrl();

// 调试：打印当前使用的API地址
if (typeof window !== 'undefined') {
  console.log('🌐 Web环境 - API_BASE_URL:', API_BASE_URL);
} else {
  console.log('📱 移动端 - API_BASE_URL:', API_BASE_URL);
}

export const buildUrl = (path, params) => {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
};
