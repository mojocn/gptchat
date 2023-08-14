---
layout: post
title: Docker实践02:lnmp环境docker部署
category: Docker
tags: Docker dockerfile
keywords: docker,dockerfile,docker-compose,lnmp环境docker部署
description:  docker,dockerfile,docker-compose,lnmp环境docker部署
permalink: /:categories/:title
coverage: docker_lnmp.png
date: 2019-09-11T14:00:54+08:00
---

## 1. Laravel/Lumen DockerFile(PHP-FPM+Nginx)

这个dockerfile使用 最佳场景是laravel/lumen php+nginx 项目,
一下dockerfile文件是非常适合做上线prod最终的部署,不适合做开发环境.
如果搭建开发环境建议使用volume来挂在脚本语言的代码,
COPY 比较适合代码发布.

```yaml
FROM php:7.3-fpm
LABEL author="mojotv.cn"
# https://hub.docker.com/r/disparo/php-fpm-nginx/dockerfile
# https://hub.docker.com/r/sinkcup/laravel-demo/dockerfile


# 添加编译环境
RUN apt-get update && apt-get install -y \
    wget gnupg2 ca-certificates lsb-release zip unzip git \
    build-essential g++ \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libicu-dev \
    libzip-dev

# 安装composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# 安装nginx
RUN echo "deb http://nginx.org/packages/debian `lsb_release -cs` nginx" \
    | tee /etc/apt/sources.list.d/nginx.list && \
    curl -fsSL https://nginx.org/keys/nginx_signing.key | apt-key add - && \
    apt-get update && apt-get install nginx && \
    apt-get upgrade -y && \
    apt-get clean

# 清除 apt cache
RUN rm -rf /var/lib/apt/lists

# 安装php ext 扩展
RUN docker-php-ext-install iconv sockets mbstring mysqli pdo pdo_mysql bcmath zip \
    && docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/ \
    && docker-php-ext-install gd intl

RUN apt-get clean \
    && apt-get autoclean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# 配置php.ini文件
RUN echo "\
max_execution_time = 6000\n\
memory_limit = 256M\n\
upload_max_filesize = 20M\n\
max_file_uploads = 20\n\
default_charset = \"UTF-8\"\n\
short_open_tag = On\n\
cgi.fix_pathinfo = 0\n\
error_reporting = E_ALL & ~E_STRICT & ~E_DEPRECATED" > /usr/local/etc/php/php.ini

# 设置php-fpm 9000 端口
RUN echo "\
[global]\n\
daemonize = yes\n\
[www]\n\
listen = 9000" > /usr/local/etc/php-fpm.d/zz-docker.conf


#copy file

COPY . /var/www
# 拷贝nginx config file
# 您的nginx 配置文件
COPY ./docker_conf_nginx_app.conf /etc/nginx/conf.d/site.conf

WORKDIR /var/www/
# 设置laravel/lumen storage 777 权限
RUN chmod 777 -R /var/www/storage

# 使用composer 安装laravel/lumen php 依赖
RUN composer install --no-autoloader --no-scripts --no-dev
RUN composer install --optimize-autoloader --no-dev


# Redirecting log outputs to stdout
#RUN ln -sf /dev/stdout /var/log/nginx/access.log \
#    && ln -sf /dev/stderr /var/log/nginx/error.log
    
# 自定义需要暴露的端口
EXPOSE 80 443 8888 7777 9000

STOPSIGNAL SIGTERM
# 启动php-fpm 和nginx 服务
CMD ["sh","-c","php-fpm && nginx -g \"daemon off;\""]
```

## 2. Docker-Composer(lnmp+redis)

