docker build -t registry.cn-hangzhou.aliyuncs.com/ls-2018/wechat-article-exporter .
docker push registry.cn-hangzhou.aliyuncs.com/ls-2018/wechat-article-exporter
docker rm wechat-article-exporter -f
docker run --name wechat-article-exporter \
  -d \
  -e MYSQL_HOST=`python3 -c'from print_proxy import *;print(get_ip())'` \
  -e MYSQL_PORT=3306 \
  -e MYSQL_USER=root \
  -e MYSQL_PASSWORD=sk3RCBqtWxF2Tg4pawUv \
  -e MYSQL_DATABASE=wechat_article_exporter \
  -p 3000:3000 \
  -v /Volumes/Tf/data/wechat-article-exporter:/app/.data registry.cn-hangzhou.aliyuncs.com/ls-2018/wechat-article-exporter




