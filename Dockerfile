# 编译层
FROM ccr.ccs.tencentyun.com/acejilam/ib-tcin8k239o:7b0c4959c6f2c424509107430ae7eec3-22-alpine AS build-env

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
# 安装 Yarn（Alpine 包管理器方式，轻量）
RUN apk add yarn
RUN yarn config set registry https://registry.npmmirror.com

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 lock 文件，安装依赖
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true

# 复制源代码
COPY . .

# 构建 Nuxt 应用（生成 .output 目录）
ENV NODE_ENV=production \
    NITRO_KV_DRIVER=fs \
    NITRO_KV_BASE=.data/kv

RUN NODE_OPTIONS="--max-old-space-size=4096" yarn build


# 运行时层
FROM ccr.ccs.tencentyun.com/acejilam/ib-tcin8k239o:7b0c4959c6f2c424509107430ae7eec3-22-alpine

ARG VERSION=unknown

# 设置工作目录
WORKDIR /app

# 复制构建输出
COPY --from=build-env /app/.output ./

# 创建 KV 存储目录并设置权限（以 root 运行，确保 node 用户可写）
RUN mkdir -p .data/kv && chown -R node:node /app

# 创建非 root 用户（使用内置 node 用户）
USER node

# 暴露端口
EXPOSE 3000

# 设置环境变量：生产模式，监听所有接口
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000

# 启动命令：运行 Nitro 生成的服务器
ENTRYPOINT ["node", "server/index.mjs"]

# docker build -t ccr.ccs.tencentyun.com/ls-2018/wechat:exporter .