docker-composer 文件最佳适用场景是 lnmp+redis的开发环境
[https://github.com/mojocn/docker-lnmp](https://github.com/mojocn/docker-lnmp)

    docker-lnmp
    |----/build                  镜像构建目录
    |----/work                   持久化目录
    |--------/components/        组件库
    |------------/component      组件,包括了数据,配置文件,日志等持久化数据
    |-----------------/config    组件的配置目录
    |-----------------/log       组件的日志目录
    |--------/wwwroot            WEB 文件目录
    |----/.env-example           配置文件
    |----/docker-compose.yml     docker compose 配置文件

没有安装 Docker 的同学移步 [安装教程](https://github.com/exc-soft/docker-lnmp#安装-docker-及相关工具),
如果您有足够的时间强烈建议通读 [Docker — 从入门到实践](https://yeasy.gitbooks.io/docker_practice/content/)

    cd ~/
    git clone https://github.com/exc-soft/docker-lnmp.git

    cd docker-lnmp
    cp .env-example .env

    # 配置数据库密码,时区,端口等
    vim .env

    # 构建镜像并启动容器
    sudo docker-compose up --build -d

```yaml
version: '3'
services:

  ### Nginx container #########################################

  nginx:
      image: nginx:alpine
      ports:
        - "${HTTP_PORT}:80" # 映射.env配置文件中的变量
        - "${HTTPS_PORT}:443" # 映射.env配置文件中的变量
        - "8888:8888" # 映射端口
        - "7777:7777"
      volumes: # 挂在目录到容器,
        - ${PROJECT_FOLDER}:/etc/nginx/html/:rw  #rw 读写
        - ./work/components/nginx/config/nginx.conf:/etc/nginx/nginx.conf:ro #ro read only 只读
        - ./work/components/nginx/config/conf.d:/etc/nginx/conf.d:ro
        - ./work/components/nginx/log:/var/log/nginx:rw  #rw 读写
      restart: always
      privileged: true
      networks:
        - net-php

  ### PHP container #########################################

  php:
      build:
        context: ./build/php
        args:
          TIME_ZONE: ${GLOBAL_TIME_ZONE}
          CHANGE_SOURCE: ${GLOBAL_CHANGE_SOURCE}
      volumes:
        - ${PROJECT_FOLDER}:/etc/nginx/html:rw
        - ./work/components/php/config/php.ini:/usr/local/etc/php/php.ini:ro
        - ./work/components/php/config/php-fpm.conf:/usr/local/etc/php-fpm.d/www.conf:rw
        - ./work/components/php/log:/var/log:rw
      restart: always
      privileged: true
      networks:
        - net-php
        - net-mysql
        - net-redis

  ### Mysql container #########################################

  mysql:
      image: mysql:5.7
      ports:
        - "${MYSQL_PORT}:3306"
      volumes:
      # 挂在mysql的目录
        - ./work/components/mysql/data:/var/lib/mysql:rw
        - ./work/components/mysql/config/mysql.cnf:/etc/mysql/conf.d/mysql.cnf:ro
        - ./work/components/mysql/log:/var/log/mysql:rw
      restart: always
      privileged: true
      environment:
        MYSQL_ROOT_PASSWORD: ${MYSQL_PASSWORD} #.env文件 变量
      networks:
        - net-mysql

  ### Redis container #########################################

  redis:
      image: redis:latest
      ports:
        - "${REDIS_PORT}:6379"
      volumes:
      # 挂在redis的目录
        - ./work/components/redis/config/redis.conf:/usr/local/etc/redis/redis.conf:ro
        - ./work/components/redis/log/redis.log:/var/log/redis/redis.log:rw
      restart: always
      privileged: true
      networks:
        - net-redis

  ### Tools container #########################################

  tools:
      build:
        context: ./build/tools
        args:
          TIME_ZONE: ${GLOBAL_TIME_ZONE} #从.env文件加载变量
          CHANGE_SOURCE: ${GLOBAL_CHANGE_SOURCE} #从.env文件加载变量
      volumes:
        - ./work/components/tools/start.sh:/home/start.sh:rw
        - ./work/components/tools/backup:/backup:rw
        - ./work/components/tools/cron.d:/etc/cron.d:rw
      restart: always
      privileged: true
      networks:
        - net-php
        - net-mysql
        - net-redis

networks:
  net-php:
  net-mysql:
  net-redis:

```
